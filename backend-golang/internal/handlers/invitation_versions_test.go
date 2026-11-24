package handlers_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type invitationVersionsFixture struct {
	marker           string
	partnerA         int64
	partnerB         int64
	designerUser     int64
	adminUser        int64
	pkgID            int64
	partnerPackageID int64
	categoryID       int64
	templateID       int64

	draftInvID     int64
	draftVerID     int64
	publishedInvID int64
	publishedVerID int64
}

func createInvitationVersionsFixture(t *testing.T, pool *pgxpool.Pool) invitationVersionsFixture {
	t.Helper()

	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "inv-ver-" + hex.EncodeToString(randomBytes)
	fixture := invitationVersionsFixture{marker: marker}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{fixture.partnerA, fixture.partnerB, fixture.designerUser, fixture.adminUser}

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitation_events
			WHERE invitation_id IN (
				SELECT id FROM invitations WHERE user_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitations WHERE user_id = ANY($1)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM events WHERE user_id = ANY($1)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM partner_packages WHERE user_id = ANY($1)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM templates WHERE id = $1
		`, fixture.templateID)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM template_categories WHERE id = $1
		`, fixture.categoryID)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM packages WHERE id = $1
		`, fixture.pkgID)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM users WHERE id = ANY($1)
		`, userIDs)
	})

	ctx := context.Background()

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

	// Base Package
	err := pool.QueryRow(ctx, `
		INSERT INTO packages (name, description, price, invitation_quota, status, duration_months)
		VALUES ($1, 'Test Package Description', 100000, 10, 'active', 1)
		RETURNING id
	`, marker+" Package").Scan(&fixture.pkgID)
	if err != nil {
		t.Fatalf("insert fixture package: %v", err)
	}

	// Active partner package
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
		VALUES ($1, $2, 'Versions test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	// Published Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Versions template', 150000, 'publish')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Template", marker+"-tmpl").Scan(&fixture.templateID)
	if err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	createInv := func(title, slug, status string) (int64, int64) {
		var eid int64
		err := pool.QueryRow(ctx, `
			INSERT INTO events (user_id, name, date, start_time, end_time, location)
			VALUES ($1, $2, '2026-12-25', '10:00:00', '14:00:00', 'Grand Ballroom')
			RETURNING id
		`, fixture.partnerA, title+" Event").Scan(&eid)
		if err != nil {
			t.Fatalf("insert event: %v", err)
		}

		var invID int64
		err = pool.QueryRow(ctx, `
			INSERT INTO invitations (user_id, template_id, title, slug, status)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, fixture.partnerA, fixture.templateID, title, slug, status).Scan(&invID)
		if err != nil {
			t.Fatalf("insert invitation: %v", err)
		}

		_, err = pool.Exec(ctx, `
			INSERT INTO invitation_events (invitation_id, event_id, sort_order)
			VALUES ($1, $2, 0)
		`, invID, eid)
		if err != nil {
			t.Fatalf("insert invitation_events: %v", err)
		}

		var verID int64
		err = pool.QueryRow(ctx, `
			INSERT INTO invitation_versions (invitation_id, version_number, status)
			VALUES ($1, 1, $2)
			RETURNING id
		`, invID, status).Scan(&verID)
		if err != nil {
			t.Fatalf("insert invitation_versions: %v", err)
		}

		if status == "published" {
			_, err = pool.Exec(ctx, `
				UPDATE invitations
				SET published_version_id = $1, published_at = CURRENT_TIMESTAMP
				WHERE id = $2
			`, verID, invID)
			if err != nil {
				t.Fatalf("update published_version_id: %v", err)
			}
		}

		return invID, verID
	}

	fixture.draftInvID, fixture.draftVerID = createInv(
		marker+" Draft Inv",
		marker+"-draft-inv",
		"draft",
	)

	fixture.publishedInvID, fixture.publishedVerID = createInv(
		marker+" Published Inv",
		marker+"-published-inv",
		"published",
	)

	return fixture
}

func TestGetInvitationVersions_Draft(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationVersionsFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	url := fmt.Sprintf("/api/v1/invitations/%d/versions", fixture.draftInvID)

	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    struct {
			InvitationID       int64  `json:"invitation_id"`
			PublishedVersionID *int64 `json:"published_version_id"`
			Versions           []struct {
				ID            int64     `json:"id"`
				VersionNumber int       `json:"version_number"`
				Status        string    `json:"status"`
				IsPublished   bool      `json:"is_published"`
				CreatedAt     time.Time `json:"created_at"`
				UpdatedAt     time.Time `json:"updated_at"`
			} `json:"versions"`
		} `json:"data"`
	}

	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if !body.Success {
		t.Errorf("expected success true, got false")
	}
	if body.Message != "Invitation versions retrieved successfully" {
		t.Errorf("unexpected message: %q", body.Message)
	}
	if body.Data.InvitationID != fixture.draftInvID {
		t.Errorf("expected invitation_id %d, got %d", fixture.draftInvID, body.Data.InvitationID)
	}
	if body.Data.PublishedVersionID != nil {
		t.Errorf("expected published_version_id to be nil for draft invitation, got %v", body.Data.PublishedVersionID)
	}
	if len(body.Data.Versions) != 1 {
		t.Fatalf("expected 1 version, got %d", len(body.Data.Versions))
	}

	v1 := body.Data.Versions[0]
	if v1.ID != fixture.draftVerID {
		t.Errorf("expected version ID %d, got %d", fixture.draftVerID, v1.ID)
	}
	if v1.VersionNumber != 1 {
		t.Errorf("expected version_number 1, got %d", v1.VersionNumber)
	}
	if v1.Status != "draft" {
		t.Errorf("expected status 'draft', got %q", v1.Status)
	}
	if v1.IsPublished {
		t.Errorf("expected is_published to be false for draft version, got true")
	}
}

func TestGetInvitationVersions_Published(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationVersionsFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	url := fmt.Sprintf("/api/v1/invitations/%d/versions", fixture.publishedInvID)

	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Data struct {
			InvitationID       int64  `json:"invitation_id"`
			PublishedVersionID *int64 `json:"published_version_id"`
			Versions           []struct {
				ID            int64  `json:"id"`
				VersionNumber int    `json:"version_number"`
				Status        string `json:"status"`
				IsPublished   bool   `json:"is_published"`
			} `json:"versions"`
		} `json:"data"`
	}

	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if body.Data.PublishedVersionID == nil || *body.Data.PublishedVersionID != fixture.publishedVerID {
		t.Errorf("expected published_version_id %d, got %v", fixture.publishedVerID, body.Data.PublishedVersionID)
	}
	if len(body.Data.Versions) != 1 {
		t.Fatalf("expected 1 version, got %d", len(body.Data.Versions))
	}

	v1 := body.Data.Versions[0]
	if v1.ID != fixture.publishedVerID {
		t.Errorf("expected version ID %d, got %d", fixture.publishedVerID, v1.ID)
	}
	if v1.Status != "published" {
		t.Errorf("expected status 'published', got %q", v1.Status)
	}
	if !v1.IsPublished {
		t.Errorf("expected is_published to be true, got false")
	}
}

func TestGetInvitationVersions_MultiVersion_OrderDesc(t *testing.T) {
	// Multi-version fixture created via SQL:
	// v1 published, v2 draft
	// Verify order: v2 first, then v1
	// Verify is_published: true only for v1
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationVersionsFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)
	ctx := context.Background()

	// Insert v2 draft directly in SQL on published invitation
	var v2ID int64
	err := pool.QueryRow(ctx, `
		INSERT INTO invitation_versions (invitation_id, version_number, status, created_at, updated_at)
		VALUES ($1, 2, 'draft', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '1 hour')
		RETURNING id
	`, fixture.publishedInvID).Scan(&v2ID)
	if err != nil {
		t.Fatalf("insert v2 version: %v", err)
	}

	url := fmt.Sprintf("/api/v1/invitations/%d/versions", fixture.publishedInvID)
	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Data struct {
			InvitationID       int64  `json:"invitation_id"`
			PublishedVersionID *int64 `json:"published_version_id"`
			Versions           []struct {
				ID            int64  `json:"id"`
				VersionNumber int    `json:"version_number"`
				Status        string `json:"status"`
				IsPublished   bool   `json:"is_published"`
			} `json:"versions"`
		} `json:"data"`
	}

	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if len(body.Data.Versions) != 2 {
		t.Fatalf("expected 2 versions, got %d", len(body.Data.Versions))
	}

	// Order must be version_number DESC: v2 first, then v1
	first := body.Data.Versions[0]
	if first.VersionNumber != 2 || first.ID != v2ID {
		t.Errorf("expected first item to be v2 (%d), got version_number %d (ID %d)", v2ID, first.VersionNumber, first.ID)
	}
	if first.Status != "draft" {
		t.Errorf("expected v2 status 'draft', got %q", first.Status)
	}
	if first.IsPublished {
		t.Errorf("expected v2 is_published to be false, got true")
	}

	second := body.Data.Versions[1]
	if second.VersionNumber != 1 || second.ID != fixture.publishedVerID {
		t.Errorf("expected second item to be v1 (%d), got version_number %d (ID %d)", fixture.publishedVerID, second.VersionNumber, second.ID)
	}
	if second.Status != "published" {
		t.Errorf("expected v1 status 'published', got %q", second.Status)
	}
	if !second.IsPublished {
		t.Errorf("expected v1 is_published to be true, got false")
	}
}

func TestGetInvitationVersions_NoVersionsFound(t *testing.T) {
	// Delete all versions for an existing invitation
	// Verify 200 with "versions": []
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationVersionsFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)
	ctx := context.Background()

	// Delete version rows for draftInvID
	_, err := pool.Exec(ctx, `
		DELETE FROM invitation_versions WHERE invitation_id = $1
	`, fixture.draftInvID)
	if err != nil {
		t.Fatalf("delete versions: %v", err)
	}

	url := fmt.Sprintf("/api/v1/invitations/%d/versions", fixture.draftInvID)
	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    struct {
			InvitationID       int64         `json:"invitation_id"`
			PublishedVersionID *int64        `json:"published_version_id"`
			Versions           []interface{} `json:"versions"`
		} `json:"data"`
	}

	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if !body.Success {
		t.Errorf("expected success true")
	}
	if body.Data.InvitationID != fixture.draftInvID {
		t.Errorf("expected invitation_id %d, got %d", fixture.draftInvID, body.Data.InvitationID)
	}
	if body.Data.Versions == nil {
		t.Errorf("expected versions to be an empty array, got nil")
	}
	if len(body.Data.Versions) != 0 {
		t.Errorf("expected 0 versions, got %d", len(body.Data.Versions))
	}
}

func TestGetInvitationVersions_PermissionsAndValidation(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationVersionsFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)
	urlA := fmt.Sprintf("/api/v1/invitations/%d/versions", fixture.draftInvID)

	t.Run("unauthenticated request returns 401", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, urlA, "", "")
		if resp.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", resp.Code)
		}
	})

	t.Run("designer and admin roles return 403", func(t *testing.T) {
		for _, uid := range []int64{fixture.designerUser, fixture.adminUser} {
			tok := templateFavoritesToken(t, uid)
			resp := templateFavoritesRequest(engine, http.MethodGet, urlA, "", tok)
			if resp.Code != http.StatusForbidden {
				t.Errorf("user %d: expected 403, got %d", uid, resp.Code)
			}
		}
	})

	t.Run("invitation owned by another partner returns 404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, urlA, "", tokenB)
		if resp.Code != http.StatusNotFound {
			t.Errorf("expected 404, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("non-existent invitation ID returns 404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations/999999999/versions", "", tokenA)
		if resp.Code != http.StatusNotFound {
			t.Errorf("expected 404, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("invalid invitation ID returns 400", func(t *testing.T) {
		for _, invalidID := range []string{"abc", "0", "-1"} {
			url := fmt.Sprintf("/api/v1/invitations/%s/versions", invalidID)
			resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("id %s: expected 400, got %d", invalidID, resp.Code)
			}
		}
	})
}
