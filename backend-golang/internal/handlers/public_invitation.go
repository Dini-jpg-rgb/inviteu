package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PublicInvitationDetail struct {
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	PublishedAt *time.Time `json:"published_at"`
}

type PublicTemplateDetail struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type PublicEventDetail struct {
	Name        string  `json:"name"`
	Date        string  `json:"date"`
	StartTime   *string `json:"start_time"`
	EndTime     *string `json:"end_time"`
	Location    *string `json:"location"`
	Address     *string `json:"address"`
	MapsURL     *string `json:"maps_url"`
	Description *string `json:"description"`
}

type PublicFieldDetail struct {
	ID        int64   `json:"id"`
	FieldKey  string  `json:"field_key"`
	Label     string  `json:"label"`
	FieldType string  `json:"field_type"`
	Value     *string `json:"value"`
	SortOrder int     `json:"sort_order"`
}

type PublicSectionDetail struct {
	ID        int64               `json:"id"`
	Name      string              `json:"name"`
	Type      string              `json:"type"`
	SortOrder int                 `json:"sort_order"`
	Settings  json.RawMessage     `json:"settings"`
	Fields    []PublicFieldDetail `json:"fields"`
}

type PublicInvitationData struct {
	Invitation PublicInvitationDetail `json:"invitation"`
	Template   PublicTemplateDetail   `json:"template"`
	Event      PublicEventDetail      `json:"event"`
	Sections   []PublicSectionDetail  `json:"sections"`
}

func sendPublicInvitationNotFound(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusNotFound, gin.H{
		"success": false,
		"message": "Invitation not found",
	})
}

