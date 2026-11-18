package handlers

import (
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"backend-golang/internal/crypto"
	"backend-golang/internal/drive"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	publicMediaCacheControl = "public, max-age=300"
	ownerMediaCacheControl  = "private, no-store"
)

func sendPublicMediaNotFound(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusNotFound, gin.H{
		"success": false,
		"message": "Media not found",
	})
}

func sendRangeNotSatisfiable(c *gin.Context, fileSize int64) {
	c.Header("Cache-Control", "no-store")
	if fileSize > 0 {
		c.Header("Content-Range", fmt.Sprintf("bytes */%d", fileSize))
	} else {
		c.Header("Content-Range", "bytes */*")
	}
	c.JSON(http.StatusRequestedRangeNotSatisfiable, gin.H{
		"success": false,
		"message": "Requested range not satisfiable",
	})
}

func whitelistedMediaMimeType(rawMime string) string {
	switch strings.ToLower(strings.TrimSpace(rawMime)) {
	case "image/jpeg":
		return "image/jpeg"
	case "image/png":
		return "image/png"
	case "audio/mpeg":
		return "audio/mpeg"
	default:
		return "application/octet-stream"
	}
}

func formatInlineContentDisposition(originalName string) string {
	safeName := sanitizeOriginalFilename(originalName, "media")
	disposition := mime.FormatMediaType("inline", map[string]string{
		"filename": safeName,
	})
	if disposition == "" {
		return "inline"
	}
	return disposition
}

func buildMediaETag(mediaID, storageFileID, fileSize int64, updatedAt time.Time) string {
	return fmt.Sprintf(`"m-%d-%d-%d-%d"`, mediaID, storageFileID, fileSize, updatedAt.UTC().UnixNano())
}

func matchesIfNoneMatch(headerVal string, etag string) bool {
	trimmed := strings.TrimSpace(headerVal)
	if trimmed == "" || etag == "" {
		return false
	}
	if trimmed == "*" {
		return true
	}
	for _, token := range strings.Split(trimmed, ",") {
		candidate := strings.TrimSpace(token)
		candidate = strings.TrimPrefix(candidate, "W/")
		candidate = strings.TrimSpace(candidate)
		if candidate == etag {
			return true
		}
	}
	return false
}

func isASCIIUnsignedDigits(s string) bool {
	if s == "" {
		return false
	}
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return false
		}
	}
	return true
}

func parseSingleByteRangeSpec(spec string, knownSize int64) (normalizedSpec string, satisfiable bool, syntaxValid bool) {
	parts := strings.Split(spec, "-")
	if len(parts) != 2 {
		return "", false, false
	}

	left := strings.TrimSpace(parts[0])
	right := strings.TrimSpace(parts[1])

	// Suffix byte-range-spec: "-suffix"
	if left == "" {
		if !isASCIIUnsignedDigits(right) {
			return "", false, false
		}
		suffixLen, err := strconv.ParseInt(right, 10, 64)
		if err != nil || suffixLen <= 0 {
			return "", false, false
		}
		if knownSize == 0 {
			return "", false, true
		}
		return "-" + strconv.FormatInt(suffixLen, 10), true, true
	}

	if !isASCIIUnsignedDigits(left) {
		return "", false, false
	}
	start, err := strconv.ParseInt(left, 10, 64)
	if err != nil || start < 0 {
		return "", false, false
	}

	if right == "" {
		if knownSize > 0 && start >= knownSize {
			return "", false, true
		}
		return strconv.FormatInt(start, 10) + "-", true, true
	}

	if !isASCIIUnsignedDigits(right) {
		return "", false, false
	}
	end, err := strconv.ParseInt(right, 10, 64)
	if err != nil || end < start {
		return "", false, false
	}
	if knownSize > 0 && start >= knownSize {
		return "", false, true
	}
	return fmt.Sprintf("%d-%d", start, end), true, true
}

