package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubmitPublicRSVPRequest struct {
	Name             string  `json:"name"`
	AttendanceStatus string  `json:"attendance_status"`
	NumberOfGuests   *int    `json:"number_of_guests"`
	Message          *string `json:"message"`
}

type RSVPListItem struct {
	ID               int64      `json:"id"`
	Name             string     `json:"name"`
	AttendanceStatus string     `json:"attendance_status"`
	NumberOfGuests   int        `json:"number_of_guests"`
	Message          *string    `json:"message"`
	SubmittedAt      *time.Time `json:"submitted_at"`
}

// SubmitPublicRSVP handles public RSVP submissions by slug.
func SubmitPublicRSVP(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024)

		var req SubmitPublicRSVPRequest
		decoder := json.NewDecoder(c.Request.Body)
		if err := decoder.Decode(&req); err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Request body exceeds maximum size of 64KB",
					"errors": gin.H{
						"body": "request body must not exceed 64KB",
					},
				})
				return
			}
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
				"errors": gin.H{
					"body": "request body must be valid JSON",
				},
			})
			return
		}

		fieldErrors := make(map[string]string)

		name := strings.TrimSpace(req.Name)
		if name == "" {
			fieldErrors["name"] = "name is required"
		} else if len([]rune(name)) > 255 {
			fieldErrors["name"] = "name must not exceed 255 characters"
		}

		status := strings.TrimSpace(req.AttendanceStatus)
		if status != "attending" && status != "not_attending" {
			fieldErrors["attendance_status"] = "attendance_status must be either 'attending' or 'not_attending'"
		}

		if req.NumberOfGuests == nil {
			fieldErrors["number_of_guests"] = "number_of_guests is required"
		} else if status == "attending" {
			if *req.NumberOfGuests < 1 || *req.NumberOfGuests > 10 {
				fieldErrors["number_of_guests"] = "number_of_guests must be between 1 and 10 for attending status"
			}
		} else if status == "not_attending" {
			if *req.NumberOfGuests != 0 {
				fieldErrors["number_of_guests"] = "number_of_guests must be 0 for not_attending status"
			}
		}

		var cleanMessage *string
		if req.Message != nil {
			trimmedMsg := strings.TrimSpace(*req.Message)
			if len([]rune(trimmedMsg)) > 1000 {
				fieldErrors["message"] = "message must not exceed 1000 characters"
			} else if trimmedMsg != "" {
				cleanMessage = &trimmedMsg
			}
		}

		if len(fieldErrors) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors":  fieldErrors,
			})
			return
		}

		slug := strings.TrimSpace(c.Param("slug"))
		if slug == "" {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}

		var invitationID int64
		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT id
			 FROM invitations
			 WHERE slug = $1
			   AND status = 'published'
			   AND (expired_at IS NULL OR expired_at > CURRENT_TIMESTAMP)`,
			slug,
		).Scan(&invitationID)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}
		if err != nil {
			log.Printf("SubmitPublicRSVP: query invitation %s: %v", slug, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to process RSVP",
			})
			return
		}

		ctx := c.Request.Context()
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("SubmitPublicRSVP: begin tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to process RSVP",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(ctx)
		}()

		var guestID int64
		guestInserted := false
		for attempt := 1; attempt <= 3; attempt++ {
			tokenBytes := make([]byte, 32)
			if _, err := rand.Read(tokenBytes); err != nil {
				log.Printf("SubmitPublicRSVP: crypto/rand read: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to process RSVP",
				})
				return
			}
			token := hex.EncodeToString(tokenBytes)

			err = tx.QueryRow(
				ctx,
				`INSERT INTO guests (invitation_id, name, unique_token)
				 VALUES ($1, $2, $3)
				 RETURNING id`,
				invitationID,
				name,
				token,
			).Scan(&guestID)

			if err == nil {
				guestInserted = true
				break
			}

			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" && strings.Contains(pgErr.ConstraintName, "unique_token") {
				continue
			}

			log.Printf("SubmitPublicRSVP: insert guest: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to process RSVP",
			})
			return
		}

		if !guestInserted {
			log.Printf("SubmitPublicRSVP: unique token collision limit reached")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to process RSVP",
			})
			return
		}

		var submittedAt time.Time
		err = tx.QueryRow(
			ctx,
			`INSERT INTO rsvps (guest_id, attendance_status, number_of_guests, message, submitted_at)
			 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
			 RETURNING submitted_at`,
			guestID,
			status,
			*req.NumberOfGuests,
			cleanMessage,
		).Scan(&submittedAt)

		if err != nil {
			log.Printf("SubmitPublicRSVP: insert rsvps: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to process RSVP",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("SubmitPublicRSVP: commit tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to process RSVP",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "RSVP submitted successfully",
			"data": gin.H{
				"attendance_status": status,
				"number_of_guests":  *req.NumberOfGuests,
				"message":           cleanMessage,
				"submitted_at":      submittedAt,
			},
		})
	}
}

// GetInvitationRSVPs retrieves the list and summary of RSVPs for partner owners.
func GetInvitationRSVPs(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		ctx := c.Request.Context()
		var existingID int64
		err = pool.QueryRow(
			ctx,
			`SELECT id FROM invitations WHERE id = $1 AND user_id = $2`,
			invitationID,
			userID,
		).Scan(&existingID)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}
		if err != nil {
			log.Printf("GetInvitationRSVPs: verify ownership: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve RSVPs",
			})
			return
		}

		page := int64(1)
		if pageStr := strings.TrimSpace(c.Query("page")); pageStr != "" {
			if parsed, err := strconv.ParseInt(pageStr, 10, 64); err == nil && parsed >= 1 {
				page = parsed
			}
		}

		limit := int64(12)
		if limitStr := strings.TrimSpace(c.Query("limit")); limitStr != "" {
			if parsed, err := strconv.ParseInt(limitStr, 10, 64); err == nil {
				if parsed > 50 {
					limit = 50
				} else if parsed >= 1 {
					limit = parsed
				}
			}
		}

		statusFilter := strings.TrimSpace(c.Query("status"))
		if statusFilter != "" && statusFilter != "attending" && statusFilter != "not_attending" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"status": "status filter must be 'attending' or 'not_attending'",
				},
			})
			return
		}

		searchFilter := strings.TrimSpace(c.Query("search"))
		if len([]rune(searchFilter)) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"search": "search query must not exceed 100 characters",
				},
			})
			return
		}

		var summary struct {
			TotalResponses    int64 `json:"total_responses"`
			AttendingCount    int64 `json:"attending_count"`
			NotAttendingCount int64 `json:"not_attending_count"`
			TotalGuests       int64 `json:"total_guests"`
		}

		err = pool.QueryRow(
			ctx,
			`SELECT 
				COUNT(r.id) AS total_responses,
				COUNT(r.id) FILTER (WHERE r.attendance_status = 'attending') AS attending_count,
				COUNT(r.id) FILTER (WHERE r.attendance_status = 'not_attending') AS not_attending_count,
				COALESCE(SUM(r.number_of_guests) FILTER (WHERE r.attendance_status = 'attending'), 0) AS total_guests
			 FROM rsvps r
			 JOIN guests g ON r.guest_id = g.id
			 WHERE g.invitation_id = $1`,
			invitationID,
		).Scan(
			&summary.TotalResponses,
			&summary.AttendingCount,
			&summary.NotAttendingCount,
			&summary.TotalGuests,
		)

		if err != nil {
			log.Printf("GetInvitationRSVPs: query summary: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve RSVPs",
			})
			return
		}

		whereClauses := []string{"g.invitation_id = $1"}
		args := []interface{}{invitationID}
		argIdx := 2

		if statusFilter != "" {
			whereClauses = append(whereClauses, fmt.Sprintf("r.attendance_status = $%d", argIdx))
			args = append(args, statusFilter)
			argIdx++
		}

		if searchFilter != "" {
			whereClauses = append(whereClauses, fmt.Sprintf("g.name ILIKE $%d ESCAPE '\\'", argIdx))
			args = append(args, "%"+escapeLikePattern(searchFilter)+"%")
			argIdx++
		}

		whereSQL := strings.Join(whereClauses, " AND ")

		var total int64
		countSQL := fmt.Sprintf(`SELECT COUNT(r.id) FROM rsvps r JOIN guests g ON r.guest_id = g.id WHERE %s`, whereSQL)
		if err := pool.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
			log.Printf("GetInvitationRSVPs: count: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve RSVPs",
			})
			return
		}

		offset := (page - 1) * limit
		listArgs := append(args, limit, offset)
		listSQL := fmt.Sprintf(`
			SELECT r.id, g.name, r.attendance_status, r.number_of_guests, r.message, r.submitted_at
			FROM rsvps r
			JOIN guests g ON r.guest_id = g.id
			WHERE %s
			ORDER BY r.submitted_at DESC NULLS LAST, r.id DESC
			LIMIT $%d OFFSET $%d
		`, whereSQL, argIdx, argIdx+1)

		rows, err := pool.Query(ctx, listSQL, listArgs...)
		if err != nil {
			log.Printf("GetInvitationRSVPs: query list: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve RSVPs",
			})
			return
		}
		defer rows.Close()

		items := make([]RSVPListItem, 0)
		for rows.Next() {
			var item RSVPListItem
			if err := rows.Scan(
				&item.ID,
				&item.Name,
				&item.AttendanceStatus,
				&item.NumberOfGuests,
				&item.Message,
				&item.SubmittedAt,
			); err != nil {
				log.Printf("GetInvitationRSVPs: scan item: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve RSVPs",
				})
				return
			}
			items = append(items, item)
		}

		if err := rows.Err(); err != nil {
			log.Printf("GetInvitationRSVPs: rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve RSVPs",
			})
			return
		}

		totalPages := int64(0)
		if total > 0 {
			totalPages = int64(math.Ceil(float64(total) / float64(limit)))
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "RSVP list retrieved successfully",
			"data": gin.H{
				"summary": summary,
				"rsvps":   items,
				"pagination": gin.H{
					"page":        page,
					"limit":       limit,
					"total":       total,
					"total_pages": totalPages,
				},
			},
		})
	}
}

func escapeLikePattern(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `%`, `\%`)
	s = strings.ReplaceAll(s, `_`, `\_`)
	return s
}
