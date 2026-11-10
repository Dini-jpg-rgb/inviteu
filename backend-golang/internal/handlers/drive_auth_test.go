package handlers_test

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"backend-golang/internal/config"
	"backend-golang/internal/crypto"
	"backend-golang/internal/drive"
	"backend-golang/internal/handlers"
	"backend-golang/internal/middleware"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/oauth2"
)

const driveTestFrontendURL = "https://app.inviteu.test"

type driveTestFixture struct {
	marker            string
	partnerA          int64
	partnerB          int64
	designerUser      int64
	adminUser         int64
	categoryID        int64
	templateID        int64
	invitationA       int64
	invitationB       int64
	driveAddonID      int64
	createdDriveAddon bool
	orderSeq          int64
}

func generateDriveTestKey(t *testing.T) []byte {
	t.Helper()
	key := make([]byte, crypto.KeySize)
	if _, err := rand.Read(key); err != nil {
		t.Fatalf("generate 32-byte key: %v", err)
	}
	return key
}

func setupDriveTestEngine(
	pool *pgxpool.Pool,
	driveCfg handlers.DriveAuthConfig,
) *gin.Engine {
	gin.SetMode(gin.TestMode)
	engine := router.SetupRouter(
		pool,
		templateFavoritesTestJWTSecret,
		"test",
		handlers.GoogleAuthConfig{},
		(*payment.MidtransClient)(nil),
	)
	handlers.MountDriveRoutes(engine, pool, driveCfg)
	return engine
}

func defaultDriveTestConfig(
	key []byte,
	fakeOAuth *drive.FakeOAuth,
) handlers.DriveAuthConfig {
	return handlers.DriveAuthConfig{
		ClientID:           "drive-test-client-id",
		ClientSecret:       "drive-test-client-secret",
		RedirectURL:        "http://localhost:8080/api/v1/auth/google/drive/callback",
		FrontendURL:        driveTestFrontendURL,
		TokenEncryptionKey: key,
		JWTSecret:          templateFavoritesTestJWTSecret,
		AppEnv:             "test",
		OAuth:              fakeOAuth,
	}
}

func createDriveTestFixture(t *testing.T, pool *pgxpool.Pool) *driveTestFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "drive-" + hex.EncodeToString(randomBytes)
	fixture := &driveTestFixture{marker: marker}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{
			fixture.partnerA,
			fixture.partnerB,
			fixture.designerUser,
			fixture.adminUser,
		}
		invitationIDs := []int64{
			fixture.invitationA,
			fixture.invitationB,
		}

		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM invitation_addon_entitlements WHERE invitation_id = ANY($1)`,
			invitationIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM order_items WHERE order_id IN (
				SELECT id FROM orders WHERE user_id = ANY($1)
			)`,
			userIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM orders WHERE user_id = ANY($1)`,
			userIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM invitations WHERE id = ANY($1)`,
			invitationIDs,
		)
		if fixture.templateID > 0 {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM templates WHERE id = $1`, fixture.templateID)
		}
		if fixture.categoryID > 0 {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM template_categories WHERE id = $1`, fixture.categoryID)
		}
		if fixture.createdDriveAddon && fixture.driveAddonID > 0 {
			_, _ = pool.Exec(
				cleanupCtx,
				`DELETE FROM addons
				 WHERE id = $1
				   AND NOT EXISTS (SELECT 1 FROM invitation_addon_entitlements WHERE addon_id = $1)
				   AND NOT EXISTS (SELECT 1 FROM invitation_version_addons WHERE addon_id = $1)`,
				fixture.driveAddonID,
			)
		}
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM user_drive_credentials WHERE user_id = ANY($1)`,
			userIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM users WHERE id = ANY($1)`,
			userIDs,
		)
	})

	ctx := context.Background()
	insertUser := func(name, email, role string) int64 {
		var uid int64
		err := pool.QueryRow(
			ctx,
			`INSERT INTO users (name, email, role, status)
			 VALUES ($1, $2, $3, 'active')
			 RETURNING id`,
			marker+" "+name,
			marker+"-"+email,
			role,
		).Scan(&uid)
		if err != nil {
			t.Fatalf("insert fixture user %s: %v", name, err)
		}
		return uid
	}

	fixture.partnerA = insertUser("Partner A", "partner-a@example.test", "partner")
	fixture.partnerB = insertUser("Partner B", "partner-b@example.test", "partner")
	fixture.designerUser = insertUser("Designer", "designer@example.test", "designer")
	fixture.adminUser = insertUser("Admin", "admin@example.test", "admin")

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO template_categories (name, slug, description)
		 VALUES ($1, $2, 'Drive test category')
		 RETURNING id`,
		marker+" Category",
		marker+"-cat",
	).Scan(&fixture.categoryID); err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		 VALUES ($1, $2, $3, $4, 'Drive template', 100000, 'publish')
		 RETURNING id`,
		fixture.categoryID,
		fixture.designerUser,
		marker+" Template",
		marker+"-tmpl",
	).Scan(&fixture.templateID); err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO invitations (user_id, template_id, title, slug, status)
		 VALUES ($1, $2, 'Partner A Invitation', $3, 'draft')
		 RETURNING id`,
		fixture.partnerA,
		fixture.templateID,
		marker+"-inv-a",
	).Scan(&fixture.invitationA); err != nil {
		t.Fatalf("insert partner A invitation: %v", err)
	}

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO invitations (user_id, template_id, title, slug, status)
		 VALUES ($1, $2, 'Partner B Invitation', $3, 'draft')
		 RETURNING id`,
		fixture.partnerB,
		fixture.templateID,
		marker+"-inv-b",
	).Scan(&fixture.invitationB); err != nil {
		t.Fatalf("insert partner B invitation: %v", err)
	}

	// Lookup existing google-drive-connect addon first; never delete seed rows belonging to others.
	err := pool.QueryRow(
		ctx,
		`SELECT id FROM addons WHERE slug = $1`,
		handlers.GoogleDriveAddonSlug,
	).Scan(&fixture.driveAddonID)
	if errors.Is(err, pgx.ErrNoRows) {
		err = pool.QueryRow(
			ctx,
			`INSERT INTO addons (name, slug, description, addon_type, price, billing_type, status, sort_order)
			 VALUES ('Google Drive Connect', $1, 'Test fixture addon', 'storage', 50000, 'one_time', 'active', 0)
			 ON CONFLICT (slug) DO NOTHING
			 RETURNING id`,
			handlers.GoogleDriveAddonSlug,
		).Scan(&fixture.driveAddonID)
		if err == nil {
			fixture.createdDriveAddon = true
		} else if errors.Is(err, pgx.ErrNoRows) {
			err = pool.QueryRow(
				ctx,
				`SELECT id FROM addons WHERE slug = $1`,
				handlers.GoogleDriveAddonSlug,
			).Scan(&fixture.driveAddonID)
		}
	}
	if err != nil {
		t.Fatalf("resolve google-drive-connect addon: %v", err)
	}

	return fixture
}

