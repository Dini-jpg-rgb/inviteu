package handlers

import (
	"log"
	"math"
	"net/http"
	"strconv"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func AddTemplateFavorite(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := templateFavoriteUserID(c)
		if !ok {
			return
		}

		var request struct {
			TemplateID *int64 `json:"template_id"`
		}
		if err := c.ShouldBindJSON(&request); err != nil || request.TemplateID == nil || *request.TemplateID < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "template_id must be a positive integer",
			})
			return
		}

		tag, err := pool.Exec(
			c.Request.Context(),
			`INSERT INTO invitation_favorites (user_id, template_id)
			 SELECT $1, t.id
			 FROM templates AS t
			 WHERE t.id = $2 AND t.status = $3
			 ON CONFLICT (user_id, template_id) DO NOTHING`,
			userID,
			*request.TemplateID,
			templateStatusPublish,
		)
		if err != nil {
			log.Printf("add template favorite: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not add template to favorites",
			})
			return
		}

		if tag.RowsAffected() == 0 {
			var published bool
			if err := pool.QueryRow(
				c.Request.Context(),
				`SELECT EXISTS (
					SELECT 1 FROM templates WHERE id = $1 AND status = $2
				)`,
				*request.TemplateID,
				templateStatusPublish,
			).Scan(&published); err != nil {
				log.Printf("check template before reporting favorite conflict: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not add template to favorites",
				})
				return
			}
			if !published {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Template not found",
				})
				return
			}

			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Template is already in favorites",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Template added to favorites",
			"data": gin.H{
				"favorite": gin.H{
					"template_id": *request.TemplateID,
				},
			},
		})
	}
}

func GetTemplateFavorites(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := templateFavoriteUserID(c)
		if !ok {
			return
		}

		page := int64(1)
		if value, exists := c.GetQuery("page"); exists {
			parsed, err := strconv.ParseInt(value, 10, 64)
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
		if value, exists := c.GetQuery("limit"); exists {
			parsed, err := strconv.ParseInt(value, 10, 64)
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

		var total int64
		if err := pool.QueryRow(
			c.Request.Context(),
			`SELECT COUNT(*)
			 FROM invitation_favorites AS favorite
			 INNER JOIN templates AS t ON t.id = favorite.template_id
			 WHERE favorite.user_id = $1 AND t.status = $2`,
			userID,
			templateStatusPublish,
		).Scan(&total); err != nil {
			log.Printf("count template favorites: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template favorites",
			})
			return
		}

		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT t.id, t.name, t.slug, t.description, t.price::text,
				t.style, t.color, t.thumbnail_file_id, tc.id, tc.name, tc.slug
			 FROM invitation_favorites AS favorite
			 INNER JOIN templates AS t ON t.id = favorite.template_id
			 INNER JOIN template_categories AS tc ON tc.id = t.category_id
			 WHERE favorite.user_id = $1 AND t.status = $2
			 ORDER BY favorite.created_at DESC, favorite.id DESC
			 LIMIT $3 OFFSET $4`,
			userID,
			templateStatusPublish,
			limit,
			offset,
		)
		if err != nil {
			log.Printf("query template favorites: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template favorites",
			})
			return
		}
		defer rows.Close()

		templates := make([]templateCatalogItem, 0)
		for rows.Next() {
			var template templateCatalogItem
			if err := rows.Scan(
				&template.ID,
				&template.Name,
				&template.Slug,
				&template.Description,
				&template.Price,
				&template.Style,
				&template.Color,
				&template.ThumbnailFileID,
				&template.Category.ID,
				&template.Category.Name,
				&template.Category.Slug,
			); err != nil {
				log.Printf("scan template favorite: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve template favorites",
				})
				return
			}
			templates = append(templates, template)
		}
		if err := rows.Err(); err != nil {
			log.Printf("iterate template favorites: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template favorites",
			})
			return
		}

		totalPages := total / limit
		if total%limit > 0 {
			totalPages++
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Template favorites retrieved successfully",
			"data": gin.H{
				"templates": templates,
				"pagination": templateCatalogPagination{
					Page:       page,
					Limit:      limit,
					Total:      total,
					TotalPages: totalPages,
				},
			},
		})
	}
}

func DeleteTemplateFavorite(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := templateFavoriteUserID(c)
		if !ok {
			return
		}

		templateID, err := strconv.ParseInt(c.Param("template_id"), 10, 64)
		if err != nil || templateID < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "template_id must be a positive integer",
			})
			return
		}

		tag, err := pool.Exec(
			c.Request.Context(),
			`DELETE FROM invitation_favorites
			 WHERE user_id = $1 AND template_id = $2`,
			userID,
			templateID,
		)
		if err != nil {
			log.Printf("delete template favorite: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not remove template favorite",
			})
			return
		}
		if tag.RowsAffected() == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Favorite not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Favorite removed successfully",
		})
	}
}

func templateFavoriteUserID(c *gin.Context) (int64, bool) {
	value, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Authentication required",
		})
		return 0, false
	}

	userID, ok := value.(int64)
	if !ok || userID <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid authenticated user",
		})
		return 0, false
	}
	return userID, true
}
