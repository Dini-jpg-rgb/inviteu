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

type invitationPreviewFixture struct {
	marker           string
	partnerA         int64
	partnerB         int64
	designerUser     int64
	adminUser        int64
	pkgID            int64
	partnerPackageID int64
	categoryID       int64
	templateID       int64

	sec1 int64
	sec2 int64

	field1 int64
	field2 int64
	field3 int64

	draftReadyInvID    int64
	draftReadyVerID    int64
	draftIncompleteInv int64
	publishedInvID     int64
	expiredInvID       int64
}

func createInvitationPreviewFixture(t *testing.T, pool *pgxpool.Pool) invitationPreviewFixture {
	t.Helper()

	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "inv-prev-" + hex.EncodeToString(randomBytes)
	fixture := invitationPreviewFixture{marker: marker}

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

	// Active partner package with 5 quota (used 0)
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
		VALUES ($1, $2, 'Preview test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	// Published Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Preview template', 150000, 'publish')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Template", marker+"-tmpl").Scan(&fixture.templateID)
	if err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	// Section 1: sort_order 10
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'First Section', 'details', 10, true, true, '{"theme":"light"}')
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sec1)
	if err != nil {
		t.Fatalf("insert fixture sec1: %v", err)
	}

	// Section 2: sort_order 20
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Second Section', 'gallery', 20, false, true, NULL)
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sec2)
	if err != nil {
		t.Fatalf("insert fixture sec2: %v", err)
	}

	// Field 1 in Sec 1: sort_order 10, default "Default 1", required true
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'groom-name', 'Groom Name', 'text', 'Default Groom', true, true, 10)
		RETURNING id
	`, fixture.sec1).Scan(&fixture.field1)
	if err != nil {
		t.Fatalf("insert fixture field1: %v", err)
	}

	// Field 2 in Sec 1: sort_order 20, default NULL, required true
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'bride-name', 'Bride Name', 'text', NULL, true, true, 20)
		RETURNING id
	`, fixture.sec1).Scan(&fixture.field2)
	if err != nil {
		t.Fatalf("insert fixture field2: %v", err)
	}

	// Field 3 in Sec 2: sort_order 10, default "Default 3", required false
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'photo-url', 'Photo URL', 'text', 'https://example.test/default.jpg', false, true, 10)
		RETURNING id
	`, fixture.sec2).Scan(&fixture.field3)
	if err != nil {
		t.Fatalf("insert fixture field3: %v", err)
	}

	createInv := func(title, slug, status string, withEventLocation bool) (int64, int64) {
		var loc *string
		if withEventLocation {
			l := "Grand Ballroom"
			loc = &l
		}

		var eid int64
		err := pool.QueryRow(ctx, `
			INSERT INTO events (user_id, name, date, start_time, end_time, location)
			VALUES ($1, $2, '2026-12-25', '10:00:00', '14:00:00', $3)
			RETURNING id
		`, fixture.partnerA, title+" Event", loc).Scan(&eid)
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
		} else if status == "expired" {
			_, err = pool.Exec(ctx, `
				UPDATE invitations
				SET published_version_id = $1,
				    published_at = CURRENT_TIMESTAMP - INTERVAL '60 days',
				    expired_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
				WHERE id = $2
			`, verID, invID)
			if err != nil {
				t.Fatalf("update expired invitation: %v", err)
			}
		}

		return invID, verID
	}

	// 1. Draft Ready (event complete, field2 filled)
	fixture.draftReadyInvID, fixture.draftReadyVerID = createInv(
		marker+" Ready Draft",
		marker+"-ready-draft",
		"draft",
		true,
	)
	_, _ = pool.Exec(ctx, `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES ($1, $2, 'Bride Sarah')
	`, fixture.draftReadyVerID, fixture.field2)

	// 2. Draft Incomplete (event has no location, field2 not filled)
	fixture.draftIncompleteInv, _ = createInv(
		marker+" Incomplete Draft",
		marker+"-inc-draft",
		"draft",
		false,
	)

	// 3. Published
	fixture.publishedInvID, _ = createInv(
		marker+" Published",
		marker+"-published",
		"published",
		true,
	)

	// 4. Expired
	fixture.expiredInvID, _ = createInv(
		marker+" Expired",
		marker+"-expired",
		"expired",
		true,
	)

	return fixture
}

func TestPreviewInvitation_Success_DraftReady(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPreviewFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	url := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.draftReadyInvID)

	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    struct {
			Invitation struct {
				ID          int64      `json:"id"`
				Title       string     `json:"title"`
				Slug        string     `json:"slug"`
				Status      string     `json:"status"`
				PublishedAt *time.Time `json:"published_at"`
				ExpiredAt   *time.Time `json:"expired_at"`
			} `json:"invitation"`
			Template struct {
				ID   int64  `json:"id"`
				Name string `json:"name"`
				Slug string `json:"slug"`
			} `json:"template"`
			Event struct {
				ID       int64   `json:"id"`
				Name     string  `json:"name"`
				Date     string  `json:"date"`
				Location *string `json:"location"`
			} `json:"event"`
			Version struct {
				ID            int64  `json:"id"`
				VersionNumber int    `json:"version_number"`
				Status        string `json:"status"`
			} `json:"version"`
			Sections []struct {
				ID        int64  `json:"id"`
				Name      string `json:"name"`
				SortOrder int    `json:"sort_order"`
				Fields    []struct {
					ID        int64   `json:"id"`
					FieldKey  string  `json:"field_key"`
					Value     *string `json:"value"`
					SortOrder int     `json:"sort_order"`
				} `json:"fields"`
			} `json:"sections"`
			Readiness *struct {
				IsReady bool              `json:"is_ready"`
				Errors  map[string]string `json:"errors"`
			} `json:"readiness"`
		} `json:"data"`
	}

	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if !body.Success {
		t.Errorf("expected success true, got false")
	}
	if body.Message != "Invitation preview retrieved successfully" {
		t.Errorf("unexpected message: %q", body.Message)
	}
	if body.Data.Invitation.Status != "draft" {
		t.Errorf("expected status 'draft', got %q", body.Data.Invitation.Status)
	}
	if body.Data.Template.ID != fixture.templateID {
		t.Errorf("expected template ID %d, got %d", fixture.templateID, body.Data.Template.ID)
	}
	if body.Data.Event.Location == nil || *body.Data.Event.Location != "Grand Ballroom" {
		t.Errorf("unexpected event location: %v", body.Data.Event.Location)
	}
	if body.Data.Readiness == nil {
		t.Fatalf("expected readiness not nil for draft")
	}
	if !body.Data.Readiness.IsReady {
		t.Errorf("expected readiness.is_ready to be true, got false (errors: %v)", body.Data.Readiness.Errors)
	}
	if len(body.Data.Readiness.Errors) != 0 {
		t.Errorf("expected 0 readiness errors, got: %v", body.Data.Readiness.Errors)
	}
}

func TestPreviewInvitation_ReadinessIncomplete(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPreviewFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	url := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.draftIncompleteInv)

	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Data struct {
			Readiness *struct {
				IsReady bool              `json:"is_ready"`
				Errors  map[string]string `json:"errors"`
			} `json:"readiness"`
		} `json:"data"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if body.Data.Readiness == nil {
		t.Fatalf("expected readiness not nil for draft")
	}
	if body.Data.Readiness.IsReady {
		t.Errorf("expected readiness.is_ready false for incomplete draft")
	}
	if _, ok := body.Data.Readiness.Errors["event.location"]; !ok {
		t.Errorf("expected error 'event.location', got: %v", body.Data.Readiness.Errors)
	}
	field2Key := fmt.Sprintf("fields.%d", fixture.field2)
	if _, ok := body.Data.Readiness.Errors[field2Key]; !ok {
		t.Errorf("expected error %q, got: %v", field2Key, body.Data.Readiness.Errors)
	}
}

