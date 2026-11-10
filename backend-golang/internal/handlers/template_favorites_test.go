package handlers_test

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"backend-golang/internal/handlers"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const templateFavoritesTestJWTSecret = "template-favorites-test-secret"

type templateFavoritesFixture struct {
	marker    string
	userA     int64
	userB     int64
	category  int64
	published int64
	other     int64
	draft     int64
}

func TestTemplateFavorites(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	gin.SetMode(gin.TestMode)
	engine := router.SetupRouter(
		pool,
		templateFavoritesTestJWTSecret,
		"test",
		handlers.GoogleAuthConfig{},
		(*payment.MidtransClient)(nil),
	)

	t.Run("authentication required on all routes", func(t *testing.T) {
		requests := []struct {
			method string
			path   string
			body   string
		}{
			{method: http.MethodPost, path: "/api/v1/users/me/favorites", body: `{"template_id":1}`},
			{method: http.MethodGet, path: "/api/v1/users/me/favorites"},
			{method: http.MethodDelete, path: "/api/v1/users/me/favorites/1"},
		}
		for _, request := range requests {
			response := templateFavoritesRequest(engine, request.method, request.path, request.body, "")
			if response.Code != http.StatusUnauthorized {
				t.Errorf("%s %s: expected status %d, got %d", request.method, request.path, http.StatusUnauthorized, response.Code)
			}
		}
	})

	t.Run("POST succeeds then duplicate conflicts", func(t *testing.T) {
		fixture := createTemplateFavoritesFixture(t, pool)
		token := templateFavoritesToken(t, fixture.userA)
		body := fmt.Sprintf(`{"template_id":%d}`, fixture.published)

		response := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/users/me/favorites", body, token)
		if response.Code != http.StatusCreated {
			t.Fatalf("expected status %d, got %d: %s", http.StatusCreated, response.Code, response.Body.String())
		}

		var success struct {
			Success bool `json:"success"`
			Data    struct {
				Favorite struct {
					TemplateID int64 `json:"template_id"`
				} `json:"favorite"`
			} `json:"data"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &success); err != nil {
			t.Fatalf("decode POST success response: %v", err)
		}
		if !success.Success || success.Data.Favorite.TemplateID != fixture.published {
			t.Fatalf("unexpected POST response: %+v", success)
		}

		response = templateFavoritesRequest(engine, http.MethodPost, "/api/v1/users/me/favorites", body, token)
		if response.Code != http.StatusConflict {
			t.Fatalf("expected duplicate status %d, got %d: %s", http.StatusConflict, response.Code, response.Body.String())
		}
	})

	t.Run("POST rejects unpublished or missing template", func(t *testing.T) {
		fixture := createTemplateFavoritesFixture(t, pool)
		token := templateFavoritesToken(t, fixture.userA)
		for _, templateID := range []int64{fixture.draft, 1<<63 - 1} {
			body := fmt.Sprintf(`{"template_id":%d}`, templateID)
			response := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/users/me/favorites", body, token)
			if response.Code != http.StatusNotFound {
				t.Errorf("template %d: expected status %d, got %d: %s", templateID, http.StatusNotFound, response.Code, response.Body.String())
			}
		}
	})

	t.Run("POST validates body", func(t *testing.T) {
		fixture := createTemplateFavoritesFixture(t, pool)
		token := templateFavoritesToken(t, fixture.userA)
		for _, body := range []string{"", "{", `{}`, `{"template_id":null}`, `{"template_id":0}`, `{"template_id":-1}`, `{"template_id":"1"}`, `{"template_id":1.5}`} {
			response := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/users/me/favorites", body, token)
			if response.Code != http.StatusBadRequest {
				t.Errorf("body %q: expected status %d, got %d: %s", body, http.StatusBadRequest, response.Code, response.Body.String())
			}
		}
	})

	t.Run("GET returns only own published favorites with pagination", func(t *testing.T) {
		fixture := createTemplateFavoritesFixture(t, pool)
		if _, err := pool.Exec(
			context.Background(),
			`INSERT INTO invitation_favorites (user_id, template_id)
			 VALUES ($1, $2), ($3, $4), ($1, $5)`,
			fixture.userA,
			fixture.published,
			fixture.userB,
			fixture.other,
			fixture.draft,
		); err != nil {
			t.Fatalf("create GET favorites: %v", err)
		}

		response := templateFavoritesRequest(
			engine,
			http.MethodGet,
			"/api/v1/users/me/favorites?page=1&limit=1",
			"",
			templateFavoritesToken(t, fixture.userA),
		)
		if response.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d: %s", http.StatusOK, response.Code, response.Body.String())
		}

		var result struct {
			Data struct {
				Templates  []map[string]any `json:"templates"`
				Pagination struct {
					Page       int64 `json:"page"`
					Limit      int64 `json:"limit"`
					Total      int64 `json:"total"`
					TotalPages int64 `json:"total_pages"`
				} `json:"pagination"`
			} `json:"data"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
			t.Fatalf("decode GET response: %v", err)
		}
		if len(result.Data.Templates) != 1 {
			t.Fatalf("expected one paginated favorite, got %d", len(result.Data.Templates))
		}
		if result.Data.Pagination.Total != 1 || result.Data.Pagination.Page != 1 ||
			result.Data.Pagination.Limit != 1 || result.Data.Pagination.TotalPages != 1 {
			t.Fatalf("unexpected pagination: %+v", result.Data.Pagination)
		}
		if result.Data.Templates[0]["slug"] != fixture.marker+"-template-published" {
			t.Fatalf("GET exposed another user's or unpublished favorite: %+v", result.Data.Templates)
		}
		if _, ok := result.Data.Templates[0]["category"]; !ok {
			t.Fatalf("catalog category missing from favorite item: %+v", result.Data.Templates[0])
		}
	})

	t.Run("DELETE does not remove another user's favorite", func(t *testing.T) {
		fixture := createTemplateFavoritesFixture(t, pool)
		if _, err := pool.Exec(
			context.Background(),
			`INSERT INTO invitation_favorites (user_id, template_id) VALUES ($1, $2)`,
			fixture.userA,
			fixture.published,
		); err != nil {
			t.Fatalf("create DELETE fixture favorite: %v", err)
		}

		path := fmt.Sprintf("/api/v1/users/me/favorites/%d", fixture.published)
		response := templateFavoritesRequest(engine, http.MethodDelete, path, "", templateFavoritesToken(t, fixture.userB))
		if response.Code != http.StatusNotFound {
			t.Fatalf("expected status %d, got %d: %s", http.StatusNotFound, response.Code, response.Body.String())
		}

		var count int
		if err := pool.QueryRow(
			context.Background(),
			`SELECT COUNT(*) FROM invitation_favorites WHERE user_id = $1 AND template_id = $2`,
			fixture.userA,
			fixture.published,
		).Scan(&count); err != nil {
			t.Fatalf("verify other user's favorite remains: %v", err)
		}
		if count != 1 {
			t.Fatalf("expected other user's favorite to remain, count=%d", count)
		}
	})

	t.Run("DELETE succeeds and missing favorite is not found", func(t *testing.T) {
		fixture := createTemplateFavoritesFixture(t, pool)
		if _, err := pool.Exec(
			context.Background(),
			`INSERT INTO invitation_favorites (user_id, template_id) VALUES ($1, $2)`,
			fixture.userA,
			fixture.published,
		); err != nil {
			t.Fatalf("create DELETE fixture favorite: %v", err)
		}

		path := fmt.Sprintf("/api/v1/users/me/favorites/%d", fixture.published)
		token := templateFavoritesToken(t, fixture.userA)
		response := templateFavoritesRequest(engine, http.MethodDelete, path, "", token)
		if response.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d: %s", http.StatusOK, response.Code, response.Body.String())
		}

		response = templateFavoritesRequest(engine, http.MethodDelete, path, "", token)
		if response.Code != http.StatusNotFound {
			t.Fatalf("expected missing favorite status %d, got %d: %s", http.StatusNotFound, response.Code, response.Body.String())
		}
	})

	t.Run("DELETE rejects invalid template id", func(t *testing.T) {
		fixture := createTemplateFavoritesFixture(t, pool)
		token := templateFavoritesToken(t, fixture.userA)
		for _, id := range []string{"abc", "0", "-1", "99999999999999999999"} {
			response := templateFavoritesRequest(
				engine,
				http.MethodDelete,
				"/api/v1/users/me/favorites/"+id,
				"",
				token,
			)
			if response.Code != http.StatusBadRequest {
				t.Errorf("id %q: expected status %d, got %d: %s", id, http.StatusBadRequest, response.Code, response.Body.String())
			}
		}
	})
}

func templateFavoritesTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()

	dbName := strings.TrimSpace(os.Getenv("TEST_DB_NAME"))
	if dbName == "" {
		t.Skip("Template favorites integration tests skipped: set TEST_DB_NAME to a dedicated test database (for example inviteu_test)")
	}
	if dbName == "inviteu" || !strings.HasSuffix(strings.ToLower(dbName), "_test") {
		t.Fatalf("refusing to run template favorites integration tests: TEST_DB_NAME must be a dedicated database ending in _test, not %q", dbName)
	}

	user := strings.TrimSpace(os.Getenv("TEST_DB_USER"))
	if user == "" {
		t.Skip("Template favorites integration tests skipped: set TEST_DB_USER for the dedicated test database")
	}

	host := strings.TrimSpace(os.Getenv("TEST_DB_HOST"))
	if host == "" {
		host = "localhost"
	}
	port := strings.TrimSpace(os.Getenv("TEST_DB_PORT"))
	if port == "" {
		port = "5432"
	}
	if _, err := strconv.Atoi(port); err != nil {
		t.Fatalf("TEST_DB_PORT must be a valid port number: %v", err)
	}

	connectionURL := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, os.Getenv("TEST_DB_PASSWORD")),
		Host:   net.JoinHostPort(host, port),
		Path:   dbName,
	}
	query := url.Values{}
	sslMode := strings.TrimSpace(os.Getenv("TEST_DB_SSLMODE"))
	if sslMode == "" {
		sslMode = "disable"
	}
	query.Set("sslmode", sslMode)
	connectionURL.RawQuery = query.Encode()

	config, err := pgxpool.ParseConfig(connectionURL.String())
	if err != nil {
		t.Fatalf("parse dedicated test database configuration: %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatalf("connect to dedicated test database %q: %v", dbName, err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		t.Fatalf("ping dedicated test database %q: %v", dbName, err)
	}

	var connectedDB string
	if err := pool.QueryRow(ctx, `SELECT current_database()`).Scan(&connectedDB); err != nil {
		pool.Close()
		t.Fatalf("verify dedicated test database: %v", err)
	}
	if connectedDB != dbName || connectedDB == "inviteu" {
		pool.Close()
		t.Fatalf("refusing to run tests: connected to unexpected database %q", connectedDB)
	}

	t.Cleanup(pool.Close)
	return pool
}

