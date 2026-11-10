package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	invitationSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	invitationTimePattern = regexp.MustCompile(`^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$`)
)

type CreateInvitationRequest struct {
	Title      string             `json:"title"`
	TemplateID int64              `json:"template_id"`
	Slug       *string            `json:"slug"`
	Event      CreateEventRequest `json:"event"`
}

type CreateEventRequest struct {
	Name        string  `json:"name"`
	Date        string  `json:"date"`
	StartTime   *string `json:"start_time"`
	EndTime     *string `json:"end_time"`
	Location    *string `json:"location"`
	Address     *string `json:"address"`
	MapsURL     *string `json:"maps_url"`
	Description *string `json:"description"`
}

type InvitationTemplateSummary struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type InvitationTemplateDetail struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type InvitationEventResponse struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Date        string  `json:"date"`
	StartTime   *string `json:"start_time"`
	EndTime     *string `json:"end_time"`
	Location    *string `json:"location"`
	Address     *string `json:"address,omitempty"`
	MapsURL     *string `json:"maps_url,omitempty"`
	Description *string `json:"description,omitempty"`
}

// CreatedAt and UpdatedAt are scanned from timestamp without time zone.
// Note on Timezone: pgx v5 assigns UTC zone when decoding timestamp without time zone,
// so encoding/json serializes with a trailing "Z" (matching order.go).
type CreateInvitationResponse struct {
	ID        int64                     `json:"id"`
	Title     string                    `json:"title"`
	Slug      string                    `json:"slug"`
	Status    string                    `json:"status"`
	Template  InvitationTemplateSummary `json:"template"`
	Event     InvitationEventResponse   `json:"event"`
	CreatedAt time.Time                 `json:"created_at"`
	UpdatedAt time.Time                 `json:"updated_at"`
}

type InvitationListItemResponse struct {
	ID        int64                     `json:"id"`
	Title     string                    `json:"title"`
	Slug      string                    `json:"slug"`
	Status    string                    `json:"status"`
	Template  InvitationTemplateSummary `json:"template"`
	Event     InvitationEventResponse   `json:"event"`
	CreatedAt time.Time                 `json:"created_at"`
	UpdatedAt time.Time                 `json:"updated_at"`
}

type InvitationDetailResponse struct {
	ID                 int64                    `json:"id"`
	Title              string                   `json:"title"`
	Slug               string                   `json:"slug"`
	Status             string                   `json:"status"`
	PublishedVersionID *int64                   `json:"published_version_id"`
	PublishedAt        *time.Time               `json:"published_at"`
	ExpiredAt          *time.Time               `json:"expired_at"`
	Template           InvitationTemplateDetail `json:"template"`
	Event              InvitationEventResponse  `json:"event"`
	CreatedAt          time.Time                `json:"created_at"`
	UpdatedAt          time.Time                `json:"updated_at"`
}

type InvitationPaginationMeta struct {
	Page       int64 `json:"page"`
	Limit      int64 `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"total_pages"`
}

func invitationUserID(c *gin.Context) (int64, bool) {
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Authentication required",
		})
		return 0, false
	}

	userID, ok := userIDValue.(int64)
	if !ok || userID <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid authenticated user",
		})
		return 0, false
	}

	return userID, true
}

func checkPartnerInvitationEligibility(ctx context.Context, pool *pgxpool.Pool, userID int64) (bool, bool, error) {
	var hasActivePackage bool
	var hasAvailableQuota bool

	err := pool.QueryRow(ctx, `
		SELECT 
			COUNT(*) > 0 AS has_active_package,
			COALESCE(BOOL_OR(invitation_used < invitation_quota), FALSE) AS has_available_quota
		FROM partner_packages
		WHERE user_id = $1
		  AND status = 'active'
		  AND (started_at IS NULL OR started_at <= CURRENT_TIMESTAMP)
		  AND (expired_at IS NULL OR expired_at > CURRENT_TIMESTAMP)
	`, userID).Scan(&hasActivePackage, &hasAvailableQuota)
	if err != nil {
		return false, false, err
	}

	return hasActivePackage, hasAvailableQuota, nil
}

