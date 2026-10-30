package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type adminCreateUserRequest struct {
	Name     string `json:"name" binding:"required,max=255"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required"`
	Phone    string `json:"phone" binding:"max=50"`
	Role     string `json:"role" binding:"required"`
}

type adminUpdateUserRequest struct {
	Name  *string `json:"name"`
	Phone *string `json:"phone"`
}

type adminUpdateUserStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// getAdminUserID retrieves the authenticated admin ID from Gin context.
func getAdminUserID(c *gin.Context) (int64, bool) {
	value, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Authentication required",
		})
		return 0, false
	}

	userID, ok := value.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Invalid user context",
		})
		return 0, false
	}

	return userID, true
}

// ListUsers returns all users, including partners.
func ListUsers(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT id, name, email, phone, role, status
			 FROM users
			 ORDER BY created_at DESC, id DESC`,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve users",
			})
			return
		}
		defer rows.Close()

		users := make([]registeredUser, 0)

		for rows.Next() {
			var user registeredUser

			if err := rows.Scan(
				&user.ID,
				&user.Name,
				&user.Email,
				&user.Phone,
				&user.Role,
				&user.Status,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve users",
				})
				return
			}

			users = append(users, user)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve users",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Users retrieved successfully",
			"data": gin.H{
				"users": users,
			},
		})
	}
}

// GetUser returns a user's details by ID.
func GetUser(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid user ID",
			})
			return
		}

		var user registeredUser

		err = pool.QueryRow(
			c.Request.Context(),
			`SELECT id, name, email, phone, role, status
			 FROM users
			 WHERE id = $1`,
			id,
		).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Phone,
			&user.Role,
			&user.Status,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve user",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "User retrieved successfully",
			"data": gin.H{
				"user": user,
			},
		})
	}
}

// CreateUser creates a user with an explicitly selected role.
func CreateUser(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req adminCreateUserRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request data",
			})
			return
		}

		req.Name = strings.TrimSpace(req.Name)
		req.Email = strings.ToLower(strings.TrimSpace(req.Email))
		req.Phone = strings.TrimSpace(req.Phone)
		req.Role = strings.ToLower(strings.TrimSpace(req.Role))

		if req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Name is required",
			})
			return
		}

		if len(req.Password) < 8 || len(req.Password) > 72 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Password must be between 8 and 72 bytes",
			})
			return
		}

		if req.Role != "admin" &&
			req.Role != "designer" &&
			req.Role != "partner" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Role must be admin, designer, or partner",
			})
			return
		}

		passwordHash, err := bcrypt.GenerateFromPassword(
			[]byte(req.Password),
			bcrypt.DefaultCost,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not process password",
			})
			return
		}

		var phone *string
		if req.Phone != "" {
			phone = &req.Phone
		}

		var user registeredUser

		err = pool.QueryRow(
			c.Request.Context(),
			`INSERT INTO users (name, email, password, phone, role, status)
			 VALUES ($1, $2, $3, $4, $5, 'active')
			 RETURNING id, name, email, phone, role, status`,
			req.Name,
			req.Email,
			string(passwordHash),
			phone,
			req.Role,
		).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Phone,
			&user.Role,
			&user.Status,
		)

		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) &&
				pgErr.Code == "23505" &&
				pgErr.ConstraintName == "users_email_key" {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Email is already registered",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create user",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "User created successfully",
			"data": gin.H{
				"user": user,
			},
		})
	}
}

// UpdateUser updates the profile of another admin or designer.
func UpdateUser(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		adminID, ok := getAdminUserID(c)
		if !ok {
			return
		}

		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid user ID",
			})
			return
		}

		if id == adminID {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "You cannot manage your own account here",
			})
			return
		}

		var req adminUpdateUserRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
			})
			return
		}

		if req.Name == nil && req.Phone == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "At least one field must be provided",
			})
			return
		}

		if req.Name != nil {
			*req.Name = strings.TrimSpace(*req.Name)
			if *req.Name == "" || len(*req.Name) > 255 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Name must contain 1–255 bytes",
				})
				return
			}
		}

		if req.Phone != nil {
			*req.Phone = strings.TrimSpace(*req.Phone)
			if len(*req.Phone) > 50 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Phone must not exceed 50 characters",
				})
				return
			}
		}

		var role string
		err = pool.QueryRow(
			c.Request.Context(),
			`SELECT role FROM users WHERE id = $1`,
			id,
		).Scan(&role)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve user",
			})
			return
		}

		if role != "admin" && role != "designer" {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Only admin and designer accounts can be managed",
			})
			return
		}

		var user registeredUser

		err = pool.QueryRow(
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
			req.Name,
			req.Phone != nil,
			req.Phone,
			id,
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
				"message": "Could not update user",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "User updated successfully",
			"data": gin.H{
				"user": user,
			},
		})
	}
}

// UpdateUserStatus activates or deactivates another admin or designer.
func UpdateUserStatus(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		adminID, ok := getAdminUserID(c)
		if !ok {
			return
		}

		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid user ID",
			})
			return
		}

		if id == adminID {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "You cannot manage your own account here",
			})
			return
		}

		var req adminUpdateUserStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status is required",
			})
			return
		}

		req.Status = strings.ToLower(strings.TrimSpace(req.Status))
		if req.Status != "active" && req.Status != "inactive" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status must be active or inactive",
			})
			return
		}

		var role string
		err = pool.QueryRow(
			c.Request.Context(),
			`SELECT role FROM users WHERE id = $1`,
			id,
		).Scan(&role)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve user",
			})
			return
		}

		if role != "admin" && role != "designer" {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Only admin and designer accounts can be managed",
			})
			return
		}

		var user registeredUser

		err = pool.QueryRow(
			c.Request.Context(),
			`UPDATE users
			 SET status = $1,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $2
			 RETURNING id, name, email, phone, role, status`,
			req.Status,
			id,
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
				"message": "Could not update user status",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "User status updated successfully",
			"data": gin.H{
				"user": user,
			},
		})
	}
}
