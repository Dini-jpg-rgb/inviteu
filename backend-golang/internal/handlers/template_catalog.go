package handlers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

const templateStatusPublish = "publish"

type templateCatalogCategory struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type templateCatalogItem struct {
	ID              int64                   `json:"id"`
	Name            string                  `json:"name"`
	Slug            string                  `json:"slug"`
	Description     *string                 `json:"description"`
	Price           string                  `json:"price"`
	Style           *string                 `json:"style"`
	Color           *string                 `json:"color"`
	ThumbnailFileID *int64                  `json:"thumbnail_file_id"`
	Category        templateCatalogCategory `json:"category"`
}

type templateCatalogPagination struct {
	Page       int64 `json:"page"`
	Limit      int64 `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"total_pages"`
}

func GetTemplates(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		where := []string{"t.status = $1"}
		args := []any{templateStatusPublish}
		addFilter := func(condition string, value any) {
			where = append(where, fmt.Sprintf(condition, len(args)+1))
			args = append(args, value)
		}

		if value, exists := c.GetQuery("category"); exists {
			addFilter("tc.slug = $%d", value)
		}

		if value, exists := c.GetQuery("q"); exists {
			query := strings.TrimSpace(value)
			if utf8.RuneCountInString(query) > 100 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "q must not exceed 100 characters",
				})
				return
			}
			query = strings.NewReplacer(`\`, `\\`, "%", `\%`, "_", `\_`).Replace(query)
			addFilter("t.name ILIKE $%d", "%"+query+"%")
		}

		var minPrice *float64
		if value, exists := c.GetQuery("min_price"); exists {
			parsed, err := strconv.ParseFloat(value, 64)
			if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) || parsed < 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "min_price must be a non-negative finite number",
				})
				return
			}
			minPrice = &parsed
			addFilter("t.price >= $%d::numeric", value)
		}

		var maxPrice *float64
		if value, exists := c.GetQuery("max_price"); exists {
			parsed, err := strconv.ParseFloat(value, 64)
			if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) || parsed < 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "max_price must be a non-negative finite number",
				})
				return
			}
			maxPrice = &parsed
			addFilter("t.price <= $%d::numeric", value)
		}

		if minPrice != nil && maxPrice != nil && *minPrice > *maxPrice {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "min_price must not be greater than max_price",
			})
			return
		}

		for _, filter := range []struct {
			name  string
			query string
		}{
			{name: "style", query: "LOWER(t.style) = LOWER($%d)"},
			{name: "color", query: "LOWER(t.color) = LOWER($%d)"},
		} {
			if value, exists := c.GetQuery(filter.name); exists {
				value = strings.TrimSpace(value)
				if utf8.RuneCountInString(value) > 100 {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": filter.name + " must not exceed 100 characters",
					})
					return
				}
				addFilter(filter.query, value)
			}
		}

		sortOrder := map[string]string{
			"newest":     "t.created_at DESC, t.id DESC",
			"price_asc":  "t.price ASC, t.id ASC",
			"price_desc": "t.price DESC, t.id ASC",
			"name_asc":   "t.name ASC, t.id ASC",
		}
		sort := "newest"
		if value, exists := c.GetQuery("sort"); exists {
			sort = value
		}
		orderBy, validSort := sortOrder[sort]
		if !validSort {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "sort must be one of: newest, price_asc, price_desc, name_asc",
			})
			return
		}

		fromWhere := `FROM templates AS t
			INNER JOIN template_categories AS tc ON tc.id = t.category_id
			WHERE ` + strings.Join(where, " AND ")

		var total int64
		if err := pool.QueryRow(
			c.Request.Context(),
			"SELECT COUNT(*) "+fromWhere,
			args...,
		).Scan(&total); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve templates",
			})
			return
		}

		listArgs := make([]any, len(args), len(args)+2)
		copy(listArgs, args)
		listArgs = append(listArgs, limit, offset)
		query := `SELECT t.id, t.name, t.slug, t.description, t.price::text,
				t.style, t.color, t.thumbnail_file_id, tc.id, tc.name, tc.slug
			` + fromWhere + `
			ORDER BY ` + orderBy + `
			LIMIT $` + strconv.Itoa(len(args)+1) + ` OFFSET $` + strconv.Itoa(len(args)+2)

		rows, err := pool.Query(c.Request.Context(), query, listArgs...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve templates",
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
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve templates",
				})
				return
			}
			templates = append(templates, template)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve templates",
			})
			return
		}

		totalPages := total / limit
		if total%limit > 0 {
			totalPages++
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Templates retrieved successfully",
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
