package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Name     string `json:"name" binding:"required,max=255"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required"`
	Phone    string `json:"phone" binding:"max=50"`
}

type registeredUser struct {
	ID     int64   `json:"id"`
	Name   string  `json:"name"`
	Email  string  `json:"email"`
	Phone  *string `json:"phone"`
	Role   string  `json:"role"`
	Status string  `json:"status"`
}

// Register handles user registration requests.
func Register(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req registerRequest

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

		passwordHash, err := bcrypt.GenerateFromPassword(
			[]byte(req.Password),
			bcrypt.DefaultCost,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not process registration",
			})
			return
		}

		var phone *string
		if req.Phone != "" {
			phone = &req.Phone
		}

		user := registeredUser{}

		err = pool.QueryRow(
			c.Request.Context(),
			`INSERT INTO users (name, email, password, phone)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, name, email, phone, role, status`,
			req.Name,
			req.Email,
			string(passwordHash),
			phone,
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
			"message": "Registration successful",
			"data": gin.H{
				"user": user,
			},
		})
	}
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required"`
}

// Login handles user login requests.
func Login(pool *pgxpool.Pool, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request data",
			})
			return
		}

		req.Email = strings.ToLower(strings.TrimSpace(req.Email))

		if jwtSecret == "" {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Authentication is not configured",
			})
			return
		}

		var user registeredUser
		var passwordHash string

		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT id, name, email, COALESCE(password, ''),
			        phone, role, status
			 FROM users
			 WHERE email = $1`,
			req.Email,
		).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&passwordHash,
			&user.Phone,
			&user.Role,
			&user.Status,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid email or password",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not process login",
			})
			return
		}

		if passwordHash == "" ||
			bcrypt.CompareHashAndPassword(
				[]byte(passwordHash),
				[]byte(req.Password),
			) != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid email or password",
			})
			return
		}

		if user.Status != "active" {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Account is not active",
			})
			return
		}

		now := time.Now()

		claims := jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(user.ID, 10),
			Issuer:    "inviteu",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

		tokenString, err := token.SignedString([]byte(jwtSecret))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create authentication token",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Login successful",
			"data": gin.H{
				"token":      tokenString,
				"token_type": "Bearer",
				"expires_in": 86400,
				"user":       user,
			},
		})
	}
}

// Logout handles user logout requests.
func Logout() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Logout successful. Please discard your token.",
		})
	}
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email,max=255"`
}

// ForgotPassword creates a one-time password reset token.
func ForgotPassword(pool *pgxpool.Pool, appEnv string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req forgotPasswordRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide a valid email address",
			})
			return
		}

		req.Email = strings.ToLower(strings.TrimSpace(req.Email))

		var userID int64
		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT id FROM users
			 WHERE email = $1 AND status = 'active'`,
			req.Email,
		).Scan(&userID)

		// Use the same response whether the account exists or not.
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "If the account exists, password reset instructions will be provided.",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not process password reset request",
			})
			return
		}

		randomBytes := make([]byte, 32)
		if _, err := rand.Read(randomBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not generate reset token",
			})
			return
		}

		rawToken := hex.EncodeToString(randomBytes)
		tokenHash := sha256.Sum256([]byte(rawToken))
		tokenHashString := hex.EncodeToString(tokenHash[:])

		_, err = pool.Exec(
			c.Request.Context(),
			`UPDATE password_reset_tokens
			 SET used_at = CURRENT_TIMESTAMP
			 WHERE user_id = $1 AND used_at IS NULL`,
			userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create reset token",
			})
			return
		}

		_, err = pool.Exec(
			c.Request.Context(),
			`INSERT INTO password_reset_tokens
			 (user_id, token_hash, expires_at, created_at)
			 VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 minutes', CURRENT_TIMESTAMP)`,
			userID,
			tokenHashString,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create reset token",
			})
			return
		}

		response := gin.H{
			"success": true,
			"message": "If the account exists, password reset instructions will be provided.",
		}

		// Only expose the raw token in explicit local development mode.
		if appEnv == "development" {
			response["reset_token"] = rawToken
		}

		c.JSON(http.StatusOK, response)
	}
}

type resetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

// ResetPassword validates a reset token and updates the user's password.
func ResetPassword(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req resetPasswordRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Token and new password are required",
			})
			return
		}

		if len(req.NewPassword) < 8 || len(req.NewPassword) > 72 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Password must be between 8 and 72 bytes",
			})
			return
		}

		tokenHash := sha256.Sum256([]byte(req.Token))
		tokenHashString := hex.EncodeToString(tokenHash[:])

		passwordHash, err := bcrypt.GenerateFromPassword(
			[]byte(req.NewPassword),
			bcrypt.DefaultCost,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not process new password",
			})
			return
		}

		tx, err := pool.Begin(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not process password reset",
			})
			return
		}
		defer tx.Rollback(c.Request.Context())

		var userID int64
		err = tx.QueryRow(
			c.Request.Context(),
			`SELECT user_id
			 FROM password_reset_tokens
			 WHERE token_hash = $1
			   AND used_at IS NULL
			   AND expires_at > CURRENT_TIMESTAMP
			 FOR UPDATE`,
			tokenHashString,
		).Scan(&userID)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Reset token is invalid, expired, or already used",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not validate reset token",
			})
			return
		}

		_, err = tx.Exec(
			c.Request.Context(),
			`UPDATE users
			 SET password = $1, updated_at = CURRENT_TIMESTAMP
			 WHERE id = $2 AND status = 'active'`,
			string(passwordHash),
			userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update password",
			})
			return
		}

		tag, err := tx.Exec(
			c.Request.Context(),
			`UPDATE password_reset_tokens
			 SET used_at = CURRENT_TIMESTAMP
			 WHERE token_hash = $1 AND used_at IS NULL`,
			tokenHashString,
		)
		if err != nil || tag.RowsAffected() != 1 {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not complete password reset",
			})
			return
		}

		if err := tx.Commit(c.Request.Context()); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not complete password reset",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Password reset successful",
		})
	}
}
