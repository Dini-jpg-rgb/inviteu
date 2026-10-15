package handlers

import (
	"errors"
	"net/http"

	"math"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type packageWidget struct {
	WidgetKey string `json:"widget_key"`
	IsEnabled bool   `json:"is_enabled"`
}

type packageLimit struct {
	ResourceKey string `json:"resource_key"`
	LimitValue  int    `json:"limit_value"`
}

type packageResponse struct {
	ID              int64           `json:"id"`
	Name            string          `json:"name"`
	Description     *string         `json:"description"`
	Price           string          `json:"price"`
	InvitationQuota int             `json:"invitation_quota"`
	Widgets         []packageWidget `json:"widgets"`
	Limits          []packageLimit  `json:"limits"`
}

func GetPackages(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT id, name, description, price::text, invitation_quota
			 FROM packages
			 WHERE status = $1
			 ORDER BY price ASC, id ASC`,
			"active",
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve packages",
			})
			return
		}
		defer rows.Close()

		packages := make([]packageResponse, 0)

		for rows.Next() {
			var p packageResponse

			err := rows.Scan(
				&p.ID,
				&p.Name,
				&p.Description,
				&p.Price,
				&p.InvitationQuota,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read package data",
				})
				return
			}

			p.Widgets = make([]packageWidget, 0)
			p.Limits = make([]packageLimit, 0)

			packages = append(packages, p)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read package data",
			})
			return
		}

		for i := range packages {
			widgetRows, err := pool.Query(
				c.Request.Context(),
				`SELECT widget_key, is_enabled
				 FROM package_widgets
				 WHERE package_id = $1
				 ORDER BY id`,
				packages[i].ID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve package features",
				})
				return
			}

			for widgetRows.Next() {
				var w packageWidget
				if err := widgetRows.Scan(&w.WidgetKey, &w.IsEnabled); err != nil {
					widgetRows.Close()
					c.JSON(http.StatusInternalServerError, gin.H{
						"success": false,
						"message": "Could not read package features",
					})
					return
				}
				packages[i].Widgets = append(packages[i].Widgets, w)
			}

			err = widgetRows.Err()
			widgetRows.Close()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read package features",
				})
				return
			}

			limitRows, err := pool.Query(
				c.Request.Context(),
				`SELECT resource_key, limit_value
				 FROM package_limits
				 WHERE package_id = $1
				 ORDER BY id`,
				packages[i].ID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve package limits",
				})
				return
			}

			for limitRows.Next() {
				var l packageLimit
				if err := limitRows.Scan(&l.ResourceKey, &l.LimitValue); err != nil {
					limitRows.Close()
					c.JSON(http.StatusInternalServerError, gin.H{
						"success": false,
						"message": "Could not read package limits",
					})
					return
				}
				packages[i].Limits = append(packages[i].Limits, l)
			}

			err = limitRows.Err()
			limitRows.Close()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read package limits",
				})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Packages retrieved successfully",
			"data": gin.H{
				"packages": packages,
			},
		})
	}
}

// GetPackageByID handles the request to retrieve a specific package by its ID.
func GetPackageByID(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		packageID := c.Param("id")

		var p packageResponse

		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT id, name, description, price::text, invitation_quota
			 FROM packages
			 WHERE id = $1 AND status = $2`,
			packageID,
			"active",
		).Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Price,
			&p.InvitationQuota,
		)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Package not found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve package",
			})
			return
		}

		p.Widgets = make([]packageWidget, 0)
		p.Limits = make([]packageLimit, 0)

		widgetRows, err := pool.Query(
			c.Request.Context(),
			`SELECT widget_key, is_enabled
			 FROM package_widgets
			 WHERE package_id = $1
			 ORDER BY id`,
			p.ID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve package features",
			})
			return
		}

		for widgetRows.Next() {
			var w packageWidget
			if err := widgetRows.Scan(&w.WidgetKey, &w.IsEnabled); err != nil {
				widgetRows.Close()
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read package features",
				})
				return
			}
			p.Widgets = append(p.Widgets, w)
		}

		err = widgetRows.Err()
		widgetRows.Close()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read package features",
			})
			return
		}

		limitRows, err := pool.Query(
			c.Request.Context(),
			`SELECT resource_key, limit_value
			 FROM package_limits
			 WHERE package_id = $1
			 ORDER BY id`,
			p.ID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve package limits",
			})
			return
		}

		for limitRows.Next() {
			var l packageLimit
			if err := limitRows.Scan(&l.ResourceKey, &l.LimitValue); err != nil {
				limitRows.Close()
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read package limits",
				})
				return
			}
			p.Limits = append(p.Limits, l)
		}

		err = limitRows.Err()
		limitRows.Close()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read package limits",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Package retrieved successfully",
			"data": gin.H{
				"package": p,
			},
		})
	}
}

