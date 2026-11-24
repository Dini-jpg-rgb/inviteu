package handlers

import (
	"math"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

var addonSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type createAddonRequest struct {
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	AddonType   string  `json:"addon_type"`
	Price       float64 `json:"price"`
	BillingType string  `json:"billing_type"`
	Status      string  `json:"status"`
	SortOrder   int     `json:"sort_order"`
}

func CreateAddon(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req createAddonRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		req.Name = strings.TrimSpace(req.Name)
		req.Slug = strings.ToLower(strings.TrimSpace(req.Slug))
		req.AddonType = strings.TrimSpace(req.AddonType)
		req.BillingType = strings.TrimSpace(req.BillingType)
		req.Status = strings.TrimSpace(req.Status)

		if req.Name == "" || req.Slug == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Name and slug are required",
			})
			return
		}

		if !addonSlugPattern.MatchString(req.Slug) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Slug must contain lowercase letters, numbers, and single hyphens",
			})
			return
		}

		if req.AddonType != "feature" &&
			req.AddonType != "quota" &&
			req.AddonType != "service" &&
			req.AddonType != "domain" &&
			req.AddonType != "storage" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid addon_type",
			})
			return
		}

		if req.BillingType != "one_time" &&
			req.BillingType != "monthly" &&
			req.BillingType != "yearly" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid billing_type",
			})
			return
		}

		if req.Price < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Price cannot be negative",
			})
			return
		}

		if req.SortOrder < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Sort order cannot be negative",
			})
			return
		}

		if req.Status == "" {
			req.Status = "active"
		}

		if req.Status != "active" &&
			req.Status != "inactive" &&
			req.Status != "archived" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid status",
			})
			return
		}

		var addonID int64

		err := pool.QueryRow(
			c.Request.Context(),
			`INSERT INTO addons
				(name, slug, description, addon_type, price, billing_type, status, sort_order)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 RETURNING id`,
			req.Name,
			req.Slug,
			req.Description,
			req.AddonType,
			req.Price,
			req.BillingType,
			req.Status,
			req.SortOrder,
		).Scan(&addonID)

		if err != nil {
			if strings.Contains(err.Error(), "addons_slug_key") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Slug already exists",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create addon",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Addon created successfully",
			"data": gin.H{
				"id":           addonID,
				"name":         req.Name,
				"slug":         req.Slug,
				"description":  req.Description,
				"addon_type":   req.AddonType,
				"price":        req.Price,
				"billing_type": req.BillingType,
				"status":       req.Status,
				"sort_order":   req.SortOrder,
			},
		})
	}
}

// edit addon request
type updateAddonRequest struct {
	Name        *string  `json:"name"`
	Slug        *string  `json:"slug"`
	Description *string  `json:"description"`
	AddonType   *string  `json:"addon_type"`
	Price       *float64 `json:"price"`
	BillingType *string  `json:"billing_type"`
	SortOrder   *int     `json:"sort_order"`
}