// GetPublicInvitation retrieves the published invitation content by slug without authentication.
func GetPublicInvitation(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := strings.TrimSpace(c.Param("slug"))
		if slug == "" || len([]rune(slug)) > 255 {
			sendPublicInvitationNotFound(c)
			return
		}

		ctx := c.Request.Context()
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{
			IsoLevel:   pgx.RepeatableRead,
			AccessMode: pgx.ReadOnly,
		})
		if err != nil {
			log.Printf("GetPublicInvitation: begin transaction: %v", err)
			c.Header("Cache-Control", "no-store")
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
			invitationID       int64
			title              string
			publishedAt        *time.Time
			publishedVersionID *int64
			templateID         int64
			templateName       string
			templateSlug       string
		)

		err = tx.QueryRow(ctx, `
			SELECT
				i.id, i.title, i.published_at, i.published_version_id,
				t.id, t.name, t.slug
			FROM invitations i
			INNER JOIN templates t ON t.id = i.template_id
			WHERE i.slug = $1
			  AND i.status = 'published'
			  AND (i.expired_at IS NULL OR i.expired_at > CURRENT_TIMESTAMP)
		`, slug).Scan(
			&invitationID,
			&title,
			&publishedAt,
			&publishedVersionID,
			&templateID,
			&templateName,
			&templateSlug,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				sendPublicInvitationNotFound(c)
				return
			}
			log.Printf("GetPublicInvitation: query invitation: %v", err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		if publishedVersionID == nil {
			log.Printf("GetPublicInvitation: invitation %d has null published_version_id", invitationID)
			sendPublicInvitationNotFound(c)
			return
		}

		var versionStatus string
		err = tx.QueryRow(ctx, `
			SELECT status
			FROM invitation_versions
			WHERE id = $1 AND invitation_id = $2
		`, *publishedVersionID, invitationID).Scan(&versionStatus)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("GetPublicInvitation: invitation %d has invalid published version %d", invitationID, *publishedVersionID)
				sendPublicInvitationNotFound(c)
				return
			}
			log.Printf("GetPublicInvitation: query version: %v", err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		if versionStatus != "published" {
			log.Printf("GetPublicInvitation: invitation %d version %d status is not published", invitationID, *publishedVersionID)
			sendPublicInvitationNotFound(c)
			return
		}

		var (
			eventName        string
			eventDate        string
			eventStartTime   *string
			eventEndTime     *string
			eventLocation    *string
			eventAddress     *string
			eventMapsURL     *string
			eventDescription *string
		)

		err = tx.QueryRow(ctx, `
			SELECT
				e.name,
				e.date::text,
				e.start_time::text,
				e.end_time::text,
				e.location,
				e.address,
				e.maps_url,
				e.description
			FROM invitation_events ie
			INNER JOIN events e ON e.id = ie.event_id
			WHERE ie.invitation_id = $1
			ORDER BY ie.sort_order ASC, ie.id ASC
			LIMIT 1
		`, invitationID).Scan(
			&eventName,
			&eventDate,
			&eventStartTime,
			&eventEndTime,
			&eventLocation,
			&eventAddress,
			&eventMapsURL,
			&eventDescription,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("GetPublicInvitation: invitation %d has no associated event", invitationID)
				sendPublicInvitationNotFound(c)
				return
			}
			log.Printf("GetPublicInvitation: query event: %v", err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		sectionRows, err := tx.Query(ctx, `
			SELECT id, name, type, sort_order, settings
			FROM template_sections
			WHERE template_id = $1
			ORDER BY sort_order ASC, id ASC
		`, templateID)
		if err != nil {
			log.Printf("GetPublicInvitation: fetch sections: %v", err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		defer sectionRows.Close()

		sections := make([]PublicSectionDetail, 0)
		sectionIndexMap := make(map[int64]int)
		for sectionRows.Next() {
			var sec PublicSectionDetail
			sec.Fields = make([]PublicFieldDetail, 0)
			if err := sectionRows.Scan(
				&sec.ID,
				&sec.Name,
				&sec.Type,
				&sec.SortOrder,
				&sec.Settings,
			); err != nil {
				log.Printf("GetPublicInvitation: scan section: %v", err)
				c.Header("Cache-Control", "no-store")
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Internal server error",
				})
				return
			}
			sectionIndexMap[sec.ID] = len(sections)
			sections = append(sections, sec)
		}
		if err := sectionRows.Err(); err != nil {
			log.Printf("GetPublicInvitation: section rows: %v", err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		sectionRows.Close()

		fieldRows, err := tx.Query(ctx, `
			SELECT
				s.id AS section_id,
				f.id,
				f.field_key,
				f.label,
				f.field_type,
				COALESCE(NULLIF(TRIM(ic.value), ''), NULLIF(TRIM(f.default_value), '')) AS value,
				f.sort_order
			FROM template_fields f
			INNER JOIN template_sections s ON s.id = f.template_section_id
			LEFT JOIN invitation_contents ic ON ic.template_field_id = f.id AND ic.invitation_version_id = $2
			WHERE s.template_id = $1
			ORDER BY s.sort_order ASC, s.id ASC, f.sort_order ASC, f.id ASC
		`, templateID, *publishedVersionID)
		if err != nil {
			log.Printf("GetPublicInvitation: fetch fields: %v", err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		defer fieldRows.Close()

		for fieldRows.Next() {
			var sectionID int64
			var fld PublicFieldDetail
			if err := fieldRows.Scan(
				&sectionID,
				&fld.ID,
				&fld.FieldKey,
				&fld.Label,
				&fld.FieldType,
				&fld.Value,
				&fld.SortOrder,
			); err != nil {
				log.Printf("GetPublicInvitation: scan field: %v", err)
				c.Header("Cache-Control", "no-store")
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Internal server error",
				})
				return
			}

			if idx, exists := sectionIndexMap[sectionID]; exists {
				sections[idx].Fields = append(sections[idx].Fields, fld)
			}
		}
		if err := fieldRows.Err(); err != nil {
			log.Printf("GetPublicInvitation: field rows: %v", err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		fieldRows.Close()

		c.Header("Cache-Control", "public, max-age=60")
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation retrieved successfully",
			"data": PublicInvitationData{
				Invitation: PublicInvitationDetail{
					Title:       title,
					Slug:        slug,
					PublishedAt: publishedAt,
				},
				Template: PublicTemplateDetail{
					Name: templateName,
					Slug: templateSlug,
				},
				Event: PublicEventDetail{
					Name:        eventName,
					Date:        eventDate,
					StartTime:   eventStartTime,
					EndTime:     eventEndTime,
					Location:    eventLocation,
					Address:     eventAddress,
					MapsURL:     eventMapsURL,
					Description: eventDescription,
				},
				Sections: sections,
			},
		})
	}
}
