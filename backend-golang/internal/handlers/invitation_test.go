package handlers_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	"backend-golang/internal/handlers"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type invitationTestFixture struct {
	marker            string
	partnerA          int64
	partnerB          int64
	designerUser      int64
	adminUser         int64
	pkgID             int64
	partnerPackageID  int64
	categoryID        int64
	publishedTemplate int64
	draftTemplate     int64
}

func createInvitationTestFixture(t *testing.T, pool *pgxpool.Pool) invitationTestFixture {
	t.Helper()

	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "inv-test-" + hex.EncodeToString(randomBytes)
	fixture := invitationTestFixture{marker: marker}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{fixture.partnerA, fixture.partnerB, fixture.designerUser, fixture.adminUser}

		// 1. Delete invitation_events
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM invitation_events
			WHERE invitation_id IN (
				SELECT id FROM invitations WHERE user_id = ANY($1)
			)
		`, userIDs); err != nil {
			t.Errorf("cleanup invitation_events: %v", err)
		}

		// 2. Delete invitations (cascades to invitation_versions)
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM invitations WHERE user_id = ANY($1)
		`, userIDs); err != nil {
			t.Errorf("cleanup invitations: %v", err)
		}

		// 3. Delete events
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM events WHERE user_id = ANY($1)
		`, userIDs); err != nil {
			t.Errorf("cleanup events: %v", err)
		}

		// 4. Delete partner_packages
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM partner_packages WHERE user_id = ANY($1)
		`, userIDs); err != nil {
			t.Errorf("cleanup partner_packages: %v", err)
		}

		// 5. Delete templates
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM templates WHERE id IN ($1, $2)
		`, fixture.publishedTemplate, fixture.draftTemplate); err != nil {
			t.Errorf("cleanup templates: %v", err)
		}

		// 6. Delete template_categories
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM template_categories WHERE id = $1
		`, fixture.categoryID); err != nil {
			t.Errorf("cleanup template_categories: %v", err)
		}

		// 7. Delete packages
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM packages WHERE id = $1
		`, fixture.pkgID); err != nil {
			t.Errorf("cleanup packages: %v", err)
		}

		// 8. Delete users
		if _, err := pool.Exec(cleanupCtx, `
			DELETE FROM users WHERE id = ANY($1)
		`, userIDs); err != nil {
			t.Errorf("cleanup users: %v", err)
		}
	})

	ctx := context.Background()

	// Users
	insertUser := func(name, email, role string) int64 {
		var uid int64
		err := pool.QueryRow(ctx, `
			INSERT INTO users (name, email, role, status)
			VALUES ($1, $2, $3, 'active')
			RETURNING id
		`, marker+" "+name, marker+"-"+email, role).Scan(&uid)
		if err != nil {
			t.Fatalf("insert fixture user %s: %v", name, err)
		}
		return uid
	}

	fixture.partnerA = insertUser("Partner A", "partner-a@example.test", "partner")
	fixture.partnerB = insertUser("Partner B", "partner-b@example.test", "partner")
	fixture.designerUser = insertUser("Designer", "designer@example.test", "designer")
	fixture.adminUser = insertUser("Admin", "admin@example.test", "admin")

	// Package
	err := pool.QueryRow(ctx, `
		INSERT INTO packages (name, description, price, invitation_quota, status, duration_months)
		VALUES ($1, 'Test Package Description', 100000, 10, 'active', 1)
		RETURNING id
	`, marker+" Package").Scan(&fixture.pkgID)
	if err != nil {
		t.Fatalf("insert fixture package: %v", err)
	}

	// Active partner_package for partnerA with quota
	err = pool.QueryRow(ctx, `
		INSERT INTO partner_packages (user_id, package_id, invitation_quota, invitation_used, started_at, expired_at, status)
		VALUES ($1, $2, 5, 0, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '30 days', 'active')
		RETURNING id
	`, fixture.partnerA, fixture.pkgID).Scan(&fixture.partnerPackageID)
	if err != nil {
		t.Fatalf("insert fixture partner_package: %v", err)
	}

	// Template Category
	err = pool.QueryRow(ctx, `
		INSERT INTO template_categories (name, slug, description)
		VALUES ($1, $2, 'Invitation test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture template category: %v", err)
	}

	// Published Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Published template', 150000, 'publish')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Pub Template", marker+"-pub-tmpl").Scan(&fixture.publishedTemplate)
	if err != nil {
		t.Fatalf("insert fixture published template: %v", err)
	}

	// Draft Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Draft template', 150000, 'draft')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Draft Template", marker+"-draft-tmpl").Scan(&fixture.draftTemplate)
	if err != nil {
		t.Fatalf("insert fixture draft template: %v", err)
	}

	return fixture
}

