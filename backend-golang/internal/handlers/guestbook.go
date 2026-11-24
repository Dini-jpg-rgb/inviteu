package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubmitPublicGuestbookRequest struct {
	Name    string `json:"name"`
	Message string `json:"message"`
}

type PublicGuestbookMessageItem struct {
	GuestName string    `json:"guest_name"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

type PartnerGuestbookMessageItem struct {
	ID          int64      `json:"id"`
	GuestName   string     `json:"guest_name"`
	Message     string     `json:"message"`
	Status      string     `json:"status"`
	ModeratedAt *time.Time `json:"moderated_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

type UpdateGuestbookStatusRequest struct {
	Status string `json:"status"`
}

func sendGuestbookInvitationNotFound(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusNotFound, gin.H{
		"success": false,
		"message": "Invitation not found",
	})
}

// SubmitPublicGuestbookMessage submits a guestbook message for a published invitation.
func SubmitPublicGuestbookMessage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024)

		var req SubmitPublicGuestbookRequest
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
		nameRunes := utf8.RuneCountInString(name)
		if name == "" || nameRunes < 1 {
			fieldErrors["name"] = "name is required"
		} else if nameRunes > 255 {
			fieldErrors["name"] = "name must not exceed 255 characters"
		}

		message := strings.TrimSpace(req.Message)
		msgRunes := utf8.RuneCountInString(message)
		if message == "" || msgRunes < 1 {
			fieldErrors["message"] = "message is required"
		} else if msgRunes > 1000 {
			fieldErrors["message"] = "message must not exceed 1000 characters"
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
		if slug == "" || utf8.RuneCountInString(slug) > 255 {
			sendGuestbookInvitationNotFound(c)
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
			sendGuestbookInvitationNotFound(c)
			return
		}
		if err != nil {
			log.Printf("SubmitPublicGuestbookMessage: query invitation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		_, err = pool.Exec(
			c.Request.Context(),
			`INSERT INTO guestbook_messages (invitation_id, guest_name, message, status)
			 VALUES ($1, $2, $3, 'pending')`,
			invitationID,
			name,
			message,
		)
		if err != nil {
			log.Printf("SubmitPublicGuestbookMessage: insert message: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not submit guestbook message",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Guestbook message submitted successfully and is awaiting moderation",
			"data": gin.H{
				"status": "pending",
			},
		})
	}
}

