package handlers

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"backend-golang/internal/crypto"
	"backend-golang/internal/drive"
	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	GoogleDriveStateCookie  = "google_drive_oauth_state"
	GoogleDriveBindCookie   = "google_drive_oauth_bind"
	GoogleDriveAddonSlug    = "google-drive-connect"
	googleDriveCookieMaxAge = 600
	googleDriveBindTTL      = 10 * time.Minute
)

type DriveAuthConfig struct {
	ClientID           string
	ClientSecret       string
	RedirectURL        string
	FrontendURL        string
	TokenEncryptionKey []byte
	JWTSecret          string
	AppEnv             string
	OAuth              drive.OAuth
	Storage            drive.Storage
	Now                func() time.Time
}

func (cfg DriveAuthConfig) isConfigured() bool {
	return strings.TrimSpace(cfg.ClientID) != "" &&
		strings.TrimSpace(cfg.ClientSecret) != "" &&
		strings.TrimSpace(cfg.RedirectURL) != "" &&
		strings.TrimSpace(cfg.FrontendURL) != "" &&
		len(cfg.TokenEncryptionKey) == crypto.KeySize
}

func (cfg DriveAuthConfig) oauthClient() drive.OAuth {
	if cfg.OAuth != nil {
		return cfg.OAuth
	}
	return drive.NewGoogleOAuth(cfg.ClientID, cfg.ClientSecret, cfg.RedirectURL)
}

func (cfg DriveAuthConfig) storageClient() drive.Storage {
	if cfg.Storage != nil {
		return cfg.Storage
	}
	return drive.NewGoogleStorage(cfg.ClientID, cfg.ClientSecret)
}

func (cfg DriveAuthConfig) now() time.Time {
	if cfg.Now != nil {
		return cfg.Now()
	}
	return time.Now()
}

type DriveStatusData struct {
	Connected   bool       `json:"connected"`
	ConnectedAt *time.Time `json:"connected_at"`
	GoogleEmail *string    `json:"google_email"`
}

func MountDriveRoutes(
	engine *gin.Engine,
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) {
	api := engine.Group("/api/v1")
	{
		api.GET(
			"/users/me/drive/connect",
			middleware.AuthRequired(pool, cfg.JWTSecret),
			middleware.RequireRole("partner"),
			DriveConnect(pool, cfg),
		)
		api.GET(
			"/auth/google/drive/callback",
			DriveCallback(pool, cfg),
		)
		api.GET(
			"/users/me/drive",
			middleware.AuthRequired(pool, cfg.JWTSecret),
			middleware.RequireRole("partner"),
			GetDriveStatus(pool, cfg),
		)
		api.DELETE(
			"/users/me/drive",
			middleware.AuthRequired(pool, cfg.JWTSecret),
			middleware.RequireRole("partner"),
			DisconnectDrive(pool, cfg),
		)
		api.POST(
			"/invitations/:invitation_id/media",
			middleware.AuthRequired(pool, cfg.JWTSecret),
			middleware.RequireRole("partner"),
			UploadInvitationMedia(pool, cfg),
		)
	}
}