func createTemplateFavoritesFixture(t *testing.T, pool *pgxpool.Pool) templateFavoritesFixture {
	t.Helper()

	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	fixture := templateFavoritesFixture{
		marker: "tf-test-" + hex.EncodeToString(randomBytes),
	}
	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if _, err := pool.Exec(
			cleanupCtx,
			`DELETE FROM templates
			 WHERE slug LIKE $1 AND name LIKE $2`,
			fixture.marker+"-template-%",
			fixture.marker+" %",
		); err != nil {
			t.Errorf("delete fixture templates: %v", err)
			return
		}
		if _, err := pool.Exec(
			cleanupCtx,
			`DELETE FROM template_categories
			 WHERE slug = $1 AND name = $2`,
			fixture.marker+"-category",
			fixture.marker+" category",
		); err != nil {
			t.Errorf("delete fixture category: %v", err)
			return
		}
		if _, err := pool.Exec(
			cleanupCtx,
			`DELETE FROM users
			 WHERE email IN ($1, $2) AND name LIKE $3`,
			fixture.marker+"-a@example.test",
			fixture.marker+"-b@example.test",
			fixture.marker+" %",
		); err != nil {
			t.Errorf("delete fixture users: %v", err)
		}
	})
	ctx := context.Background()

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO users (name, email, role, status)
		 VALUES ($1, $2, $3, 'active')
		 RETURNING id`,
		fixture.marker+" user A",
		fixture.marker+"-a@example.test",
		"designer",
	).Scan(&fixture.userA); err != nil {
		t.Fatalf("insert fixture user A: %v", err)
	}
	if err := pool.QueryRow(
		ctx,
		`INSERT INTO users (name, email, role, status)
		 VALUES ($1, $2, $3, 'active')
		 RETURNING id`,
		fixture.marker+" user B",
		fixture.marker+"-b@example.test",
		"partner",
	).Scan(&fixture.userB); err != nil {
		t.Fatalf("insert fixture user B: %v", err)
	}
	if err := pool.QueryRow(
		ctx,
		`INSERT INTO template_categories (name, slug, description)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		fixture.marker+" category",
		fixture.marker+"-category",
		"Template favorites integration-test fixture",
	).Scan(&fixture.category); err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	fixture.published = insertTemplateFavoritesTestTemplate(t, pool, fixture, "published", "publish")
	fixture.other = insertTemplateFavoritesTestTemplate(t, pool, fixture, "other", "publish")
	fixture.draft = insertTemplateFavoritesTestTemplate(t, pool, fixture, "draft", "draft")

	return fixture
}

func insertTemplateFavoritesTestTemplate(
	t *testing.T,
	pool *pgxpool.Pool,
	fixture templateFavoritesFixture,
	suffix string,
	status string,
) int64 {
	t.Helper()
	var templateID int64
	err := pool.QueryRow(
		context.Background(),
		`INSERT INTO templates (
			category_id, designer_id, name, slug, description, price, style, color, status
		 )
		 VALUES ($1, $2, $3, $4, $5, 125.00, 'modern', 'blue', $6)
		 RETURNING id`,
		fixture.category,
		fixture.userA,
		fixture.marker+" "+suffix,
		fixture.marker+"-template-"+suffix,
		"Template favorites integration-test fixture",
		status,
	).Scan(&templateID)
	if err != nil {
		t.Fatalf("insert fixture template %s: %v", suffix, err)
	}
	return templateID
}

func templateFavoritesToken(t *testing.T, userID int64) string {
	t.Helper()
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(userID, 10),
		Issuer:    "inviteu",
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
	})
	signed, err := token.SignedString([]byte(templateFavoritesTestJWTSecret))
	if err != nil {
		t.Fatalf("sign fixture JWT: %v", err)
	}
	return signed
}

func templateFavoritesRequest(
	engine http.Handler,
	method string,
	path string,
	body string,
	token string,
) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, bytes.NewBufferString(body))
	if body != "" {
		request.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)
	return response
}