func TestPreviewInvitation_ReadinessNullForNonDraft(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPreviewFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)

	t.Run("published invitation returns readiness null", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.publishedInvID)
		resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
		}

		var rawMap map[string]interface{}
		_ = json.Unmarshal(resp.Body.Bytes(), &rawMap)
		data := rawMap["data"].(map[string]interface{})
		if data["readiness"] != nil {
			t.Errorf("expected readiness to be null for published invitation, got: %v", data["readiness"])
		}
	})

	t.Run("expired invitation returns readiness null", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.expiredInvID)
		resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
		}

		var rawMap map[string]interface{}
		_ = json.Unmarshal(resp.Body.Bytes(), &rawMap)
		data := rawMap["data"].(map[string]interface{})
		if data["readiness"] != nil {
			t.Errorf("expected readiness to be null for expired invitation, got: %v", data["readiness"])
		}
	})
}

func TestPreviewInvitation_EffectiveValues(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPreviewFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)

	// Field 1: has default "Default Groom", stored value is spaces-only "   "
	// Should fall back to default "Default Groom"
	_, _ = pool.Exec(context.Background(), `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES ($1, $2, '   ')
	`, fixture.draftReadyVerID, fixture.field1)

	// Field 3: has default "https://example.test/default.jpg", no row in invitation_contents
	// Should use default value

	url := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.draftReadyInvID)
	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Data struct {
			Sections []struct {
				Fields []struct {
					ID    int64   `json:"id"`
					Value *string `json:"value"`
				} `json:"fields"`
			} `json:"sections"`
		} `json:"data"`
	}
	_ = json.Unmarshal(resp.Body.Bytes(), &body)

	fieldValMap := make(map[int64]*string)
	for _, sec := range body.Data.Sections {
		for _, f := range sec.Fields {
			fieldValMap[f.ID] = f.Value
		}
	}

	// Field 1: spaces-only -> fallback to default
	val1 := fieldValMap[fixture.field1]
	if val1 == nil || *val1 != "Default Groom" {
		t.Errorf("expected field 1 effective value 'Default Groom', got: %v", val1)
	}

	// Field 2: has stored value "Bride Sarah"
	val2 := fieldValMap[fixture.field2]
	if val2 == nil || *val2 != "Bride Sarah" {
		t.Errorf("expected field 2 effective value 'Bride Sarah', got: %v", val2)
	}

	// Field 3: no stored row -> fallback to default
	val3 := fieldValMap[fixture.field3]
	if val3 == nil || *val3 != "https://example.test/default.jpg" {
		t.Errorf("expected field 3 effective value 'https://example.test/default.jpg', got: %v", val3)
	}
}

