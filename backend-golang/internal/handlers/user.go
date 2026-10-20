package handlers

import (
	"net/http"
	"strings"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func GetMe(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, exists := c.Get(middleware.UserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		userID, ok := value.(int64)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Invalid user context",
			})
			return
		}

		var user registeredUser

		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT id, name, email, phone, role, status
			 FROM users
			 WHERE id = $1`,
			userID,
		).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Phone,
			&user.Role,
			&user.Status,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve user profile",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Profile retrieved successfully",
			"data": gin.H{
				"user": user,
			},
		})
	}
}

// UpdateMe handles the request to update the authenticated user's profile.
func UpdateMe(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, exists := c.Get(middleware.UserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		userID, ok := value.(int64)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Invalid user context",
			})
			return
		}

		var input struct {
			Name  *string `json:"name"`
			Phone *string `json:"phone"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		if input.Name == nil && input.Phone == nil {
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

		if input.Phone != nil {
			*input.Phone = strings.TrimSpace(*input.Phone)
			if len(*input.Phone) > 50 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Phone must not exceed 50 characters",
				})
				return
			}
		}

		var user registeredUser

		err := pool.QueryRow(
			c.Request.Context(),
			`UPDATE users
			 SET name = COALESCE($1, name),
			     phone = CASE
			         WHEN $2::boolean THEN $3::varchar
			         ELSE phone
			     END,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $4
			 RETURNING id, name, email, phone, role, status`,
			input.Name,
			input.Phone != nil,
			input.Phone,
			userID,
		).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Phone,
			&user.Role,
			&user.Status,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update user profile",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Profile updated successfully",
			"data": gin.H{
				"user": user,
			},
		})
	}
}