func setupInvitationTestEngine(pool *pgxpool.Pool) http.Handler {
	gin.SetMode(gin.TestMode)
	return router.SetupRouter(
		pool,
		templateFavoritesTestJWTSecret,
		"test",
		handlers.GoogleAuthConfig{},
		(*payment.MidtransClient)(nil),
	)
}

func TestInvitationCore(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)

	t.Run("authentication required on all routes", func(t *testing.T) {
		requests := []struct {
			method string
			path   string
			body   string
		}{
			{method: http.MethodPost, path: "/api/v1/invitations", body: `{"title":"test"}`},
			{method: http.MethodGet, path: "/api/v1/invitations"},
			{method: http.MethodGet, path: "/api/v1/invitations/1"},
		}
		for _, req := range requests {
			resp := templateFavoritesRequest(engine, req.method, req.path, req.body, "")
			if resp.Code != http.StatusUnauthorized {
				t.Errorf("%s %s: expected %d, got %d", req.method, req.path, http.StatusUnauthorized, resp.Code)
			}
		}
	})

	t.Run("designer and admin rejected with 403 on all routes", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)

		for _, uid := range []int64{fixture.designerUser, fixture.adminUser} {
			token := templateFavoritesToken(t, uid)
			requests := []struct {
				method string
				path   string
				body   string
			}{
				{method: http.MethodPost, path: "/api/v1/invitations", body: `{"title":"test"}`},
				{method: http.MethodGet, path: "/api/v1/invitations"},
				{method: http.MethodGet, path: "/api/v1/invitations/1"},
			}
			for _, req := range requests {
				resp := templateFavoritesRequest(engine, req.method, req.path, req.body, token)
				if resp.Code != http.StatusForbidden {
					t.Errorf("user %d %s %s: expected 403, got %d", uid, req.method, req.path, resp.Code)
				}
			}
		}
	})

	t.Run("POST fails when partner has no active package", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenB := templateFavoritesToken(t, fixture.partnerB) // partnerB has no partner_packages row

		body := fmt.Sprintf(`{
			"title": "Wedding of B",
			"template_id": %d,
			"event": {
				"date": "2026-12-15"
			}
		}`, fixture.publishedTemplate)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenB)
		if resp.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool              `json:"success"`
			Errors  map[string]string `json:"errors"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal error: %v", err)
		}
		if res.Success || res.Errors["package"] != "no_active_package" {
			t.Fatalf("expected package error no_active_package, got %+v", res)
		}
	})

	t.Run("POST fails when package is expired", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		// Set package expired
		_, err := pool.Exec(context.Background(), `
			UPDATE partner_packages
			SET expired_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
			WHERE id = $1
		`, fixture.partnerPackageID)
		if err != nil {
			t.Fatalf("update expired_at: %v", err)
		}

		tokenA := templateFavoritesToken(t, fixture.partnerA)
		body := fmt.Sprintf(`{
			"title": "Wedding Expired",
			"template_id": %d,
			"event": {"date": "2026-12-15"}
		}`, fixture.publishedTemplate)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d: %s", resp.Code, resp.Body.String())
		}
		if !strings.Contains(resp.Body.String(), "no_active_package") {
			t.Fatalf("expected no_active_package error code: %s", resp.Body.String())
		}
	})

	t.Run("POST fails when package has not started", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		// Set package future started_at
		_, err := pool.Exec(context.Background(), `
			UPDATE partner_packages
			SET started_at = CURRENT_TIMESTAMP + INTERVAL '1 day'
			WHERE id = $1
		`, fixture.partnerPackageID)
		if err != nil {
			t.Fatalf("update started_at: %v", err)
		}

		tokenA := templateFavoritesToken(t, fixture.partnerA)
		body := fmt.Sprintf(`{
			"title": "Wedding Not Started",
			"template_id": %d,
			"event": {"date": "2026-12-15"}
		}`, fixture.publishedTemplate)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d: %s", resp.Code, resp.Body.String())
		}
		if !strings.Contains(resp.Body.String(), "no_active_package") {
			t.Fatalf("expected no_active_package error code: %s", resp.Body.String())
		}
	})

	t.Run("POST fails when quota is exhausted", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		// Set invitation_used = invitation_quota
		_, err := pool.Exec(context.Background(), `
			UPDATE partner_packages
			SET invitation_used = invitation_quota
			WHERE id = $1
		`, fixture.partnerPackageID)
		if err != nil {
			t.Fatalf("update used quota: %v", err)
		}

		tokenA := templateFavoritesToken(t, fixture.partnerA)
		body := fmt.Sprintf(`{
			"title": "Wedding Quota Out",
			"template_id": %d,
			"event": {"date": "2026-12-15"}
		}`, fixture.publishedTemplate)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d: %s", resp.Code, resp.Body.String())
		}
		if !strings.Contains(resp.Body.String(), "quota_exhausted") {
			t.Fatalf("expected quota_exhausted error code: %s", resp.Body.String())
		}
	})

	t.Run("POST succeeds when partner has two active packages, one exhausted and one with remaining quota", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		// Package 1 is exhausted (used == quota)
		_, err := pool.Exec(context.Background(), `
			UPDATE partner_packages
			SET invitation_quota = 2, invitation_used = 2
			WHERE id = $1
		`, fixture.partnerPackageID)
		if err != nil {
			t.Fatalf("update pkg 1: %v", err)
		}

		// Package 2 is active with remaining quota (quota 3, used 1)
		_, err = pool.Exec(context.Background(), `
			INSERT INTO partner_packages (user_id, package_id, invitation_quota, invitation_used, started_at, expired_at, status)
			VALUES ($1, $2, 3, 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '30 days', 'active')
		`, fixture.partnerA, fixture.pkgID)
		if err != nil {
			t.Fatalf("insert pkg 2: %v", err)
		}

		tokenA := templateFavoritesToken(t, fixture.partnerA)
		body := fmt.Sprintf(`{
			"title": "Wedding Two Packages",
			"template_id": %d,
			"event": {
				"date": "2026-12-15"
			}
		}`, fixture.publishedTemplate)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created with second package quota, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("POST rejects non-existent or unpublished template", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		// 1. Non-existent template
		bodyNonExistent := `{
			"title": "Wedding Non Existent",
			"template_id": 999999999,
			"event": {"date": "2026-12-15"}
		}`
		resp1 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", bodyNonExistent, tokenA)
		if resp1.Code != http.StatusNotFound {
			t.Errorf("expected 404 for non-existent template, got %d: %s", resp1.Code, resp1.Body.String())
		}

		// 2. Draft template
		bodyDraft := fmt.Sprintf(`{
			"title": "Wedding Draft Template",
			"template_id": %d,
			"event": {"date": "2026-12-15"}
		}`, fixture.draftTemplate)
		resp2 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", bodyDraft, tokenA)
		if resp2.Code != http.StatusNotFound {
			t.Errorf("expected 404 for draft template, got %d: %s", resp2.Code, resp2.Body.String())
		}
	})

	t.Run("POST validates request body", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		invalidBodies := []struct {
			name string
			body string
		}{
			{"empty body", ""},
			{"invalid json", "{"},
			{"missing title", fmt.Sprintf(`{"template_id":%d,"event":{"date":"2026-12-15"}}`, fixture.publishedTemplate)},
			{"whitespace title", fmt.Sprintf(`{"title":"   ","template_id":%d,"event":{"date":"2026-12-15"}}`, fixture.publishedTemplate)},
			{"negative template_id", `{"title":"Wedding","template_id":-1,"event":{"date":"2026-12-15"}}`},
			{"missing event date", fmt.Sprintf(`{"title":"Wedding","template_id":%d,"event":{}}`, fixture.publishedTemplate)},
			{"invalid date format free text", fmt.Sprintf(`{"title":"Wedding","template_id":%d,"event":{"date":"15 Des 2026"}}`, fixture.publishedTemplate)},
			{"invalid start time", fmt.Sprintf(`{"title":"Wedding","template_id":%d,"event":{"date":"2026-12-15","start_time":"abc"}}`, fixture.publishedTemplate)},
			{"end_time earlier than start_time", fmt.Sprintf(`{"title":"Wedding","template_id":%d,"event":{"date":"2026-12-15","start_time":"14:00","end_time":"10:00"}}`, fixture.publishedTemplate)},
			{"invalid slug format uppercase", fmt.Sprintf(`{"title":"Wedding","template_id":%d,"slug":"Invalid_Slug","event":{"date":"2026-12-15"}}`, fixture.publishedTemplate)},
			{"invalid slug double hyphen", fmt.Sprintf(`{"title":"Wedding","template_id":%d,"slug":"invalid--slug","event":{"date":"2026-12-15"}}`, fixture.publishedTemplate)},
		}

		for _, tc := range invalidBodies {
			resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", tc.body, tokenA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("test %s: expected 400 Bad Request, got %d: %s", tc.name, resp.Code, resp.Body.String())
			}
		}
	})

	t.Run("POST client status is ignored and initial status is always draft", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		body := fmt.Sprintf(`{
			"title": "Client Status Test",
			"status": "Published",
			"template_id": %d,
			"event": {
				"date": "2026-12-15"
			}
		}`, fixture.publishedTemplate)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Invitation struct {
					ID     int64  `json:"id"`
					Status string `json:"status"`
				} `json:"invitation"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if res.Data.Invitation.Status != "draft" {
			t.Fatalf("expected status to be draft, got %q", res.Data.Invitation.Status)
		}
	})

	t.Run("POST custom slug collision returns 409 and does not leave orphan records", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		customSlug := fixture.marker + "-custom-slug"
		body := fmt.Sprintf(`{
			"title": "First With Slug",
			"slug": "%s",
			"template_id": %d,
			"event": {"date": "2026-12-15"}
		}`, customSlug, fixture.publishedTemplate)

		// 1. First creation succeeds
		resp1 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp1.Code != http.StatusCreated {
			t.Fatalf("first creation expected 201, got %d: %s", resp1.Code, resp1.Body.String())
		}

		// Count records before the duplicate attempt
		countRecords := func() (int, int, int, int) {
			var eventsCount, invCount, ieCount, ivCount int
			_ = pool.QueryRow(context.Background(), `SELECT count(*) FROM events WHERE user_id = $1`, fixture.partnerA).Scan(&eventsCount)
			_ = pool.QueryRow(context.Background(), `SELECT count(*) FROM invitations WHERE user_id = $1`, fixture.partnerA).Scan(&invCount)
			_ = pool.QueryRow(context.Background(), `
				SELECT count(*) FROM invitation_events ie 
				JOIN invitations i ON i.id = ie.invitation_id 
				WHERE i.user_id = $1
			`, fixture.partnerA).Scan(&ieCount)
			_ = pool.QueryRow(context.Background(), `
				SELECT count(*) FROM invitation_versions iv 
				JOIN invitations i ON i.id = iv.invitation_id 
				WHERE i.user_id = $1
			`, fixture.partnerA).Scan(&ivCount)
			return eventsCount, invCount, ieCount, ivCount
		}

		eventsBefore, invBefore, ieBefore, ivBefore := countRecords()

		// 2. Second creation with SAME custom slug fails with 409
		resp2 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp2.Code != http.StatusConflict {
			t.Fatalf("duplicate slug expected 409, got %d: %s", resp2.Code, resp2.Body.String())
		}
		if !strings.Contains(resp2.Body.String(), "slug_already_taken") {
			t.Fatalf("expected slug_already_taken error: %s", resp2.Body.String())
		}

		// 3. Verify counts are unchanged (no orphan records!)
		eventsAfter, invAfter, ieAfter, ivAfter := countRecords()
		if eventsAfter != eventsBefore || invAfter != invBefore || ieAfter != ieBefore || ivAfter != ivBefore {
			t.Fatalf("orphan records created! before=(e:%d,i:%d,ie:%d,iv:%d), after=(e:%d,i:%d,ie:%d,iv:%d)",
				eventsBefore, invBefore, ieBefore, ivBefore, eventsAfter, invAfter, ieAfter, ivAfter)
		}
	})

	t.Run("POST auto-generates unique slug with retry and does NOT deduct quota", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		var quotaUsedBefore int
		err := pool.QueryRow(context.Background(), `
			SELECT invitation_used FROM partner_packages WHERE id = $1
		`, fixture.partnerPackageID).Scan(&quotaUsedBefore)
		if err != nil {
			t.Fatalf("query quota used before: %v", err)
		}

		body := fmt.Sprintf(`{
			"title": "The Wedding of Andi & Bunga",
			"template_id": %d,
			"event": {
				"name": "Akad & Resepsi",
				"date": "2026-11-20",
				"start_time": "09:00",
				"end_time": "13:00",
				"location": "Sasana Budaya Ganesha",
				"address": "Jl. Tamansari No.73, Bandung",
				"maps_url": "https://maps.app.goo.gl/bandung",
				"description": "Mohon doa restu"
			}
		}`, fixture.publishedTemplate)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", body, tokenA)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Invitation struct {
					ID        int64     `json:"id"`
					Title     string    `json:"title"`
					Slug      string    `json:"slug"`
					Status    string    `json:"status"`
					CreatedAt time.Time `json:"created_at"`
					Event     struct {
						ID        int64   `json:"id"`
						Name      string  `json:"name"`
						Date      string  `json:"date"`
						StartTime *string `json:"start_time"`
						EndTime   *string `json:"end_time"`
						Location  *string `json:"location"`
					} `json:"event"`
				} `json:"invitation"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal success response: %v", err)
		}

		inv := res.Data.Invitation
		if inv.ID <= 0 || inv.Title != "The Wedding of Andi & Bunga" {
			t.Fatalf("unexpected invitation response: %+v", inv)
		}
		if !strings.HasPrefix(inv.Slug, "the-wedding-of-andi-bunga-") {
			t.Fatalf("expected slug to start with slugified title, got %q", inv.Slug)
		}
		if inv.Status != "draft" {
			t.Fatalf("expected status draft, got %q", inv.Status)
		}
		if inv.Event.Date != "2026-11-20" {
			t.Fatalf("expected event date 2026-11-20, got %q", inv.Event.Date)
		}
		if inv.Event.StartTime == nil || !strings.HasPrefix(*inv.Event.StartTime, "09:00") {
			t.Fatalf("expected start_time 09:00, got %v", inv.Event.StartTime)
		}

		// Verify timestamp format: in JSON raw string, verify RFC3339 format ending in "Z"
		// (pgx v5 decodes timestamp without timezone with UTC location, encoding/json formats with trailing 'Z')
		if !strings.Contains(resp.Body.String(), `"created_at":"20`) || !strings.Contains(resp.Body.String(), `Z"`) {
			t.Errorf("expected created_at timestamp in response to end with Z: %s", resp.Body.String())
		}

		// Verify quota is NOT deducted
		var quotaUsedAfter int
		err = pool.QueryRow(context.Background(), `
			SELECT invitation_used FROM partner_packages WHERE id = $1
		`, fixture.partnerPackageID).Scan(&quotaUsedAfter)
		if err != nil {
			t.Fatalf("query quota used after: %v", err)
		}
		if quotaUsedAfter != quotaUsedBefore {
			t.Fatalf("invitation_used changed! before: %d, after: %d", quotaUsedBefore, quotaUsedAfter)
		}

		// Verify version 1 draft was created
		var v1Count int
		err = pool.QueryRow(context.Background(), `
			SELECT count(*) FROM invitation_versions WHERE invitation_id = $1 AND version_number = 1 AND status = 'draft'
		`, inv.ID).Scan(&v1Count)
		if err != nil || v1Count != 1 {
			t.Fatalf("expected invitation_versions v1 draft, got count: %d, err: %v", v1Count, err)
		}
	})

	t.Run("GET /invitations returns list of own invitations with pagination and status filter", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)
		tokenB := templateFavoritesToken(t, fixture.partnerB)

		// Create 2 invitations for Partner A
		createBody1 := fmt.Sprintf(`{"title":"Inv 1","template_id":%d,"event":{"date":"2026-12-01"}}`, fixture.publishedTemplate)
		createBody2 := fmt.Sprintf(`{"title":"Inv 2","template_id":%d,"event":{"date":"2026-12-02"}}`, fixture.publishedTemplate)
		respA1 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", createBody1, tokenA)
		respA2 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", createBody2, tokenA)
		if respA1.Code != http.StatusCreated || respA2.Code != http.StatusCreated {
			t.Fatalf("failed setup invitations for A")
		}

		var parseInvID func(b []byte) int64 = func(b []byte) int64 {
			var r struct {
				Data struct {
					Invitation struct {
						ID int64 `json:"id"`
					} `json:"invitation"`
				} `json:"data"`
			}
			_ = json.Unmarshal(b, &r)
			return r.Data.Invitation.ID
		}
		inv2ID := parseInvID(respA2.Body.Bytes())

		// Update Inv 2 to 'published' directly in DB to test status filter
		_, err := pool.Exec(context.Background(), `UPDATE invitations SET status = 'published' WHERE id = $1`, inv2ID)
		if err != nil {
			t.Fatalf("update status to published: %v", err)
		}

		// 1. Partner B sees 0 invitations
		respListB := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations", "", tokenB)
		if respListB.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", respListB.Code, respListB.Body.String())
		}
		var listB struct {
			Data struct {
				Invitations []any `json:"invitations"`
				Pagination  struct {
					Total int64 `json:"total"`
				} `json:"pagination"`
			} `json:"data"`
		}
		_ = json.Unmarshal(respListB.Body.Bytes(), &listB)
		if len(listB.Data.Invitations) != 0 || listB.Data.Pagination.Total != 0 {
			t.Fatalf("Partner B should see 0 invitations, got %d", len(listB.Data.Invitations))
		}

		// 2. Partner A sees 2 invitations (all)
		respListA := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations", "", tokenA)
		if respListA.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", respListA.Code, respListA.Body.String())
		}
		var listA struct {
			Data struct {
				Invitations []struct {
					ID     int64  `json:"id"`
					Status string `json:"status"`
				} `json:"invitations"`
				Pagination struct {
					Total int64 `json:"total"`
				} `json:"pagination"`
			} `json:"data"`
		}
		_ = json.Unmarshal(respListA.Body.Bytes(), &listA)
		if len(listA.Data.Invitations) != 2 || listA.Data.Pagination.Total != 2 {
			t.Fatalf("Partner A expected 2 invitations, got %d", len(listA.Data.Invitations))
		}

		// 3. Status filter = draft
		respDraft := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations?status=draft", "", tokenA)
		if respDraft.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", respDraft.Code)
		}
		var listDraft struct {
			Data struct {
				Invitations []struct {
					ID     int64  `json:"id"`
					Status string `json:"status"`
				} `json:"invitations"`
			} `json:"data"`
		}
		_ = json.Unmarshal(respDraft.Body.Bytes(), &listDraft)
		if len(listDraft.Data.Invitations) != 1 || listDraft.Data.Invitations[0].Status != "draft" {
			t.Fatalf("expected 1 draft invitation, got %d", len(listDraft.Data.Invitations))
		}

		// 4. Invalid status filter returns 400
		respInvalidStatus := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations?status=invalid_val", "", tokenA)
		if respInvalidStatus.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for invalid status, got %d: %s", respInvalidStatus.Code, respInvalidStatus.Body.String())
		}

		// 5. Pagination limit capped to 50
		respLimit := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations?limit=100", "", tokenA)
		if respLimit.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", respLimit.Code)
		}
		var listLimit struct {
			Data struct {
				Pagination struct {
					Limit int64 `json:"limit"`
				} `json:"pagination"`
			} `json:"data"`
		}
		_ = json.Unmarshal(respLimit.Body.Bytes(), &listLimit)
		if listLimit.Data.Pagination.Limit != 50 {
			t.Fatalf("expected limit capped to 50, got %d", listLimit.Data.Pagination.Limit)
		}
	})

	t.Run("GET /invitations/:id returns detail of own invitation", func(t *testing.T) {
		fixture := createInvitationTestFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)
		tokenB := templateFavoritesToken(t, fixture.partnerB)

		// Create invitation for A
		createBody := fmt.Sprintf(`{
			"title": "Detail Test Wedding",
			"template_id": %d,
			"event": {
				"name": "Detail Event",
				"date": "2026-10-30",
				"location": "Jakarta Hall",
				"address": "Sudirman",
				"description": "Acara spesial"
			}
		}`, fixture.publishedTemplate)

		respCreate := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations", createBody, tokenA)
		if respCreate.Code != http.StatusCreated {
			t.Fatalf("create failed: %s", respCreate.Body.String())
		}

		var resCreate struct {
			Data struct {
				Invitation struct {
					ID int64 `json:"id"`
				} `json:"invitation"`
			} `json:"data"`
		}
		_ = json.Unmarshal(respCreate.Body.Bytes(), &resCreate)
		invID := resCreate.Data.Invitation.ID

		// 1. Own partner gets 200 OK with full details
		path := fmt.Sprintf("/api/v1/invitations/%d", invID)
		respGet := templateFavoritesRequest(engine, http.MethodGet, path, "", tokenA)
		if respGet.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", respGet.Code, respGet.Body.String())
		}

		var resDetail struct {
			Success bool `json:"success"`
			Data    struct {
				Invitation struct {
					ID       int64  `json:"id"`
					Title    string `json:"title"`
					Status   string `json:"status"`
					Template struct {
						ID   int64  `json:"id"`
						Name string `json:"name"`
						Slug string `json:"slug"`
					} `json:"template"`
					Event struct {
						ID          int64   `json:"id"`
						Name        string  `json:"name"`
						Date        string  `json:"date"`
						Location    *string `json:"location"`
						Address     *string `json:"address"`
						Description *string `json:"description"`
					} `json:"event"`
				} `json:"invitation"`
			} `json:"data"`
		}
		if err := json.Unmarshal(respGet.Body.Bytes(), &resDetail); err != nil {
			t.Fatalf("unmarshal detail response: %v", err)
		}

		inv := resDetail.Data.Invitation
		if inv.ID != invID || inv.Title != "Detail Test Wedding" {
			t.Fatalf("unexpected detail: %+v", inv)
		}
		if inv.Template.ID != fixture.publishedTemplate || inv.Template.Name == "" {
			t.Fatalf("template detail missing: %+v", inv.Template)
		}
		if inv.Event.Name != "Detail Event" || inv.Event.Date != "2026-10-30" || inv.Event.Location == nil || *inv.Event.Location != "Jakarta Hall" {
			t.Fatalf("event detail missing or incorrect: %+v", inv.Event)
		}

		// 2. Another partner (B) gets 404 Not Found (strict resource isolation)
		respOther := templateFavoritesRequest(engine, http.MethodGet, path, "", tokenB)
		if respOther.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for another user's invitation, got %d: %s", respOther.Code, respOther.Body.String())
		}

		// 3. Invalid IDs return 400 Bad Request
		for _, invalidID := range []string{"abc", "0", "-5"} {
			respInv := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations/"+invalidID, "", tokenA)
			if respInv.Code != http.StatusBadRequest {
				t.Errorf("id %s: expected 400, got %d", invalidID, respInv.Code)
			}
		}
	})
}