func slugifyInvitationTitle(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	lastDash := false
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			lastDash = false
		} else {
			if !lastDash && b.Len() > 0 {
				b.WriteRune('-')
				lastDash = true
			}
		}
	}
	res := strings.Trim(b.String(), "-")
	if res == "" {
		return "invitation"
	}
	return res
}

func randomHexSuffix(chars int) string {
	bytes := make([]byte, (chars+1)/2)
	if _, err := rand.Read(bytes); err != nil {
		return strconv.FormatInt(time.Now().UnixNano()%10000, 16)
	}
	encoded := hex.EncodeToString(bytes)
	if len(encoded) > chars {
		return encoded[:chars]
	}
	return encoded
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func parseTimeSeconds(val string) (int, bool) {
	parts := strings.Split(val, ":")
	if len(parts) < 2 || len(parts) > 3 {
		return 0, false
	}
	h, err1 := strconv.Atoi(parts[0])
	m, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil || h < 0 || h > 23 || m < 0 || m > 59 {
		return 0, false
	}
	s := 0
	if len(parts) == 3 {
		var err3 error
		s, err3 = strconv.Atoi(parts[2])
		if err3 != nil || s < 0 || s > 59 {
			return 0, false
		}
	}
	return h*3600 + m*60 + s, true
}

func CreateInvitation(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		var req CreateInvitationRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		req.Title = strings.TrimSpace(req.Title)
		if req.Title == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "title is required",
				"errors": gin.H{
					"title": "title cannot be empty",
				},
			})
			return
		}
		if len(req.Title) > 255 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "title cannot exceed 255 characters",
				"errors": gin.H{
					"title": "title is too long",
				},
			})
			return
		}

		if req.TemplateID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "template_id must be a positive integer",
				"errors": gin.H{
					"template_id": "template_id must be greater than 0",
				},
			})
			return
		}

		req.Event.Date = strings.TrimSpace(req.Event.Date)
		if req.Event.Date == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "event.date is required",
				"errors": gin.H{
					"event.date": "event.date cannot be empty",
				},
			})
			return
		}
		if _, err := time.Parse("2006-01-02", req.Event.Date); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "event.date must be in YYYY-MM-DD format",
				"errors": gin.H{
					"event.date": "invalid date format",
				},
			})
			return
		}

		req.Event.Name = strings.TrimSpace(req.Event.Name)
		if req.Event.Name == "" {
			req.Event.Name = req.Title
		}
		if len(req.Event.Name) > 255 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "event.name cannot exceed 255 characters",
				"errors": gin.H{
					"event.name": "event.name is too long",
				},
			})
			return
		}

		var startTimeVal *string
		if req.Event.StartTime != nil {
			val := strings.TrimSpace(*req.Event.StartTime)
			if val != "" {
				if !invitationTimePattern.MatchString(val) {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.start_time must be in HH:MM or HH:MM:SS format",
						"errors": gin.H{
							"event.start_time": "invalid time format",
						},
					})
					return
				}
				startTimeVal = &val
			}
		}

		var endTimeVal *string
		if req.Event.EndTime != nil {
			val := strings.TrimSpace(*req.Event.EndTime)
			if val != "" {
				if !invitationTimePattern.MatchString(val) {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.end_time must be in HH:MM or HH:MM:SS format",
						"errors": gin.H{
							"event.end_time": "invalid time format",
						},
					})
					return
				}
				endTimeVal = &val
			}
		}

		if startTimeVal != nil && endTimeVal != nil {
			stSecs, ok1 := parseTimeSeconds(*startTimeVal)
			etSecs, ok2 := parseTimeSeconds(*endTimeVal)
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

		var locationVal *string
		if req.Event.Location != nil {
			val := strings.TrimSpace(*req.Event.Location)
			if val != "" {
				if len(val) > 255 {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "event.location cannot exceed 255 characters",
						"errors": gin.H{
							"event.location": "event.location is too long",
						},
					})
					return
				}
				locationVal = &val
			}
		}

		var addressVal *string
		if req.Event.Address != nil {
			val := strings.TrimSpace(*req.Event.Address)
			if val != "" {
				addressVal = &val
			}
		}

		var mapsURLVal *string
		if req.Event.MapsURL != nil {
			val := strings.TrimSpace(*req.Event.MapsURL)
			if val != "" {
				mapsURLVal = &val
			}
		}

		var descriptionVal *string
		if req.Event.Description != nil {
			val := strings.TrimSpace(*req.Event.Description)
			if val != "" {
				descriptionVal = &val
			}
		}

		var customSlug *string
		if req.Slug != nil {
			val := strings.ToLower(strings.TrimSpace(*req.Slug))
			if val != "" {
				if !invitationSlugPattern.MatchString(val) || len(val) > 255 {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "slug must contain only lowercase letters, numbers, and single hyphens",
						"errors": gin.H{
							"slug": "invalid slug format",
						},
					})
					return
				}
				customSlug = &val
			}
		}

		ctx := c.Request.Context()

		hasActivePackage, hasAvailableQuota, err := checkPartnerInvitationEligibility(ctx, pool, userID)
		if err != nil {
			log.Printf("CreateInvitation: check package eligibility: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify package eligibility",
			})
			return
		}

		if !hasActivePackage {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "An active package is required to create an invitation",
				"errors": gin.H{
					"package": "no_active_package",
				},
			})
			return
		}

		if !hasAvailableQuota {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Invitation quota has been exhausted",
				"errors": gin.H{
					"package": "quota_exhausted",
				},
			})
			return
		}

		var templateName string
		err = pool.QueryRow(
			ctx,
			`SELECT name FROM templates WHERE id = $1 AND status = 'publish'`,
			req.TemplateID,
		).Scan(&templateName)
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Template not found",
			})
			return
		}
		if err != nil {
			log.Printf("CreateInvitation: verify template: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify template",
			})
			return
		}

		executeTransaction := func(slugCandidate string) (*CreateInvitationResponse, error) {
			tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
			if err != nil {
				return nil, fmt.Errorf("begin transaction: %w", err)
			}
			defer func() {
				_ = tx.Rollback(context.Background())
			}()

			var eventID int64
			var eventDateStr string
			var eventStartTimeStr *string
			var eventEndTimeStr *string

			err = tx.QueryRow(ctx, `
				INSERT INTO events (
					user_id, name, description, date, start_time, end_time, location, address, maps_url
				)
				VALUES ($1, $2, $3, $4::date, $5::time, $6::time, $7, $8, $9)
				RETURNING id, date::text, start_time::text, end_time::text
			`,
				userID,
				req.Event.Name,
				descriptionVal,
				req.Event.Date,
				startTimeVal,
				endTimeVal,
				locationVal,
				addressVal,
				mapsURLVal,
			).Scan(&eventID, &eventDateStr, &eventStartTimeStr, &eventEndTimeStr)
			if err != nil {
				return nil, fmt.Errorf("insert event: %w", err)
			}

			var invitationID int64
			var createdAt time.Time
			var updatedAt time.Time

			err = tx.QueryRow(ctx, `
				INSERT INTO invitations (
					user_id, template_id, title, slug, status
				)
				VALUES ($1, $2, $3, $4, 'draft')
				RETURNING id, created_at, updated_at
			`,
				userID,
				req.TemplateID,
				req.Title,
				slugCandidate,
			).Scan(&invitationID, &createdAt, &updatedAt)
			if err != nil {
				return nil, err
			}

			_, err = tx.Exec(ctx, `
				INSERT INTO invitation_events (
					invitation_id, event_id, sort_order
				)
				VALUES ($1, $2, 0)
			`, invitationID, eventID)
			if err != nil {
				return nil, fmt.Errorf("insert invitation_events: %w", err)
			}

			_, err = tx.Exec(ctx, `
				INSERT INTO invitation_versions (
					invitation_id, version_number, status
				)
				VALUES ($1, 1, 'draft')
			`, invitationID)
			if err != nil {
				return nil, fmt.Errorf("insert invitation_versions: %w", err)
			}

			if err := tx.Commit(ctx); err != nil {
				return nil, fmt.Errorf("commit transaction: %w", err)
			}

			return &CreateInvitationResponse{
				ID:     invitationID,
				Title:  req.Title,
				Slug:   slugCandidate,
				Status: "draft",
				Template: InvitationTemplateSummary{
					ID:   req.TemplateID,
					Name: templateName,
				},
				Event: InvitationEventResponse{
					ID:          eventID,
					Name:        req.Event.Name,
					Date:        eventDateStr,
					StartTime:   eventStartTimeStr,
					EndTime:     eventEndTimeStr,
					Location:    locationVal,
					Address:     addressVal,
					MapsURL:     mapsURLVal,
					Description: descriptionVal,
				},
				CreatedAt: createdAt,
				UpdatedAt: updatedAt,
			}, nil
		}

		if customSlug != nil {
			resp, err := executeTransaction(*customSlug)
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
				log.Printf("CreateInvitation: custom slug insert: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not create invitation",
				})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"success": true,
				"message": "Invitation created successfully",
				"data": gin.H{
					"invitation": resp,
				},
			})
			return
		}

		baseSlug := slugifyInvitationTitle(req.Title)
		for attempt := 0; attempt < 3; attempt++ {
			candidate := fmt.Sprintf("%s-%s", baseSlug, randomHexSuffix(4))
			resp, err := executeTransaction(candidate)
			if err == nil {
				c.JSON(http.StatusCreated, gin.H{
					"success": true,
					"message": "Invitation created successfully",
					"data": gin.H{
						"invitation": resp,
					},
				})
				return
			}

			if isUniqueViolation(err) {
				continue
			}

			log.Printf("CreateInvitation: auto slug attempt %d failed: %v", attempt, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create invitation",
			})
			return
		}

		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Could not generate a unique slug, please try again",
			"errors": gin.H{
				"slug": "slug_generation_conflict",
			},
		})
	}
}

