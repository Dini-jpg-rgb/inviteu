package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const templateDetailStatusPublish = "publish"

type templateDetailCategory struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type templateDetailField struct {
	ID              int64           `json:"id"`
	FieldKey        string          `json:"field_key"`
	Label           string          `json:"label"`
	FieldType       string          `json:"field_type"`
	DefaultValue    *string         `json:"default_value"`
	IsRequired      bool            `json:"is_required"`
	IsEditable      bool            `json:"is_editable"`
	SortOrder       int             `json:"sort_order"`
	ValidationRules json.RawMessage `json:"validation_rules"`
}

type templateDetailSection struct {
	ID         int64                 `json:"id"`
	Name       string                `json:"name"`
	Type       string                `json:"type"`
	SortOrder  int                   `json:"sort_order"`
	IsRequired bool                  `json:"is_required"`
	IsEditable bool                  `json:"is_editable"`
	Settings   json.RawMessage       `json:"settings"`
	Fields     []templateDetailField `json:"fields"`
}

type templateDetailAsset struct {
	ID            int64   `json:"id"`
	AssetType     string  `json:"asset_type"`
	AssetKey      *string `json:"asset_key"`
	StorageFileID int64   `json:"storage_file_id"`
	SortOrder     int     `json:"sort_order"`
}

type templateDetailResponse struct {
	ID              int64                   `json:"id"`
	Name            string                  `json:"name"`
	Slug            string                  `json:"slug"`
	Description     *string                 `json:"description"`
	Price           string                  `json:"price"`
	Style           *string                 `json:"style"`
	Color           *string                 `json:"color"`
	ThumbnailFileID *int64                  `json:"thumbnail_file_id"`
	Category        templateDetailCategory  `json:"category"`
	Sections        []templateDetailSection `json:"sections"`
	Assets          []templateDetailAsset   `json:"assets"`
}

func GetTemplateByID(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		templateID, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || templateID < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "id must be a positive integer",
			})
			return
		}

		var template templateDetailResponse
		err = pool.QueryRow(
			c.Request.Context(),
			`SELECT t.id, t.name, t.slug, t.description, t.price::text,
				t.style, t.color, t.thumbnail_file_id, tc.id, tc.name, tc.slug
			 FROM templates AS t
			 INNER JOIN template_categories AS tc ON tc.id = t.category_id
			 WHERE t.id = $1 AND t.status = $2`,
			templateID,
			templateDetailStatusPublish,
		).Scan(
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
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Template not found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template",
			})
			return
		}

		template.Sections = make([]templateDetailSection, 0)
		sectionRows, err := pool.Query(
			c.Request.Context(),
			`SELECT id, name, type, sort_order, is_required, is_editable, settings
			 FROM template_sections
			 WHERE template_id = $1
			 ORDER BY sort_order ASC, id ASC`,
			templateID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template",
			})
			return
		}
		defer sectionRows.Close()

		sectionIndexes := make(map[int64]int)
		for sectionRows.Next() {
			var section templateDetailSection
			section.Fields = make([]templateDetailField, 0)
			if err := sectionRows.Scan(
				&section.ID,
				&section.Name,
				&section.Type,
				&section.SortOrder,
				&section.IsRequired,
				&section.IsEditable,
				&section.Settings,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve template",
				})
				return
			}
			sectionIndexes[section.ID] = len(template.Sections)
			template.Sections = append(template.Sections, section)
		}
		if err := sectionRows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template",
			})
			return
		}
		sectionRows.Close()

		fieldRows, err := pool.Query(
			c.Request.Context(),
			`SELECT s.id, f.id, f.field_key, f.label, f.field_type, f.default_value,
				f.is_required, f.is_editable, f.sort_order, f.validation_rules
			 FROM template_fields AS f
			 INNER JOIN template_sections AS s ON s.id = f.template_section_id
			 WHERE s.template_id = $1
			 ORDER BY s.sort_order ASC, s.id ASC, f.sort_order ASC, f.id ASC`,
			templateID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template",
			})
			return
		}
		defer fieldRows.Close()

		for fieldRows.Next() {
			var sectionID int64
			var field templateDetailField
			if err := fieldRows.Scan(
				&sectionID,
				&field.ID,
				&field.FieldKey,
				&field.Label,
				&field.FieldType,
				&field.DefaultValue,
				&field.IsRequired,
				&field.IsEditable,
				&field.SortOrder,
				&field.ValidationRules,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve template",
				})
				return
			}

			sectionIndex, exists := sectionIndexes[sectionID]
			if !exists {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve template",
				})
				return
			}
			template.Sections[sectionIndex].Fields = append(
				template.Sections[sectionIndex].Fields,
				field,
			)
		}
		if err := fieldRows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template",
			})
			return
		}
		fieldRows.Close()

		template.Assets = make([]templateDetailAsset, 0)
		assetRows, err := pool.Query(
			c.Request.Context(),
			`SELECT id, asset_type, asset_key, storage_file_id, sort_order
			 FROM template_assets
			 WHERE template_id = $1
			 ORDER BY sort_order ASC, id ASC`,
			templateID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template",
			})
			return
		}
		defer assetRows.Close()

		for assetRows.Next() {
			var asset templateDetailAsset
			if err := assetRows.Scan(
				&asset.ID,
				&asset.AssetType,
				&asset.AssetKey,
				&asset.StorageFileID,
				&asset.SortOrder,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve template",
				})
				return
			}
			template.Assets = append(template.Assets, asset)
		}
		if err := assetRows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve template",
			})
			return
		}
		assetRows.Close()

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Template retrieved successfully",
			"data": gin.H{
				"template": template,
			},
		})
	}
}