// CreatePackage handles the request to create a new package.
func CreatePackage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Name            string  `json:"name"`
			Description     *string `json:"description"`
			Price           string  `json:"price"`
			InvitationQuota int     `json:"invitation_quota"`
			Status          string  `json:"status"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		input.Name = strings.TrimSpace(input.Name)
		input.Price = strings.TrimSpace(input.Price)

		if input.Name == "" || len(input.Name) > 255 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Name must contain 1–255 bytes",
			})
			return
		}

		price, err := strconv.ParseFloat(input.Price, 64)
		if err != nil || math.IsNaN(price) || math.IsInf(price, 0) || price < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Price must be a valid non-negative number",
			})
			return
		}

		if input.InvitationQuota < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invitation quota must not be negative",
			})
			return
		}

		if input.Status == "" {
			input.Status = "active"
		}

		if input.Status != "active" && input.Status != "inactive" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status must be active or inactive",
			})
			return
		}

		var p packageResponse

		err = pool.QueryRow(
			c.Request.Context(),
			`INSERT INTO packages
				(name, description, price, invitation_quota, status)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id, name, description, price::text, invitation_quota`,
			input.Name,
			input.Description,
			input.Price,
			input.InvitationQuota,
			input.Status,
		).Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Price,
			&p.InvitationQuota,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create package",
			})
			return
		}

		p.Widgets = make([]packageWidget, 0)
		p.Limits = make([]packageLimit, 0)

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Package created successfully",
			"data": gin.H{
				"package": p,
				"status":  input.Status,
			},
		})
	}
}

func UpdatePackage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		packageID := c.Param("id")

		var input struct {
			Name            *string `json:"name"`
			Description     *string `json:"description"`
			Price           *string `json:"price"`
			InvitationQuota *int    `json:"invitation_quota"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		if input.Name == nil &&
			input.Description == nil &&
			input.Price == nil &&
			input.InvitationQuota == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "At least one field must be provided",
			})
			return
		}

		if input.Name != nil {
			*input.Name = strings.TrimSpace(*input.Name)
			if *input.Name == "" || len(*input.Name) > 255 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Name must contain 1–255 bytes",
				})
				return
			}
		}

		if input.Price != nil {
			*input.Price = strings.TrimSpace(*input.Price)

			price, err := strconv.ParseFloat(*input.Price, 64)
			if err != nil || math.IsNaN(price) ||
				math.IsInf(price, 0) || price < 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Price must be a valid non-negative number",
				})
				return
			}
		}

		if input.InvitationQuota != nil && *input.InvitationQuota < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invitation quota must not be negative",
			})
			return
		}

		var p packageResponse

		err := pool.QueryRow(
			c.Request.Context(),
			`UPDATE packages
			 SET name = COALESCE($1, name),
			     description = CASE
			         WHEN $2::boolean THEN $3::text
			         ELSE description
			     END,
			     price = COALESCE($4::numeric, price),
			     invitation_quota = COALESCE($5::integer, invitation_quota),
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $6
			 RETURNING id, name, description, price::text, invitation_quota`,
			input.Name,
			input.Description != nil,
			input.Description,
			input.Price,
			input.InvitationQuota,
			packageID,
		).Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Price,
			&p.InvitationQuota,
		)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Package not found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update package",
			})
			return
		}

		p.Widgets = make([]packageWidget, 0)
		p.Limits = make([]packageLimit, 0)

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Package updated successfully",
			"data": gin.H{
				"package": p,
			},
		})
	}
}

func UpdatePackageStatus(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		packageID := c.Param("id")

		var input struct {
			Status string `json:"status"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		input.Status = strings.TrimSpace(input.Status)

		if input.Status != "active" && input.Status != "inactive" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status must be active or inactive",
			})
			return
		}

		var result struct {
			ID     int64  `json:"id"`
			Name   string `json:"name"`
			Status string `json:"status"`
		}

		err := pool.QueryRow(
			c.Request.Context(),
			`UPDATE packages
			 SET status = $1,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $2
			 RETURNING id, name, status`,
			input.Status,
			packageID,
		).Scan(&result.ID, &result.Name, &result.Status)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Package not found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update package status",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Package status updated successfully",
			"data": gin.H{
				"package": result,
			},
		})
	}
}