func SignDriveOAuthBind(
	bindKey []byte,
	userID int64,
	nonce string,
	expiresAt time.Time,
) (string, error) {
	if len(bindKey) != crypto.KeySize || userID <= 0 || strings.TrimSpace(nonce) == "" {
		return "", errors.New("invalid bind parameters")
	}

	payload := strconv.FormatInt(userID, 10) + "." + nonce + "." + strconv.FormatInt(expiresAt.Unix(), 10)
	mac := hmac.New(sha256.New, bindKey)
	_, _ = mac.Write([]byte(payload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return payload + "." + sig, nil
}

func verifyDriveOAuthBind(
	bindKey []byte,
	cookieValue string,
	expectedNonce string,
	now time.Time,
) (int64, error) {
	if len(bindKey) != crypto.KeySize {
		return 0, errors.New("invalid bind key")
	}

	parts := strings.Split(cookieValue, ".")
	if len(parts) != 4 {
		return 0, errors.New("malformed bind cookie")
	}

	payload := parts[0] + "." + parts[1] + "." + parts[2]
	sigBytes, err := base64.RawURLEncoding.DecodeString(parts[3])
	if err != nil {
		return 0, errors.New("invalid bind signature encoding")
	}

	mac := hmac.New(sha256.New, bindKey)
	_, _ = mac.Write([]byte(payload))
	expectedMAC := mac.Sum(nil)
	if !hmac.Equal(sigBytes, expectedMAC) {
		return 0, errors.New("bind signature mismatch")
	}

	userID, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || userID <= 0 {
		return 0, errors.New("invalid bind user id")
	}

	if parts[1] == "" || subtle.ConstantTimeCompare([]byte(parts[1]), []byte(expectedNonce)) != 1 {
		return 0, errors.New("bind nonce mismatch")
	}

	expUnix, err := strconv.ParseInt(parts[2], 10, 64)
	if err != nil || now.Unix() > expUnix {
		return 0, errors.New("bind cookie expired")
	}

	return userID, nil
}

func driveFrontendRedirectURL(frontendURL, status, reason string) string {
	base := strings.TrimRight(strings.TrimSpace(frontendURL), "/")
	target := base + "/drive/connected?status=" + url.QueryEscape(status)
	if reason != "" {
		target += "&reason=" + url.QueryEscape(reason)
	}
	return target
}

func DriveConnect(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.isConfigured() {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google Drive integration is not configured",
			})
			return
		}

		if pool == nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database is not configured",
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		var hasActiveEntitlement bool
		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT EXISTS (
				SELECT 1
				FROM invitation_addon_entitlements e
				JOIN invitations i ON i.id = e.invitation_id
				JOIN addons a ON a.id = e.addon_id
				WHERE i.user_id = $1
				  AND a.slug = $2
				  AND e.status = 'active'
				  AND (
					  e.expires_at IS NULL
					  OR e.expires_at > CURRENT_TIMESTAMP
				  )
			)`,
			userID,
			GoogleDriveAddonSlug,
		).Scan(&hasActiveEntitlement)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify Google Drive add-on entitlement",
			})
			return
		}

		if !hasActiveEntitlement {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "An active Google Drive add-on is required to connect Google Drive",
				"errors": gin.H{
					"addon": "addon_required",
				},
			})
			return
		}

		bindKey, err := crypto.DeriveOAuthBindKey(cfg.TokenEncryptionKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google Drive integration is not configured",
			})
			return
		}

		stateBytes := make([]byte, 32)
		if _, err := rand.Read(stateBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not initialize Google Drive connection",
			})
			return
		}
		state := base64.RawURLEncoding.EncodeToString(stateBytes)

		expiresAt := cfg.now().Add(googleDriveBindTTL)
		bindCookieVal, err := SignDriveOAuthBind(bindKey, userID, state, expiresAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not initialize Google Drive connection",
			})
			return
		}

		secureCookie := cfg.AppEnv == "production"
		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie(
			GoogleDriveStateCookie,
			state,
			googleDriveCookieMaxAge,
			"/",
			"",
			secureCookie,
			true,
		)
		c.SetCookie(
			GoogleDriveBindCookie,
			bindCookieVal,
			googleDriveCookieMaxAge,
			"/",
			"",
			secureCookie,
			true,
		)

		authURL := cfg.oauthClient().AuthCodeURL(state)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Google Drive authorization URL generated successfully",
			"data": gin.H{
				"auth_url": authURL,
			},
		})
	}
}

func DriveCallback(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		stateCookie, stateErr := c.Cookie(GoogleDriveStateCookie)
		bindCookie, bindErr := c.Cookie(GoogleDriveBindCookie)

		secureCookie := cfg.AppEnv == "production"
		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie(
			GoogleDriveStateCookie,
			"",
			-1,
			"/",
			"",
			secureCookie,
			true,
		)
		c.SetCookie(
			GoogleDriveBindCookie,
			"",
			-1,
			"/",
			"",
			secureCookie,
			true,
		)

		if !cfg.isConfigured() {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "not_configured"),
			)
			return
		}

		bindKey, err := crypto.DeriveOAuthBindKey(cfg.TokenEncryptionKey)
		if err != nil {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "not_configured"),
			)
			return
		}

		stateQuery := c.Query("state")
		if stateErr != nil ||
			stateCookie == "" ||
			stateQuery == "" ||
			subtle.ConstantTimeCompare([]byte(stateCookie), []byte(stateQuery)) != 1 {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "invalid_state"),
			)
			return
		}

		if bindErr != nil || bindCookie == "" {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "invalid_state"),
			)
			return
		}

		userID, err := verifyDriveOAuthBind(bindKey, bindCookie, stateCookie, cfg.now())
		if err != nil {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "invalid_state"),
			)
			return
		}

		if c.Query("error") != "" {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "denied"),
			)
			return
		}

		code := strings.TrimSpace(c.Query("code"))
		if code == "" {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "missing_code"),
			)
			return
		}

		ctx := c.Request.Context()
		oauthClient := cfg.oauthClient()

		token, err := oauthClient.Exchange(ctx, code)
		if err != nil || token == nil {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "exchange_failed"),
			)
			return
		}

		refreshToken := strings.TrimSpace(token.RefreshToken)
		if refreshToken == "" {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "no_refresh_token"),
			)
			return
		}

		identity, err := oauthClient.VerifyIDToken(ctx, token)
		if err != nil ||
			identity == nil ||
			strings.TrimSpace(identity.Sub) == "" ||
			strings.TrimSpace(identity.Email) == "" {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "exchange_failed"),
			)
			return
		}

		encryptedRefreshToken, err := crypto.Encrypt(cfg.TokenEncryptionKey, []byte(refreshToken))
		if err != nil {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "exchange_failed"),
			)
			return
		}

		tag, err := pool.Exec(
			ctx,
			`INSERT INTO user_drive_credentials (
				user_id,
				google_sub,
				google_email,
				encrypted_refresh_token,
				scopes,
				status,
				connected_at,
				updated_at
			)
			SELECT
				u.id,
				$2,
				$3,
				$4,
				$5,
				'connected',
				CURRENT_TIMESTAMP,
				CURRENT_TIMESTAMP
			FROM users u
			WHERE u.id = $1
			  AND u.role = 'partner'
			  AND u.status = 'active'
			ON CONFLICT (user_id) DO UPDATE SET
				google_sub = EXCLUDED.google_sub,
				google_email = EXCLUDED.google_email,
				encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
				scopes = EXCLUDED.scopes,
				status = 'connected',
				connected_at = CURRENT_TIMESTAMP,
				updated_at = CURRENT_TIMESTAMP`,
			userID,
			strings.TrimSpace(identity.Sub),
			strings.TrimSpace(identity.Email),
			encryptedRefreshToken,
			drive.DefaultScopesString(),
		)
		if err != nil || tag.RowsAffected() == 0 {
			c.Redirect(
				http.StatusFound,
				driveFrontendRedirectURL(cfg.FrontendURL, "error", "exchange_failed"),
			)
			return
		}

		c.Redirect(
			http.StatusFound,
			driveFrontendRedirectURL(cfg.FrontendURL, "connected", ""),
		)
	}
}

func GetDriveStatus(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.isConfigured() {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google Drive integration is not configured",
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		var (
			googleEmail *string
			status      string
			connectedAt time.Time
		)

		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT google_email, status, connected_at
			 FROM user_drive_credentials
			 WHERE user_id = $1`,
			userID,
		).Scan(&googleEmail, &status, &connectedAt)

		if errors.Is(err, pgx.ErrNoRows) || (err == nil && status != "connected") {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Google Drive connection status retrieved successfully",
				"data": DriveStatusData{
					Connected:   false,
					ConnectedAt: nil,
					GoogleEmail: nil,
				},
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve Google Drive status",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Google Drive connection status retrieved successfully",
			"data": DriveStatusData{
				Connected:   true,
				ConnectedAt: &connectedAt,
				GoogleEmail: googleEmail,
			},
		})
	}
}

func DisconnectDrive(
	pool *pgxpool.Pool,
	cfg DriveAuthConfig,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.isConfigured() {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Google Drive integration is not configured",
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		ctx := c.Request.Context()

		var encryptedToken []byte
		err := pool.QueryRow(
			ctx,
			`SELECT encrypted_refresh_token
			 FROM user_drive_credentials
			 WHERE user_id = $1`,
			userID,
		).Scan(&encryptedToken)

		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not disconnect Google Drive",
			})
			return
		}

		if err == nil {
			if len(encryptedToken) > 0 {
				plaintext, decErr := crypto.Decrypt(cfg.TokenEncryptionKey, encryptedToken)
				if decErr == nil && len(plaintext) > 0 {
					_ = cfg.oauthClient().Revoke(ctx, string(plaintext))
					for i := range plaintext {
						plaintext[i] = 0
					}
				}
			}

			if _, delErr := pool.Exec(
				ctx,
				`DELETE FROM user_drive_credentials WHERE user_id = $1`,
				userID,
			); delErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not disconnect Google Drive",
				})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Google Drive disconnected successfully",
			"data": gin.H{
				"connected": false,
			},
		})
	}
}
