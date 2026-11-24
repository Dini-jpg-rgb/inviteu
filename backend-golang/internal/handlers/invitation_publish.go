package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PublishInvitationResponse struct {
	Invitation     PublishInvitationDetail `json:"invitation"`
	RemainingQuota int64                   `json:"remaining_quota"`
}

type PublishInvitationDetail struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Status      string     `json:"status"`
	PublishedAt *time.Time `json:"published_at"`
}

type partnerPackageQuotaRow struct {
	id    int64
	quota int
	used  int
}

// PublishInvitation transitions a draft invitation to published for the first time,
// atomic with partner package quota deduction.
func PublishInvitation(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		idParam := strings.TrimSpace(c.Param("id"))
		if idParam == "" {
			idParam = strings.TrimSpace(c.Param("invitation_id"))
		}
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
			})
			return
		}

		ctx := c.Request.Context()
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("PublishInvitation: begin transaction: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not start transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		// 1. Lock invitation row and check ownership
		var (
			title      string
			slug       string
			templateID int64
			status     string
		)
		err = tx.QueryRow(ctx, `
			SELECT id, title, slug, template_id, status
			FROM invitations
			WHERE id = $1 AND user_id = $2
			FOR UPDATE
		`, invitationID, userID).Scan(&invitationID, &title, &slug, &templateID, &status)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("PublishInvitation: lock invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not lock invitation",
			})
			return
		}

		// 2. Verify status is 'draft'
		if status != "draft" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Only draft invitations can be published",
				"errors": gin.H{
					"status": "invitation_is_not_draft",
				},
			})
			return
		}

		// 3. Find working draft version inside the same transaction
		var draftVersionID int64
		err = tx.QueryRow(ctx, `
			SELECT id
			FROM invitation_versions
			WHERE invitation_id = $1 AND status = 'draft'
			ORDER BY version_number DESC
			LIMIT 1
			FOR UPDATE
		`, invitationID).Scan(&draftVersionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("PublishInvitation: draft version not found for invitation %d: %v", invitationID, err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Internal server error",
				})
				return
			}
			log.Printf("PublishInvitation: lock draft version: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not lock invitation version",
			})
			return
		}

		// 4. Validate readiness (completeness of event, template status, and required fields)
		valErrors, err := ValidateInvitationReadiness(ctx, tx, invitationID, templateID, draftVersionID)
		if err != nil {
			log.Printf("PublishInvitation: validate readiness: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not validate invitation readiness",
			})
			return
		}
		if len(valErrors) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invitation is not ready to be published",
				"errors":  valErrors,
			})
			return
		}

		// 5. Select and lock all active packages belonging to partner in active time window
		// Urutan: ORDER BY expired_at ASC NULLS LAST, id ASC FOR UPDATE (tanpa LIMIT, tanpa filter used < quota)
		rows, err := tx.Query(ctx, `
			SELECT id, invitation_quota, invitation_used
			FROM partner_packages
			WHERE user_id = $1
			  AND status = 'active'
			  AND (started_at IS NULL OR started_at <= CURRENT_TIMESTAMP)
			  AND (expired_at IS NULL OR expired_at > CURRENT_TIMESTAMP)
			ORDER BY expired_at ASC NULLS LAST, id ASC
			FOR UPDATE
		`, userID)
		if err != nil {
			log.Printf("PublishInvitation: fetch active packages: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not query partner packages",
			})
			return
		}
		defer rows.Close()

		var packages []partnerPackageQuotaRow
		for rows.Next() {
			var pkg partnerPackageQuotaRow
			if err := rows.Scan(&pkg.id, &pkg.quota, &pkg.used); err != nil {
				log.Printf("PublishInvitation: scan partner package: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read partner packages",
				})
				return
			}
			packages = append(packages, pkg)
		}
		if err := rows.Err(); err != nil {
			log.Printf("PublishInvitation: iterate packages: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read partner packages",
			})
			return
		}

		if len(packages) == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "An active package is required to publish an invitation",
				"errors": gin.H{
					"package": "no_active_package",
				},
			})
			return
		}

		// Choose the first package with remaining quota in Go
		var chosenPkgID int64
		for _, pkg := range packages {
			if pkg.used < pkg.quota {
				chosenPkgID = pkg.id
				break
			}
		}

		if chosenPkgID == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Invitation quota has been exhausted",
				"errors": gin.H{
					"package": "quota_exhausted",
				},
			})
			return
		}

		// Update quota on chosen package with defensive check
		cmdTag, err := tx.Exec(ctx, `
			UPDATE partner_packages
			SET invitation_used = invitation_used + 1,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = $1 AND invitation_used < invitation_quota
		`, chosenPkgID)
		if err != nil {
			log.Printf("PublishInvitation: deduct package quota: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not deduct package quota",
			})
			return
		}
		if cmdTag.RowsAffected() == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Invitation quota has been exhausted",
				"errors": gin.H{
					"package": "quota_exhausted",
				},
			})
			return
		}

		// 6. Update invitation_versions status = 'published'
		_, err = tx.Exec(ctx, `
			UPDATE invitation_versions
			SET status = 'published',
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = $1
		`, draftVersionID)
		if err != nil {
			log.Printf("PublishInvitation: update version status: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update invitation version",
			})
			return
		}

		// 7. Update invitations status = 'published', published_at, published_version_id
		// expired_at dibiarkan NULL (keputusan sementara; default masa aktif menunggu keputusan bisnis).
		// Jangan menulis ke audit_logs atau notifications (belum ada helper bersama).
		var publishedAt time.Time
		err = tx.QueryRow(ctx, `
			UPDATE invitations
			SET status = 'published',
			    published_version_id = $1,
			    published_at = CURRENT_TIMESTAMP,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
			RETURNING published_at
		`, draftVersionID, invitationID).Scan(&publishedAt)
		if err != nil {
			log.Printf("PublishInvitation: update invitation status: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update invitation",
			})
			return
		}

		// 8. Calculate total remaining quota across all active packages
		var remainingQuota int64
		err = tx.QueryRow(ctx, `
			SELECT COALESCE(SUM(invitation_quota - invitation_used), 0)
			FROM partner_packages
			WHERE user_id = $1
			  AND status = 'active'
			  AND (started_at IS NULL OR started_at <= CURRENT_TIMESTAMP)
			  AND (expired_at IS NULL OR expired_at > CURRENT_TIMESTAMP)
		`, userID).Scan(&remainingQuota)
		if err != nil {
			log.Printf("PublishInvitation: calculate remaining quota: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not calculate remaining quota",
			})
			return
		}

		// 9. Commit transaction
		if err := tx.Commit(ctx); err != nil {
			log.Printf("PublishInvitation: commit transaction: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not commit transaction",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation published successfully",
			"data": PublishInvitationResponse{
				Invitation: PublishInvitationDetail{
					ID:          invitationID,
					Title:       title,
					Slug:        slug,
					Status:      "published",
					PublishedAt: &publishedAt,
				},
				RemainingQuota: remainingQuota,
			},
		})
	}
}
