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

	"github.com/jackc/pgx/v5/pgxpool"
)

type invitationContentFixture struct {
	marker             string
	partnerA           int64
	partnerB           int64
	designerUser       int64
	adminUser          int64
	pkgID              int64
	partnerPackageID   int64
	categoryID         int64
	templateID         int64
	otherTemplateID    int64
	sectionEditable    int64
	sectionNonEditable int64
	fieldGroom         int64
	fieldDate          int64
	fieldTime          int64
	fieldStatic        int64
	fieldLockedSection int64
	otherFieldID       int64

	draftInvitationA     int64
	draftInvitationASlug string
	draftVersionA        int64
	draftEventA          int64

	publishedInvitationA int64
	publishedVersionA    int64
	publishedEventA      int64

	draftInvitationB int64
}

func createInvitationContentFixture(t *testing.T, pool *pgxpool.Pool) invitationContentFixture {
	t.Helper()

	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "inv-cnt-" + hex.EncodeToString(randomBytes)
	fixture := invitationContentFixture{marker: marker}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{fixture.partnerA, fixture.partnerB, fixture.designerUser, fixture.adminUser}

		// 1. Delete invitation_events
		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitation_events
			WHERE invitation_id IN (
				SELECT id FROM invitations WHERE user_id = ANY($1)
			)
		`, userIDs)

		// 2. Delete invitations (cascades to invitation_versions and invitation_contents)
		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitations WHERE user_id = ANY($1)
		`, userIDs)

		// 3. Delete events
		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM events WHERE user_id = ANY($1)
		`, userIDs)

		// 4. Delete partner_packages
		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM partner_packages WHERE user_id = ANY($1)
		`, userIDs)

		// 5. Delete templates (cascades to template_sections and template_fields)
		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM templates WHERE id IN ($1, $2)
		`, fixture.templateID, fixture.otherTemplateID)

		// 6. Delete template_categories
		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM template_categories WHERE id = $1
		`, fixture.categoryID)

		// 7. Delete packages
		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM packages WHERE id = $1
		`, fixture.pkgID)

		// 8. Delete users
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
		VALUES ($1, $2, 'Content test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture template category: %v", err)
	}

	// Primary Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Primary template', 150000, 'publish')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Template", marker+"-tmpl").Scan(&fixture.templateID)
	if err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	// Other Template (to test foreign template field rejections)
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Other template', 150000, 'publish')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Other Template", marker+"-other-tmpl").Scan(&fixture.otherTemplateID)
	if err != nil {
		t.Fatalf("insert fixture other template: %v", err)
	}

	// Section 1: Editable
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Main Cover', 'cover', 10, true, true, '{"theme":"light"}')
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sectionEditable)
	if err != nil {
		t.Fatalf("insert fixture section editable: %v", err)
	}

	// Section 2: Non-editable section
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Fixed Footer', 'footer', 20, false, false, NULL)
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sectionNonEditable)
	if err != nil {
		t.Fatalf("insert fixture section non-editable: %v", err)
	}

	// Field 1: Groom Name (text, editable, max length 50, default "Default Groom")
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order, validation_rules)
		VALUES ($1, 'groom-name', 'Groom Name', 'text', 'Default Groom', true, true, 10, '{"maxLength": 50}')
		RETURNING id
	`, fixture.sectionEditable).Scan(&fixture.fieldGroom)
	if err != nil {
		t.Fatalf("insert fixture fieldGroom: %v", err)
	}

	// Field 2: Event Date (date, editable, format YYYY-MM-DD)
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order, validation_rules)
		VALUES ($1, 'event-date', 'Event Date', 'date', NULL, true, true, 20, '{"format": "YYYY-MM-DD"}')
		RETURNING id
	`, fixture.sectionEditable).Scan(&fixture.fieldDate)
	if err != nil {
		t.Fatalf("insert fixture fieldDate: %v", err)
	}

	// Field 3: Event Time (time, editable, format HH:mm)
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order, validation_rules)
		VALUES ($1, 'event-time', 'Event Time', 'time', NULL, false, true, 30, '{"format": "HH:mm"}')
		RETURNING id
	`, fixture.sectionEditable).Scan(&fixture.fieldTime)
	if err != nil {
		t.Fatalf("insert fixture fieldTime: %v", err)
	}

	// Field 4: Static watermark (text, is_editable false, default "InviteU Powered")
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order, validation_rules)
		VALUES ($1, 'watermark', 'Watermark', 'text', 'InviteU Powered', false, false, 40, NULL)
		RETURNING id
	`, fixture.sectionEditable).Scan(&fixture.fieldStatic)
	if err != nil {
		t.Fatalf("insert fixture fieldStatic: %v", err)
	}

	// Field 5: Inside non-editable section (is_editable true on field, but false on section)
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order, validation_rules)
		VALUES ($1, 'footer-text', 'Footer Text', 'text', 'Footer Default', false, true, 10, NULL)
		RETURNING id
	`, fixture.sectionNonEditable).Scan(&fixture.fieldLockedSection)
	if err != nil {
		t.Fatalf("insert fixture fieldLockedSection: %v", err)
	}

	// Section & Field in other template
	var otherSectionID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable)
		VALUES ($1, 'Other Section', 'general', 10, false, true)
		RETURNING id
	`, fixture.otherTemplateID).Scan(&otherSectionID)
	if err != nil {
		t.Fatalf("insert other section: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'other-field', 'Other Field', 'text', NULL, false, true, 10)
		RETURNING id
	`, otherSectionID).Scan(&fixture.otherFieldID)
	if err != nil {
		t.Fatalf("insert other field: %v", err)
	}

	// Helper to create invitation + event + version
	createInv := func(userID int64, title, slug, status string, tmplID int64) (int64, int64, int64) {
		var eid int64
		err := pool.QueryRow(ctx, `
			INSERT INTO events (user_id, name, date, start_time, end_time, location)
			VALUES ($1, $2, '2026-12-25', '10:00', '14:00', 'Grand Ballroom')
			RETURNING id
		`, userID, title+" Event").Scan(&eid)
		if err != nil {
			t.Fatalf("insert event: %v", err)
		}

		var invID int64
		err = pool.QueryRow(ctx, `
			INSERT INTO invitations (user_id, template_id, title, slug, status)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, userID, tmplID, title, slug, status).Scan(&invID)
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

		return invID, verID, eid
	}

	fixture.draftInvitationASlug = marker + "-draft-a"
	fixture.draftInvitationA, fixture.draftVersionA, fixture.draftEventA = createInv(
		fixture.partnerA, "Draft A", fixture.draftInvitationASlug, "draft", fixture.templateID,
	)

	fixture.publishedInvitationA, fixture.publishedVersionA, fixture.publishedEventA = createInv(
		fixture.partnerA, "Published A", marker+"-pub-a", "published", fixture.templateID,
	)

	fixture.draftInvitationB, _, _ = createInv(
		fixture.partnerB, "Draft B", marker+"-draft-b", "draft", fixture.templateID,
	)

	return fixture
}

func TestInvitationContentEndpoints(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)

	t.Run("authentication required on all content and patch routes", func(t *testing.T) {
		requests := []struct {
			method string
			path   string
			body   string
		}{
			{method: http.MethodGet, path: "/api/v1/invitations/1/content"},
			{method: http.MethodPatch, path: "/api/v1/invitations/1/content", body: `{"fields":[{"field_id":1,"value":"test"}]}`},
			{method: http.MethodPatch, path: "/api/v1/invitations/1", body: `{"title":"test"}`},
		}
		for _, req := range requests {
			resp := templateFavoritesRequest(engine, req.method, req.path, req.body, "")
			if resp.Code != http.StatusUnauthorized {
				t.Errorf("%s %s: expected %d, got %d", req.method, req.path, http.StatusUnauthorized, resp.Code)
			}
		}
	})

	t.Run("designer and admin rejected with 403", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)

		for _, uid := range []int64{fixture.designerUser, fixture.adminUser} {
			token := templateFavoritesToken(t, uid)
			requests := []struct {
				method string
				path   string
				body   string
			}{
				{method: http.MethodGet, path: fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)},
				{method: http.MethodPatch, path: fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA), body: `{"fields":[{"field_id":1,"value":"test"}]}`},
				{method: http.MethodPatch, path: fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA), body: `{"title":"test"}`},
			}
			for _, req := range requests {
				resp := templateFavoritesRequest(engine, req.method, req.path, req.body, token)
				if resp.Code != http.StatusForbidden {
					t.Errorf("user %d %s %s: expected 403, got %d", uid, req.method, req.path, resp.Code)
				}
			}
		}
	})

	t.Run("invalid invitation ID returns 400", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		paths := []string{
			"/api/v1/invitations/abc/content",
			"/api/v1/invitations/0/content",
			"/api/v1/invitations/-5/content",
		}
		for _, path := range paths {
			resp := templateFavoritesRequest(engine, http.MethodGet, path, "", tokenA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("GET %s: expected 400, got %d", path, resp.Code)
			}
		}
	})

	t.Run("invitation belonging to other partner returns 404 for GET and PATCH", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenB := templateFavoritesToken(t, fixture.partnerB)

		// Partner B accesses Partner A's invitation
		getURL := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		respGet := templateFavoritesRequest(engine, http.MethodGet, getURL, "", tokenB)
		if respGet.Code != http.StatusNotFound {
			t.Errorf("GET other partner invitation: expected 404, got %d", respGet.Code)
		}

		patchContentURL := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		respPatchContent := templateFavoritesRequest(engine, http.MethodPatch, patchContentURL, `{"fields":[{"field_id":1,"value":"test"}]}`, tokenB)
		if respPatchContent.Code != http.StatusNotFound {
			t.Errorf("PATCH other partner content: expected 404, got %d", respPatchContent.Code)
		}

		patchInvURL := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)
		respPatchInv := templateFavoritesRequest(engine, http.MethodPatch, patchInvURL, `{"title":"New Title"}`, tokenB)
		if respPatchInv.Code != http.StatusNotFound {
			t.Errorf("PATCH other partner invitation: expected 404, got %d", respPatchInv.Code)
		}
	})

	t.Run("GET /content returns 200 with default values when no content rows exist", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Success bool `json:"success"`
			Data    struct {
				InvitationID int64 `json:"invitation_id"`
				Version      struct {
					ID            int64  `json:"id"`
					VersionNumber int    `json:"version_number"`
					Status        string `json:"status"`
				} `json:"version"`
				TemplateID int64 `json:"template_id"`
				Sections   []struct {
					ID     int64  `json:"id"`
					Name   string `json:"name"`
					Fields []struct {
						ID           int64   `json:"id"`
						FieldKey     string  `json:"field_key"`
						DefaultValue *string `json:"default_value"`
						Value        *string `json:"value"`
					} `json:"fields"`
				} `json:"sections"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if body.Data.InvitationID != fixture.draftInvitationA {
			t.Errorf("expected invitation_id %d, got %d", fixture.draftInvitationA, body.Data.InvitationID)
		}
		if body.Data.Version.Status != "draft" {
			t.Errorf("expected version status draft, got %s", body.Data.Version.Status)
		}
		if len(body.Data.Sections) == 0 {
			t.Fatalf("expected sections, got 0")
		}

		// Verify default value for groom name
		foundGroom := false
		for _, sec := range body.Data.Sections {
			for _, fld := range sec.Fields {
				if fld.ID == fixture.fieldGroom {
					foundGroom = true
					if fld.Value == nil || *fld.Value != "Default Groom" {
						t.Errorf("expected value to fallback to default 'Default Groom', got %v", fld.Value)
					}
				}
			}
		}
		if !foundGroom {
			t.Errorf("fieldGroom not found in sections response")
		}
	})

	t.Run("GET /content returns 200 on published invitation returning published version", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.publishedInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 on published invitation, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Success bool `json:"success"`
			Data    struct {
				Version struct {
					ID     int64  `json:"id"`
					Status string `json:"status"`
				} `json:"version"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if body.Data.Version.ID != fixture.publishedVersionA {
			t.Errorf("expected published version %d, got %d", fixture.publishedVersionA, body.Data.Version.ID)
		}
		if body.Data.Version.Status != "published" {
			t.Errorf("expected version status published, got %s", body.Data.Version.Status)
		}
	})

	t.Run("PATCH /content fails with 409 on non-draft (published) invitation", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.publishedInvitationA)
		payload := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"Raka Pratama"}]}`, fixture.fieldGroom)
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusConflict {
			t.Errorf("expected 409 for editing non-draft invitation content, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("PATCH /content validates field limits: 0 fields and > 200 fields", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)

		// 0 fields
		respZero := templateFavoritesRequest(engine, http.MethodPatch, url, `{"fields":[]}`, tokenA)
		if respZero.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for 0 fields, got %d: %s", respZero.Code, respZero.Body.String())
		}

		// > 200 fields (201 items)
		items := make([]string, 201)
		for i := 0; i < 201; i++ {
			items[i] = fmt.Sprintf(`{"field_id":%d,"value":"val"}`, i+1)
		}
		payloadOver := fmt.Sprintf(`{"fields":[%s]}`, strings.Join(items, ","))
		respOver := templateFavoritesRequest(engine, http.MethodPatch, url, payloadOver, tokenA)
		if respOver.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for > 200 fields, got %d: %s", respOver.Code, respOver.Body.String())
		}
	})

	t.Run("PATCH /content validates duplicate field_id returns 400", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		payload := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"A"},{"field_id":%d,"value":"B"}]}`, fixture.fieldGroom, fixture.fieldGroom)
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for duplicate field_id, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("PATCH /content rejects field not belonging to template with 400", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		payload := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"Other Template Value"}]}`, fixture.otherFieldID)
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for field not belonging to template, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("PATCH /content rejects non-editable field and non-editable section with 400", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)

		// Non-editable field
		payloadField := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"Hacked Watermark"}]}`, fixture.fieldStatic)
		respField := templateFavoritesRequest(engine, http.MethodPatch, url, payloadField, tokenA)
		if respField.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for non-editable field, got %d: %s", respField.Code, respField.Body.String())
		}

		// Field in non-editable section
		payloadSection := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"Hacked Footer"}]}`, fixture.fieldLockedSection)
		respSection := templateFavoritesRequest(engine, http.MethodPatch, url, payloadSection, tokenA)
		if respSection.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for non-editable section, got %d: %s", respSection.Code, respSection.Body.String())
		}
	})

	t.Run("PATCH /content rejects value exceeding 5000 runes with 400", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		hugeVal := strings.Repeat("A", 5001)
		payload := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":%q}]}`, fixture.fieldGroom, hugeVal)
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for > 5000 runes, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("PATCH /content rejects validation_rules violations with 400 per field", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)

		// maxLength 50 violated
		longName := strings.Repeat("X", 51)
		payloadMax := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":%q}]}`, fixture.fieldGroom, longName)
		respMax := templateFavoritesRequest(engine, http.MethodPatch, url, payloadMax, tokenA)
		if respMax.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for maxLength violation, got %d: %s", respMax.Code, respMax.Body.String())
		}

		// invalid date format
		payloadDate := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"25-12-2026"}]}`, fixture.fieldDate)
		respDate := templateFavoritesRequest(engine, http.MethodPatch, url, payloadDate, tokenA)
		if respDate.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for date format violation, got %d: %s", respDate.Code, respDate.Body.String())
		}

		// invalid time format
		payloadTime := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"25:99"}]}`, fixture.fieldTime)
		respTime := templateFavoritesRequest(engine, http.MethodPatch, url, payloadTime, tokenA)
		if respTime.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for time format violation, got %d: %s", respTime.Code, respTime.Body.String())
		}
	})

	t.Run("PATCH /content all-or-nothing rollback when batch contains invalid field", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		// Field 1 is valid, Field 2 has invalid date format
		payload := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"Valid Groom Name"},{"field_id":%d,"value":"invalid-date"}]}`, fixture.fieldGroom, fixture.fieldDate)
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d: %s", resp.Code, resp.Body.String())
		}

		// Verify that "Valid Groom Name" was NOT saved to invitation_contents
		var count int
		err := pool.QueryRow(context.Background(), `
			SELECT COUNT(*) FROM invitation_contents
			WHERE invitation_version_id = $1 AND template_field_id = $2
		`, fixture.draftVersionA, fixture.fieldGroom).Scan(&count)
		if err != nil {
			t.Fatalf("query count: %v", err)
		}
		if count != 0 {
			t.Errorf("expected 0 rows saved due to rollback, got %d", count)
		}
	})

	t.Run("PATCH /content upserts valid fields successfully and returns updated_at and fields_updated", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		payload := fmt.Sprintf(`{
			"fields": [
				{"field_id": %d, "value": "Raka Pratama"},
				{"field_id": %d, "value": "2026-11-20"},
				{"field_id": %d, "value": "14:30"}
			]
		}`, fixture.fieldGroom, fixture.fieldDate, fixture.fieldTime)

		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Success bool `json:"success"`
			Data    struct {
				UpdatedAt     time.Time `json:"updated_at"`
				FieldsUpdated int       `json:"fields_updated"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if body.Data.FieldsUpdated != 3 {
			t.Errorf("expected 3 fields updated, got %d", body.Data.FieldsUpdated)
		}
		if body.Data.UpdatedAt.IsZero() {
			t.Errorf("expected valid updated_at timestamp")
		}

		// Check GET /content shows updated values
		respGet := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
		if respGet.Code != http.StatusOK {
			t.Fatalf("GET /content: expected 200, got %d", respGet.Code)
		}

		var getBody struct {
			Data struct {
				Sections []struct {
					Fields []struct {
						ID    int64   `json:"id"`
						Value *string `json:"value"`
					} `json:"fields"`
				} `json:"sections"`
			} `json:"data"`
		}
		if err := json.Unmarshal(respGet.Body.Bytes(), &getBody); err != nil {
			t.Fatalf("unmarshal get body: %v", err)
		}

		valuesMap := make(map[int64]string)
		for _, s := range getBody.Data.Sections {
			for _, f := range s.Fields {
				if f.Value != nil {
					valuesMap[f.ID] = *f.Value
				}
			}
		}

		if valuesMap[fixture.fieldGroom] != "Raka Pratama" {
			t.Errorf("expected Raka Pratama, got %s", valuesMap[fixture.fieldGroom])
		}
		if valuesMap[fixture.fieldDate] != "2026-11-20" {
			t.Errorf("expected 2026-11-20, got %s", valuesMap[fixture.fieldDate])
		}
		if valuesMap[fixture.fieldTime] != "14:30" {
			t.Errorf("expected 14:30, got %s", valuesMap[fixture.fieldTime])
		}
	})

	t.Run("PATCH /content idempotency: saving twice yields 1 row in invitation_contents", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		payload := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"First Save"}]}`, fixture.fieldGroom)
		resp1 := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp1.Code != http.StatusOK {
			t.Fatalf("first save failed: %d", resp1.Code)
		}

		payload2 := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"Second Save"}]}`, fixture.fieldGroom)
		resp2 := templateFavoritesRequest(engine, http.MethodPatch, url, payload2, tokenA)
		if resp2.Code != http.StatusOK {
			t.Fatalf("second save failed: %d", resp2.Code)
		}

		var rowCount int
		var savedVal string
		err := pool.QueryRow(context.Background(), `
			SELECT COUNT(*), MAX(value) FROM invitation_contents
			WHERE invitation_version_id = $1 AND template_field_id = $2
		`, fixture.draftVersionA, fixture.fieldGroom).Scan(&rowCount, &savedVal)
		if err != nil {
			t.Fatalf("query contents: %v", err)
		}

		if rowCount != 1 {
			t.Errorf("expected exactly 1 row after multiple upserts, got %d", rowCount)
		}
		if savedVal != "Second Save" {
			t.Errorf("expected updated value 'Second Save', got %q", savedVal)
		}
	})

	t.Run("PATCH /content empty string or null deletes content row and GET reverts to default", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)

		// 1. Set a custom value
		payload1 := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"Custom Groom"}]}`, fixture.fieldGroom)
		resp1 := templateFavoritesRequest(engine, http.MethodPatch, url, payload1, tokenA)
		if resp1.Code != http.StatusOK {
			t.Fatalf("set custom value: %d", resp1.Code)
		}

		// 2. Clear using empty string ""
		payloadClear := fmt.Sprintf(`{"fields":[{"field_id":%d,"value":""}]}`, fixture.fieldGroom)
		respClear := templateFavoritesRequest(engine, http.MethodPatch, url, payloadClear, tokenA)
		if respClear.Code != http.StatusOK {
			t.Fatalf("clear field: %d: %s", respClear.Code, respClear.Body.String())
		}

		// Check row was deleted
		var rowCount int
		err := pool.QueryRow(context.Background(), `
			SELECT COUNT(*) FROM invitation_contents
			WHERE invitation_version_id = $1 AND template_field_id = $2
		`, fixture.draftVersionA, fixture.fieldGroom).Scan(&rowCount)
		if err != nil {
			t.Fatalf("query row count: %v", err)
		}
		if rowCount != 0 {
			t.Errorf("expected content row to be deleted on empty value, got %d rows", rowCount)
		}

		// GET /content reverts to template default_value
		respGet := templateFavoritesRequest(engine, http.MethodGet, url, "", tokenA)
		if respGet.Code != http.StatusOK {
			t.Fatalf("get content: %d", respGet.Code)
		}

		var getBody struct {
			Data struct {
				Sections []struct {
					Fields []struct {
						ID    int64   `json:"id"`
						Value *string `json:"value"`
					} `json:"fields"`
				} `json:"sections"`
			} `json:"data"`
		}
		_ = json.Unmarshal(respGet.Body.Bytes(), &getBody)
		for _, sec := range getBody.Data.Sections {
			for _, fld := range sec.Fields {
				if fld.ID == fixture.fieldGroom {
					if fld.Value == nil || *fld.Value != "Default Groom" {
						t.Errorf("expected reverted value 'Default Groom', got %v", fld.Value)
					}
				}
			}
		}
	})

	t.Run("PATCH /invitations/:id empty body returns 400", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)

		respEmpty := templateFavoritesRequest(engine, http.MethodPatch, url, `{}`, tokenA)
		if respEmpty.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty body, got %d: %s", respEmpty.Code, respEmpty.Body.String())
		}

		respEmptyEvent := templateFavoritesRequest(engine, http.MethodPatch, url, `{"event":{}}`, tokenA)
		if respEmptyEvent.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty event object, got %d: %s", respEmptyEvent.Code, respEmptyEvent.Body.String())
		}
	})

	t.Run("PATCH /invitations/:id rejects non-draft invitation with 409", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d", fixture.publishedInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, `{"title":"Updated Title"}`, tokenA)
		if resp.Code != http.StatusConflict {
			t.Errorf("expected 409 for updating non-draft invitation, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("PATCH /invitations/:id rejects changing template_id with 400", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)
		payload := fmt.Sprintf(`{"template_id":%d}`, fixture.otherTemplateID)
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for changing template_id, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("PATCH /invitations/:id validates event date not YYYY-MM-DD", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)
		payload := `{"event":{"date":"invalid-date"}}`
		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for invalid event date format, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("PATCH /invitations/:id validates event time format and end_time < start_time", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)

		// Invalid time format
		respTimeFmt := templateFavoritesRequest(engine, http.MethodPatch, url, `{"event":{"start_time":"25:70"}}`, tokenA)
		if respTimeFmt.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for invalid time format, got %d: %s", respTimeFmt.Code, respTimeFmt.Body.String())
		}

		// end_time earlier than start_time
		respTimeOrder := templateFavoritesRequest(engine, http.MethodPatch, url, `{"event":{"start_time":"15:00","end_time":"10:00"}}`, tokenA)
		if respTimeOrder.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for end_time < start_time, got %d: %s", respTimeOrder.Code, respTimeOrder.Body.String())
		}
	})

	t.Run("PATCH /invitations/:id validates slug format and slug collision returns 409", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		url := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)

		// Invalid slug format
		respSlugFmt := templateFavoritesRequest(engine, http.MethodPatch, url, `{"slug":"Invalid Slug!@#"}`, tokenA)
		if respSlugFmt.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for invalid slug format, got %d: %s", respSlugFmt.Code, respSlugFmt.Body.String())
		}

		// Slug collision with partnerB's draft invitation slug
		var bSlug string
		err := pool.QueryRow(context.Background(), `SELECT slug FROM invitations WHERE id = $1`, fixture.draftInvitationB).Scan(&bSlug)
		if err != nil {
			t.Fatalf("query slug B: %v", err)
		}

		payloadCollision := fmt.Sprintf(`{"slug":%q}`, bSlug)
		respCollision := templateFavoritesRequest(engine, http.MethodPatch, url, payloadCollision, tokenA)
		if respCollision.Code != http.StatusConflict {
			t.Errorf("expected 409 for slug collision, got %d: %s", respCollision.Code, respCollision.Body.String())
		}
	})

	t.Run("PATCH /invitations/:id successfully updates title, slug, and event, and updates updated_at", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		// Get initial updated_at
		var initUpdatedAt time.Time
		err := pool.QueryRow(context.Background(), `SELECT updated_at FROM invitations WHERE id = $1`, fixture.draftInvitationA).Scan(&initUpdatedAt)
		if err != nil {
			t.Fatalf("query initial updated_at: %v", err)
		}

		// Small delay to ensure timestamp resolution advances
		time.Sleep(50 * time.Millisecond)

		url := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)
		newSlug := fixture.draftInvitationASlug + "-updated"
		payload := fmt.Sprintf(`{
			"title": "Updated Title Raka & Alya",
			"slug": %q,
			"event": {
				"name": "Resepsi Mewah",
				"date": "2026-11-28",
				"start_time": "11:00",
				"end_time": "15:00",
				"location": "The Ritz-Carlton",
				"address": "Mega Kuningan",
				"maps_url": "https://maps.google.com/test",
				"description": "Black Tie"
			}
		}`, newSlug)

		resp := templateFavoritesRequest(engine, http.MethodPatch, url, payload, tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Success bool `json:"success"`
			Data    struct {
				Invitation struct {
					Title     string    `json:"title"`
					Slug      string    `json:"slug"`
					UpdatedAt time.Time `json:"updated_at"`
					Event     struct {
						Name      string  `json:"name"`
						Date      string  `json:"date"`
						StartTime *string `json:"start_time"`
						EndTime   *string `json:"end_time"`
						Location  *string `json:"location"`
					} `json:"event"`
				} `json:"invitation"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if body.Data.Invitation.Title != "Updated Title Raka & Alya" {
			t.Errorf("expected updated title, got %s", body.Data.Invitation.Title)
		}
		if body.Data.Invitation.Slug != newSlug {
			t.Errorf("expected updated slug %s, got %s", newSlug, body.Data.Invitation.Slug)
		}
		if body.Data.Invitation.Event.Name != "Resepsi Mewah" {
			t.Errorf("expected updated event name, got %s", body.Data.Invitation.Event.Name)
		}
		if body.Data.Invitation.Event.Date != "2026-11-28" {
			t.Errorf("expected updated date, got %s", body.Data.Invitation.Event.Date)
		}
		if body.Data.Invitation.UpdatedAt.Before(initUpdatedAt) || body.Data.Invitation.UpdatedAt.Equal(initUpdatedAt) {
			t.Errorf("expected updated_at to advance, init: %v, new: %v", initUpdatedAt, body.Data.Invitation.UpdatedAt)
		}
	})

	t.Run("quota is untouched on draft content edits and invitation updates", func(t *testing.T) {
		fixture := createInvitationContentFixture(t, pool)

		var quotaBefore, usedBefore int
		err := pool.QueryRow(context.Background(), `
			SELECT invitation_quota, invitation_used FROM partner_packages WHERE id = $1
		`, fixture.partnerPackageID).Scan(&quotaBefore, &usedBefore)
		if err != nil {
			t.Fatalf("query quota before: %v", err)
		}

		tokenA := templateFavoritesToken(t, fixture.partnerA)
		urlContent := fmt.Sprintf("/api/v1/invitations/%d/content", fixture.draftInvitationA)
		_ = templateFavoritesRequest(engine, http.MethodPatch, urlContent, fmt.Sprintf(`{"fields":[{"field_id":%d,"value":"New Value"}]}`, fixture.fieldGroom), tokenA)

		urlInv := fmt.Sprintf("/api/v1/invitations/%d", fixture.draftInvitationA)
		_ = templateFavoritesRequest(engine, http.MethodPatch, urlInv, `{"title":"Title Changed"}`, tokenA)

		var quotaAfter, usedAfter int
		err = pool.QueryRow(context.Background(), `
			SELECT invitation_quota, invitation_used FROM partner_packages WHERE id = $1
		`, fixture.partnerPackageID).Scan(&quotaAfter, &usedAfter)
		if err != nil {
			t.Fatalf("query quota after: %v", err)
		}

		if quotaAfter != quotaBefore || usedAfter != usedBefore {
			t.Errorf("quota changed! before: %d/%d, after: %d/%d", usedBefore, quotaBefore, usedAfter, quotaAfter)
		}
	})
}