// evaluateMediaRangeHeader validates an HTTP Range request header against knownSize.
// - No Range header -> forwardRange="", ok=true
// - Valid single range -> forwardRange="bytes=...", ok=true
// - Valid multi-range (contains comma) -> ignored per RFC 9110, forwardRange="", ok=true
// - Malformed syntax or unsatisfiable range -> ok=false (caller responds 416)
func evaluateMediaRangeHeader(rawRange string, knownSize int64) (forwardRange string, ok bool) {
	trimmed := strings.TrimSpace(rawRange)
	if trimmed == "" {
		return "", true
	}
	if !strings.HasPrefix(trimmed, "bytes=") {
		return "", false
	}
	rangeSet := strings.TrimSpace(strings.TrimPrefix(trimmed, "bytes="))
	if rangeSet == "" {
		return "", false
	}

	// Multi-range: validate each spec, then ignore Range and serve 200 full content per RFC 9110.
	if strings.Contains(rangeSet, ",") {
		specs := strings.Split(rangeSet, ",")
		anySatisfiable := false
		for _, rawSpec := range specs {
			s := strings.TrimSpace(rawSpec)
			if s == "" {
				return "", false
			}
			_, satisfiable, syntaxValid := parseSingleByteRangeSpec(s, knownSize)
			if !syntaxValid {
				return "", false
			}
			if satisfiable {
				anySatisfiable = true
			}
		}
		if !anySatisfiable {
			return "", false
		}
		return "", true
	}

	normSpec, satisfiable, syntaxValid := parseSingleByteRangeSpec(rangeSet, knownSize)
	if !syntaxValid || !satisfiable {
		return "", false
	}
	return "bytes=" + normSpec, true
}

func writeMediaStreamResponse(
	c *gin.Context,
	stream *drive.DownloadFileStream,
	mimeType string,
	originalName string,
	knownSize int64,
	cacheControl string,
	etag string,
) {
	c.Header("Content-Type", whitelistedMediaMimeType(mimeType))
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Accept-Ranges", "bytes")
	c.Header("Content-Disposition", formatInlineContentDisposition(originalName))
	c.Header("Cache-Control", cacheControl)
	if etag != "" {
		c.Header("ETag", etag)
	}

	if stream.StatusCode == http.StatusPartialContent && stream.ContentRange != "" {
		c.Header("Content-Range", stream.ContentRange)
	}

	if stream.ContentLength >= 0 {
		c.Header("Content-Length", strconv.FormatInt(stream.ContentLength, 10))
	} else if stream.StatusCode == http.StatusOK && knownSize > 0 {
		c.Header("Content-Length", strconv.FormatInt(knownSize, 10))
	}

	c.Status(stream.StatusCode)
	c.Writer.WriteHeaderNow()
	_, _ = io.Copy(c.Writer, stream.Body)
}