func (f *driveTestFixture) insertEntitlement(
	t *testing.T,
	pool *pgxpool.Pool,
	userID int64,
	invitationID int64,
	status string,
	intervalExpr string,
) int64 {
	t.Helper()
	ctx := context.Background()
	seq := atomic.AddInt64(&f.orderSeq, 1)
	orderNum := fmt.Sprintf("ORD-%s-%d", strings.ToUpper(f.marker), seq)

	var orderID int64
	if err := pool.QueryRow(
		ctx,
		`INSERT INTO orders (user_id, order_number, subtotal, discount, total, status)
		 VALUES ($1, $2, 50000, 0, 50000, 'paid')
		 RETURNING id`,
		userID,
		orderNum,
	).Scan(&orderID); err != nil {
		t.Fatalf("insert fixture order: %v", err)
	}

	var orderItemID int64
	if err := pool.QueryRow(
		ctx,
		`INSERT INTO order_items (
			order_id, item_type, item_reference_id, item_name, quantity, unit_price, subtotal, invitation_id
		 )
		 VALUES ($1, 'addon', $2, 'Google Drive Connect', 1, 50000, 50000, $3)
		 RETURNING id`,
		orderID,
		f.driveAddonID,
		invitationID,
	).Scan(&orderItemID); err != nil {
		t.Fatalf("insert fixture order_item: %v", err)
	}

	var entitlementID int64
	var err error
	if intervalExpr == "" {
		err = pool.QueryRow(
			ctx,
			`INSERT INTO invitation_addon_entitlements (
				invitation_id, addon_id, order_item_id, status, expires_at
			 )
			 VALUES ($1, $2, $3, $4, NULL)
			 RETURNING id`,
			invitationID,
			f.driveAddonID,
			orderItemID,
			status,
		).Scan(&entitlementID)
	} else {
		err = pool.QueryRow(
			ctx,
			`INSERT INTO invitation_addon_entitlements (
				invitation_id, addon_id, order_item_id, status, expires_at
			 )
			 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + ($5::interval))
			 RETURNING id`,
			invitationID,
			f.driveAddonID,
			orderItemID,
			status,
			intervalExpr,
		).Scan(&entitlementID)
	}
	if err != nil {
		t.Fatalf("insert fixture invitation_addon_entitlement: %v", err)
	}
	return entitlementID
}

func (f *driveTestFixture) clearEntitlements(t *testing.T, pool *pgxpool.Pool, invitationID int64) {
	t.Helper()
	if _, err := pool.Exec(
		context.Background(),
		`DELETE FROM invitation_addon_entitlements WHERE invitation_id = $1`,
		invitationID,
	); err != nil {
		t.Fatalf("clear entitlements for invitation %d: %v", invitationID, err)
	}
}

func findCookie(cookies []*http.Cookie, name string) *http.Cookie {
	for _, ck := range cookies {
		if ck.Name == name {
			return ck
		}
	}
	return nil
}

