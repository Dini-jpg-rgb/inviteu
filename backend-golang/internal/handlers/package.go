package handlers

import (
	"errors"
	"math"
	"net/http"
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
	DurationMonths  *int            `json:"duration_months"`
	Widgets         []packageWidget `json:"widgets"`
	Limits          []packageLimit  `json:"limits"`
}

// loadPackageDetails mengambil widgets dan limits untuk sebuah paket.
func loadPackageDetails(
	c *gin.Context,
	pool *pgxpool.Pool,
	p *packageResponse,
) error {
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
		return err
	}

	for widgetRows.Next() {
		var w packageWidget

		if err := widgetRows.Scan(&w.WidgetKey, &w.IsEnabled); err != nil {
			widgetRows.Close()
			return err
		}

		p.Widgets = append(p.Widgets, w)
	}

	err = widgetRows.Err()
	widgetRows.Close()
	if err != nil {
		return err
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
		return err
	}

	for limitRows.Next() {
		var l packageLimit

		if err := limitRows.Scan(&l.ResourceKey, &l.LimitValue); err != nil {
			limitRows.Close()
			return err
		}

		p.Limits = append(p.Limits, l)
	}

	err = limitRows.Err()
	limitRows.Close()
	if err != nil {
		return err
	}

	return nil
}

// GetPackages mengambil semua paket yang berstatus active.
func GetPackages(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT id, name, description, price::text,
			        invitation_quota, duration_months
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

			if err := rows.Scan(
				&p.ID,
				&p.Name,
				&p.Description,
				&p.Price,
				&p.InvitationQuota,
				&p.DurationMonths,
			); err != nil {
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

		// Tutup rows sebelum menjalankan query lain.
		rows.Close()

		for i := range packages {
			if err := loadPackageDetails(
				c,
				pool,
				&packages[i],
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve package details",
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

// GetPackageByID mengambil detail satu paket yang berstatus active.
func GetPackageByID(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		packageID, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || packageID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid package ID",
			})
			return
		}

		var p packageResponse

		err = pool.QueryRow(
			c.Request.Context(),
			`SELECT id, name, description, price::text,
			        invitation_quota, duration_months
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
			&p.DurationMonths,
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

		if err := loadPackageDetails(c, pool, &p); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve package details",
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

// CreatePackage membuat paket baru.
func CreatePackage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Name            string  `json:"name"`
			Description     *string `json:"description"`
			Price           string  `json:"price"`
			InvitationQuota int     `json:"invitation_quota"`
			DurationMonths  int     `json:"duration_months"`
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
		if err != nil ||
			math.IsNaN(price) ||
			math.IsInf(price, 0) ||
			price < 0 {
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

		// Durasi wajib diisi dan harus lebih besar dari nol.
		if input.DurationMonths <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Duration months must be a positive integer",
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
				(name, description, price, invitation_quota,
				 duration_months, status)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING id, name, description, price::text,
			           invitation_quota, duration_months`,
			input.Name,
			input.Description,
			input.Price,
			input.InvitationQuota,
			input.DurationMonths,
			input.Status,
		).Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Price,
			&p.InvitationQuota,
			&p.DurationMonths,
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

// UpdatePackage memperbarui field paket yang dikirim dalam request.
func UpdatePackage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		packageID, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || packageID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid package ID",
			})
			return
		}

		var input struct {
			Name            *string `json:"name"`
			Description     *string `json:"description"`
			Price           *string `json:"price"`
			InvitationQuota *int    `json:"invitation_quota"`
			DurationMonths  *int    `json:"duration_months"`
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
			input.InvitationQuota == nil &&
			input.DurationMonths == nil {
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
			if err != nil ||
				math.IsNaN(price) ||
				math.IsInf(price, 0) ||
				price < 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Price must be a valid non-negative number",
				})
				return
			}
		}

		if input.InvitationQuota != nil &&
			*input.InvitationQuota < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invitation quota must not be negative",
			})
			return
		}

		if input.DurationMonths != nil &&
			*input.DurationMonths <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Duration months must be a positive integer",
			})
			return
		}

		var p packageResponse

		err = pool.QueryRow(
			c.Request.Context(),
			`UPDATE packages
			 SET name = COALESCE($1::varchar, name),
			     description = CASE
			         WHEN $2::boolean THEN $3::text
			         ELSE description
			     END,
			     price = COALESCE($4::numeric, price),
			     invitation_quota = COALESCE($5::integer, invitation_quota),
			     duration_months = COALESCE($6::integer, duration_months),
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $7
			 RETURNING id, name, description, price::text,
			           invitation_quota, duration_months`,
			input.Name,
			input.Description != nil,
			input.Description,
			input.Price,
			input.InvitationQuota,
			input.DurationMonths,
			packageID,
		).Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Price,
			&p.InvitationQuota,
			&p.DurationMonths,
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

		// Field widgets dan limits belum diubah oleh endpoint ini.
		// Ambil nilai yang tersimpan agar response tetap konsisten.
		if err := loadPackageDetails(c, pool, &p); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Package updated, but details could not be retrieved",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Package updated successfully",
			"data": gin.H{
				"package": p,
			},
		})
	}
}

// UpdatePackageStatus mengubah status paket menjadi active atau inactive.
func UpdatePackageStatus(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		packageID, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || packageID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid package ID",
			})
			return
		}

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

		err = pool.QueryRow(
			c.Request.Context(),
			`UPDATE packages
			 SET status = $1,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $2
			 RETURNING id, name, status`,
			input.Status,
			packageID,
		).Scan(
			&result.ID,
			&result.Name,
			&result.Status,
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