func UpdateAddon(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var req updateAddonRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		if req.Name == nil &&
			req.Slug == nil &&
			req.Description == nil &&
			req.AddonType == nil &&
			req.Price == nil &&
			req.BillingType == nil &&
			req.SortOrder == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "At least one field must be provided",
			})
			return
		}

		if req.Name != nil {
			*req.Name = strings.TrimSpace(*req.Name)
			if *req.Name == "" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Name cannot be empty",
				})
				return
			}
		}

		if req.Slug != nil {
			*req.Slug = strings.ToLower(strings.TrimSpace(*req.Slug))
			if !addonSlugPattern.MatchString(*req.Slug) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid slug format",
				})
				return
			}
		}

		if req.AddonType != nil {
			*req.AddonType = strings.TrimSpace(*req.AddonType)
			switch *req.AddonType {
			case "feature", "quota", "service", "domain", "storage":
			default:
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid addon_type",
				})
				return
			}
		}

		if req.BillingType != nil {
			*req.BillingType = strings.TrimSpace(*req.BillingType)
			switch *req.BillingType {
			case "one_time", "monthly", "yearly":
			default:
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid billing_type",
				})
				return
			}
		}

		if req.Price != nil && (*req.Price < 0 ||
			math.IsNaN(*req.Price) || math.IsInf(*req.Price, 0)) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Price must be a finite non-negative number",
			})
			return
		}

		if req.SortOrder != nil && *req.SortOrder < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Sort order cannot be negative",
			})
			return
		}

		var addonID int64
		var name, slug, addonType, billingType, status string
		var description *string
		var price string
		var sortOrder int

		err := pool.QueryRow(c.Request.Context(), `
			UPDATE addons
			SET
				name = COALESCE($1, name),
				slug = COALESCE($2, slug),
				description = COALESCE($3, description),
				addon_type = COALESCE($4, addon_type),
				price = COALESCE($5, price),
				billing_type = COALESCE($6, billing_type),
				sort_order = COALESCE($7, sort_order),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $8
			RETURNING id, name, slug, description, addon_type,
			          price::text, billing_type, status, sort_order
		`,
			req.Name,
			req.Slug,
			req.Description,
			req.AddonType,
			req.Price,
			req.BillingType,
			req.SortOrder,
			id,
		).Scan(
			&addonID, &name, &slug, &description, &addonType,
			&price, &billingType, &status, &sortOrder,
		)

		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Addon not found",
				})
				return
			}

			if strings.Contains(err.Error(), "addons_slug_key") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Slug already exists",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update addon",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Addon updated successfully",
			"data": gin.H{
				"id":           addonID,
				"name":         name,
				"slug":         slug,
				"description":  description,
				"addon_type":   addonType,
				"price":        price,
				"billing_type": billingType,
				"status":       status,
				"sort_order":   sortOrder,
			},
		})
	}
}

// edit status request

type updateAddonStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func UpdateAddonStatus(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var req updateAddonStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status is required",
			})
			return
		}

		req.Status = strings.TrimSpace(req.Status)

		switch req.Status {
		case "active", "inactive", "archived":
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status must be active, inactive, or archived",
			})
			return
		}

		var addonID int64
		var name, status string

		err := pool.QueryRow(
			c.Request.Context(),
			`UPDATE addons
			 SET status = $1, updated_at = CURRENT_TIMESTAMP
			 WHERE id = $2
			 RETURNING id, name, status`,
			req.Status,
			id,
		).Scan(&addonID, &name, &status)

		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Addon not found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update addon status",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Addon status updated successfully",
			"data": gin.H{
				"id":     addonID,
				"name":   name,
				"status": status,
			},
		})
	}
}

// mengambil semua addon

type addonResponse struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	AddonType   string  `json:"addon_type"`
	Price       string  `json:"price"`
	BillingType string  `json:"billing_type"`
	Status      string  `json:"status"`
	SortOrder   int     `json:"sort_order"`
}

func GetAddons(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := pool.Query(c.Request.Context(), `
			SELECT id, name, slug, description, addon_type,
			       price::text, billing_type, status, sort_order
			FROM addons
			WHERE status = 'active'
			ORDER BY sort_order ASC, id ASC
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve addons",
			})
			return
		}
		defer rows.Close()

		addons := make([]addonResponse, 0)

		for rows.Next() {
			var addon addonResponse
			if err := rows.Scan(
				&addon.ID,
				&addon.Name,
				&addon.Slug,
				&addon.Description,
				&addon.AddonType,
				&addon.Price,
				&addon.BillingType,
				&addon.Status,
				&addon.SortOrder,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to read addon data",
				})
				return
			}

			addons = append(addons, addon)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to read addon data",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Addons retrieved successfully",
			"data":    addons,
		})
	}
}

func GetAddonByID(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var addon addonResponse

		err := pool.QueryRow(c.Request.Context(), `
			SELECT id, name, slug, description, addon_type,
			       price::text, billing_type, status, sort_order
			FROM addons
			WHERE id = $1 AND status = 'active'
		`, id).Scan(
			&addon.ID,
			&addon.Name,
			&addon.Slug,
			&addon.Description,
			&addon.AddonType,
			&addon.Price,
			&addon.BillingType,
			&addon.Status,
			&addon.SortOrder,
		)

		if err != nil {
			if strings.Contains(err.Error(), "no rows") {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Addon not found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve addon",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Addon retrieved successfully",
			"data":    addon,
		})
	}
}