func performCallbackRequest(
	engine http.Handler,
	rawQuery string,
	cookies ...*http.Cookie,
) *httptest.ResponseRecorder {
	path := "/api/v1/auth/google/drive/callback"
	if rawQuery != "" {
		path += "?" + rawQuery
	}
	req := httptest.NewRequest(http.MethodGet, path, nil)
	for _, ck := range cookies {
		if ck != nil {
			req.AddCookie(ck)
		}
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func TestDriveAuth_UnitAndValidation(t *testing.T) {
	key := generateDriveTestKey(t)
	fakeOAuth := &drive.FakeOAuth{
		ExchangeToken: &oauth2.Token{
			AccessToken:  "fake-access-token",
			RefreshToken: "fake-refresh-token",
		},
		Identity: &drive.Identity{
			Sub:   "google-sub-123",
			Email: "partner@example.test",
		},
	}
	driveCfg := defaultDriveTestConfig(key, fakeOAuth)
	engine := setupDriveTestEngine(nil, driveCfg)

	t.Run("tanpa_jwt_401", func(t *testing.T) {
		endpoints := []struct {
			method string
			path   string
		}{
			{method: http.MethodGet, path: "/api/v1/users/me/drive/connect"},
			{method: http.MethodGet, path: "/api/v1/users/me/drive"},
			{method: http.MethodDelete, path: "/api/v1/users/me/drive"},
		}
		for _, ep := range endpoints {
			resp := templateFavoritesRequest(engine, ep.method, ep.path, "", "")
			if resp.Code != http.StatusUnauthorized {
				t.Errorf("%s %s without JWT: expected 401, got %d", ep.method, ep.path, resp.Code)
			}
		}
	})

	t.Run("connect_tanpa_pool_500", func(t *testing.T) {
		r := gin.New()
		r.GET("/api/v1/users/me/drive/connect", func(c *gin.Context) {
			c.Set(middleware.UserIDKey, int64(42))
			c.Set(middleware.UserRoleKey, "partner")
			c.Next()
		}, handlers.DriveConnect(nil, driveCfg))

		resp := templateFavoritesRequest(r, http.MethodGet, "/api/v1/users/me/drive/connect", "", "")
		if resp.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500 Internal Server Error when pool is nil, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("not_configured_500_dan_callback_redirect_not_configured", func(t *testing.T) {
		unconfigured := handlers.DriveAuthConfig{
			FrontendURL: driveTestFrontendURL,
			JWTSecret:   templateFavoritesTestJWTSecret,
			AppEnv:      "test",
		}
		r := gin.New()
		withPartner := func(c *gin.Context) {
			c.Set(middleware.UserIDKey, int64(42))
			c.Set(middleware.UserRoleKey, "partner")
			c.Next()
		}
		r.GET("/api/v1/users/me/drive/connect", withPartner, handlers.DriveConnect(nil, unconfigured))
		r.GET("/api/v1/users/me/drive", withPartner, handlers.GetDriveStatus(nil, unconfigured))
		r.DELETE("/api/v1/users/me/drive", withPartner, handlers.DisconnectDrive(nil, unconfigured))
		r.GET("/api/v1/auth/google/drive/callback", handlers.DriveCallback(nil, unconfigured))

		for _, ep := range []struct {
			method string
			path   string
		}{
			{http.MethodGet, "/api/v1/users/me/drive/connect"},
			{http.MethodGet, "/api/v1/users/me/drive"},
			{http.MethodDelete, "/api/v1/users/me/drive"},
		} {
			resp := templateFavoritesRequest(r, ep.method, ep.path, "", "")
			if resp.Code != http.StatusInternalServerError || !strings.Contains(resp.Body.String(), "not configured") {
				t.Errorf("%s %s: expected 500 not configured, got %d: %s", ep.method, ep.path, resp.Code, resp.Body.String())
			}
		}

		cbResp := performCallbackRequest(r, "state=abc&code=def")
		if cbResp.Code != http.StatusFound || cbResp.Header().Get("Location") != driveTestFrontendURL+"/drive/connected?status=error&reason=not_configured" {
			t.Errorf("expected 302 not_configured, got %d %s", cbResp.Code, cbResp.Header().Get("Location"))
		}
	})

	t.Run("kunci_enkripsi_bukan_32_byte_ditolak_di_config", func(t *testing.T) {
		if got, err := config.ParseTokenEncryptionKey(""); err != nil || got != nil {
			t.Fatalf("expected empty key to return nil, nil; got %v, %v", got, err)
		}

		shortKey := base64.StdEncoding.EncodeToString([]byte("16-byte-key-here"))
		if _, err := config.ParseTokenEncryptionKey(shortKey); err == nil {
			t.Fatal("expected error for 16-byte key")
		} else if strings.Contains(err.Error(), shortKey) {
			t.Fatalf("error leaked raw key value: %v", err)
		}

		validRaw := generateDriveTestKey(t)
		validB64 := base64.StdEncoding.EncodeToString(validRaw)
		parsed, err := config.ParseTokenEncryptionKey(validB64)
		if err != nil || !bytes.Equal(parsed, validRaw) {
			t.Fatalf("expected valid 32-byte key to parse cleanly, err=%v", err)
		}
	})

	t.Run("callback_state_dan_bind_invalid_tanpa_db", func(t *testing.T) {
		bindKey, err := crypto.DeriveOAuthBindKey(key)
		if err != nil {
			t.Fatalf("derive bind key: %v", err)
		}
		stateA := "nonce-state-user-a"
		validBindA, err := handlers.SignDriveOAuthBind(
			bindKey,
			101,
			stateA,
			time.Now().Add(10*time.Minute),
		)
		if err != nil {
			t.Fatalf("sign bind A: %v", err)
		}
		expiredBindA, err := handlers.SignDriveOAuthBind(
			bindKey,
			101,
			stateA,
			time.Now().Add(-1*time.Minute),
		)
		if err != nil {
			t.Fatalf("sign expired bind A: %v", err)
		}

		cases := []struct {
			name       string
			query      string
			cookies    []*http.Cookie
			wantReason string
		}{
			{
				name:  "missing_state_cookie",
				query: "state=" + stateA + "&code=auth-code",
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveBindCookie, Value: validBindA},
				},
				wantReason: "invalid_state",
			},
			{
				name:  "wrong_state_query",
				query: "state=wrong-state&code=auth-code",
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveStateCookie, Value: stateA},
					{Name: handlers.GoogleDriveBindCookie, Value: validBindA},
				},
				wantReason: "invalid_state",
			},
			{
				name:  "missing_bind_cookie",
				query: "state=" + stateA + "&code=auth-code",
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveStateCookie, Value: stateA},
				},
				wantReason: "invalid_state",
			},
			{
				name:  "corrupted_bind_hmac",
				query: "state=" + stateA + "&code=auth-code",
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveStateCookie, Value: stateA},
					{Name: handlers.GoogleDriveBindCookie, Value: validBindA + "tampered"},
				},
				wantReason: "invalid_state",
			},
			{
				name:  "expired_bind_cookie",
				query: "state=" + stateA + "&code=auth-code",
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveStateCookie, Value: stateA},
					{Name: handlers.GoogleDriveBindCookie, Value: expiredBindA},
				},
				wantReason: "invalid_state",
			},
			{
				name:  "bind_user_a_cannot_pair_with_state_b",
				query: "state=nonce-state-user-b&code=auth-code",
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveStateCookie, Value: "nonce-state-user-b"},
					{Name: handlers.GoogleDriveBindCookie, Value: validBindA},
				},
				wantReason: "invalid_state",
			},
			{
				name:  "google_denied",
				query: "state=" + stateA + "&error=access_denied",
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveStateCookie, Value: stateA},
					{Name: handlers.GoogleDriveBindCookie, Value: validBindA},
				},
				wantReason: "denied",
			},
			{
				name:  "missing_code",
				query: "state=" + stateA,
				cookies: []*http.Cookie{
					{Name: handlers.GoogleDriveStateCookie, Value: stateA},
					{Name: handlers.GoogleDriveBindCookie, Value: validBindA},
				},
				wantReason: "missing_code",
			},
		}

		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				rec := performCallbackRequest(engine, tc.query, tc.cookies...)
				if rec.Code != http.StatusFound {
					t.Fatalf("expected 302 Found, got %d", rec.Code)
				}
				loc := rec.Header().Get("Location")
				wantLoc := driveTestFrontendURL + "/drive/connected?status=error&reason=" + tc.wantReason
				if loc != wantLoc {
					t.Errorf("expected redirect %q, got %q", wantLoc, loc)
				}

				res := rec.Result()
				defer res.Body.Close()
				stateCk := findCookie(res.Cookies(), handlers.GoogleDriveStateCookie)
				bindCk := findCookie(res.Cookies(), handlers.GoogleDriveBindCookie)
				if stateCk == nil || stateCk.MaxAge >= 0 {
					t.Errorf("expected state cookie to be cleared, got %+v", stateCk)
				}
				if bindCk == nil || bindCk.MaxAge >= 0 {
					t.Errorf("expected bind cookie to be cleared, got %+v", bindCk)
				}
			})
		}
	})

	t.Run("exchange_tanpa_refresh_token_redirect_no_refresh_token", func(t *testing.T) {
		noRefreshFake := &drive.FakeOAuth{
			ExchangeToken: &oauth2.Token{
				AccessToken:  "access-only-no-refresh",
				RefreshToken: "",
			},
			Identity: &drive.Identity{
				Sub:   "sub-1",
				Email: "partner@example.test",
			},
		}
		eng := setupDriveTestEngine(nil, defaultDriveTestConfig(key, noRefreshFake))

		bindKey, _ := crypto.DeriveOAuthBindKey(key)
		state := "state-no-refresh"
		bindVal, _ := handlers.SignDriveOAuthBind(bindKey, 101, state, time.Now().Add(10*time.Minute))

		rec := performCallbackRequest(
			eng,
			"state="+state+"&code=valid-code",
			&http.Cookie{Name: handlers.GoogleDriveStateCookie, Value: state},
			&http.Cookie{Name: handlers.GoogleDriveBindCookie, Value: bindVal},
		)
		if rec.Code != http.StatusFound {
			t.Fatalf("expected 302 Found, got %d", rec.Code)
		}
		wantLoc := driveTestFrontendURL + "/drive/connected?status=error&reason=no_refresh_token"
		if got := rec.Header().Get("Location"); got != wantLoc {
			t.Fatalf("expected redirect %q, got %q", wantLoc, got)
		}
	})
}

