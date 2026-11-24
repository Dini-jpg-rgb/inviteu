package handlers

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"backend-golang/internal/crypto"
	"backend-golang/internal/drive"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	maxImageUploadBytes        = 10 << 20 // 10 MB
	maxAudioUploadBytes        = 10 << 20 // 10 MB
	maxMultipartOverheadBytes  = 64 << 10 // 64 KB
	maxMultipartRequestBytes   = maxImageUploadBytes + maxMultipartOverheadBytes
	maxMultipartTextFieldBytes = 1024 // 1 KB
	sniffBufferSize            = 512
	maxImageDimensionPx        = 6000
	maxOriginalFilenameRunes   = 200
	maxAudioFilesPerVersion    = 1
	galleryLimitResourceKey    = "gallery_limit"
	driveDefaultFolderName     = "InviteU"
	driveAddonSlug             = GoogleDriveAddonSlug
	storageProviderGoogleDrive = "google_drive"
	mediaFileTypeImage         = "image"
	mediaFileTypeAudio         = "audio"
	compensatingDeleteTimeout  = 5 * time.Second
)

type InvitationMediaResponse struct {
	ID                  int64     `json:"id"`
	InvitationID        int64     `json:"invitation_id"`
	InvitationVersionID int64     `json:"invitation_version_id"`
	TemplateSectionID   *int64    `json:"template_section_id"`
	StorageFileID       int64     `json:"storage_file_id"`
	FileID              string    `json:"file_id"`
	FileType            string    `json:"file_type"`
	MimeType            string    `json:"mime_type"`
	OriginalName        string    `json:"original_name"`
	Size                int64     `json:"size"`
	SortOrder           int       `json:"sort_order"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type mediaQueryer interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// hasMP3FrameSync checks whether the first 4 bytes match an MPEG Audio Layer III frame sync header.
// Catatan: pemeriksaan frame sync ini hanya memeriksa 4 byte header awal dan bukan bukti bahwa
// keseluruhan stream MP3 valid atau bebas dari kerusakan.
func hasMP3FrameSync(b []byte) bool {
	if len(b) < 4 {
		return false
	}
	// 11-bit frame sync: byte 0 == 0xFF and top 3 bits of byte 1 == 111 (0xE0)
	if b[0] != 0xFF || (b[1]&0xE0) != 0xE0 {
		return false
	}
	// MPEG Audio version ID (bits 4-3 of byte 1): 01 (0x08) is reserved
	if (b[1] & 0x18) == 0x08 {
		return false
	}
	// Layer description (bits 2-1 of byte 1): 01 (0x02) is Layer III
	if (b[1] & 0x06) != 0x02 {
		return false
	}
	// Bitrate index (bits 7-4 of byte 2): 0000 (0x00, free) and 1111 (0xF0, bad) are disallowed
	bitrateBits := b[2] & 0xF0
	if bitrateBits == 0x00 || bitrateBits == 0xF0 {
		return false
	}
	// Sampling rate frequency index (bits 3-2 of byte 2): 11 (0x0C) is reserved
	if (b[2] & 0x0C) == 0x0C {
		return false
	}
	return true
}

func detectMediaContentType(sniff []byte) (mimeType string, fileType string, ext string, maxBytes int64, ok bool) {
	detected := http.DetectContentType(sniff)
	if detected == "application/octet-stream" && hasMP3FrameSync(sniff) {
		detected = "audio/mpeg"
	}

	switch detected {
	case "image/jpeg":
		return "image/jpeg", mediaFileTypeImage, ".jpg", maxImageUploadBytes, true
	case "image/png":
		return "image/png", mediaFileTypeImage, ".png", maxImageUploadBytes, true
	case "audio/mpeg":
		return "audio/mpeg", mediaFileTypeAudio, ".mp3", maxAudioUploadBytes, true
	default:
		return detected, "", "", 0, false
	}
}

func sanitizeOriginalFilename(rawName string, fallback string) string {
	trimmed := strings.TrimSpace(rawName)
	trimmed = strings.ReplaceAll(trimmed, "\\", "/")
	base := filepath.Base(trimmed)
	if base == "." || base == "/" || base == "" {
		return fallback
	}

	var b strings.Builder
	runeCount := 0
	for _, r := range base {
		if r == 0 || r == '/' || r == '\\' || unicode.IsControl(r) {
			continue
		}
		if !unicode.IsPrint(r) {
			continue
		}
		b.WriteRune(r)
		runeCount++
		if runeCount >= maxOriginalFilenameRunes {
			break
		}
	}

	cleaned := strings.TrimSpace(b.String())
	if cleaned == "" || cleaned == "." || cleaned == ".." {
		return fallback
	}
	return cleaned
}

func checkInvitationMediaLimits(
	ctx context.Context,
	q mediaQueryer,
	userID int64,
	invitationVersionID int64,
	mediaFileType string,
) (limitKey string, limitMsg string, err error) {
	switch mediaFileType {
	case mediaFileTypeImage:
		var galleryLimit *int
		err := q.QueryRow(ctx, `
			SELECT MAX(pl.limit_value)
			FROM partner_packages pp
			JOIN package_limits pl ON pl.package_id = pp.package_id
			WHERE pp.user_id = $1
			  AND pp.status = 'active'
			  AND (pp.started_at IS NULL OR pp.started_at <= CURRENT_TIMESTAMP)
			  AND (pp.expired_at IS NULL OR pp.expired_at > CURRENT_TIMESTAMP)
			  AND pl.resource_key = $2
		`, userID, galleryLimitResourceKey).Scan(&galleryLimit)
		if err != nil {
			return "", "", err
		}

		// Fail-open when no gallery_limit row exists for the active package(s).
		if galleryLimit == nil {
			return "", "", nil
		}

		var imageCount int
		err = q.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM invitation_media im
			JOIN storage_files sf ON sf.id = im.storage_file_id
			WHERE im.invitation_version_id = $1
			  AND im.file_type = $2
			  AND sf.deleted_at IS NULL
		`, invitationVersionID, mediaFileTypeImage).Scan(&imageCount)
		if err != nil {
			return "", "", err
		}

		if imageCount >= *galleryLimit {
			return "gallery_limit_reached", "Maximum gallery image limit reached for this invitation", nil
		}
		return "", "", nil

	case mediaFileTypeAudio:
		var audioCount int
		err := q.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM invitation_media im
			JOIN storage_files sf ON sf.id = im.storage_file_id
			WHERE im.invitation_version_id = $1
			  AND im.file_type = $2
			  AND sf.deleted_at IS NULL
		`, invitationVersionID, mediaFileTypeAudio).Scan(&audioCount)
		if err != nil {
			return "", "", err
		}

		if audioCount >= maxAudioFilesPerVersion {
			return "audio_limit_reached", "Maximum audio file limit reached for this invitation", nil
		}
		return "", "", nil

	default:
		return "", "", nil
	}
}

func markDriveCredentialsRevoked(ctx context.Context, pool *pgxpool.Pool, userID int64) {
	updateCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if ctx != nil && ctx.Err() == nil {
		updateCtx = ctx
	}
	if _, err := pool.Exec(
		updateCtx,
		`UPDATE user_drive_credentials
		 SET status = 'revoked',
		     updated_at = CURRENT_TIMESTAMP
		 WHERE user_id = $1`,
		userID,
	); err != nil {
		log.Printf("UploadInvitationMedia: mark drive credentials revoked for user_id=%d: %v", userID, err)
	}
}

func compensateDriveFileDelete(
	storageClient drive.Storage,
	refreshToken string,
	fileID string,
	userID int64,
	invitationID int64,
) {
	cleanupCtx, cancel := context.WithTimeout(context.Background(), compensatingDeleteTimeout)
	defer cancel()

	if err := storageClient.DeleteFile(cleanupCtx, refreshToken, fileID); err != nil {
		log.Printf(
			"orphan drive file user_id=%d invitation_id=%d file_id=%s",
			userID,
			invitationID,
			fileID,
		)
	}
}

func ensurePartnerDriveFolder(
	ctx context.Context,
	pool *pgxpool.Pool,
	storageClient drive.Storage,
	userID int64,
	refreshToken string,
	currentFolderID *string,
) (string, error) {
	if currentFolderID != nil && strings.TrimSpace(*currentFolderID) != "" {
		return strings.TrimSpace(*currentFolderID), nil
	}

	createdFolderID, err := storageClient.CreateFolder(ctx, refreshToken, driveDefaultFolderName)
	if err != nil {
		return "", err
	}

	tag, err := pool.Exec(
		ctx,
		`UPDATE user_drive_credentials
		 SET drive_folder_id = $1,
		     updated_at = CURRENT_TIMESTAMP
		 WHERE user_id = $2
		   AND drive_folder_id IS NULL`,
		createdFolderID,
		userID,
	)
	if err != nil {
		return "", err
	}

	if tag.RowsAffected() > 0 {
		return createdFolderID, nil
	}

	// Another concurrent upload won the race; read the winner folder ID.
	var winnerFolderID *string
	err = pool.QueryRow(
		ctx,
		`SELECT drive_folder_id
		 FROM user_drive_credentials
		 WHERE user_id = $1`,
		userID,
	).Scan(&winnerFolderID)
	if err != nil {
		return "", err
	}

	// Best-effort cleanup of the loser folder.
	cleanupCtx, cancel := context.WithTimeout(context.Background(), compensatingDeleteTimeout)
	_ = storageClient.DeleteFile(cleanupCtx, refreshToken, createdFolderID)
	cancel()

	if winnerFolderID != nil && strings.TrimSpace(*winnerFolderID) != "" {
		return strings.TrimSpace(*winnerFolderID), nil
	}

	return createdFolderID, nil
}

// UploadInvitationMedia handles POST /api/v1/invitations/:id/media.
func UploadInvitationMedia(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.isConfigured() {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google Drive integration is not configured",
			})
			return
		}

		if pool == nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database is not configured",
			})
			return
		}

		// Step 1: Auth + role partner (enforced by middleware) & parse :id / :invitation_id
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

		ctx := c.Request.Context()

		// Step 2: Verify invitation ownership, draft status, and resolve latest draft version
		var (
			templateID int64
			status     string
		)
		err = pool.QueryRow(ctx, `
			SELECT template_id, status
			FROM invitations
			WHERE id = $1 AND user_id = $2
		`, invitationID, userID).Scan(&templateID, &status)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("UploadInvitationMedia: fetch invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify invitation",
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

		var draftVersionID int64
		err = pool.QueryRow(ctx, `
			SELECT id
			FROM invitation_versions
			WHERE invitation_id = $1 AND status = 'draft'
			ORDER BY version_number DESC
			LIMIT 1
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
			log.Printf("UploadInvitationMedia: fetch draft version for invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify invitation version",
			})
			return
		}

		// Step 3: Gate add-on Drive per invitation
		var hasActiveEntitlement bool
		err = pool.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM invitation_addon_entitlements e
				JOIN addons a ON a.id = e.addon_id
				WHERE e.invitation_id = $1
				  AND a.slug = $2
				  AND e.status = 'active'
				  AND (
					  e.expires_at IS NULL
					  OR e.expires_at > CURRENT_TIMESTAMP
				  )
			)
		`, invitationID, driveAddonSlug).Scan(&hasActiveEntitlement)
		if err != nil {
			log.Printf("UploadInvitationMedia: check addon entitlement for invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify Google Drive add-on entitlement",
			})
			return
		}

		if !hasActiveEntitlement {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "An active Google Drive add-on is required to upload media",
				"errors": gin.H{
					"addon": "addon_required",
				},
			})
			return
		}

		// Step 4: Fetch user_drive_credentials (without calling Google yet)
		var (
			encryptedRefreshToken []byte
			driveFolderID         *string
			credStatus            string
		)
		err = pool.QueryRow(ctx, `
			SELECT encrypted_refresh_token, drive_folder_id, status
			FROM user_drive_credentials
			WHERE user_id = $1
		`, userID).Scan(&encryptedRefreshToken, &driveFolderID, &credStatus)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Google Drive is not connected",
					"errors": gin.H{
						"drive": "drive_not_connected",
					},
				})
				return
			}
			log.Printf("UploadInvitationMedia: fetch drive credentials for user %d: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify Google Drive connection",
			})
			return
		}

		if credStatus != "connected" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Google Drive access has been revoked, please reconnect",
				"errors": gin.H{
					"drive": "drive_revoked",
				},
			})
			return
		}

		// Step 5 & 6: Read multipart body ONLY after steps 1-4 succeed
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxMultipartRequestBytes)
		mr, err := c.Request.MultipartReader()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid multipart form request",
				"errors": gin.H{
					"file": "file_required",
				},
			})
			return
		}

		var (
			filePartSeen      bool
			fileEmpty         bool
			fileTooLarge      bool
			unsupportedType   bool
			clientFileName    string
			detectedMime      string
			mediaFileType     string
			extFromMime       string
			fileBytes         []byte
			rawSectionID      *string
			rawSortOrder      *string
			textFieldTooLarge string
		)

		for {
			part, partErr := mr.NextPart()
			if errors.Is(partErr, io.EOF) {
				break
			}
			if partErr != nil {
				var maxBytesErr *http.MaxBytesError
				if errors.As(partErr, &maxBytesErr) {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "File size exceeds maximum limit of 10MB",
						"errors": gin.H{
							"file": "file_too_large",
						},
					})
					return
				}
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid multipart form data",
					"errors": gin.H{
						"file": "file_required",
					},
				})
				return
			}

			formName := part.FormName()
			switch formName {
			case "template_section_id", "sort_order":
				buf, readErr := io.ReadAll(io.LimitReader(part, maxMultipartTextFieldBytes+1))
				_ = part.Close()
				if readErr != nil {
					var maxBytesErr *http.MaxBytesError
					if errors.As(readErr, &maxBytesErr) {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "File size exceeds maximum limit of 10MB",
							"errors": gin.H{
								"file": "file_too_large",
							},
						})
						return
					}
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Invalid form field",
						"errors": gin.H{
							formName: "invalid_" + formName,
						},
					})
					return
				}
				if len(buf) > maxMultipartTextFieldBytes {
					textFieldTooLarge = formName
					continue
				}
				val := strings.TrimSpace(string(buf))
				if formName == "template_section_id" {
					rawSectionID = &val
				} else {
					rawSortOrder = &val
				}

			case "file":
				if filePartSeen {
					_ = part.Close()
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Only one file may be uploaded per request",
						"errors": gin.H{
							"file": "multiple_files_not_allowed",
						},
					})
					return
				}
				filePartSeen = true
				clientFileName = part.FileName()

				sniffBuf := make([]byte, sniffBufferSize)
				n, sniffErr := io.ReadFull(part, sniffBuf)
				if sniffErr != nil && !errors.Is(sniffErr, io.EOF) && !errors.Is(sniffErr, io.ErrUnexpectedEOF) {
					_ = part.Close()
					var maxBytesErr *http.MaxBytesError
					if errors.As(sniffErr, &maxBytesErr) {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "File size exceeds maximum limit of 10MB",
							"errors": gin.H{
								"file": "file_too_large",
							},
						})
						return
					}
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Could not read uploaded file",
						"errors": gin.H{
							"file": "file_required",
						},
					})
					return
				}

				if n == 0 {
					fileEmpty = true
					_ = part.Close()
					continue
				}

				var maxAllowed int64
				var validMime bool
				detectedMime, mediaFileType, extFromMime, maxAllowed, validMime = detectMediaContentType(sniffBuf[:n])
				if !validMime {
					unsupportedType = true
					_ = part.Close()
					continue
				}

				restLimit := maxAllowed - int64(n) + 1
				restBytes, readErr := io.ReadAll(io.LimitReader(part, restLimit))
				_ = part.Close()
				if readErr != nil {
					var maxBytesErr *http.MaxBytesError
					if errors.As(readErr, &maxBytesErr) {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "File size exceeds maximum limit of 10MB",
							"errors": gin.H{
								"file": "file_too_large",
							},
						})
						return
					}
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Could not read uploaded file",
						"errors": gin.H{
							"file": "file_required",
						},
					})
					return
				}

				if int64(n)+int64(len(restBytes)) > maxAllowed {
					fileTooLarge = true
					continue
				}

				fileBytes = make([]byte, 0, n+len(restBytes))
				fileBytes = append(fileBytes, sniffBuf[:n]...)
				fileBytes = append(fileBytes, restBytes...)

			default:
				_, readErr := io.Copy(io.Discard, io.LimitReader(part, maxMultipartTextFieldBytes+1))
				_ = part.Close()
				if readErr != nil {
					var maxBytesErr *http.MaxBytesError
					if errors.As(readErr, &maxBytesErr) {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "File size exceeds maximum limit of 10MB",
							"errors": gin.H{
								"file": "file_too_large",
							},
						})
						return
					}
				}
			}
		}

		if textFieldTooLarge != "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Form field is too large",
				"errors": gin.H{
					textFieldTooLarge: "invalid_" + textFieldTooLarge,
				},
			})
			return
		}

		if !filePartSeen || fileEmpty {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "A non-empty file is required",
				"errors": gin.H{
					"file": "file_required",
				},
			})
			return
		}

		if fileTooLarge {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "File size exceeds maximum limit of 10MB",
				"errors": gin.H{
					"file": "file_too_large",
				},
			})
			return
		}

		if unsupportedType {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Unsupported file type; only JPEG, PNG, and MP3 are allowed",
				"errors": gin.H{
					"file": "unsupported_file_type",
				},
			})
			return
		}

		// Image structural & dimension validation (Decision 8)
		if mediaFileType == mediaFileTypeImage {
			imgCfg, _, err := image.DecodeConfig(bytes.NewReader(fileBytes))
			if err != nil || imgCfg.Width <= 0 || imgCfg.Height <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Image file is corrupted or invalid",
					"errors": gin.H{
						"file": "invalid_image",
					},
				})
				return
			}
			if imgCfg.Width > maxImageDimensionPx || imgCfg.Height > maxImageDimensionPx {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Image dimensions must not exceed 6000x6000 pixels",
					"errors": gin.H{
						"file": "image_dimensions_too_large",
					},
				})
				return
			}
		}

		// Step 7: Validate template_section_id and sort_order
		sortOrder := 0
		if rawSortOrder != nil && *rawSortOrder != "" {
			parsedSort, err := strconv.Atoi(*rawSortOrder)
			if err != nil || parsedSort < 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "sort_order must be a non-negative integer",
					"errors": gin.H{
						"sort_order": "invalid_sort_order",
					},
				})
				return
			}
			sortOrder = parsedSort
		}

		var templateSectionID *int64
		if rawSectionID != nil && *rawSectionID != "" {
			parsedSecID, err := strconv.ParseInt(*rawSectionID, 10, 64)
			if err != nil || parsedSecID <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "template_section_id is invalid",
					"errors": gin.H{
						"template_section_id": "invalid_template_section_id",
					},
				})
				return
			}

			var sectionBelongsToTemplate bool
			err = pool.QueryRow(ctx, `
				SELECT EXISTS (
					SELECT 1
					FROM template_sections
					WHERE id = $1 AND template_id = $2
				)
			`, parsedSecID, templateID).Scan(&sectionBelongsToTemplate)
			if err != nil {
				log.Printf("UploadInvitationMedia: check template_section_id %d: %v", parsedSecID, err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not validate template section",
				})
				return
			}
			if !sectionBelongsToTemplate {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "template_section_id does not belong to this invitation template",
					"errors": gin.H{
						"template_section_id": "invalid_template_section_id",
					},
				})
				return
			}
			templateSectionID = &parsedSecID
		}

		// Step 8: Pre-check gallery_limit & audio_limit (fail-fast, without lock)
		limitCode, limitMsg, err := checkInvitationMediaLimits(
			ctx,
			pool,
			userID,
			draftVersionID,
			mediaFileType,
		)
		if err != nil {
			log.Printf("UploadInvitationMedia: pre-check media limits: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify media quota",
			})
			return
		}
		if limitCode != "" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": limitMsg,
				"errors": gin.H{
					"media": limitCode,
				},
			})
			return
		}

		// Step 9: Decrypt refresh token, ensure folder, and upload to Google Drive (outside DB tx)
		plaintextToken, err := crypto.Decrypt(cfg.TokenEncryptionKey, encryptedRefreshToken)
		if err != nil || len(plaintextToken) == 0 {
			log.Printf("UploadInvitationMedia: decrypt refresh token for user %d failed", userID)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not initialize Google Drive upload",
			})
			return
		}
		defer func() {
			for i := range plaintextToken {
				plaintextToken[i] = 0
			}
		}()
		refreshTokenStr := string(plaintextToken)

		unixUTC := cfg.now().UTC().Unix()
		driveFileName := fmt.Sprintf(
			"inv-%d-v%d-%d-%s%s",
			invitationID,
			draftVersionID,
			unixUTC,
			randomHexSuffix(8),
			extFromMime,
		)
		originalName := sanitizeOriginalFilename(clientFileName, driveFileName)
		if utf8.RuneCountInString(originalName) == 0 {
			originalName = driveFileName
		}

		storageClient := cfg.storageClient()

		activeFolderID, err := ensurePartnerDriveFolder(
			ctx,
			pool,
			storageClient,
			userID,
			refreshTokenStr,
			driveFolderID,
		)
		if err != nil {
			if errors.Is(err, drive.ErrTokenRevoked) {
				markDriveCredentialsRevoked(ctx, pool, userID)
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Google Drive access has been revoked, please reconnect",
					"errors": gin.H{
						"drive": "drive_revoked",
					},
				})
				return
			}
			log.Printf("UploadInvitationMedia: ensure drive folder for user %d failed: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not upload file to Google Drive",
				"errors": gin.H{
					"drive": "drive_upload_failed",
				},
			})
			return
		}

		uploaded, err := storageClient.UploadFile(ctx, refreshTokenStr, drive.UploadFileParams{
			FolderID: activeFolderID,
			FileName: driveFileName,
			MimeType: detectedMime,
			Content:  fileBytes,
		})
		if errors.Is(err, drive.ErrFolderNotFound) {
			// Partner deleted the folder in Google Drive; create a new folder, update DB, and retry ONCE.
			newFolderID, folderErr := storageClient.CreateFolder(ctx, refreshTokenStr, driveDefaultFolderName)
			if folderErr != nil {
				if errors.Is(folderErr, drive.ErrTokenRevoked) {
					markDriveCredentialsRevoked(ctx, pool, userID)
					c.JSON(http.StatusConflict, gin.H{
						"success": false,
						"message": "Google Drive access has been revoked, please reconnect",
						"errors": gin.H{
							"drive": "drive_revoked",
						},
					})
					return
				}
				log.Printf("UploadInvitationMedia: recreate drive folder for user %d failed: %v", userID, folderErr)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not upload file to Google Drive",
					"errors": gin.H{
						"drive": "drive_upload_failed",
					},
				})
				return
			}

			if _, updateErr := pool.Exec(
				ctx,
				`UPDATE user_drive_credentials
				 SET drive_folder_id = $1,
				     updated_at = CURRENT_TIMESTAMP
				 WHERE user_id = $2`,
				newFolderID,
				userID,
			); updateErr != nil {
				log.Printf("UploadInvitationMedia: update recreated folder id for user %d failed: %v", userID, updateErr)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not save Google Drive folder",
				})
				return
			}

			activeFolderID = newFolderID
			uploaded, err = storageClient.UploadFile(ctx, refreshTokenStr, drive.UploadFileParams{
				FolderID: activeFolderID,
				FileName: driveFileName,
				MimeType: detectedMime,
				Content:  fileBytes,
			})
		}

		if err != nil {
			if errors.Is(err, drive.ErrTokenRevoked) {
				markDriveCredentialsRevoked(ctx, pool, userID)
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Google Drive access has been revoked, please reconnect",
					"errors": gin.H{
						"drive": "drive_revoked",
					},
				})
				return
			}
			log.Printf("UploadInvitationMedia: drive upload for user %d invitation %d failed: %v", userID, invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not upload file to Google Drive",
				"errors": gin.H{
					"drive": "drive_upload_failed",
				},
			})
			return
		}

		if uploaded == nil || strings.TrimSpace(uploaded.ID) == "" {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not upload file to Google Drive",
				"errors": gin.H{
					"drive": "drive_upload_failed",
				},
			})
			return
		}

		// Step 10 & 11: Short DB transaction with FOR UPDATE re-check and compensating delete on any failure
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("UploadInvitationMedia: begin tx: %v", err)
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save invitation media",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		var lockedStatus string
		err = tx.QueryRow(ctx, `
			SELECT status
			FROM invitations
			WHERE id = $1 AND user_id = $2
			FOR UPDATE
		`, invitationID, userID).Scan(&lockedStatus)
		if err != nil {
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("UploadInvitationMedia: lock invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save invitation media",
			})
			return
		}

		if lockedStatus != "draft" {
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Only draft invitations can be edited",
				"errors": gin.H{
					"status": "invitation_is_not_draft",
				},
			})
			return
		}

		var lockedDraftVersionID int64
		err = tx.QueryRow(ctx, `
			SELECT id
			FROM invitation_versions
			WHERE invitation_id = $1 AND status = 'draft'
			ORDER BY version_number DESC
			LIMIT 1
			FOR UPDATE
		`, invitationID).Scan(&lockedDraftVersionID)
		if err != nil || lockedDraftVersionID != draftVersionID {
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			if errors.Is(err, pgx.ErrNoRows) || (err == nil && lockedDraftVersionID != draftVersionID) {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Only draft invitations can be edited",
					"errors": gin.H{
						"status": "invitation_is_not_draft",
					},
				})
				return
			}
			log.Printf("UploadInvitationMedia: lock draft version for invitation %d: %v", invitationID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save invitation media",
			})
			return
		}

		recheckCode, recheckMsg, err := checkInvitationMediaLimits(
			ctx,
			tx,
			userID,
			draftVersionID,
			mediaFileType,
		)
		if err != nil {
			log.Printf("UploadInvitationMedia: re-check media limits in tx: %v", err)
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save invitation media",
			})
			return
		}
		if recheckCode != "" {
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": recheckMsg,
				"errors": gin.H{
					"media": recheckCode,
				},
			})
			return
		}

		fileSize := int64(len(fileBytes))
		var folderIDPtr *string
		if strings.TrimSpace(activeFolderID) != "" {
			f := strings.TrimSpace(activeFolderID)
			folderIDPtr = &f
		}

		var storageFileID int64
		err = tx.QueryRow(ctx, `
			INSERT INTO storage_files (
				provider,
				file_id,
				folder_id,
				original_name,
				mime_type,
				size,
				uploaded_by
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
		`,
			storageProviderGoogleDrive,
			uploaded.ID,
			folderIDPtr,
			originalName,
			detectedMime,
			fileSize,
			userID,
		).Scan(&storageFileID)
		if err != nil {
			log.Printf("UploadInvitationMedia: insert storage_files: %v", err)
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save invitation media",
			})
			return
		}

		var (
			mediaID   int64
			createdAt time.Time
			updatedAt time.Time
		)
		err = tx.QueryRow(ctx, `
			INSERT INTO invitation_media (
				invitation_version_id,
				template_section_id,
				storage_file_id,
				file_type,
				sort_order
			)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, created_at, updated_at
		`,
			draftVersionID,
			templateSectionID,
			storageFileID,
			mediaFileType,
			sortOrder,
		).Scan(&mediaID, &createdAt, &updatedAt)
		if err != nil {
			log.Printf("UploadInvitationMedia: insert invitation_media: %v", err)
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save invitation media",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("UploadInvitationMedia: commit tx: %v", err)
			compensateDriveFileDelete(storageClient, refreshTokenStr, uploaded.ID, userID, invitationID)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save invitation media",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Invitation media uploaded successfully",
			"data": gin.H{
				"media": InvitationMediaResponse{
					ID:                  mediaID,
					InvitationID:        invitationID,
					InvitationVersionID: draftVersionID,
					TemplateSectionID:   templateSectionID,
					StorageFileID:       storageFileID,
					FileID:              uploaded.ID,
					FileType:            mediaFileType,
					MimeType:            detectedMime,
					OriginalName:        originalName,
					Size:                fileSize,
					SortOrder:           sortOrder,
					CreatedAt:           createdAt,
					UpdatedAt:           updatedAt,
				},
			},
		})
	}
}
