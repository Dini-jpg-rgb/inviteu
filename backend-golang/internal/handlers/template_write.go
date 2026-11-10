package handlers

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	TemplateStatusDraft      = "draft"
	TemplateStatusPublish    = "publish"
	TemplateStatusNeedReview = "need_review"
	TemplateStatusRevision   = "revision"
	TemplateStatusDecline    = "decline"

	maxTemplatePrice = 9999999999999.99
)

var templateSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type TemplateWriteResponse struct {
	ID              int64     `json:"id"`
	CategoryID      int64     `json:"category_id"`
	DesignerID      int64     `json:"designer_id"`
	Name            string    `json:"name"`
	Slug            string    `json:"slug"`
	Description     *string   `json:"description"`
	ThumbnailFileID *int64    `json:"thumbnail_file_id"`
	Price           string    `json:"price"`
	Style           *string   `json:"style"`
	Color           *string   `json:"color"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type CreateTemplateRequest struct {
	Name            string   `json:"name"`
	CategoryID      int64    `json:"category_id"`
	Slug            *string  `json:"slug"`
	Description     *string  `json:"description"`
	Price           *float64 `json:"price"`
	Style           *string  `json:"style"`
	Color           *string  `json:"color"`
	ThumbnailFileID *int64   `json:"thumbnail_file_id"`
}

func templateAuthUser(c *gin.Context) (int64, string, bool) {
	userIDVal, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Authentication required",
		})
		return 0, "", false
	}
	userID, ok := userIDVal.(int64)
	if !ok || userID <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid authenticated user",
		})
		return 0, "", false
	}

	roleVal, exists := c.Get(middleware.UserRoleKey)
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "User role is not available",
		})
		return 0, "", false
	}
	role, ok := roleVal.(string)
	if !ok || (role != "designer" && role != "admin") {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You do not have permission to access this resource",
		})
		return 0, "", false
	}

	return userID, role, true
}

func slugifyTemplateName(s string) string {
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
		return "template"
	}
	return res
}

func randomTemplateHexSuffix(chars int) string {
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

// CreateTemplate creates a new template in draft status.
func CreateTemplate(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _, ok := templateAuthUser(c)
		if !ok {
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024)

		var req CreateTemplateRequest
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
			fieldErrors["name"] = "name cannot be empty"
		} else if utf8.RuneCountInString(name) > 255 {
			fieldErrors["name"] = "name must not exceed 255 characters"
		}

		if req.CategoryID <= 0 {
			fieldErrors["category_id"] = "category_id must be a positive integer"
		}

		var cleanDesc *string
		if req.Description != nil {
			trimmed := strings.TrimSpace(*req.Description)
			if trimmed != "" {
				cleanDesc = &trimmed
			}
		}

		priceVal := float64(0)
		if req.Price != nil {
			if math.IsNaN(*req.Price) || math.IsInf(*req.Price, 0) || *req.Price < 0 {
				fieldErrors["price"] = "price must be a valid non-negative number"
			} else if *req.Price > maxTemplatePrice {
				fieldErrors["price"] = "price exceeds maximum allowed limit (9999999999999.99)"
			} else {
				priceVal = *req.Price
			}
		}

		var cleanStyle *string
		if req.Style != nil {
			trimmed := strings.TrimSpace(*req.Style)
			if trimmed != "" {
				if utf8.RuneCountInString(trimmed) > 100 {
					fieldErrors["style"] = "style must not exceed 100 characters"
				} else {
					cleanStyle = &trimmed
				}
			}
		}

		var cleanColor *string
		if req.Color != nil {
			trimmed := strings.TrimSpace(*req.Color)
			if trimmed != "" {
				if utf8.RuneCountInString(trimmed) > 100 {
					fieldErrors["color"] = "color must not exceed 100 characters"
				} else {
					cleanColor = &trimmed
				}
			}
		}

		var customSlug *string
		if req.Slug != nil {
			trimmed := strings.ToLower(strings.TrimSpace(*req.Slug))
			if trimmed != "" {
				if !templateSlugPattern.MatchString(trimmed) || len(trimmed) > 255 {
					fieldErrors["slug"] = "slug must contain lowercase letters, numbers, and single hyphens, max 255 characters"
				} else {
					customSlug = &trimmed
				}
			}
		}

		if req.ThumbnailFileID != nil && *req.ThumbnailFileID <= 0 {
			fieldErrors["thumbnail_file_id"] = "thumbnail_file_id must be a positive integer"
		}

		if len(fieldErrors) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors":  fieldErrors,
			})
			return
		}

		ctx := c.Request.Context()

		// Verify category existence
		var categoryExists bool
		err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM template_categories WHERE id = $1)`, req.CategoryID).Scan(&categoryExists)
		if err != nil {
			log.Printf("CreateTemplate: check category: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		if !categoryExists {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"category_id": "category_id does not exist",
				},
			})
			return
		}

		// Verify thumbnail_file_id existence if provided
		if req.ThumbnailFileID != nil {
			var thumbExists bool
			err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM storage_files WHERE id = $1)`, *req.ThumbnailFileID).Scan(&thumbExists)
			if err != nil {
				log.Printf("CreateTemplate: check storage_file: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Internal server error",
				})
				return
			}
			if !thumbExists {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Validation failed",
					"errors": gin.H{
						"thumbnail_file_id": "thumbnail_file_id does not exist",
					},
				})
				return
			}
		}

		executeInsert := func(slug string) (*TemplateWriteResponse, error) {
			var res TemplateWriteResponse
			err := pool.QueryRow(
				ctx,
				`INSERT INTO templates (
					category_id, designer_id, name, slug, description,
					thumbnail_file_id, price, style, color, status
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
				RETURNING id, category_id, designer_id, name, slug, description,
				          thumbnail_file_id, price::text, style, color, status, created_at, updated_at`,
				req.CategoryID,
				userID,
				name,
				slug,
				cleanDesc,
				req.ThumbnailFileID,
				priceVal,
				cleanStyle,
				cleanColor,
			).Scan(
				&res.ID,
				&res.CategoryID,
				&res.DesignerID,
				&res.Name,
				&res.Slug,
				&res.Description,
				&res.ThumbnailFileID,
				&res.Price,
				&res.Style,
				&res.Color,
				&res.Status,
				&res.CreatedAt,
				&res.UpdatedAt,
			)
			if err != nil {
				return nil, err
			}
			return &res, nil
		}

		if customSlug != nil {
			res, err := executeInsert(*customSlug)
			if err != nil {
				var pgErr *pgconn.PgError
				if errors.As(err, &pgErr) {
					if pgErr.Code == "23505" && pgErr.ConstraintName == "templates_slug_key" {
						c.JSON(http.StatusConflict, gin.H{
							"success": false,
							"message": "Slug is already in use",
							"errors": gin.H{
								"slug": "slug_already_taken",
							},
						})
						return
					}
					if pgErr.Code == "23503" {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "Referenced resource does not exist",
						})
						return
					}
					if pgErr.Code == "22003" {
						c.JSON(http.StatusBadRequest, gin.H{
							"success": false,
							"message": "Validation failed",
							"errors": gin.H{
								"price": "price exceeds maximum allowed limit (9999999999999.99)",
							},
						})
						return
					}
				}
				log.Printf("CreateTemplate: insert custom slug: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not create template",
				})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"success": true,
				"message": "Template created successfully",
				"data":    res,
			})
			return
		}

		// Auto-generate slug with collision retry
		baseSlug := slugifyTemplateName(name)
		for attempt := 0; attempt < 5; attempt++ {
			candidate := fmt.Sprintf("%s-%s", baseSlug, randomTemplateHexSuffix(6))
			res, err := executeInsert(candidate)
			if err == nil {
				c.JSON(http.StatusCreated, gin.H{
					"success": true,
					"message": "Template created successfully",
					"data":    res,
				})
				return
			}

			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" && pgErr.ConstraintName == "templates_slug_key" {
					continue
				}
				if pgErr.Code == "22003" {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Validation failed",
						"errors": gin.H{
							"price": "price exceeds maximum allowed limit (9999999999999.99)",
						},
					})
					return
				}
			}

			log.Printf("CreateTemplate: insert auto slug: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create template",
			})
			return
		}

		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Could not generate unique slug, please provide custom slug",
		})
	}
}

// UpdateTemplate updates an existing template in draft or revision status.
func UpdateTemplate(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, role, ok := templateAuthUser(c)
		if !ok {
			return
		}

		idParam := strings.TrimSpace(c.Param("id"))
		templateID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || templateID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid template ID",
				"errors": gin.H{
					"id": "template id must be a positive integer",
				},
			})
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024)
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
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
					"body": "request body cannot be read",
				},
			})
			return
		}

		if len(strings.TrimSpace(string(bodyBytes))) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"body": "at least one field must be provided for update",
				},
			})
			return
		}

		var rawMap map[string]json.RawMessage
		if err := json.Unmarshal(bodyBytes, &rawMap); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
				"errors": gin.H{
					"body": "request body must be valid JSON",
				},
			})
			return
		}

		if len(rawMap) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"body": "at least one field must be provided for update",
				},
			})
			return
		}

		fieldErrors := make(map[string]string)
		setFields := make(map[string]any)

		// 1. name (wajib tidak null)
		if rawVal, present := rawMap["name"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				fieldErrors["name"] = "name cannot be null"
			} else {
				var s string
				if err := json.Unmarshal(rawVal, &s); err != nil {
					fieldErrors["name"] = "name must be a string"
				} else {
					trimmed := strings.TrimSpace(s)
					if trimmed == "" {
						fieldErrors["name"] = "name cannot be empty"
					} else if utf8.RuneCountInString(trimmed) > 255 {
						fieldErrors["name"] = "name must not exceed 255 characters"
					} else {
						setFields["name"] = trimmed
					}
				}
			}
		}

		// 2. category_id (wajib tidak null)
		if rawVal, present := rawMap["category_id"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				fieldErrors["category_id"] = "category_id cannot be null"
			} else {
				var cid int64
				if err := json.Unmarshal(rawVal, &cid); err != nil || cid <= 0 {
					fieldErrors["category_id"] = "category_id must be a positive integer"
				} else {
					var catExists bool
					err := pool.QueryRow(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM template_categories WHERE id = $1)`, cid).Scan(&catExists)
					if err != nil {
						log.Printf("UpdateTemplate: check category: %v", err)
						c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Internal server error"})
						return
					}
					if !catExists {
						fieldErrors["category_id"] = "category_id does not exist"
					} else {
						setFields["category_id"] = cid
					}
				}
			}
		}

		// 3. price (wajib tidak null)
		if rawVal, present := rawMap["price"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				fieldErrors["price"] = "price cannot be null"
			} else {
				var p float64
				if err := json.Unmarshal(rawVal, &p); err != nil {
					var pStr string
					if errStr := json.Unmarshal(rawVal, &pStr); errStr == nil {
						parsed, errParse := strconv.ParseFloat(pStr, 64)
						if errParse == nil {
							p = parsed
						} else {
							fieldErrors["price"] = "price must be a valid non-negative number"
						}
					} else {
						fieldErrors["price"] = "price must be a valid non-negative number"
					}
				}
				if _, ok := fieldErrors["price"]; !ok {
					if p < 0 || math.IsNaN(p) || math.IsInf(p, 0) {
						fieldErrors["price"] = "price must be a valid non-negative number"
					} else if p > maxTemplatePrice {
						fieldErrors["price"] = "price exceeds maximum allowed limit (9999999999999.99)"
					} else {
						setFields["price"] = p
					}
				}
			}
		}

		// 4. slug (wajib tidak null)
		if rawVal, present := rawMap["slug"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				fieldErrors["slug"] = "slug cannot be null"
			} else {
				var s string
				if err := json.Unmarshal(rawVal, &s); err != nil {
					fieldErrors["slug"] = "slug must be a string"
				} else {
					trimmed := strings.ToLower(strings.TrimSpace(s))
					if trimmed == "" || !templateSlugPattern.MatchString(trimmed) || len(trimmed) > 255 {
						fieldErrors["slug"] = "slug must contain lowercase letters, numbers, and single hyphens, max 255 characters"
					} else {
						setFields["slug"] = trimmed
					}
				}
			}
		}

		// 5. description (nullable: null = kosongkan)
		if rawVal, present := rawMap["description"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				setFields["description"] = nil
			} else {
				var s string
				if err := json.Unmarshal(rawVal, &s); err != nil {
					fieldErrors["description"] = "description must be a string"
				} else {
					trimmed := strings.TrimSpace(s)
					if trimmed == "" {
						setFields["description"] = nil
					} else {
						setFields["description"] = trimmed
					}
				}
			}
		}

		// 6. style (nullable: null = kosongkan)
		if rawVal, present := rawMap["style"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				setFields["style"] = nil
			} else {
				var s string
				if err := json.Unmarshal(rawVal, &s); err != nil {
					fieldErrors["style"] = "style must be a string"
				} else {
					trimmed := strings.TrimSpace(s)
					if trimmed == "" {
						setFields["style"] = nil
					} else if utf8.RuneCountInString(trimmed) > 100 {
						fieldErrors["style"] = "style must not exceed 100 characters"
					} else {
						setFields["style"] = trimmed
					}
				}
			}
		}

		// 7. color (nullable: null = kosongkan)
		if rawVal, present := rawMap["color"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				setFields["color"] = nil
			} else {
				var s string
				if err := json.Unmarshal(rawVal, &s); err != nil {
					fieldErrors["color"] = "color must be a string"
				} else {
					trimmed := strings.TrimSpace(s)
					if trimmed == "" {
						setFields["color"] = nil
					} else if utf8.RuneCountInString(trimmed) > 100 {
						fieldErrors["color"] = "color must not exceed 100 characters"
					} else {
						setFields["color"] = trimmed
					}
				}
			}
		}

		// 8. thumbnail_file_id (nullable: null = kosongkan)
		if rawVal, present := rawMap["thumbnail_file_id"]; present {
			if string(bytes.TrimSpace(rawVal)) == "null" {
				setFields["thumbnail_file_id"] = nil
			} else {
				var tid int64
				if err := json.Unmarshal(rawVal, &tid); err != nil || tid <= 0 {
					fieldErrors["thumbnail_file_id"] = "thumbnail_file_id must be a positive integer"
				} else {
					var thumbExists bool
					err := pool.QueryRow(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM storage_files WHERE id = $1)`, tid).Scan(&thumbExists)
					if err != nil {
						log.Printf("UpdateTemplate: check thumbnail storage_file: %v", err)
						c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Internal server error"})
						return
					}
					if !thumbExists {
						fieldErrors["thumbnail_file_id"] = "thumbnail_file_id does not exist"
					} else {
						setFields["thumbnail_file_id"] = tid
					}
				}
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

		if len(setFields) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"body": "at least one valid field must be provided for update",
				},
			})
			return
		}

		ctx := c.Request.Context()

		// Build dynamic atomic update query with deterministic column ordering
		keys := make([]string, 0, len(setFields))
		for k := range setFields {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		setClauses := make([]string, 0, len(keys)+1)
		args := make([]any, 0, len(keys)+3)
		argIndex := 1

		for _, k := range keys {
			setClauses = append(setClauses, fmt.Sprintf("%s = $%d", k, argIndex))
			args = append(args, setFields[k])
			argIndex++
		}
		setClauses = append(setClauses, "updated_at = CURRENT_TIMESTAMP")

		var whereClause string
		if role == "designer" {
			whereClause = fmt.Sprintf("WHERE id = $%d AND designer_id = $%d AND status IN ('draft', 'revision')", argIndex, argIndex+1)
			args = append(args, templateID, userID)
		} else {
			whereClause = fmt.Sprintf("WHERE id = $%d AND status IN ('draft', 'revision')", argIndex)
			args = append(args, templateID)
		}

		updateQuery := fmt.Sprintf(
			`UPDATE templates
			 SET %s
			 %s
			 RETURNING id, category_id, designer_id, name, slug, description,
			           thumbnail_file_id, price::text, style, color, status, created_at, updated_at`,
			strings.Join(setClauses, ", "),
			whereClause,
		)

		var res TemplateWriteResponse
		err = pool.QueryRow(ctx, updateQuery, args...).Scan(
			&res.ID,
			&res.CategoryID,
			&res.DesignerID,
			&res.Name,
			&res.Slug,
			&res.Description,
			&res.ThumbnailFileID,
			&res.Price,
			&res.Style,
			&res.Color,
			&res.Status,
			&res.CreatedAt,
			&res.UpdatedAt,
		)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				// 0 rows affected: Differentiate 404 vs 409
				if role == "designer" {
					var dbDesignerID int64
					var dbStatus string
					errCheck := pool.QueryRow(ctx, `SELECT designer_id, status FROM templates WHERE id = $1`, templateID).Scan(&dbDesignerID, &dbStatus)
					if errors.Is(errCheck, pgx.ErrNoRows) || dbDesignerID != userID {
						c.JSON(http.StatusNotFound, gin.H{
							"success": false,
							"message": "Template not found",
						})
						return
					}
					c.JSON(http.StatusConflict, gin.H{
						"success": false,
						"message": "Template can only be updated when in draft or revision status",
						"errors": gin.H{
							"status": "template_status_not_editable",
						},
					})
					return
				}

				// Admin role
				var dbStatus string
				errCheck := pool.QueryRow(ctx, `SELECT status FROM templates WHERE id = $1`, templateID).Scan(&dbStatus)
				if errors.Is(errCheck, pgx.ErrNoRows) {
					c.JSON(http.StatusNotFound, gin.H{
						"success": false,
						"message": "Template not found",
					})
					return
				}
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Template can only be updated when in draft or revision status",
					"errors": gin.H{
						"status": "template_status_not_editable",
					},
				})
				return
			}

			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" && pgErr.ConstraintName == "templates_slug_key" {
					c.JSON(http.StatusConflict, gin.H{
						"success": false,
						"message": "Slug is already in use",
						"errors": gin.H{
							"slug": "slug_already_taken",
						},
					})
					return
				}
				if pgErr.Code == "23503" {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Referenced resource does not exist",
					})
					return
				}
				if pgErr.Code == "22003" {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Validation failed",
						"errors": gin.H{
							"price": "price exceeds maximum allowed limit (9999999999999.99)",
						},
					})
					return
				}
			}

			log.Printf("UpdateTemplate: execute update: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update template",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Template updated successfully",
			"data":    res,
		})
	}
}

// DeleteTemplate deletes a draft template if not referenced by invitations, package_templates, or invitation_favorites.
func DeleteTemplate(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, role, ok := templateAuthUser(c)
		if !ok {
			return
		}

		idParam := strings.TrimSpace(c.Param("id"))
		templateID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || templateID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid template ID",
				"errors": gin.H{
					"id": "template id must be a positive integer",
				},
			})
			return
		}

		ctx := c.Request.Context()

		var deleteQuery string
		var deleteArgs []any

		if role == "designer" {
			deleteQuery = `
				DELETE FROM templates
				WHERE id = $1
				  AND designer_id = $2
				  AND status = 'draft'
				  AND NOT EXISTS (SELECT 1 FROM invitations WHERE template_id = $1)
				  AND NOT EXISTS (SELECT 1 FROM package_templates WHERE template_id = $1)
				  AND NOT EXISTS (SELECT 1 FROM invitation_favorites WHERE template_id = $1)
			`
			deleteArgs = []any{templateID, userID}
		} else {
			deleteQuery = `
				DELETE FROM templates
				WHERE id = $1
				  AND status = 'draft'
				  AND NOT EXISTS (SELECT 1 FROM invitations WHERE template_id = $1)
				  AND NOT EXISTS (SELECT 1 FROM package_templates WHERE template_id = $1)
				  AND NOT EXISTS (SELECT 1 FROM invitation_favorites WHERE template_id = $1)
			`
			deleteArgs = []any{templateID}
		}

		tag, err := pool.Exec(ctx, deleteQuery, deleteArgs...)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23503" {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Template cannot be deleted because it is referenced by existing records",
				})
				return
			}
			log.Printf("DeleteTemplate: execute delete: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete template",
			})
			return
		}

		if tag.RowsAffected() > 0 {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Template deleted successfully",
			})
			return
		}

		// 0 rows affected: Run query to differentiate 404 vs 409
		var (
			dbDesignerID int64
			dbStatus     string
			hasInv       bool
			hasPkg       bool
			hasFav       bool
		)

		errCheck := pool.QueryRow(ctx, `
			SELECT designer_id, status,
			       EXISTS(SELECT 1 FROM invitations WHERE template_id = $1) AS has_inv,
			       EXISTS(SELECT 1 FROM package_templates WHERE template_id = $1) AS has_pkg,
			       EXISTS(SELECT 1 FROM invitation_favorites WHERE template_id = $1) AS has_fav
			FROM templates
			WHERE id = $1
		`, templateID).Scan(&dbDesignerID, &dbStatus, &hasInv, &hasPkg, &hasFav)

		if errors.Is(errCheck, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Template not found",
			})
			return
		}

		if role == "designer" && dbDesignerID != userID {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Template not found",
			})
			return
		}

		if dbStatus != TemplateStatusDraft {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Only draft templates can be deleted",
				"errors": gin.H{
					"status": "only_draft_template_can_be_deleted",
				},
			})
			return
		}

		if hasInv || hasPkg || hasFav {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Template cannot be deleted because it is referenced by existing records",
				"errors": gin.H{
					"template": "template_is_referenced",
				},
			})
			return
		}

		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Template not found",
		})
	}
}
