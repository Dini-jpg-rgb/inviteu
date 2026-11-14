package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend-golang/internal/crypto"
	"backend-golang/internal/drive"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	maxListedMediaPerRequest = 500
	driveDeleteTimeout       = 5 * time.Second
)

func zeroBytes(b []byte) {
	for i := range b {
		b[i] = 0
	}
}

func markUserDriveRevoked(ctx context.Context, pool *pgxpool.Pool, userID int64) {
	markDriveCredentialsRevoked(ctx, pool, userID)
}

func resolveInvitationWorkingVersion(
	ctx context.Context,
	pool *pgxpool.Pool,
	invitationID int64,
	publishedVersionID *int64,
) (*InvitationContentVersionResponse, error) {
	var (
		verID     int64
		verNumber int
		verStatus string
	)

	err := pool.QueryRow(ctx, `
		SELECT id, version_number, status
		FROM invitation_versions
		WHERE invitation_id = $1 AND status = 'draft'
		ORDER BY version_number DESC
		LIMIT 1
	`, invitationID).Scan(&verID, &verNumber, &verStatus)
	if err == nil {
		return &InvitationContentVersionResponse{
			ID:            verID,
			VersionNumber: verNumber,
			Status:        verStatus,
		}, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	if publishedVersionID != nil {
		errPub := pool.QueryRow(ctx, `
			SELECT id, version_number, status
			FROM invitation_versions
			WHERE id = $1
		`, *publishedVersionID).Scan(&verID, &verNumber, &verStatus)
		if errPub == nil {
			return &InvitationContentVersionResponse{
				ID:            verID,
				VersionNumber: verNumber,
				Status:        verStatus,
			}, nil
		}
		if !errors.Is(errPub, pgx.ErrNoRows) {
			return nil, errPub
		}
	}

	errPub := pool.QueryRow(ctx, `
		SELECT id, version_number, status
		FROM invitation_versions
		WHERE invitation_id = $1 AND status = 'published'
		ORDER BY version_number DESC
		LIMIT 1
	`, invitationID).Scan(&verID, &verNumber, &verStatus)
	if errPub == nil {
		return &InvitationContentVersionResponse{
			ID:            verID,
			VersionNumber: verNumber,
			Status:        verStatus,
		}, nil
	}
	if errors.Is(errPub, pgx.ErrNoRows) {
		return nil, nil
	}
	return nil, errPub
}

// GetInvitationMedia handles GET /api/v1/invitations/:id/media.
func GetInvitationMedia(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if pool == nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database is not configured",
			})
			return
		}

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
				"errors": gin.H{
					"id": "invalid_invitation_id",
				},
			})
			return
		}

		fileTypeFilter := strings.TrimSpace(c.Query("file_type"))
		if fileTypeFilter != "" && fileTypeFilter != mediaFileTypeImage && fileTypeFilter != mediaFileTypeAudio {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"file_type": "invalid_file_type",
				},
			})
			return
		}

		ctx := c.Request.Context()

		var publishedVersionID *int64
		err = pool.QueryRow(ctx, `
			SELECT published_version_id
			FROM invitations
			WHERE id = $1 AND user_id = $2
		`, invitationID, userID).Scan(&publishedVersionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("GetInvitationMedia: fetch invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation media",
			})
			return
		}

		workingVersion, err := resolveInvitationWorkingVersion(ctx, pool, invitationID, publishedVersionID)
		if err != nil {
			log.Printf("GetInvitationMedia: resolve working version for invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation version",
			})
			return
		}

		media := make([]InvitationMediaResponse, 0)
		if workingVersion != nil {
			rows, err := pool.Query(ctx, `
				SELECT
					im.id,
					im.invitation_version_id,
					im.template_section_id,
					im.storage_file_id,
					sf.file_id,
					im.file_type,
					COALESCE(sf.mime_type, ''),
					sf.original_name,
					COALESCE(sf.size, 0),
					im.sort_order,
					im.created_at,
					im.updated_at
				FROM invitation_media im
				INNER JOIN storage_files sf ON sf.id = im.storage_file_id
				WHERE im.invitation_version_id = $1
				  AND sf.deleted_at IS NULL
				  AND ($2 = '' OR im.file_type = $2)
				ORDER BY im.sort_order ASC, im.id ASC
				LIMIT $3
			`, workingVersion.ID, fileTypeFilter, maxListedMediaPerRequest)
			if err != nil {
				log.Printf("GetInvitationMedia: query media for version %d: %v", workingVersion.ID, err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve invitation media",
				})
				return
			}
			defer rows.Close()

			for rows.Next() {
				var item InvitationMediaResponse
				item.InvitationID = invitationID
				if err := rows.Scan(
					&item.ID,
					&item.InvitationVersionID,
					&item.TemplateSectionID,
					&item.StorageFileID,
					&item.FileID,
					&item.FileType,
					&item.MimeType,
					&item.OriginalName,
					&item.Size,
					&item.SortOrder,
					&item.CreatedAt,
					&item.UpdatedAt,
				); err != nil {
					log.Printf("GetInvitationMedia: scan media row: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{
						"success": false,
						"message": "Could not read invitation media",
					})
					return
				}
				media = append(media, item)
			}
			if err := rows.Err(); err != nil {
				log.Printf("GetInvitationMedia: iterate media rows: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve invitation media",
				})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation media retrieved successfully",
			"data": gin.H{
				"invitation_id": invitationID,
				"version":       workingVersion,
				"media":         media,
			},
		})
	}
}

