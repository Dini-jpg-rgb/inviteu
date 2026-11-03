package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvitationContentVersionResponse struct {
	ID            int64  `json:"id"`
	VersionNumber int    `json:"version_number"`
	Status        string `json:"status"`
}

type InvitationContentFieldResponse struct {
	ID              int64           `json:"id"`
	FieldKey        string          `json:"field_key"`
	Label           string          `json:"label"`
	FieldType       string          `json:"field_type"`
	DefaultValue    *string         `json:"default_value"`
	Value           *string         `json:"value"`
	IsRequired      bool            `json:"is_required"`
	IsEditable      bool            `json:"is_editable"`
	SortOrder       int             `json:"sort_order"`
	ValidationRules json.RawMessage `json:"validation_rules"`
}

type InvitationContentSectionResponse struct {
	ID         int64                            `json:"id"`
	Name       string                           `json:"name"`
	Type       string                           `json:"type"`
	SortOrder  int                              `json:"sort_order"`
	IsRequired bool                             `json:"is_required"`
	IsEditable bool                             `json:"is_editable"`
	Settings   json.RawMessage                  `json:"settings"`
	Fields     []InvitationContentFieldResponse `json:"fields"`
}

type UpdateInvitationContentItem struct {
	FieldID int64   `json:"field_id"`
	Value   *string `json:"value"`
}

type UpdateInvitationContentRequest struct {
	Fields []UpdateInvitationContentItem `json:"fields"`
}

type UpdateInvitationEventRequest struct {
	Name        *string `json:"name"`
	Date        *string `json:"date"`
	StartTime   *string `json:"start_time"`
	EndTime     *string `json:"end_time"`
	Location    *string `json:"location"`
	Address     *string `json:"address"`
	MapsURL     *string `json:"maps_url"`
	Description *string `json:"description"`
}

type UpdateInvitationRequest struct {
	Title      *string                       `json:"title"`
	TemplateID *int64                        `json:"template_id"`
	Slug       *string                       `json:"slug"`
	Event      *UpdateInvitationEventRequest `json:"event"`
}