func assertAddonRequired403(t *testing.T, resp *httptest.ResponseRecorder) {
	t.Helper()
	if resp.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden, got %d: %s", resp.Code, resp.Body.String())
	}
	var body struct {
		Success bool              `json:"success"`
		Message string            `json:"message"`
		Errors  map[string]string `json:"errors"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal 403 response: %v", err)
	}
	if body.Success {
		t.Fatalf("expected success=false, got true")
	}
	if body.Errors["addon"] != "addon_required" {
		t.Fatalf("expected errors.addon=\"addon_required\", got %+v", body.Errors)
	}
}

func TestDriveAuth_Integration(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createDriveTestFixture(t, pool)

	key := generateDriveTestKey(t)
	otherKey := generateDriveTestKey(t)

	fakeOAuth := &drive.FakeOAuth{
		ClientID:     "drive-test-client-id",
		ClientSecret: "drive-test-client-secret",
		RedirectURL:  "http://localhost:8080/api/v1/auth/google/drive/callback",
		ExchangeToken: &oauth2.Token{
			AccessToken:  "initial-access-token-secret",
			RefreshToken: "1//initial-refresh-token-secret-value",
		},
		Identity: &drive.Identity{
			Sub:   "google-sub-partner-a-1",
			Email: "partner.a.drive@gmail.com",
		},
	}

	driveCfg := defaultDriveTestConfig(key, fakeOAuth)
	engine := setupDriveTestEngine(pool, driveCfg)

	tokenPartnerA := templateFavoritesToken(t, fixture.partnerA)
	tokenPartnerB := templateFavoritesToken(t, fixture.partnerB)
	tokenDesigner := templateFavoritesToken(t, fixture.designerUser)
	tokenAdmin := templateFavoritesToken(t, fixture.adminUser)

	countCredentials := func(t *testing.T, userID int64) int {
		t.Helper()
		var count int
		err := pool.QueryRow(
			context.Background(),
			`SELECT COUNT(*) FROM user_drive_credentials WHERE user_id = $1`,
			userID,
		).Scan(&count)
		if err != nil {
			t.Fatalf("count user_drive_credentials for user %d: %v", userID, err)
		}
		return count
	}

	t.Run("tanpa_jwt_401_dan_bukan_partner_403", func(t *testing.T) {
		endpoints := []struct {
			method string
			path   string
		}{
			{method: http.MethodGet, path: "/api/v1/users/me/drive/connect"},
			{method: http.MethodGet, path: "/api/v1/users/me/drive"},
			{method: http.MethodDelete, path: "/api/v1/users/me/drive"},
		}

		for _, ep := range endpoints {
			resp := templateFavoritesRequest(engine, ep.method, ep.path, "", "")
			if resp.Code != http.StatusUnauthorized {
				t.Errorf("%s %s without token: expected 401, got %d", ep.method, ep.path, resp.Code)
			}

			respDesigner := templateFavoritesRequest(engine, ep.method, ep.path, "", tokenDesigner)
			if respDesigner.Code != http.StatusForbidden {
				t.Errorf("%s %s with designer role: expected 403, got %d", ep.method, ep.path, respDesigner.Code)
			}

			respAdmin := templateFavoritesRequest(engine, ep.method, ep.path, "", tokenAdmin)
			if respAdmin.Code != http.StatusForbidden {
				t.Errorf("%s %s with admin role: expected 403, got %d", ep.method, ep.path, respAdmin.Code)
			}
		}
	})

	t.Run("gate_addon_entitlement_connect", func(t *testing.T) {
		// 1. Tanpa entitlement -> 403 addon_required
		fixture.clearEntitlements(t, pool, fixture.invitationA)
		fixture.clearEntitlements(t, pool, fixture.invitationB)
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		assertAddonRequired403(t, resp)

		// 2. Entitlement expired (status='active', expires_at di masa lalu) -> 403 addon_required
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA, "active", "-1 hour")
		resp = templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		assertAddonRequired403(t, resp)

		// 3. Entitlement revoked -> 403 addon_required
		fixture.clearEntitlements(t, pool, fixture.invitationA)
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA, "revoked", "7 days")
		resp = templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		assertAddonRequired403(t, resp)

		// 4. Partner A tidak bisa memakai entitlement milik undangan Partner B -> 403 addon_required
		fixture.clearEntitlements(t, pool, fixture.invitationA)
		fixture.clearEntitlements(t, pool, fixture.invitationB)
		fixture.insertEntitlement(t, pool, fixture.partnerB, fixture.invitationB, "active", "")
		resp = templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		assertAddonRequired403(t, resp)

		// 5. Entitlement aktif dengan expires_at di masa depan -> 200 OK
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA, "active", "7 days")
		resp = templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK with future expires_at, got %d: %s", resp.Code, resp.Body.String())
		}

		// 6. Entitlement aktif dengan expires_at NULL -> 200 OK
		fixture.clearEntitlements(t, pool, fixture.invitationA)
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA, "active", "")
		resp = templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK with NULL expires_at, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("get_status_belum_terhubung", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive", "", tokenPartnerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Success bool                     `json:"success"`
			Data    handlers.DriveStatusData `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal status response: %v", err)
		}
		if !body.Success || body.Data.Connected {
			t.Fatalf("expected connected=false, got %+v", body)
		}
		if body.Data.ConnectedAt != nil || body.Data.GoogleEmail != nil {
			t.Fatalf("expected nil connected_at and google_email when disconnected, got %+v", body.Data)
		}
	})

	t.Run("connect_200_auth_url_dan_set_cookie_kedua_cookie", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Success bool `json:"success"`
			Data    struct {
				AuthURL string `json:"auth_url"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal connect response: %v", err)
		}
		if !body.Success || body.Data.AuthURL == "" {
			t.Fatalf("expected non-empty auth_url, got %+v", body)
		}

		parsedURL, err := url.Parse(body.Data.AuthURL)
		if err != nil {
			t.Fatalf("parse auth_url: %v", err)
		}
		q := parsedURL.Query()
		if q.Get("access_type") != "offline" {
			t.Errorf("expected access_type=offline, got %q", q.Get("access_type"))
		}
		if q.Get("prompt") != "consent" {
			t.Errorf("expected prompt=consent, got %q", q.Get("prompt"))
		}
		scopeParam := q.Get("scope")
		for _, requiredScope := range []string{
			"openid",
			"email",
			"https://www.googleapis.com/auth/drive.file",
		} {
			if !strings.Contains(scopeParam, requiredScope) {
				t.Errorf("expected scope %q in %q", requiredScope, scopeParam)
			}
		}

		res := resp.Result()
		defer res.Body.Close()
		stateCk := findCookie(res.Cookies(), handlers.GoogleDriveStateCookie)
		bindCk := findCookie(res.Cookies(), handlers.GoogleDriveBindCookie)
		if stateCk == nil {
			t.Fatal("missing google_drive_oauth_state cookie")
		}
		if bindCk == nil {
			t.Fatal("missing google_drive_oauth_bind cookie")
		}
		for _, ck := range []*http.Cookie{stateCk, bindCk} {
			if !ck.HttpOnly {
				t.Errorf("cookie %s must be HttpOnly", ck.Name)
			}
			if ck.SameSite != http.SameSiteLaxMode {
				t.Errorf("cookie %s must have SameSite=Lax, got %v", ck.Name, ck.SameSite)
			}
			if ck.Path != "/" {
				t.Errorf("cookie %s must have Path=/, got %q", ck.Name, ck.Path)
			}
			if ck.MaxAge != 600 {
				t.Errorf("cookie %s must have MaxAge=600, got %d", ck.Name, ck.MaxAge)
			}
		}
		if q.Get("state") != stateCk.Value {
			t.Errorf("auth_url state %q does not match state cookie %q", q.Get("state"), stateCk.Value)
		}
	})

	t.Run("state_atau_bind_salah_dan_exchange_tanpa_refresh_token_tanpa_baris", func(t *testing.T) {
		connectResp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		res := connectResp.Result()
		defer res.Body.Close()
		stateCk := findCookie(res.Cookies(), handlers.GoogleDriveStateCookie)
		bindCk := findCookie(res.Cookies(), handlers.GoogleDriveBindCookie)

		// 1. Wrong state
		rec := performCallbackRequest(engine, "state=wrong-state&code=code1", stateCk, bindCk)
		if rec.Code != http.StatusFound || !strings.Contains(rec.Header().Get("Location"), "reason=invalid_state") {
			t.Fatalf("expected 302 invalid_state for wrong state, got %d %s", rec.Code, rec.Header().Get("Location"))
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected 0 rows after wrong state, got %d", got)
		}

		// 2. Missing state cookie
		rec = performCallbackRequest(engine, "state="+stateCk.Value+"&code=code1", bindCk)
		if rec.Code != http.StatusFound || !strings.Contains(rec.Header().Get("Location"), "reason=invalid_state") {
			t.Fatalf("expected 302 invalid_state for missing state cookie, got %d %s", rec.Code, rec.Header().Get("Location"))
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected 0 rows after missing state cookie, got %d", got)
		}

		// 3. Missing bind cookie
		rec = performCallbackRequest(engine, "state="+stateCk.Value+"&code=code1", stateCk)
		if rec.Code != http.StatusFound || !strings.Contains(rec.Header().Get("Location"), "reason=invalid_state") {
			t.Fatalf("expected 302 invalid_state for missing bind cookie, got %d %s", rec.Code, rec.Header().Get("Location"))
		}

		// 4. Corrupted bind HMAC
		badBind := *bindCk
		badBind.Value = bindCk.Value + "corrupt"
		rec = performCallbackRequest(engine, "state="+stateCk.Value+"&code=code1", stateCk, &badBind)
		if rec.Code != http.StatusFound || !strings.Contains(rec.Header().Get("Location"), "reason=invalid_state") {
			t.Fatalf("expected 302 invalid_state for corrupted bind cookie, got %d %s", rec.Code, rec.Header().Get("Location"))
		}

		// 5. Expired bind cookie
		bindKey, _ := crypto.DeriveOAuthBindKey(key)
		expiredVal, _ := handlers.SignDriveOAuthBind(bindKey, fixture.partnerA, stateCk.Value, time.Now().Add(-5*time.Minute))
		expiredCk := &http.Cookie{Name: handlers.GoogleDriveBindCookie, Value: expiredVal}
		rec = performCallbackRequest(engine, "state="+stateCk.Value+"&code=code1", stateCk, expiredCk)
		if rec.Code != http.StatusFound || !strings.Contains(rec.Header().Get("Location"), "reason=invalid_state") {
			t.Fatalf("expected 302 invalid_state for expired bind cookie, got %d %s", rec.Code, rec.Header().Get("Location"))
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected 0 rows after expired bind cookie, got %d", got)
		}

		// 6. Cookie bind user A cannot link to user B
		connectRespB := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerB)
		resB := connectRespB.Result()
		defer resB.Body.Close()
		stateCkB := findCookie(resB.Cookies(), handlers.GoogleDriveStateCookie)

		rec = performCallbackRequest(engine, "state="+stateCkB.Value+"&code=code1", stateCkB, bindCk)
		if rec.Code != http.StatusFound || !strings.Contains(rec.Header().Get("Location"), "reason=invalid_state") {
			t.Fatalf("expected 302 invalid_state when pairing user A bind with user B state, got %d %s", rec.Code, rec.Header().Get("Location"))
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected 0 rows for partner A, got %d", got)
		}
		if got := countCredentials(t, fixture.partnerB); got != 0 {
			t.Fatalf("expected 0 rows for partner B, got %d", got)
		}

		// 7. Exchange without refresh token -> no row written
		fakeOAuth.ExchangeToken = &oauth2.Token{
			AccessToken:  "only-access-token",
			RefreshToken: "",
		}
		rec = performCallbackRequest(engine, "state="+stateCk.Value+"&code=code-no-rt", stateCk, bindCk)
		if rec.Code != http.StatusFound || !strings.Contains(rec.Header().Get("Location"), "reason=no_refresh_token") {
			t.Fatalf("expected 302 no_refresh_token, got %d %s", rec.Code, rec.Header().Get("Location"))
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected 0 rows when refresh token is missing, got %d", got)
		}
	})

	t.Run("callback_sukses_enkripsi_db_status_true_dan_user_id_query_diabaikan", func(t *testing.T) {
		plaintextRT := "1//0g-partner-a-first-secret-refresh-token"
		fakeOAuth.ExchangeToken = &oauth2.Token{
			AccessToken:  "access-token-1",
			RefreshToken: plaintextRT,
		}
		fakeOAuth.Identity = &drive.Identity{
			Sub:   "google-sub-partner-a-1",
			Email: "partner.a.first@gmail.com",
		}

		connectResp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		res := connectResp.Result()
		defer res.Body.Close()
		stateCk := findCookie(res.Cookies(), handlers.GoogleDriveStateCookie)
		bindCk := findCookie(res.Cookies(), handlers.GoogleDriveBindCookie)

		// Pass user_id of partnerB in query string to verify it is ignored
		query := fmt.Sprintf("state=%s&code=valid-code-1&user_id=%d", url.QueryEscape(stateCk.Value), fixture.partnerB)
		rec := performCallbackRequest(engine, query, stateCk, bindCk)
		if rec.Code != http.StatusFound {
			t.Fatalf("expected 302 Found, got %d", rec.Code)
		}
		wantLoc := driveTestFrontendURL + "/drive/connected?status=connected"
		if got := rec.Header().Get("Location"); got != wantLoc {
			t.Fatalf("expected redirect %q, got %q", wantLoc, got)
		}

		// Partner B must NOT have a row; Partner A must have 1 row
		if got := countCredentials(t, fixture.partnerB); got != 0 {
			t.Fatalf("expected 0 rows for partner B (query user_id must be ignored), got %d", got)
		}
		if got := countCredentials(t, fixture.partnerA); got != 1 {
			t.Fatalf("expected 1 row for partner A, got %d", got)
		}

		// Inspect raw bytes in DB
		var (
			dbSub            string
			dbEmail          string
			dbEncryptedBytes []byte
			dbScopes         string
			dbStatus         string
		)
		err := pool.QueryRow(
			context.Background(),
			`SELECT google_sub, google_email, encrypted_refresh_token, scopes, status
			 FROM user_drive_credentials
			 WHERE user_id = $1`,
			fixture.partnerA,
		).Scan(&dbSub, &dbEmail, &dbEncryptedBytes, &dbScopes, &dbStatus)
		if err != nil {
			t.Fatalf("select credentials row: %v", err)
		}
		if dbSub != "google-sub-partner-a-1" || dbEmail != "partner.a.first@gmail.com" || dbStatus != "connected" {
			t.Fatalf("unexpected row metadata: sub=%q email=%q status=%q", dbSub, dbEmail, dbStatus)
		}
		if len(dbEncryptedBytes) == 0 || bytes.Equal(dbEncryptedBytes, []byte(plaintextRT)) || bytes.Contains(dbEncryptedBytes, []byte(plaintextRT)) {
			t.Fatal("encrypted_refresh_token in DB must not be plaintext or contain plaintext")
		}

		decrypted, err := crypto.Decrypt(key, dbEncryptedBytes)
		if err != nil {
			t.Fatalf("Decrypt stored token with correct key failed: %v", err)
		}
		if string(decrypted) != plaintextRT {
			t.Fatalf("decrypted token mismatch: got %q, want %q", string(decrypted), plaintextRT)
		}
		if _, err := crypto.Decrypt(otherKey, dbEncryptedBytes); err == nil {
			t.Fatal("Decrypt stored token with different key must fail")
		}

		// Check GET /api/v1/users/me/drive status
		statusResp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive", "", tokenPartnerA)
		if statusResp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK from GET status, got %d", statusResp.Code)
		}
		rawStatusBody := statusResp.Body.String()
		if strings.Contains(rawStatusBody, plaintextRT) || strings.Contains(rawStatusBody, "refresh_token") {
			t.Fatalf("GET status response must not contain token: %s", rawStatusBody)
		}

		var statusPayload struct {
			Success bool                     `json:"success"`
			Data    handlers.DriveStatusData `json:"data"`
		}
		if err := json.Unmarshal(statusResp.Body.Bytes(), &statusPayload); err != nil {
			t.Fatalf("unmarshal status payload: %v", err)
		}
		if !statusPayload.Success || !statusPayload.Data.Connected {
			t.Fatalf("expected connected=true, got %+v", statusPayload)
		}
		if statusPayload.Data.GoogleEmail == nil || *statusPayload.Data.GoogleEmail != "partner.a.first@gmail.com" {
			t.Errorf("expected google_email partner.a.first@gmail.com, got %v", statusPayload.Data.GoogleEmail)
		}
		if statusPayload.Data.ConnectedAt == nil || statusPayload.Data.ConnectedAt.IsZero() {
			t.Errorf("expected non-zero connected_at, got %v", statusPayload.Data.ConnectedAt)
		}
	})

	t.Run("connect_ulang_upsert_tetap_satu_baris", func(t *testing.T) {
		secondRT := "1//0g-partner-a-second-rotated-refresh-token"
		fakeOAuth.ExchangeToken = &oauth2.Token{
			AccessToken:  "access-token-2",
			RefreshToken: secondRT,
		}
		fakeOAuth.Identity = &drive.Identity{
			Sub:   "google-sub-partner-a-2",
			Email: "partner.a.second@gmail.com",
		}

		connectResp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		res := connectResp.Result()
		defer res.Body.Close()
		stateCk := findCookie(res.Cookies(), handlers.GoogleDriveStateCookie)
		bindCk := findCookie(res.Cookies(), handlers.GoogleDriveBindCookie)

		rec := performCallbackRequest(
			engine,
			"state="+url.QueryEscape(stateCk.Value)+"&code=valid-code-2",
			stateCk,
			bindCk,
		)
		if rec.Code != http.StatusFound {
			t.Fatalf("expected 302 Found on re-connect, got %d", rec.Code)
		}

		if got := countCredentials(t, fixture.partnerA); got != 1 {
			t.Fatalf("expected UPSERT to keep exactly 1 row for partner A, got %d", got)
		}

		var (
			dbSub            string
			dbEmail          string
			dbEncryptedBytes []byte
			dbStatus         string
		)
		err := pool.QueryRow(
			context.Background(),
			`SELECT google_sub, google_email, encrypted_refresh_token, status
			 FROM user_drive_credentials
			 WHERE user_id = $1`,
			fixture.partnerA,
		).Scan(&dbSub, &dbEmail, &dbEncryptedBytes, &dbStatus)
		if err != nil {
			t.Fatalf("select updated row: %v", err)
		}
		if dbSub != "google-sub-partner-a-2" || dbEmail != "partner.a.second@gmail.com" || dbStatus != "connected" {
			t.Fatalf("expected updated sub and email, got sub=%q email=%q status=%q", dbSub, dbEmail, dbStatus)
		}
		decrypted, err := crypto.Decrypt(key, dbEncryptedBytes)
		if err != nil || string(decrypted) != secondRT {
			t.Fatalf("expected decrypted token %q, got %q (err=%v)", secondRT, string(decrypted), err)
		}
	})

	t.Run("delete_dua_kali_keduanya_200_idempotent", func(t *testing.T) {
		fakeOAuth.RevokeErr = nil

		del1 := templateFavoritesRequest(engine, http.MethodDelete, "/api/v1/users/me/drive", "", tokenPartnerA)
		if del1.Code != http.StatusOK {
			t.Fatalf("first DELETE expected 200 OK, got %d: %s", del1.Code, del1.Body.String())
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected 0 rows after first DELETE, got %d", got)
		}
		revoked := fakeOAuth.RevokedTokensSnapshot()
		if len(revoked) == 0 || revoked[len(revoked)-1] != "1//0g-partner-a-second-rotated-refresh-token" {
			t.Fatalf("expected Revoke to be called with decrypted refresh token, got %v", revoked)
		}

		del2 := templateFavoritesRequest(engine, http.MethodDelete, "/api/v1/users/me/drive", "", tokenPartnerA)
		if del2.Code != http.StatusOK {
			t.Fatalf("second DELETE expected 200 OK, got %d: %s", del2.Code, del2.Body.String())
		}

		var body struct {
			Success bool `json:"success"`
			Data    struct {
				Connected bool `json:"connected"`
			} `json:"data"`
		}
		if err := json.Unmarshal(del2.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal second DELETE response: %v", err)
		}
		if !body.Success || body.Data.Connected {
			t.Fatalf("expected connected=false on second DELETE, got %+v", body)
		}
	})

	t.Run("revoke_error_tetap_menghapus_baris", func(t *testing.T) {
		// Connect again first
		fakeOAuth.ExchangeToken = &oauth2.Token{
			AccessToken:  "access-token-3",
			RefreshToken: "1//0g-partner-a-third-refresh-token",
		}
		fakeOAuth.Identity = &drive.Identity{
			Sub:   "google-sub-partner-a-3",
			Email: "partner.a.third@gmail.com",
		}
		connectResp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		res := connectResp.Result()
		defer res.Body.Close()
		stateCk := findCookie(res.Cookies(), handlers.GoogleDriveStateCookie)
		bindCk := findCookie(res.Cookies(), handlers.GoogleDriveBindCookie)

		rec := performCallbackRequest(
			engine,
			"state="+url.QueryEscape(stateCk.Value)+"&code=valid-code-3",
			stateCk,
			bindCk,
		)
		if rec.Code != http.StatusFound {
			t.Fatalf("expected 302 Found on connect before revoke error test, got %d", rec.Code)
		}
		if got := countCredentials(t, fixture.partnerA); got != 1 {
			t.Fatalf("expected 1 row before DELETE, got %d", got)
		}

		// Simulate Google Revoke failure
		fakeOAuth.RevokeErr = errors.New("simulated google revoke network failure")
		delResp := templateFavoritesRequest(engine, http.MethodDelete, "/api/v1/users/me/drive", "", tokenPartnerA)
		if delResp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK even when Revoke fails, got %d: %s", delResp.Code, delResp.Body.String())
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected row to be deleted even when Revoke fails, got %d rows", got)
		}
	})

	t.Run("status_delete_dan_callback_tetap_jalan_tanpa_addon", func(t *testing.T) {
		fakeOAuth.RevokeErr = nil
		fakeOAuth.ExchangeToken = &oauth2.Token{
			AccessToken:  "access-token-4",
			RefreshToken: "1//0g-partner-a-fourth-refresh-token",
		}
		fakeOAuth.Identity = &drive.Identity{
			Sub:   "google-sub-partner-a-4",
			Email: "partner.a.fourth@gmail.com",
		}

		// Initiate connect while entitlement is still active
		connectResp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		if connectResp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on connect, got %d", connectResp.Code)
		}
		res := connectResp.Result()
		defer res.Body.Close()
		stateCk := findCookie(res.Cookies(), handlers.GoogleDriveStateCookie)
		bindCk := findCookie(res.Cookies(), handlers.GoogleDriveBindCookie)

		// Remove all entitlements before callback, status, and disconnect
		fixture.clearEntitlements(t, pool, fixture.invitationA)
		fixture.clearEntitlements(t, pool, fixture.invitationB)

		// Connect is now blocked (403), but callback, status, and disconnect must still work
		blockedConnect := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive/connect", "", tokenPartnerA)
		assertAddonRequired403(t, blockedConnect)

		cbRec := performCallbackRequest(
			engine,
			"state="+url.QueryEscape(stateCk.Value)+"&code=valid-code-4",
			stateCk,
			bindCk,
		)
		if cbRec.Code != http.StatusFound || cbRec.Header().Get("Location") != driveTestFrontendURL+"/drive/connected?status=connected" {
			t.Fatalf("expected callback to succeed without active addon, got %d %s", cbRec.Code, cbRec.Header().Get("Location"))
		}

		statusResp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/users/me/drive", "", tokenPartnerA)
		if statusResp.Code != http.StatusOK {
			t.Fatalf("expected GET status 200 OK without active addon, got %d: %s", statusResp.Code, statusResp.Body.String())
		}

		delResp := templateFavoritesRequest(engine, http.MethodDelete, "/api/v1/users/me/drive", "", tokenPartnerA)
		if delResp.Code != http.StatusOK {
			t.Fatalf("expected DELETE 200 OK without active addon, got %d: %s", delResp.Code, delResp.Body.String())
		}
		if got := countCredentials(t, fixture.partnerA); got != 0 {
			t.Fatalf("expected 0 rows after DELETE without addon, got %d", got)
		}
	})
}