// DeleteInvitationMedia handles DELETE /api/v1/invitations/:id/media/:media_id.
func DeleteInvitationMedia(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if pool == nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database is not configured",
			})
			return
		}

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
				"errors": gin.H{
					"id": "invalid_invitation_id",
				},
			})
			return
		}

		mediaIDParam := strings.TrimSpace(c.Param("media_id"))
		mediaID, err := strconv.ParseInt(mediaIDParam, 10, 64)
		if err != nil || mediaID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid media ID",
				"errors": gin.H{
					"media_id": "invalid_media_id",
				},
			})
			return
		}

		ctx := c.Request.Context()
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("DeleteInvitationMedia: begin tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete invitation media",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		// (1) Lock invitation row first
		var invitationStatus string
		err = tx.QueryRow(ctx, `
			SELECT status
			FROM invitations
			WHERE id = $1 AND user_id = $2
			FOR UPDATE
		`, invitationID, userID).Scan(&invitationStatus)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("DeleteInvitationMedia: lock invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete invitation media",
			})
			return
		}

		if invitationStatus != "draft" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Only draft invitations can be edited",
				"errors": gin.H{
					"status": "invitation_is_not_draft",
				},
			})
			return
		}

		// (2) Lock latest draft version with exact same query as Slice 2
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
					"message": "Only draft invitations can be edited",
					"errors": gin.H{
						"status": "invitation_is_not_draft",
					},
				})
				return
			}
			log.Printf("DeleteInvitationMedia: lock draft version for invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete invitation media",
			})
			return
		}

		// (3) Hard-delete invitation_media row in the locked draft version
		var storageFileID int64
		err = tx.QueryRow(ctx, `
			DELETE FROM invitation_media
			WHERE id = $1 AND invitation_version_id = $2
			RETURNING storage_file_id
		`, mediaID, draftVersionID).Scan(&storageFileID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Media not found",
				})
				return
			}
			log.Printf("DeleteInvitationMedia: delete media %d: %v", mediaID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete invitation media",
			})
			return
		}

		// (4) Check whether storage_file_id is still referenced by any of the 4 FK tables
		var stillReferenced bool
		err = tx.QueryRow(ctx, `
			SELECT (
				EXISTS (SELECT 1 FROM invitation_media WHERE storage_file_id = $1)
				OR EXISTS (SELECT 1 FROM guest_media WHERE storage_file_id = $1)
				OR EXISTS (SELECT 1 FROM template_assets WHERE storage_file_id = $1)
				OR EXISTS (SELECT 1 FROM templates WHERE thumbnail_file_id = $1)
			)
		`, storageFileID).Scan(&stillReferenced)
		if err != nil {
			log.Printf("DeleteInvitationMedia: check storage_file_id %d references: %v", storageFileID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete invitation media",
			})
			return
		}

		var (
			shouldDeleteDriveFile bool
			provider              string
			driveFileID           string
		)
		if !stillReferenced {
			err = tx.QueryRow(ctx, `
				UPDATE storage_files
				SET deleted_at = CURRENT_TIMESTAMP,
				    updated_at = CURRENT_TIMESTAMP
				WHERE id = $1 AND deleted_at IS NULL
				RETURNING provider, file_id
			`, storageFileID).Scan(&provider, &driveFileID)
			if err == nil {
				shouldDeleteDriveFile = true
			} else if errors.Is(err, pgx.ErrNoRows) {
				log.Printf(
					"DeleteInvitationMedia: storage_file_id=%d already soft-deleted for user_id=%d invitation_id=%d",
					storageFileID,
					userID,
					invitationID,
				)
			} else {
				log.Printf("DeleteInvitationMedia: soft-delete storage_file_id %d: %v", storageFileID, err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not delete invitation media",
				})
				return
			}
		}

		// (5) Commit DB transaction before best-effort Drive delete
		if err := tx.Commit(ctx); err != nil {
			log.Printf("DeleteInvitationMedia: commit tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete invitation media",
			})
			return
		}

		// (6) Post-commit best-effort delete on partner's Google Drive
		if shouldDeleteDriveFile && provider == storageProviderGoogleDrive && strings.TrimSpace(driveFileID) != "" {
			driveCtx, cancel := context.WithTimeout(context.Background(), driveDeleteTimeout)
			defer cancel()

			var (
				encryptedRefreshToken []byte
				credStatus            string
			)
			credErr := pool.QueryRow(driveCtx, `
				SELECT encrypted_refresh_token, status
				FROM user_drive_credentials
				WHERE user_id = $1
			`, userID).Scan(&encryptedRefreshToken, &credStatus)

			if credErr != nil || credStatus != "connected" || len(encryptedRefreshToken) == 0 || len(cfg.TokenEncryptionKey) != crypto.KeySize {
				log.Printf(
					"orphan drive file user_id=%d invitation_id=%d file_id=%s",
					userID,
					invitationID,
					driveFileID,
				)
			} else {
				plaintextToken, decErr := crypto.Decrypt(cfg.TokenEncryptionKey, encryptedRefreshToken)
				if decErr != nil || len(plaintextToken) == 0 {
					zeroBytes(plaintextToken)
					log.Printf(
						"orphan drive file user_id=%d invitation_id=%d file_id=%s",
						userID,
						invitationID,
						driveFileID,
					)
				} else {
					refreshTokenStr := string(plaintextToken)
					delErr := cfg.storageClient().DeleteFile(driveCtx, refreshTokenStr, driveFileID)
					zeroBytes(plaintextToken)
					if delErr != nil {
						if errors.Is(delErr, drive.ErrTokenRevoked) {
							markUserDriveRevoked(driveCtx, pool, userID)
						} else {
							log.Printf(
								"orphan drive file user_id=%d invitation_id=%d file_id=%s",
								userID,
								invitationID,
								driveFileID,
							)
						}
					}
				}
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation media deleted successfully",
		})
	}
}
