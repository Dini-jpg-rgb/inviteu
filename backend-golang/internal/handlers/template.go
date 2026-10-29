package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type templateCategoryResponse struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
}

func GetTemplateCategories(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT id, name, slug, description
			 FROM template_categories
			 ORDER BY name ASC, id ASC`,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template categories",
			})
			return
		}
		defer rows.Close()

		categories := make([]templateCategoryResponse, 0)
		for rows.Next() {
			var category templateCategoryResponse
			if err := rows.Scan(
				&category.ID,
				&category.Name,
				&category.Slug,
				&category.Description,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve template categories",
				})
				return
			}

			categories = append(categories, category)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template categories",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Template categories retrieved successfully",
			"data": gin.H{
				"categories": categories,
			},
		})
	}
}
