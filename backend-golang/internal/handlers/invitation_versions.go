package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvitationVersionItemResponse struct {
	ID            int64     `json:"id"`
	VersionNumber int       `json:"version_number"`
	Status        string    `json:"status"`
	IsPublished   bool      `json:"is_published"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type InvitationVersionsListResponse struct {
	InvitationID       int64                           `json:"invitation_id"`
	PublishedVersionID *int64                          `json:"published_version_id"`
	Versions           []InvitationVersionItemResponse `json:"versions"`
}

// GetInvitationVersions retrieves the list of versions for an invitation owned by the authenticated partner.
// It executes a single query with LEFT JOIN from invitations to invitation_versions.
// If the invitation does not exist or belongs to another user, it returns 404.
// If the invitation exists but has no versions, it returns 200 with an empty versions array.
func GetInvitationVersions(pool *pgxpool.Pool) gin.HandlerFunc {
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

		// Single query with LEFT JOIN to verify ownership and fetch versions in one roundtrip.
		rows, err := pool.Query(ctx, `
			SELECT
				i.id AS invitation_id,
				i.published_version_id,
				iv.id AS version_id,
				iv.version_number,
				iv.status AS version_status,
				iv.created_at AS version_created_at,
				iv.updated_at AS version_updated_at
			FROM invitations i
			LEFT JOIN invitation_versions iv ON iv.invitation_id = i.id
			WHERE i.id = $1 AND i.user_id = $2
			ORDER BY iv.version_number DESC NULLS LAST, iv.id DESC
		`, invitationID, userID)
		if err != nil {
			log.Printf("GetInvitationVersions: query versions: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation versions",
			})
			return
		}
		defer rows.Close()

		var (
			foundInvitation    bool
			retInvitationID    int64
			publishedVersionID *int64
			versions           = make([]InvitationVersionItemResponse, 0)
		)

		for rows.Next() {
			foundInvitation = true
			var (
				vID        *int64
				vNum       *int
				vStatus    *string
				vCreatedAt *time.Time
				vUpdatedAt *time.Time
			)

			if err := rows.Scan(
				&retInvitationID,
				&publishedVersionID,
				&vID,
				&vNum,
				&vStatus,
				&vCreatedAt,
				&vUpdatedAt,
			); err != nil {
				log.Printf("GetInvitationVersions: scan row: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read invitation versions",
				})
				return
			}

			if vID != nil && vNum != nil && vStatus != nil && vCreatedAt != nil && vUpdatedAt != nil {
				isPublished := publishedVersionID != nil && *vID == *publishedVersionID
				versions = append(versions, InvitationVersionItemResponse{
					ID:            *vID,
					VersionNumber: *vNum,
					Status:        *vStatus,
					IsPublished:   isPublished,
					CreatedAt:     *vCreatedAt,
					UpdatedAt:     *vUpdatedAt,
				})
			}
		}

		if err := rows.Err(); err != nil {
			log.Printf("GetInvitationVersions: rows error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation versions",
			})
			return
		}

		if !foundInvitation {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation versions retrieved successfully",
			"data": InvitationVersionsListResponse{
				InvitationID:       retInvitationID,
				PublishedVersionID: publishedVersionID,
				Versions:           versions,
			},
		})
	}
}