// StreamPublicInvitationMedia handles GET /api/v1/public/invitations/:slug/media/:media_id.
func StreamPublicInvitationMedia(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.isConfigured() {
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google Drive integration is not configured",
			})
			return
		}

		if pool == nil {
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database is not configured",
			})
			return
		}

		slug := strings.TrimSpace(c.Param("slug"))
		if slug == "" || utf8.RuneCountInString(slug) > 255 {
			sendPublicMediaNotFound(c)
			return
		}

		mediaIDParam := strings.TrimSpace(c.Param("media_id"))
		mediaID, err := strconv.ParseInt(mediaIDParam, 10, 64)
		if err != nil || mediaID <= 0 {
			sendPublicMediaNotFound(c)
			return
		}

		ctx := c.Request.Context()

		var (
			invitationID          int64
			ownerUserID           int64
			resolvedMediaID       int64
			storageFileID         int64
			driveFileID           string
			mimeType              string
			originalName          string
			fileSize              int64
			sfCreatedAt           time.Time
			sfUpdatedAt           time.Time
			encryptedRefreshToken []byte
			credStatus            string
		)

		err = pool.QueryRow(ctx, `
			SELECT
				i.id,
				i.user_id,
				im.id,
				sf.id,
				sf.file_id,
				COALESCE(sf.mime_type, ''),
				sf.original_name,
				COALESCE(sf.size, 0),
				sf.created_at,
				sf.updated_at,
				udc.encrypted_refresh_token,
				COALESCE(udc.status, '')
			FROM invitations i
			INNER JOIN invitation_versions iv
				ON iv.id = i.published_version_id
			   AND iv.invitation_id = i.id
			INNER JOIN invitation_media im
				ON im.invitation_version_id = iv.id
			INNER JOIN storage_files sf
				ON sf.id = im.storage_file_id
			LEFT JOIN user_drive_credentials udc
				ON udc.user_id = i.user_id
			WHERE i.slug = $1
			  AND im.id = $2
			  AND i.status = 'published'
			  AND iv.status = 'published'
			  AND (i.expired_at IS NULL OR i.expired_at > CURRENT_TIMESTAMP)
			  AND sf.deleted_at IS NULL
			  AND sf.provider = $3
		`, slug, mediaID, storageProviderGoogleDrive).Scan(
			&invitationID,
			&ownerUserID,
			&resolvedMediaID,
			&storageFileID,
			&driveFileID,
			&mimeType,
			&originalName,
			&fileSize,
			&sfCreatedAt,
			&sfUpdatedAt,
			&encryptedRefreshToken,
			&credStatus,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				sendPublicMediaNotFound(c)
				return
			}
			log.Printf("StreamPublicInvitationMedia: query media %d: %v", mediaID, err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve media",
			})
			return
		}

		if credStatus != "connected" || len(encryptedRefreshToken) == 0 || strings.TrimSpace(driveFileID) == "" {
			sendPublicMediaNotFound(c)
			return
		}

		etagTimestamp := sfUpdatedAt
		if etagTimestamp.IsZero() {
			etagTimestamp = sfCreatedAt
		}
		etag := buildMediaETag(resolvedMediaID, storageFileID, fileSize, etagTimestamp)

		rawRange := strings.TrimSpace(c.GetHeader("Range"))
		if rawRange == "" && matchesIfNoneMatch(c.GetHeader("If-None-Match"), etag) {
			c.Header("Cache-Control", publicMediaCacheControl)
			c.Header("ETag", etag)
			c.Header("Accept-Ranges", "bytes")
			c.Header("X-Content-Type-Options", "nosniff")
			c.Status(http.StatusNotModified)
			return
		}

		forwardRange, rangeOK := evaluateMediaRangeHeader(rawRange, fileSize)
		if !rangeOK {
			sendRangeNotSatisfiable(c, fileSize)
			return
		}

		plaintextToken, err := crypto.Decrypt(cfg.TokenEncryptionKey, encryptedRefreshToken)
		if err != nil || len(plaintextToken) == 0 {
			zeroBytes(plaintextToken)
			log.Printf("StreamPublicInvitationMedia: decrypt credentials for invitation %d failed", invitationID)
			sendPublicMediaNotFound(c)
			return
		}
		refreshTokenStr := string(plaintextToken)
		zeroBytes(plaintextToken)

		stream, err := cfg.storageClient().OpenFile(ctx, refreshTokenStr, driveFileID, forwardRange)
		if err != nil {
			switch {
			case errors.Is(err, drive.ErrTokenRevoked):
				markDriveCredentialsRevoked(ctx, pool, ownerUserID)
				sendPublicMediaNotFound(c)
			case errors.Is(err, drive.ErrFileNotFound):
				sendPublicMediaNotFound(c)
			case errors.Is(err, drive.ErrRangeNotSatisfiable):
				sendRangeNotSatisfiable(c, fileSize)
			default:
				log.Printf("StreamPublicInvitationMedia: open drive file for invitation %d media %d failed: %v", invitationID, resolvedMediaID, err)
				c.Header("Cache-Control", "no-store")
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve media",
				})
			}
			return
		}
		defer stream.Body.Close()

		writeMediaStreamResponse(
			c,
			stream,
			mimeType,
			originalName,
			fileSize,
			publicMediaCacheControl,
			etag,
		)
	}
}