// GetPublicGuestbookMessages returns approved guestbook messages for an invitation.
func GetPublicGuestbookMessages(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := strings.TrimSpace(c.Param("slug"))
		if slug == "" || utf8.RuneCountInString(slug) > 255 {
			sendGuestbookInvitationNotFound(c)
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
			sendGuestbookInvitationNotFound(c)
			return
		}
		if err != nil {
			log.Printf("GetPublicGuestbookMessages: query invitation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		page := 1
		if p := c.Query("page"); p != "" {
			if val, err := strconv.Atoi(p); err == nil && val >= 1 {
				page = val
			}
		}

		limit := 12
		if l := c.Query("limit"); l != "" {
			if val, err := strconv.Atoi(l); err == nil && val >= 1 {
				limit = val
			}
		}
		if limit > 50 {
			limit = 50
		}
		offset := (page - 1) * limit

		var total int64
		err = pool.QueryRow(
			c.Request.Context(),
			`SELECT COUNT(id)
			 FROM guestbook_messages
			 WHERE invitation_id = $1 AND status = 'approved'`,
			invitationID,
		).Scan(&total)
		if err != nil {
			log.Printf("GetPublicGuestbookMessages: count: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve guestbook messages",
			})
			return
		}

		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT guest_name, message, created_at
			 FROM guestbook_messages
			 WHERE invitation_id = $1 AND status = 'approved'
			 ORDER BY created_at DESC, id DESC
			 LIMIT $2 OFFSET $3`,
			invitationID,
			limit,
			offset,
		)
		if err != nil {
			log.Printf("GetPublicGuestbookMessages: query: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve guestbook messages",
			})
			return
		}
		defer rows.Close()

		items := make([]PublicGuestbookMessageItem, 0)
		for rows.Next() {
			var item PublicGuestbookMessageItem
			if err := rows.Scan(&item.GuestName, &item.Message, &item.CreatedAt); err != nil {
				log.Printf("GetPublicGuestbookMessages: scan: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve guestbook messages",
				})
				return
			}
			items = append(items, item)
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetPublicGuestbookMessages: rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve guestbook messages",
			})
			return
		}

		totalPages := int64(0)
		if total > 0 {
			totalPages = int64(math.Ceil(float64(total) / float64(limit)))
		}

		c.Header("Cache-Control", "public, max-age=60")
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Guestbook messages retrieved successfully",
			"data": gin.H{
				"messages": items,
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

// GetInvitationGuestbookMessages returns all guestbook messages for partner owners.
func GetInvitationGuestbookMessages(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
				"errors": gin.H{
					"id": "invitation id must be a positive integer",
				},
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		ctx := c.Request.Context()

		var exists bool
		err = pool.QueryRow(
			ctx,
			`SELECT EXISTS (
				SELECT 1 FROM invitations WHERE id = $1 AND user_id = $2
			)`,
			invitationID,
			userID,
		).Scan(&exists)
		if err != nil {
			log.Printf("GetInvitationGuestbookMessages: check ownership: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}

		statusFilter := strings.TrimSpace(c.Query("status"))
		if statusFilter != "" {
			if statusFilter != "pending" && statusFilter != "approved" && statusFilter != "rejected" && statusFilter != "hidden" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Validation failed",
					"errors": gin.H{
						"status": "status must be one of: pending, approved, rejected, hidden",
					},
				})
				return
			}
		}

		page := 1
		if p := c.Query("page"); p != "" {
			if val, err := strconv.Atoi(p); err == nil && val >= 1 {
				page = val
			}
		}

		limit := 12
		if l := c.Query("limit"); l != "" {
			if val, err := strconv.Atoi(l); err == nil && val >= 1 {
				limit = val
			}
		}
		if limit > 50 {
			limit = 50
		}
		offset := (page - 1) * limit

		var summary struct {
			Total    int64 `json:"total"`
			Pending  int64 `json:"pending"`
			Approved int64 `json:"approved"`
			Rejected int64 `json:"rejected"`
			Hidden   int64 `json:"hidden"`
		}

		err = pool.QueryRow(
			ctx,
			`SELECT
				COUNT(id) AS total,
				COUNT(id) FILTER (WHERE status = 'pending') AS pending,
				COUNT(id) FILTER (WHERE status = 'approved') AS approved,
				COUNT(id) FILTER (WHERE status = 'rejected') AS rejected,
				COUNT(id) FILTER (WHERE status = 'hidden') AS hidden
			 FROM guestbook_messages
			 WHERE invitation_id = $1`,
			invitationID,
		).Scan(
			&summary.Total,
			&summary.Pending,
			&summary.Approved,
			&summary.Rejected,
			&summary.Hidden,
		)
		if err != nil {
			log.Printf("GetInvitationGuestbookMessages: summary: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve guestbook messages",
			})
			return
		}

		var totalFiltered int64
		var rows pgx.Rows

		if statusFilter != "" {
			err = pool.QueryRow(
				ctx,
				`SELECT COUNT(id) FROM guestbook_messages WHERE invitation_id = $1 AND status = $2`,
				invitationID,
				statusFilter,
			).Scan(&totalFiltered)
			if err != nil {
				log.Printf("GetInvitationGuestbookMessages: filtered count: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve guestbook messages",
				})
				return
			}

			rows, err = pool.Query(
				ctx,
				`SELECT id, guest_name, message, status, moderated_at, created_at
				 FROM guestbook_messages
				 WHERE invitation_id = $1 AND status = $2
				 ORDER BY created_at DESC, id DESC
				 LIMIT $3 OFFSET $4`,
				invitationID,
				statusFilter,
				limit,
				offset,
			)
		} else {
			totalFiltered = summary.Total
			rows, err = pool.Query(
				ctx,
				`SELECT id, guest_name, message, status, moderated_at, created_at
				 FROM guestbook_messages
				 WHERE invitation_id = $1
				 ORDER BY created_at DESC, id DESC
				 LIMIT $2 OFFSET $3`,
				invitationID,
				limit,
				offset,
			)
		}

		if err != nil {
			log.Printf("GetInvitationGuestbookMessages: query rows: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve guestbook messages",
			})
			return
		}
		defer rows.Close()

		items := make([]PartnerGuestbookMessageItem, 0)
		for rows.Next() {
			var item PartnerGuestbookMessageItem
			if err := rows.Scan(
				&item.ID,
				&item.GuestName,
				&item.Message,
				&item.Status,
				&item.ModeratedAt,
				&item.CreatedAt,
			); err != nil {
				log.Printf("GetInvitationGuestbookMessages: scan row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve guestbook messages",
				})
				return
			}
			items = append(items, item)
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetInvitationGuestbookMessages: rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve guestbook messages",
			})
			return
		}

		totalPages := int64(0)
		if totalFiltered > 0 {
			totalPages = int64(math.Ceil(float64(totalFiltered) / float64(limit)))
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Guestbook messages retrieved successfully",
			"data": gin.H{
				"summary":  summary,
				"messages": items,
				"pagination": gin.H{
					"page":        page,
					"limit":       limit,
					"total":       totalFiltered,
					"total_pages": totalPages,
				},
			},
		})
	}
}

// UpdateInvitationGuestbookMessageStatus moderates a guestbook message status.
func UpdateInvitationGuestbookMessageStatus(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
				"errors": gin.H{
					"id": "invitation id must be a positive integer",
				},
			})
			return
		}

		msgIDParam := strings.TrimSpace(c.Param("message_id"))
		messageID, err := strconv.ParseInt(msgIDParam, 10, 64)
		if err != nil || messageID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid message ID",
				"errors": gin.H{
					"message_id": "message id must be a positive integer",
				},
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		var req UpdateGuestbookStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
				"errors": gin.H{
					"body": "request body must be valid JSON",
				},
			})
			return
		}

		status := strings.TrimSpace(req.Status)
		if status != "pending" && status != "approved" && status != "rejected" && status != "hidden" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"status": "status must be one of: pending, approved, rejected, hidden",
				},
			})
			return
		}

		var item PartnerGuestbookMessageItem
		err = pool.QueryRow(
			c.Request.Context(),
			`UPDATE guestbook_messages
			 SET status = $1,
			     moderated_by = $2,
			     moderated_at = CURRENT_TIMESTAMP,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $3
			   AND invitation_id = $4
			   AND EXISTS (
			       SELECT 1 FROM invitations
			       WHERE id = $4 AND user_id = $2
			   )
			 RETURNING id, guest_name, message, status, moderated_at, created_at`,
			status,
			userID,
			messageID,
			invitationID,
		).Scan(
			&item.ID,
			&item.GuestName,
			&item.Message,
			&item.Status,
			&item.ModeratedAt,
			&item.CreatedAt,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Message not found",
			})
			return
		}
		if err != nil {
			log.Printf("UpdateInvitationGuestbookMessageStatus: update: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update guestbook message",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Guestbook message status updated successfully",
			"data":    item,
		})
	}
}

// DeleteInvitationGuestbookMessage hard deletes a guestbook message.
func DeleteInvitationGuestbookMessage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
				"errors": gin.H{
					"id": "invitation id must be a positive integer",
				},
			})
			return
		}

		msgIDParam := strings.TrimSpace(c.Param("message_id"))
		messageID, err := strconv.ParseInt(msgIDParam, 10, 64)
		if err != nil || messageID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid message ID",
				"errors": gin.H{
					"message_id": "message id must be a positive integer",
				},
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		tag, err := pool.Exec(
			c.Request.Context(),
			`DELETE FROM guestbook_messages
			 WHERE id = $1
			   AND invitation_id = $2
			   AND EXISTS (
			       SELECT 1 FROM invitations
			       WHERE id = $2 AND user_id = $3
			   )`,
			messageID,
			invitationID,
			userID,
		)
		if err != nil {
			log.Printf("DeleteInvitationGuestbookMessage: delete: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete guestbook message",
			})
			return
		}

		if tag.RowsAffected() == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Message not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Message deleted successfully",
		})
	}
}