func GetInvitations(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		page := int64(1)
		if val, exists := c.GetQuery("page"); exists {
			parsed, err := strconv.ParseInt(val, 10, 64)
			if err != nil || parsed < 1 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "page must be an integer greater than or equal to 1",
				})
				return
			}
			page = parsed
		}

		limit := int64(12)
		if val, exists := c.GetQuery("limit"); exists {
			parsed, err := strconv.ParseInt(val, 10, 64)
			if err != nil || parsed < 1 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "limit must be an integer greater than or equal to 1",
				})
				return
			}
			limit = parsed
			if limit > 50 {
				limit = 50
			}
		}

		if page-1 > math.MaxInt64/limit {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "page is too large",
			})
			return
		}
		offset := (page - 1) * limit

		statusFilter := strings.ToLower(strings.TrimSpace(c.Query("status")))
		if statusFilter != "" && statusFilter != "all" {
			if statusFilter != "draft" && statusFilter != "published" && statusFilter != "expired" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid status filter",
				})
				return
			}
		} else {
			statusFilter = ""
		}

		ctx := c.Request.Context()

		var total int64
		err := pool.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM invitations i
			WHERE i.user_id = $1
			  AND ($2 = '' OR i.status = $2)
		`, userID, statusFilter).Scan(&total)
		if err != nil {
			log.Printf("GetInvitations: count: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitations",
			})
			return
		}

		rows, err := pool.Query(ctx, `
			SELECT i.id, i.title, i.slug, i.status, i.created_at, i.updated_at,
			       t.id, t.name,
			       e.id, e.name, e.date::text, e.start_time::text, e.end_time::text, e.location
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
			WHERE i.user_id = $1
			  AND ($2 = '' OR i.status = $2)
			ORDER BY i.created_at DESC, i.id DESC
			LIMIT $3 OFFSET $4
		`, userID, statusFilter, limit, offset)
		if err != nil {
			log.Printf("GetInvitations: query: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitations",
			})
			return
		}
		defer rows.Close()

		invitations := make([]InvitationListItemResponse, 0)
		for rows.Next() {
			var inv InvitationListItemResponse
			var eventID *int64
			var eventName *string
			var eventDateStr *string
			var eventStartTimeStr *string
			var eventEndTimeStr *string
			var eventLocation *string

			if err := rows.Scan(
				&inv.ID,
				&inv.Title,
				&inv.Slug,
				&inv.Status,
				&inv.CreatedAt,
				&inv.UpdatedAt,
				&inv.Template.ID,
				&inv.Template.Name,
				&eventID,
				&eventName,
				&eventDateStr,
				&eventStartTimeStr,
				&eventEndTimeStr,
				&eventLocation,
			); err != nil {
				log.Printf("GetInvitations: scan: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read invitations",
				})
				return
			}

			if eventID != nil {
				inv.Event.ID = *eventID
				if eventName != nil {
					inv.Event.Name = *eventName
				}
				if eventDateStr != nil {
					inv.Event.Date = *eventDateStr
				}
				inv.Event.StartTime = eventStartTimeStr
				inv.Event.EndTime = eventEndTimeStr
				inv.Event.Location = eventLocation
			}

			invitations = append(invitations, inv)
		}

		if err := rows.Err(); err != nil {
			log.Printf("GetInvitations: rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitations",
			})
			return
		}

		totalPages := int64(0)
		if total > 0 {
			totalPages = int64(math.Ceil(float64(total) / float64(limit)))
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitations retrieved successfully",
			"data": gin.H{
				"invitations": invitations,
				"pagination": InvitationPaginationMeta{
					Page:       page,
					Limit:      limit,
					Total:      total,
					TotalPages: totalPages,
				},
			},
		})
	}
}

func GetInvitationByID(pool *pgxpool.Pool) gin.HandlerFunc {
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

		var inv InvitationDetailResponse
		var eventID *int64
		var eventName *string
		var eventDescription *string
		var eventDateStr *string
		var eventStartTimeStr *string
		var eventEndTimeStr *string
		var eventLocation *string
		var eventAddress *string
		var eventMapsURL *string

		err = pool.QueryRow(ctx, `
			SELECT i.id, i.title, i.slug, i.status,
			       i.published_version_id, i.published_at, i.expired_at,
			       i.created_at, i.updated_at,
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
			&inv.ID,
			&inv.Title,
			&inv.Slug,
			&inv.Status,
			&inv.PublishedVersionID,
			&inv.PublishedAt,
			&inv.ExpiredAt,
			&inv.CreatedAt,
			&inv.UpdatedAt,
			&inv.Template.ID,
			&inv.Template.Name,
			&inv.Template.Slug,
			&eventID,
			&eventName,
			&eventDescription,
			&eventDateStr,
			&eventStartTimeStr,
			&eventEndTimeStr,
			&eventLocation,
			&eventAddress,
			&eventMapsURL,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}
		if err != nil {
			log.Printf("GetInvitationByID: query: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation",
			})
			return
		}

		if eventID != nil {
			inv.Event.ID = *eventID
			if eventName != nil {
				inv.Event.Name = *eventName
			}
			if eventDateStr != nil {
				inv.Event.Date = *eventDateStr
			}
			inv.Event.StartTime = eventStartTimeStr
			inv.Event.EndTime = eventEndTimeStr
			inv.Event.Location = eventLocation
			inv.Event.Address = eventAddress
			inv.Event.MapsURL = eventMapsURL
			inv.Event.Description = eventDescription
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation retrieved successfully",
			"data": gin.H{
				"invitation": inv,
			},
		})
	}
}