// StreamOwnerInvitationMedia handles GET /api/v1/invitations/:id/media/:media_id/content.
func StreamOwnerInvitationMedia(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.isConfigured() {
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google Drive integration is not configured",
			})
			return
		}

		if pool == nil {
			c.Header("Cache-Control", "no-store")
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
			c.Header("Cache-Control", "no-store")
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
			c.Header("Cache-Control", "no-store")
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

		var (
			ownedInvitationID     int64
			resolvedMediaID       *int64
			storageFileID         *int64
			driveFileID           string
			mimeType              string
			originalName          string
			fileSize              int64
			encryptedRefreshToken []byte
			credStatus            string
		)

		err = pool.QueryRow(ctx, `
			WITH owned_invitation AS (
				SELECT i.id, i.user_id, i.published_version_id
				FROM invitations i
				WHERE i.id = $1 AND i.user_id = $2
			),
			working_version AS (
				SELECT iv.id
				FROM owned_invitation oi
				INNER JOIN invitation_versions iv ON iv.invitation_id = oi.id
				WHERE iv.status IN ('draft', 'published')
				   OR (oi.published_version_id IS NOT NULL AND iv.id = oi.published_version_id)
				ORDER BY
					CASE
						WHEN iv.status = 'draft' THEN 1
						WHEN oi.published_version_id IS NOT NULL AND iv.id = oi.published_version_id THEN 2
						WHEN iv.status = 'published' THEN 3
						ELSE 4
					END ASC,
					iv.version_number DESC
				LIMIT 1
			)
			SELECT
				oi.id,
				im.id,
				sf.id,
				COALESCE(sf.file_id, ''),
				COALESCE(sf.mime_type, ''),
				COALESCE(sf.original_name, ''),
				COALESCE(sf.size, 0),
				udc.encrypted_refresh_token,
				COALESCE(udc.status, '')
			FROM owned_invitation oi
			LEFT JOIN working_version wv ON TRUE
			LEFT JOIN invitation_media im
				ON im.id = $3
			   AND im.invitation_version_id = wv.id
			LEFT JOIN storage_files sf
				ON sf.id = im.storage_file_id
			   AND sf.deleted_at IS NULL
			   AND sf.provider = $4
			LEFT JOIN user_drive_credentials udc
				ON udc.user_id = oi.user_id
		`, invitationID, userID, mediaID, storageProviderGoogleDrive).Scan(
			&ownedInvitationID,
			&resolvedMediaID,
			&storageFileID,
			&driveFileID,
			&mimeType,
			&originalName,
			&fileSize,
			&encryptedRefreshToken,
			&credStatus,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.Header("Cache-Control", "no-store")
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("StreamOwnerInvitationMedia: query invitation %d media %d: %v", invitationID, mediaID, err)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve media",
			})
			return
		}

		if resolvedMediaID == nil || storageFileID == nil || strings.TrimSpace(driveFileID) == "" {
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Media not found",
			})
			return
		}

		if credStatus == "" {
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Google Drive is not connected",
				"errors": gin.H{
					"drive": "drive_not_connected",
				},
			})
			return
		}

		if credStatus != "connected" || len(encryptedRefreshToken) == 0 {
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Google Drive access has been revoked, please reconnect",
				"errors": gin.H{
					"drive": "drive_revoked",
				},
			})
			return
		}

		rawRange := strings.TrimSpace(c.GetHeader("Range"))
		forwardRange, rangeOK := evaluateMediaRangeHeader(rawRange, fileSize)
		if !rangeOK {
			sendRangeNotSatisfiable(c, fileSize)
			return
		}

		plaintextToken, err := crypto.Decrypt(cfg.TokenEncryptionKey, encryptedRefreshToken)
		if err != nil || len(plaintextToken) == 0 {
			zeroBytes(plaintextToken)
			log.Printf("StreamOwnerInvitationMedia: decrypt credentials for user %d failed", userID)
			c.Header("Cache-Control", "no-store")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve media",
			})
			return
		}
		refreshTokenStr := string(plaintextToken)
		zeroBytes(plaintextToken)

		stream, err := cfg.storageClient().OpenFile(ctx, refreshTokenStr, driveFileID, forwardRange)
		if err != nil {
			switch {
			case errors.Is(err, drive.ErrTokenRevoked):
				markDriveCredentialsRevoked(ctx, pool, userID)
				c.Header("Cache-Control", "no-store")
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Google Drive access has been revoked, please reconnect",
					"errors": gin.H{
						"drive": "drive_revoked",
					},
				})
			case errors.Is(err, drive.ErrFileNotFound):
				c.Header("Cache-Control", "no-store")
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Media not found",
				})
			case errors.Is(err, drive.ErrRangeNotSatisfiable):
				sendRangeNotSatisfiable(c, fileSize)
			default:
				log.Printf("StreamOwnerInvitationMedia: open drive file for invitation %d media %d failed: %v", invitationID, mediaID, err)
				c.Header("Cache-Control", "no-store")
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve media",
				})
			}
			return
		}
		defer stream.Body.Close()

		writeMediaStreamResponse(
			c,
			stream,
			mimeType,
			originalName,
			fileSize,
			ownerMediaCacheControl,
			"",
		)
	}
}

