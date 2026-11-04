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

type InvitationPreviewDetail struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Status      string     `json:"status"`
	PublishedAt *time.Time `json:"published_at"`
	ExpiredAt   *time.Time `json:"expired_at"`
}

type InvitationPreviewReadiness struct {
	IsReady bool              `json:"is_ready"`
	Errors  map[string]string `json:"errors"`
}

type InvitationPreviewData struct {
	Invitation InvitationPreviewDetail            `json:"invitation"`
	Template   InvitationTemplateDetail           `json:"template"`
	Event      *InvitationEventResponse           `json:"event"`
	Version    InvitationContentVersionResponse   `json:"version"`
	Sections   []InvitationContentSectionResponse `json:"sections"`
	Readiness  *InvitationPreviewReadiness        `json:"readiness"`
}

// PreviewInvitation retrieves a composite read-only preview of an invitation.
// It returns invitation metadata, event data, template details, and sections/fields
// with effective values (trimmed stored value or trimmed default_value).
// For draft invitations, it includes readiness check via ValidateInvitationReadiness.
func PreviewInvitation(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		idParam := strings.TrimSpace(c.Param("id"))
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
			})
			return
		}

		ctx := c.Request.Context()

		// Gunakan transaksi baca-saja RepeatableRead untuk menjamin snapshot data yang konsisten
		// di semua query (metadata, event, section, field, dan konten) tanpa risiko phantom read.
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{
			IsoLevel:   pgx.RepeatableRead,
			AccessMode: pgx.ReadOnly,
		})
		if err != nil {
			log.Printf("PreviewInvitation: begin read-only transaction: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not start transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		var (
			title              string
			slug               string
			status             string
			publishedVersionID *int64
			publishedAt        *time.Time
			expiredAt          *time.Time

			templateID   int64
			templateName string
			templateSlug string

			eventID          *int64
			eventName        *string
			eventDescription *string
			eventDate        *string
			eventStartTime   *string
			eventEndTime     *string
			eventLocation    *string
			eventAddress     *string
			eventMapsURL     *string
		)

		err = tx.QueryRow(ctx, `
			SELECT
				i.id, i.title, i.slug, i.status,
				i.published_version_id, i.published_at, i.expired_at,
				t.id, t.name, t.slug,
				e.id, e.name, e.description,
				e.date::text, e.start_time::text, e.end_time::text,
				e.location, e.address, e.maps_url
			FROM invitations i
			INNER JOIN templates t ON t.id = i.template_id
			LEFT JOIN LATERAL (
				SELECT ie.event_id
				FROM invitation_events ie
				WHERE ie.invitation_id = i.id
				ORDER BY ie.sort_order ASC, ie.id ASC
				LIMIT 1
			) ie ON true
			LEFT JOIN events e ON e.id = ie.event_id
			WHERE i.id = $1 AND i.user_id = $2
		`, invitationID, userID).Scan(
			&invitationID,
			&title,
			&slug,
			&status,
			&publishedVersionID,
			&publishedAt,
			&expiredAt,
			&templateID,
			&templateName,
			&templateSlug,
			&eventID,
			&eventName,
			&eventDescription,
			&eventDate,
			&eventStartTime,
			&eventEndTime,
			&eventLocation,
			&eventAddress,
			&eventMapsURL,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("PreviewInvitation: query invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation",
			})
			return
		}

		// Determine the working version: draft if available, otherwise published version.
		var (
			workingVersionID int64
			workingVersion   InvitationContentVersionResponse
		)

		err = tx.QueryRow(ctx, `
			SELECT id, version_number, status
			FROM invitation_versions
			WHERE invitation_id = $1 AND status = 'draft'
			ORDER BY version_number DESC
			LIMIT 1
		`, invitationID).Scan(&workingVersion.ID, &workingVersion.VersionNumber, &workingVersion.Status)
		if err == nil {
			workingVersionID = workingVersion.ID
		} else if errors.Is(err, pgx.ErrNoRows) {
			if publishedVersionID != nil {
				errPub := tx.QueryRow(ctx, `
					SELECT id, version_number, status
					FROM invitation_versions
					WHERE id = $1
				`, *publishedVersionID).Scan(&workingVersion.ID, &workingVersion.VersionNumber, &workingVersion.Status)
				if errPub == nil {
					workingVersionID = workingVersion.ID
				}
			}
			if workingVersionID == 0 {
				errPub := tx.QueryRow(ctx, `
					SELECT id, version_number, status
					FROM invitation_versions
					WHERE invitation_id = $1 AND status = 'published'
					ORDER BY version_number DESC
					LIMIT 1
				`, invitationID).Scan(&workingVersion.ID, &workingVersion.VersionNumber, &workingVersion.Status)
				if errPub == nil {
					workingVersionID = workingVersion.ID
				}
			}
		} else {
			log.Printf("PreviewInvitation: query draft version: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation version",
			})
			return
		}

		if workingVersionID == 0 {
			log.Printf("PreviewInvitation: no version found for invitation %d", invitationID)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		// Fetch sections for the template, ordered by sort_order ASC, id ASC
		sectionRows, err := tx.Query(ctx, `
			SELECT id, name, type, sort_order, is_required, is_editable, settings
			FROM template_sections
			WHERE template_id = $1
			ORDER BY sort_order ASC, id ASC
		`, templateID)
		if err != nil {
			log.Printf("PreviewInvitation: fetch sections: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template sections",
			})
			return
		}
		defer sectionRows.Close()

		sections := make([]InvitationContentSectionResponse, 0)
		sectionIndexMap := make(map[int64]int)
		for sectionRows.Next() {
			var sec InvitationContentSectionResponse
			sec.Fields = make([]InvitationContentFieldResponse, 0)
			if err := sectionRows.Scan(
				&sec.ID,
				&sec.Name,
				&sec.Type,
				&sec.SortOrder,
				&sec.IsRequired,
				&sec.IsEditable,
				&sec.Settings,
			); err != nil {
				log.Printf("PreviewInvitation: scan section: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read template sections",
				})
				return
			}
			sectionIndexMap[sec.ID] = len(sections)
			sections = append(sections, sec)
		}
		if err := sectionRows.Err(); err != nil {
			log.Printf("PreviewInvitation: section rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template sections",
			})
			return
		}
		sectionRows.Close()

		// Fetch fields joined with invitation_contents of the working version.
		// Effective value: COALESCE(NULLIF(TRIM(ic.value), ''), NULLIF(TRIM(f.default_value), ''))
		fieldRows, err := tx.Query(ctx, `
			SELECT
				s.id AS section_id,
				f.id,
				f.field_key,
				f.label,
				f.field_type,
				f.default_value,
				COALESCE(NULLIF(TRIM(ic.value), ''), NULLIF(TRIM(f.default_value), '')) AS value,
				f.is_required,
				f.is_editable,
				f.sort_order,
				f.validation_rules
			FROM template_fields f
			INNER JOIN template_sections s ON s.id = f.template_section_id
			LEFT JOIN invitation_contents ic ON ic.template_field_id = f.id AND ic.invitation_version_id = $2
			WHERE s.template_id = $1
			ORDER BY s.sort_order ASC, s.id ASC, f.sort_order ASC, f.id ASC
		`, templateID, workingVersionID)
		if err != nil {
			log.Printf("PreviewInvitation: fetch fields: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template fields",
			})
			return
		}
		defer fieldRows.Close()

		for fieldRows.Next() {
			var sectionID int64
			var field InvitationContentFieldResponse
			if err := fieldRows.Scan(
				&sectionID,
				&field.ID,
				&field.FieldKey,
				&field.Label,
				&field.FieldType,
				&field.DefaultValue,
				&field.Value,
				&field.IsRequired,
				&field.IsEditable,
				&field.SortOrder,
				&field.ValidationRules,
			); err != nil {
				log.Printf("PreviewInvitation: scan field: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read template fields",
				})
				return
			}

			if idx, exists := sectionIndexMap[sectionID]; exists {
				sections[idx].Fields = append(sections[idx].Fields, field)
			}
		}
		if err := fieldRows.Err(); err != nil {
			log.Printf("PreviewInvitation: field rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template fields",
			})
			return
		}
		fieldRows.Close()

		// Calculate readiness only for draft invitations using ValidateInvitationReadiness
		var readiness *InvitationPreviewReadiness
		if status == "draft" {
			valErrors, err := ValidateInvitationReadiness(ctx, tx, invitationID, templateID, workingVersionID)
			if err != nil {
				log.Printf("PreviewInvitation: validate readiness: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not check invitation readiness",
				})
				return
			}
			readiness = &InvitationPreviewReadiness{
				IsReady: len(valErrors) == 0,
				Errors:  valErrors,
			}
		}

		var eventResp *InvitationEventResponse
		if eventID != nil && eventName != nil && eventDate != nil {
			eventResp = &InvitationEventResponse{
				ID:          *eventID,
				Name:        *eventName,
				Date:        *eventDate,
				StartTime:   eventStartTime,
				EndTime:     eventEndTime,
				Location:    eventLocation,
				Address:     eventAddress,
				MapsURL:     eventMapsURL,
				Description: eventDescription,
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation preview retrieved successfully",
			"data": InvitationPreviewData{
				Invitation: InvitationPreviewDetail{
					ID:          invitationID,
					Title:       title,
					Slug:        slug,
					Status:      status,
					PublishedAt: publishedAt,
					ExpiredAt:   expiredAt,
				},
				Template: InvitationTemplateDetail{
					ID:   templateID,
					Name: templateName,
					Slug: templateSlug,
				},
				Event:     eventResp,
				Version:   workingVersion,
				Sections:  sections,
				Readiness: readiness,
			},
		})
	}
}
