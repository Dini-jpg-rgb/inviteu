package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/oauth2"
)

const googleStateCookie = "google_oauth_state"

type GoogleAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	JWTSecret    string
	AppEnv       string
}

type googleUserInfo struct {
	ID      string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func GoogleLogin(
	pool *pgxpool.Pool,
	cfg GoogleAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if cfg.ClientID == "" ||
			cfg.ClientSecret == "" ||
			cfg.RedirectURL == "" ||
			cfg.JWTSecret == "" {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google authentication is not configured",
			})
			return
		}

		stateBytes := make([]byte, 32)
		if _, err := rand.Read(stateBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not initialize Google login",
			})
			return
		}

		state := base64.RawURLEncoding.EncodeToString(stateBytes)

		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie(
			googleStateCookie,
			state,
			600,
			"/",
			"",
			cfg.AppEnv == "production",
			true,
		)

		oauthConfig := googleOAuthConfig(cfg)
		c.Redirect(
			http.StatusTemporaryRedirect,
			oauthConfig.AuthCodeURL(
				state,
				oauth2.SetAuthURLParam("prompt", "select_account"),
			),
		)
	}
}

func GoogleCallback(
	pool *pgxpool.Pool,
	cfg GoogleAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		stateCookie, err := c.Cookie(googleStateCookie)
		c.SetCookie(
			googleStateCookie,
			"",
			-1,
			"/",
			"",
			cfg.AppEnv == "production",
			true,
		)

		if err != nil ||
			stateCookie == "" ||
			c.Query("state") == "" ||
			c.Query("state") != stateCookie {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid OAuth state",
			})
			return
		}

		if googleError := c.Query("error"); googleError != "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Google login was cancelled or denied",
			})
			return
		}

		code := c.Query("code")
		if code == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Authorization code is missing",
			})
			return
		}

		oauthConfig := googleOAuthConfig(cfg)

		token, err := oauthConfig.Exchange(
			c.Request.Context(),
			code,
		)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Could not exchange Google authorization code",
			})
			return
		}

		rawIDToken, ok := token.Extra("id_token").(string)
		if !ok || rawIDToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Google ID token is missing",
			})
			return
		}

		provider, err := oidc.NewProvider(
			c.Request.Context(),
			"https://accounts.google.com",
		)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"success": false,
				"message": "Could not initialize Google identity verification",
			})
			return
		}

		verifier := provider.Verifier(&oidc.Config{
			ClientID: cfg.ClientID,
		})

		idToken, err := verifier.Verify(
			c.Request.Context(),
			rawIDToken,
		)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Google identity verification failed",
			})
			return
		}

		var profile googleUserInfo
		if err := idToken.Claims(&profile); err != nil ||
			profile.ID == "" ||
			profile.Email == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Google account information is incomplete",
			})
			return
		}

		var verifiedClaims struct {
			EmailVerified bool `json:"email_verified"`
		}
		if err := idToken.Claims(&verifiedClaims); err != nil ||
			!verifiedClaims.EmailVerified {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Google email is not verified",
			})
			return
		}

		var user registeredUser

		err = pool.QueryRow(
			c.Request.Context(),
			`SELECT id, name, email, phone, role, status
			 FROM users
			 WHERE google_id = $1`,
			profile.ID,
		).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Phone,
			&user.Role,
			&user.Status,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			// Do not automatically link an existing email account.
			// Linking should require a separate authenticated flow.
			err = pool.QueryRow(
				c.Request.Context(),
				`INSERT INTO users (name, email, google_id, avatar)
				 VALUES ($1, $2, $3, $4)
				 ON CONFLICT (email) DO NOTHING
				 RETURNING id, name, email, phone, role, status`,
				profile.Name,
				profile.Email,
				profile.ID,
				profile.Picture,
			).Scan(
				&user.ID,
				&user.Name,
				&user.Email,
				&user.Phone,
				&user.Role,
				&user.Status,
			)

			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "An account with this email already exists. Sign in with that account first.",
				})
				return
			}
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not find or create user account",
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

		jwtToken := jwt.NewWithClaims(
			jwt.SigningMethodHS256,
			claims,
		)

		tokenString, err := jwtToken.SignedString(
			[]byte(cfg.JWTSecret),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create authentication token",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Google login successful",
			"data": gin.H{
				"token":      tokenString,
				"token_type": "Bearer",
				"expires_in": 86400,
				"user":       user,
			},
		})
	}
}

func googleOAuthConfig(cfg GoogleAuthConfig) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Scopes: []string{
			"openid",
			"email",
			"profile",
		},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/v2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
	}
}