// GetInvitationContent retrieves the working version content of the partner's invitation.
// Accessible for own invitations in any status (draft, published, expired).
func GetInvitationContent(pool *pgxpool.Pool) gin.HandlerFunc {
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

		var templateID int64
		var status string
		var publishedVersionID *int64

		err = pool.QueryRow(ctx, `
			SELECT template_id, status, published_version_id
			FROM invitations
			WHERE id = $1 AND user_id = $2
		`, invitationID, userID).Scan(&templateID, &status, &publishedVersionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("GetInvitationContent: fetch invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation content",
			})
			return
		}

		// Determine the working version: draft if available, otherwise published version.
		var workingVersion *InvitationContentVersionResponse
		var workingVersionID *int64

		var verID int64
		var verNumber int
		var verStatus string

		err = pool.QueryRow(ctx, `
			SELECT id, version_number, status
			FROM invitation_versions
			WHERE invitation_id = $1 AND status = 'draft'
			ORDER BY version_number DESC
			LIMIT 1
		`, invitationID).Scan(&verID, &verNumber, &verStatus)
		if err == nil {
			workingVersionID = &verID
			workingVersion = &InvitationContentVersionResponse{
				ID:            verID,
				VersionNumber: verNumber,
				Status:        verStatus,
			}
		} else if errors.Is(err, pgx.ErrNoRows) {
			if publishedVersionID != nil {
				errPub := pool.QueryRow(ctx, `
					SELECT id, version_number, status
					FROM invitation_versions
					WHERE id = $1
				`, *publishedVersionID).Scan(&verID, &verNumber, &verStatus)
				if errPub == nil {
					workingVersionID = &verID
					workingVersion = &InvitationContentVersionResponse{
						ID:            verID,
						VersionNumber: verNumber,
						Status:        verStatus,
					}
				}
			}

			if workingVersion == nil {
				errPub := pool.QueryRow(ctx, `
					SELECT id, version_number, status
					FROM invitation_versions
					WHERE invitation_id = $1 AND status = 'published'
					ORDER BY version_number DESC
					LIMIT 1
				`, invitationID).Scan(&verID, &verNumber, &verStatus)
				if errPub == nil {
					workingVersionID = &verID
					workingVersion = &InvitationContentVersionResponse{
						ID:            verID,
						VersionNumber: verNumber,
						Status:        verStatus,
					}
				}
			}
		} else {
			log.Printf("GetInvitationContent: fetch draft version: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation version",
			})
			return
		}

		// Fetch sections for the template
		sectionRows, err := pool.Query(ctx, `
			SELECT id, name, type, sort_order, is_required, is_editable, settings
			FROM template_sections
			WHERE template_id = $1
			ORDER BY sort_order ASC, id ASC
		`, templateID)
		if err != nil {
			log.Printf("GetInvitationContent: fetch sections: %v", err)
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
				log.Printf("GetInvitationContent: scan section: %v", err)
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
			log.Printf("GetInvitationContent: section rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template sections",
			})
			return
		}
		sectionRows.Close()

		// Fetch fields and join with invitation_contents of the working version
		fieldRows, err := pool.Query(ctx, `
			SELECT
				s.id AS section_id,
				f.id,
				f.field_key,
				f.label,
				f.field_type,
				f.default_value,
				COALESCE(ic.value, f.default_value) AS value,
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
			log.Printf("GetInvitationContent: fetch fields: %v", err)
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
				log.Printf("GetInvitationContent: scan field: %v", err)
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
			log.Printf("GetInvitationContent: field rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template fields",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation content retrieved successfully",
			"data": gin.H{
				"invitation_id": invitationID,
				"version":       workingVersion,
				"template_id":   templateID,
				"sections":      sections,
			},
		})
	}
}

// UpdateInvitationContent partially upserts content fields on a draft invitation version.
func UpdateInvitationContent(pool *pgxpool.Pool) gin.HandlerFunc {
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

		var req UpdateInvitationContentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		if len(req.Fields) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "fields cannot be empty",
				"errors": gin.H{
					"fields": "at least one field is required",
				},
			})
			return
		}

		if len(req.Fields) > 200 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "maximum 200 fields per request",
				"errors": gin.H{
					"fields": "exceeds maximum allowed fields (200)",
				},
			})
			return
		}

		seenFieldIDs := make(map[int64]bool)
		fieldIDs := make([]int64, 0, len(req.Fields))
		for _, item := range req.Fields {
			if item.FieldID <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid field ID",
					"errors": gin.H{
						"fields": "field_id must be a positive integer",
					},
				})
				return
			}
			if seenFieldIDs[item.FieldID] {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Duplicate field_id in request",
					"errors": gin.H{
						fmt.Sprintf("fields.%d", item.FieldID): "duplicate field_id in request",
					},
				})
				return
			}
			seenFieldIDs[item.FieldID] = true
			fieldIDs = append(fieldIDs, item.FieldID)
		}

		ctx := c.Request.Context()
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("UpdateInvitationContent: begin tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not begin transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		// Lock invitation row and verify draft status
		var templateID int64
		var status string
		err = tx.QueryRow(ctx, `
			SELECT template_id, status
			FROM invitations
			WHERE id = $1 AND user_id = $2
			FOR UPDATE
		`, invitationID, userID).Scan(&templateID, &status)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("UpdateInvitationContent: lock invitation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not lock invitation",
			})
			return
		}

		if status != "draft" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Only draft invitations can be edited",
				"errors": gin.H{
					"status": "invitation_is_not_draft",
				},
			})
			return
		}

		// Find working draft version inside the same transaction
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
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "No draft version found for invitation",
					"errors": gin.H{
						"version": "no_draft_version",
					},
				})
				return
			}
			log.Printf("UpdateInvitationContent: lock draft version: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not lock invitation version",
			})
			return
		}

		// Single query to validate all field IDs belong to template and fetch rules
		type fieldMeta struct {
			fieldIsEditable bool
			sectIsEditable  bool
			fieldType       string
			validationRules json.RawMessage
		}

		rows, err := tx.Query(ctx, `
			SELECT tf.id, tf.is_editable, ts.is_editable, tf.field_type, tf.validation_rules
			FROM template_fields tf
			INNER JOIN template_sections ts ON ts.id = tf.template_section_id
			WHERE tf.id = ANY($1) AND ts.template_id = $2
		`, fieldIDs, templateID)
		if err != nil {
			log.Printf("UpdateInvitationContent: query field metadata: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not validate fields",
			})
			return
		}
		defer rows.Close()

		fieldMetaMap := make(map[int64]fieldMeta)
		for rows.Next() {
			var fid int64
			var meta fieldMeta
			if err := rows.Scan(
				&fid,
				&meta.fieldIsEditable,
				&meta.sectIsEditable,
				&meta.fieldType,
				&meta.validationRules,
			); err != nil {
				log.Printf("UpdateInvitationContent: scan field metadata: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not validate fields",
				})
				return
			}
			fieldMetaMap[fid] = meta
		}
		if err := rows.Err(); err != nil {
			log.Printf("UpdateInvitationContent: rows field metadata err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not validate fields",
			})
			return
		}
		rows.Close()

		errorsMap := make(map[string]string)
		for _, item := range req.Fields {
			fieldKey := fmt.Sprintf("fields.%d", item.FieldID)
			meta, exists := fieldMetaMap[item.FieldID]
			if !exists {
				errorsMap[fieldKey] = "field does not belong to this template"
				continue
			}

			if !meta.fieldIsEditable || !meta.sectIsEditable {
				errorsMap[fieldKey] = "field is not editable"
				continue
			}

			isEmpty := item.Value == nil || *item.Value == ""
			if isEmpty {
				// Empty values: skip validation rules as instructed
				continue
			}

			val := *item.Value
			if utf8.RuneCountInString(val) > 5000 {
				errorsMap[fieldKey] = "value exceeds maximum allowed length of 5000 characters"
				continue
			}

			// Apply validation rules if defined
			if len(meta.validationRules) > 0 && string(meta.validationRules) != "null" {
				var rules struct {
					MaxLength *int    `json:"maxLength"`
					Format    *string `json:"format"`
				}
				if err := json.Unmarshal(meta.validationRules, &rules); err == nil {
					if rules.MaxLength != nil && utf8.RuneCountInString(val) > *rules.MaxLength {
						errorsMap[fieldKey] = fmt.Sprintf("value exceeds maximum length of %d characters", *rules.MaxLength)
						continue
					}
					if rules.Format != nil {
						fmtStr := *rules.Format
						if fmtStr == "YYYY-MM-DD" || meta.fieldType == "date" {
							if _, err := time.Parse("2006-01-02", val); err != nil {
								errorsMap[fieldKey] = "invalid date format, expected YYYY-MM-DD"
								continue
							}
						} else if fmtStr == "HH:mm" || meta.fieldType == "time" {
							if !invitationTimePattern.MatchString(val) {
								errorsMap[fieldKey] = "invalid time format, expected HH:mm or HH:MM:SS"
								continue
							}
						}
					}
				}
			} else {
				if meta.fieldType == "date" {
					if _, err := time.Parse("2006-01-02", val); err != nil {
						errorsMap[fieldKey] = "invalid date format, expected YYYY-MM-DD"
						continue
					}
				} else if meta.fieldType == "time" {
					if !invitationTimePattern.MatchString(val) {
						errorsMap[fieldKey] = "invalid time format, expected HH:mm or HH:MM:SS"
						continue
					}
				}
			}
		}

		if len(errorsMap) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors":  errorsMap,
			})
			return
		}

		// Perform all updates/deletes in the transaction
		fieldsUpdated := 0
		for _, item := range req.Fields {
			isEmpty := item.Value == nil || *item.Value == ""
			if isEmpty {
				_, err := tx.Exec(ctx, `
					DELETE FROM invitation_contents
					WHERE invitation_version_id = $1 AND template_field_id = $2
				`, draftVersionID, item.FieldID)
				if err != nil {
					log.Printf("UpdateInvitationContent: delete field %d: %v", item.FieldID, err)
					c.JSON(http.StatusInternalServerError, gin.H{
						"success": false,
						"message": "Could not update invitation content",
					})
					return
				}
				fieldsUpdated++
			} else {
				_, err := tx.Exec(ctx, `
					INSERT INTO invitation_contents (
						invitation_version_id, template_field_id, value, updated_at
					)
					VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
					ON CONFLICT (invitation_version_id, template_field_id)
					DO UPDATE SET
						value = EXCLUDED.value,
						updated_at = CURRENT_TIMESTAMP
				`, draftVersionID, item.FieldID, *item.Value)
				if err != nil {
					log.Printf("UpdateInvitationContent: upsert field %d: %v", item.FieldID, err)
					c.JSON(http.StatusInternalServerError, gin.H{
						"success": false,
						"message": "Could not update invitation content",
					})
					return
				}
				fieldsUpdated++
			}
		}

		_, err = tx.Exec(ctx, `
			UPDATE invitation_versions
			SET updated_at = CURRENT_TIMESTAMP
			WHERE id = $1
		`, draftVersionID)
		if err != nil {
			log.Printf("UpdateInvitationContent: update version timestamp: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update version timestamp",
			})
			return
		}

		var invitationUpdatedAt time.Time
		err = tx.QueryRow(ctx, `
			UPDATE invitations
			SET updated_at = CURRENT_TIMESTAMP
			WHERE id = $1
			RETURNING updated_at
		`, invitationID).Scan(&invitationUpdatedAt)
		if err != nil {
			log.Printf("UpdateInvitationContent: update invitation timestamp: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update invitation timestamp",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("UpdateInvitationContent: commit tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not commit transaction",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation content updated successfully",
			"data": gin.H{
				"updated_at":     invitationUpdatedAt,
				"fields_updated": fieldsUpdated,
			},
		})
	}
}

// UpdateInvitation updates draft invitation metadata (title, slug, event).
func UpdateInvitation(pool *pgxpool.Pool) gin.HandlerFunc {
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

		var req UpdateInvitationRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		// Check if body has at least one field to update
		hasField := false
		if req.Title != nil || req.TemplateID != nil || req.Slug != nil {
			hasField = true
		}
		if req.Event != nil {
			if req.Event.Name != nil || req.Event.Date != nil || req.Event.StartTime != nil ||
				req.Event.EndTime != nil || req.Event.Location != nil || req.Event.Address != nil ||
				req.Event.MapsURL != nil || req.Event.Description != nil {
				hasField = true
			}
		}

		if !hasField {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "At least one field must be provided for update",
				"errors": gin.H{
					"body": "no fields to update",
				},
			})
			return
		}

		// Field validations
		var titleVal *string
		if req.Title != nil {
			trimmed := strings.TrimSpace(*req.Title)
			if trimmed == "" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "title cannot be empty",
					"errors": gin.H{
						"title": "title cannot be empty",
					},
				})
				return
			}
			if len(trimmed) > 255 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "title cannot exceed 255 characters",
					"errors": gin.H{
						"title": "title is too long",
					},
				})
				return
			}
			titleVal = &trimmed
		}

		var slugVal *string
		if req.Slug != nil {
			trimmed := strings.ToLower(strings.TrimSpace(*req.Slug))
			if trimmed == "" || !invitationSlugPattern.MatchString(trimmed) || len(trimmed) > 255 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "slug must contain only lowercase letters, numbers, and single hyphens",
					"errors": gin.H{
						"slug": "invalid slug format",
					},
				})
				return
			}
			slugVal = &trimmed
		}

		var eventNameVal *string
		var eventDateVal *string
		var eventStartTimeVal *string
		var eventEndTimeVal *string
		var eventLocationVal *string
		var eventAddressVal *string
		var eventMapsURLVal *string
		var eventDescriptionVal *string

		if req.Event != nil {
			if req.Event.Name != nil {
				trimmed := strings.TrimSpace(*req.Event.Name)
				if trimmed == "" {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.name cannot be empty",
						"errors": gin.H{
							"event.name": "event.name cannot be empty",
						},
					})
					return
				}
				if len(trimmed) > 255 {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.name cannot exceed 255 characters",
						"errors": gin.H{
							"event.name": "event.name is too long",
						},
					})
					return
				}
				eventNameVal = &trimmed
			}

			if req.Event.Date != nil {
				trimmed := strings.TrimSpace(*req.Event.Date)
				if trimmed == "" {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.date cannot be empty",
						"errors": gin.H{
							"event.date": "event.date cannot be empty",
						},
					})
					return
				}
				if _, err := time.Parse("2006-01-02", trimmed); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.date must be in YYYY-MM-DD format",
						"errors": gin.H{
							"event.date": "invalid date format",
						},
					})
					return
				}
				eventDateVal = &trimmed
			}

			if req.Event.StartTime != nil {
				trimmed := strings.TrimSpace(*req.Event.StartTime)
				if trimmed != "" {
					if !invitationTimePattern.MatchString(trimmed) {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "event.start_time must be in HH:MM or HH:MM:SS format",
							"errors": gin.H{
								"event.start_time": "invalid time format",
							},
						})
						return
					}
					eventStartTimeVal = &trimmed
				}
			}

			if req.Event.EndTime != nil {
				trimmed := strings.TrimSpace(*req.Event.EndTime)
				if trimmed != "" {
					if !invitationTimePattern.MatchString(trimmed) {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "event.end_time must be in HH:MM or HH:MM:SS format",
							"errors": gin.H{
								"event.end_time": "invalid time format",
							},
						})
						return
					}
					eventEndTimeVal = &trimmed
				}
			}

			if req.Event.Location != nil {
				trimmed := strings.TrimSpace(*req.Event.Location)
				if len(trimmed) > 255 {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.location cannot exceed 255 characters",
						"errors": gin.H{
							"event.location": "event.location is too long",
						},
					})
					return
				}
				eventLocationVal = &trimmed
			}

			if req.Event.Address != nil {
				trimmed := strings.TrimSpace(*req.Event.Address)
				eventAddressVal = &trimmed
			}

			if req.Event.MapsURL != nil {
				trimmed := strings.TrimSpace(*req.Event.MapsURL)
				eventMapsURLVal = &trimmed
			}

			if req.Event.Description != nil {
				trimmed := strings.TrimSpace(*req.Event.Description)
				eventDescriptionVal = &trimmed
			}
		}

		ctx := c.Request.Context()
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("UpdateInvitation: begin tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not begin transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		// Lock invitation and fetch current data and event ID via invitation_events
		var currentTemplateID int64
		var currentTitle string
		var currentSlug string
		var currentStatus string
		var publishedVersionID *int64
		var publishedAt *time.Time
		var expiredAt *time.Time
		var createdAt time.Time
		var updatedAt time.Time
		var templateName string
		var templateSlug string
		var eventID *int64
		var currentEventName *string
		var currentEventDescription *string
		var currentEventDateStr *string
		var currentEventStartTimeStr *string
		var currentEventEndTimeStr *string
		var currentEventLocation *string
		var currentEventAddress *string
		var currentEventMapsURL *string

		err = tx.QueryRow(ctx, `
			SELECT i.id, i.template_id, i.title, i.slug, i.status,
			       i.published_version_id, i.published_at, i.expired_at,
			       i.created_at, i.updated_at,
			       t.name, t.slug,
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
			FOR UPDATE OF i
		`, invitationID, userID).Scan(
			&invitationID,
			&currentTemplateID,
			&currentTitle,
			&currentSlug,
			&currentStatus,
			&publishedVersionID,
			&publishedAt,
			&expiredAt,
			&createdAt,
			&updatedAt,
			&templateName,
			&templateSlug,
			&eventID,
			&currentEventName,
			&currentEventDescription,
			&currentEventDateStr,
			&currentEventStartTimeStr,
			&currentEventEndTimeStr,
			&currentEventLocation,
			&currentEventAddress,
			&currentEventMapsURL,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("UpdateInvitation: lock invitation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not lock invitation",
			})
			return
		}

		if currentStatus != "draft" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Only draft invitations can be edited",
				"errors": gin.H{
					"status": "invitation_is_not_draft",
				},
			})
			return
		}

		if req.TemplateID != nil && *req.TemplateID != currentTemplateID {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "template_id cannot be changed",
				"errors": gin.H{
					"template_id": "template_id cannot be changed",
				},
			})
			return
		}

		// Update event if event fields are provided and event exists
		var finalEventDateStr string
		if currentEventDateStr != nil {
			finalEventDateStr = *currentEventDateStr
		}
		var finalEventStartTimeStr *string = currentEventStartTimeStr
		var finalEventEndTimeStr *string = currentEventEndTimeStr
		var finalEventName string
		if currentEventName != nil {
			finalEventName = *currentEventName
		}
		var finalEventLocation *string = currentEventLocation
		var finalEventAddress *string = currentEventAddress
		var finalEventMapsURL *string = currentEventMapsURL
		var finalEventDescription *string = currentEventDescription

		if req.Event != nil && eventID != nil {
			// Validate start_time and end_time comparison
			effectiveStart := currentEventStartTimeStr
			if req.Event.StartTime != nil {
				effectiveStart = eventStartTimeVal
			}
			effectiveEnd := currentEventEndTimeStr
			if req.Event.EndTime != nil {
				effectiveEnd = eventEndTimeVal
			}

			if effectiveStart != nil && effectiveEnd != nil {
				stSecs, ok1 := parseTimeSeconds(*effectiveStart)
				etSecs, ok2 := parseTimeSeconds(*effectiveEnd)
				if !ok1 || !ok2 || etSecs < stSecs {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.end_time cannot be earlier than event.start_time",
						"errors": gin.H{
							"event.end_time": "end_time must be greater than or equal to start_time",
						},
					})
					return
				}
			}

			err = tx.QueryRow(ctx, `
				UPDATE events
				SET name = COALESCE($1, name),
				    date = COALESCE($2::date, date),
				    start_time = CASE WHEN $3 THEN $4::time ELSE start_time END,
				    end_time = CASE WHEN $5 THEN $6::time ELSE end_time END,
				    location = CASE WHEN $7 THEN $8 ELSE location END,
				    address = CASE WHEN $9 THEN $10 ELSE address END,
				    maps_url = CASE WHEN $11 THEN $12 ELSE maps_url END,
				    description = CASE WHEN $13 THEN $14 ELSE description END,
				    updated_at = CURRENT_TIMESTAMP
				WHERE id = $15
				RETURNING name, date::text, start_time::text, end_time::text, location, address, maps_url, description
			`,
				eventNameVal,
				eventDateVal,
				req.Event.StartTime != nil, eventStartTimeVal,
				req.Event.EndTime != nil, eventEndTimeVal,
				req.Event.Location != nil, eventLocationVal,
				req.Event.Address != nil, eventAddressVal,
				req.Event.MapsURL != nil, eventMapsURLVal,
				req.Event.Description != nil, eventDescriptionVal,
				*eventID,
			).Scan(
				&finalEventName,
				&finalEventDateStr,
				&finalEventStartTimeStr,
				&finalEventEndTimeStr,
				&finalEventLocation,
				&finalEventAddress,
				&finalEventMapsURL,
				&finalEventDescription,
			)
			if err != nil {
				log.Printf("UpdateInvitation: update event: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not update event data",
				})
				return
			}
		}

		// Update invitation title, slug, and updated_at
		finalTitle := currentTitle
		finalSlug := currentSlug
		var finalUpdatedAt time.Time

		err = tx.QueryRow(ctx, `
			UPDATE invitations
			SET title = COALESCE($1, title),
			    slug = COALESCE($2, slug),
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = $3
			RETURNING title, slug, updated_at
		`, titleVal, slugVal, invitationID).Scan(&finalTitle, &finalSlug, &finalUpdatedAt)
		if err != nil {
			if isUniqueViolation(err) {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Slug is already in use",
					"errors": gin.H{
						"slug": "slug_already_taken",
					},
				})
				return
			}
			log.Printf("UpdateInvitation: update invitation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update invitation",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("UpdateInvitation: commit tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not commit transaction",
			})
			return
		}

		var eventResp InvitationEventResponse
		if eventID != nil {
			eventResp = InvitationEventResponse{
				ID:          *eventID,
				Name:        finalEventName,
				Date:        finalEventDateStr,
				StartTime:   finalEventStartTimeStr,
				EndTime:     finalEventEndTimeStr,
				Location:    finalEventLocation,
				Address:     finalEventAddress,
				MapsURL:     finalEventMapsURL,
				Description: finalEventDescription,
			}
		}

		resp := InvitationDetailResponse{
			ID:                 invitationID,
			Title:              finalTitle,
			Slug:               finalSlug,
			Status:             currentStatus,
			PublishedVersionID: publishedVersionID,
			PublishedAt:        publishedAt,
			ExpiredAt:          expiredAt,
			Template: InvitationTemplateDetail{
				ID:   currentTemplateID,
				Name: templateName,
				Slug: templateSlug,
			},
			Event:     eventResp,
			CreatedAt: createdAt,
			UpdatedAt: finalUpdatedAt,
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation updated successfully",
			"data": gin.H{
				"invitation": resp,
			},
		})
	}
}