func TestPreviewInvitation_SectionAndFieldOrdering(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPreviewFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)

	url := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.draftReadyInvID)
	resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Data struct {
			Sections []struct {
				ID        int64 `json:"id"`
				SortOrder int   `json:"sort_order"`
				Fields    []struct {
					ID        int64 `json:"id"`
					SortOrder int   `json:"sort_order"`
				} `json:"fields"`
			} `json:"sections"`
		} `json:"data"`
	}
	_ = json.Unmarshal(resp.Body.Bytes(), &body)

	if len(body.Data.Sections) < 2 {
		t.Fatalf("expected at least 2 sections, got %d", len(body.Data.Sections))
	}

	// Sections must be sorted by sort_order ASC
	if body.Data.Sections[0].ID != fixture.sec1 || body.Data.Sections[1].ID != fixture.sec2 {
		t.Errorf("sections not sorted properly: %v", body.Data.Sections)
	}

	// Fields in Section 1 must be sorted by sort_order ASC (field1 has sort_order 10, field2 has 20)
	sec1Fields := body.Data.Sections[0].Fields
	if len(sec1Fields) < 2 {
		t.Fatalf("expected at least 2 fields in section 1, got %d", len(sec1Fields))
	}
	if sec1Fields[0].ID != fixture.field1 || sec1Fields[1].ID != fixture.field2 {
		t.Errorf("fields in section 1 not sorted properly: %v", sec1Fields)
	}
}

func TestPreviewInvitation_SideEffectFree(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPreviewFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)
	ctx := context.Background()

	// Capture initial state
	var (
		initStatus    string
		initUpdatedAt time.Time
	)
	err := pool.QueryRow(ctx, `
		SELECT status, updated_at FROM invitations WHERE id = $1
	`, fixture.draftReadyInvID).Scan(&initStatus, &initUpdatedAt)
	if err != nil {
		t.Fatalf("query initial invitation: %v", err)
	}

	var initUsed int
	err = pool.QueryRow(ctx, `
		SELECT invitation_used FROM partner_packages WHERE id = $1
	`, fixture.partnerPackageID).Scan(&initUsed)
	if err != nil {
		t.Fatalf("query initial package used: %v", err)
	}

	// Call preview 5 times
	url := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.draftReadyInvID)
	for i := 0; i < 5; i++ {
		resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("iteration %d: expected 200, got %d", i, resp.Code)
		}
	}

	// Verify nothing changed
	var (
		finalStatus    string
		finalUpdatedAt time.Time
	)
	_ = pool.QueryRow(ctx, `
		SELECT status, updated_at FROM invitations WHERE id = $1
	`, fixture.draftReadyInvID).Scan(&finalStatus, &finalUpdatedAt)

	if finalStatus != initStatus {
		t.Errorf("status changed from %q to %q", initStatus, finalStatus)
	}
	if !finalUpdatedAt.Equal(initUpdatedAt) {
		t.Errorf("updated_at changed from %v to %v", initUpdatedAt, finalUpdatedAt)
	}

	var finalUsed int
	_ = pool.QueryRow(ctx, `
		SELECT invitation_used FROM partner_packages WHERE id = $1
	`, fixture.partnerPackageID).Scan(&finalUsed)

	if finalUsed != initUsed {
		t.Errorf("package invitation_used changed from %d to %d", initUsed, finalUsed)
	}
}

func TestPreviewInvitation_PermissionsAndValidation(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPreviewFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)
	urlA := fmt.Sprintf("/api/v1/invitations/%d/preview", fixture.draftReadyInvID)

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
			t.Errorf("expected 404, got %d", resp.Code)
		}
	})

	t.Run("non-existent invitation ID returns 404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations/999999999/preview", "", tokenA)
		if resp.Code != http.StatusNotFound {
			t.Errorf("expected 404, got %d", resp.Code)
		}
	})

	t.Run("invalid invitation ID returns 400", func(t *testing.T) {
		for _, invalidID := range []string{"abc", "0", "-5"} {
			url := fmt.Sprintf("/api/v1/invitations/%s/preview", invalidID)
			resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("id %s: expected 400, got %d", invalidID, resp.Code)
			}
		}
	})
}
