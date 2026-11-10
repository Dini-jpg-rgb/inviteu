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

type publicInvitationFixture struct {
	marker             string
	partnerA           int64
	partnerB           int64
	designerUser       int64
	adminUser          int64
	categoryID         int64
	templateID         int64
	sec1ID             int64
	sec2ID             int64
	secEmptyID         int64
	fld1ID             int64
	fld2ID             int64
	fld3ID             int64
	eventAID           int64
	eventBID           int64
	publishedInvID     int64
	publishedSlug      string
	draftInvID         int64
	draftSlug          string
	expiredInvID       int64
	expiredSlug        string
	corruptNullVerID   int64
	corruptNullSlug    string
	corruptWrongVerID  int64
	corruptWrongSlug   string
	corruptNoEventID   int64
	corruptNoEventSlug string
	otherInvID         int64
	otherSlug          string
}

func createPublicInvitationFixture(t *testing.T, pool *pgxpool.Pool) publicInvitationFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "pubinv-" + hex.EncodeToString(randomBytes)

	fixture := publicInvitationFixture{
		marker:             marker,
		publishedSlug:      marker + "-pub",
		draftSlug:          marker + "-draft",
		expiredSlug:        marker + "-exp",
		corruptNullSlug:    marker + "-corrupt-null",
		corruptWrongSlug:   marker + "-corrupt-wrong",
		corruptNoEventSlug: marker + "-corrupt-noevent",
		otherSlug:          marker + "-other",
	}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{fixture.partnerA, fixture.partnerB, fixture.designerUser, fixture.adminUser}

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitation_contents WHERE invitation_version_id IN (
				SELECT id FROM invitation_versions WHERE invitation_id IN (
					SELECT id FROM invitations WHERE user_id = ANY($1)
				)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitation_versions WHERE invitation_id IN (
				SELECT id FROM invitations WHERE user_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitation_events WHERE invitation_id IN (
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
			DELETE FROM template_fields WHERE template_section_id IN (
				SELECT id FROM template_sections WHERE template_id = $1
			)
		`, fixture.templateID)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM template_sections WHERE template_id = $1
		`, fixture.templateID)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM templates WHERE id = $1
		`, fixture.templateID)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM template_categories WHERE id = $1
		`, fixture.categoryID)

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

	// Template Category
	err := pool.QueryRow(ctx, `
		INSERT INTO template_categories (name, slug, description)
		VALUES ($1, $2, 'Public invitation test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	// Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Public invitation template', 100000, 'published')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Template", marker+"-tmpl").Scan(&fixture.templateID)
	if err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	// Template Sections: Sec1 (sort_order 10), Sec2 (sort_order 20), SecEmpty (sort_order 30)
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Cover Section', 'cover', 10, true, true, '{"theme":"romantic"}')
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sec1ID)
	if err != nil {
		t.Fatalf("insert fixture sec1: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Quote Section', 'quote', 20, false, true, NULL)
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sec2ID)
	if err != nil {
		t.Fatalf("insert fixture sec2: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Empty Section', 'extra', 30, false, true, '{"layout":"grid"}')
		RETURNING id
	`, fixture.templateID).Scan(&fixture.secEmptyID)
	if err != nil {
		t.Fatalf("insert fixture secEmpty: %v", err)
	}

	// Template Fields: fld1 (sec1, sort 10), fld2 (sec1, sort 20), fld3 (sec2, sort 10)
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'groom_name', 'Nama Pria', 'text', 'Default Groom', true, true, 10)
		RETURNING id
	`, fixture.sec1ID).Scan(&fixture.fld1ID)
	if err != nil {
		t.Fatalf("insert fixture fld1: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'bride_name', 'Nama Wanita', 'text', 'Default Bride', true, true, 20)
		RETURNING id
	`, fixture.sec1ID).Scan(&fixture.fld2ID)
	if err != nil {
		t.Fatalf("insert fixture fld2: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'quote_text', 'Kutipan', 'text', 'Default Quote', false, true, 10)
		RETURNING id
	`, fixture.sec2ID).Scan(&fixture.fld3ID)
	if err != nil {
		t.Fatalf("insert fixture fld3: %v", err)
	}

	// Events
	err = pool.QueryRow(ctx, `
		INSERT INTO events (user_id, name, description, date, start_time, end_time, location, address, maps_url)
		VALUES ($1, 'Akad Nikah', 'Resepsi sakral', '2026-12-31', '09:00:00', '13:00:00', 'Gedung Pernikahan Indah', 'Jl. Cinta Sejati No. 1', 'https://maps.example.test/love')
		RETURNING id
	`, fixture.partnerA).Scan(&fixture.eventAID)
	if err != nil {
		t.Fatalf("insert fixture event A: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO events (user_id, name, description, date, start_time, end_time, location, address, maps_url)
		VALUES ($1, 'Acara Partner B', 'Acara kedua', '2027-01-15', '10:00:00', '14:00:00', 'Hotel Mewah', 'Jl. Harmoni No. 2', 'https://maps.example.test/b')
		RETURNING id
	`, fixture.partnerB).Scan(&fixture.eventBID)
	if err != nil {
		t.Fatalf("insert fixture event B: %v", err)
	}

	// 1. Published Invitation for Partner A
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at, expired_at)
		VALUES ($1, $2, 'Wedding of Romeo & Juliet', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL)
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.publishedSlug).Scan(&fixture.publishedInvID)
	if err != nil {
		t.Fatalf("insert published invitation: %v", err)
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO invitation_events (invitation_id, event_id, sort_order)
		VALUES ($1, $2, 0)
	`, fixture.publishedInvID, fixture.eventAID)
	if err != nil {
		t.Fatalf("link published invitation event: %v", err)
	}

	// Versions for Published Invitation: v1 (published), v2 (draft)
	var pubV1ID, pubV2ID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO invitation_versions (invitation_id, version_number, status)
		VALUES ($1, 1, 'published')
		RETURNING id
	`, fixture.publishedInvID).Scan(&pubV1ID)
	if err != nil {
		t.Fatalf("insert pubV1: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO invitation_versions (invitation_id, version_number, status)
		VALUES ($1, 2, 'draft')
		RETURNING id
	`, fixture.publishedInvID).Scan(&pubV2ID)
	if err != nil {
		t.Fatalf("insert pubV2: %v", err)
	}

	// Point published_version_id to v1
	_, err = pool.Exec(ctx, `
		UPDATE invitations SET published_version_id = $1 WHERE id = $2
	`, pubV1ID, fixture.publishedInvID)
	if err != nil {
		t.Fatalf("set published_version_id: %v", err)
	}

	// Contents for v1 (published version):
	// fld1 = 'Romeo Montagu'
	// fld2 = '   ' (whitespace only, should fallback to 'Default Bride')
	// fld3 = 'Love is eternal'
	_, err = pool.Exec(ctx, `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES
			($1, $2, 'Romeo Montagu'),
			($1, $3, '   '),
			($1, $4, 'Love is eternal')
	`, pubV1ID, fixture.fld1ID, fixture.fld2ID, fixture.fld3ID)
	if err != nil {
		t.Fatalf("insert contents for pubV1: %v", err)
	}

	// Contents for v2 (draft version):
	// fld1 = 'Draft Value Not Published'
	_, err = pool.Exec(ctx, `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES ($1, $2, 'Draft Value Not Published')
	`, pubV2ID, fixture.fld1ID)
	if err != nil {
		t.Fatalf("insert contents for pubV2: %v", err)
	}

	// 2. Draft Invitation
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status)
		VALUES ($1, $2, 'Draft Invitation', $3, 'draft')
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.draftSlug).Scan(&fixture.draftInvID)
	if err != nil {
		t.Fatalf("insert draft invitation: %v", err)
	}
	_, _ = pool.Exec(ctx, `
		INSERT INTO invitation_events (invitation_id, event_id, sort_order)
		VALUES ($1, $2, 0)
	`, fixture.draftInvID, fixture.eventAID)

	// 3. Expired Invitation
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at, expired_at)
		VALUES ($1, $2, 'Expired Invitation', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '1 hour')
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.expiredSlug).Scan(&fixture.expiredInvID)
	if err != nil {
		t.Fatalf("insert expired invitation: %v", err)
	}
	_, _ = pool.Exec(ctx, `
		INSERT INTO invitation_events (invitation_id, event_id, sort_order)
		VALUES ($1, $2, 0)
	`, fixture.expiredInvID, fixture.eventAID)

	// 4. Corrupt Invitation: published_version_id is NULL
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at, published_version_id)
		VALUES ($1, $2, 'Corrupt Null Version', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL)
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.corruptNullSlug).Scan(&fixture.corruptNullVerID)
	if err != nil {
		t.Fatalf("insert corrupt null version invitation: %v", err)
	}
	_, _ = pool.Exec(ctx, `
		INSERT INTO invitation_events (invitation_id, event_id, sort_order)
		VALUES ($1, $2, 0)
	`, fixture.corruptNullVerID, fixture.eventAID)

	// 5. Corrupt Invitation: published_version_id belongs to another invitation
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at, published_version_id)
		VALUES ($1, $2, 'Corrupt Wrong Version', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day', $4)
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.corruptWrongSlug, pubV1ID).Scan(&fixture.corruptWrongVerID)
	if err != nil {
		t.Fatalf("insert corrupt wrong version invitation: %v", err)
	}
	_, _ = pool.Exec(ctx, `
		INSERT INTO invitation_events (invitation_id, event_id, sort_order)
		VALUES ($1, $2, 0)
	`, fixture.corruptWrongVerID, fixture.eventAID)

	// 6. Corrupt Invitation: has valid published version but no event linked
	var corruptNoEventVerID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at)
		VALUES ($1, $2, 'Corrupt No Event', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day')
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.corruptNoEventSlug).Scan(&fixture.corruptNoEventID)
	if err != nil {
		t.Fatalf("insert corrupt no event invitation: %v", err)
	}
	err = pool.QueryRow(ctx, `
		INSERT INTO invitation_versions (invitation_id, version_number, status)
		VALUES ($1, 1, 'published')
		RETURNING id
	`, fixture.corruptNoEventID).Scan(&corruptNoEventVerID)
	if err != nil {
		t.Fatalf("insert corrupt no event version: %v", err)
	}
	_, _ = pool.Exec(ctx, `
		UPDATE invitations SET published_version_id = $1 WHERE id = $2
	`, corruptNoEventVerID, fixture.corruptNoEventID)

	// 7. Other Invitation for Partner B (to verify data isolation)
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at)
		VALUES ($1, $2, 'Partner B Wedding', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '2 days')
		RETURNING id
	`, fixture.partnerB, fixture.templateID, fixture.otherSlug).Scan(&fixture.otherInvID)
	if err != nil {
		t.Fatalf("insert partner B invitation: %v", err)
	}
	_, _ = pool.Exec(ctx, `
		INSERT INTO invitation_events (invitation_id, event_id, sort_order)
		VALUES ($1, $2, 0)
	`, fixture.otherInvID, fixture.eventBID)

	var otherVerID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO invitation_versions (invitation_id, version_number, status)
		VALUES ($1, 1, 'published')
		RETURNING id
	`, fixture.otherInvID).Scan(&otherVerID)
	if err != nil {
		t.Fatalf("insert other version: %v", err)
	}
	_, _ = pool.Exec(ctx, `
		UPDATE invitations SET published_version_id = $1 WHERE id = $2
	`, otherVerID, fixture.otherInvID)
	_, _ = pool.Exec(ctx, `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES ($1, $2, 'Partner B Specific Groom')
	`, otherVerID, fixture.fld1ID)

	return fixture
}

func checkForbiddenKeysRecursively(t *testing.T, data interface{}, path string) {
	t.Helper()

	forbiddenKeys := map[string]bool{
		"user_id":               true,
		"partner":               true,
		"quota":                 true,
		"package":               true,
		"status":                true,
		"readiness":             true,
		"expired_at":            true,
		"validation_rules":      true,
		"is_required":           true,
		"is_editable":           true,
		"default_value":         true,
		"invitation_id":         true,
		"version_id":            true,
		"content_id":            true,
		"invitation_version_id": true,
		"template_field_id":     true,
		"template_section_id":   true,
	}

	switch v := data.(type) {
	case map[string]interface{}:
		for k, val := range v {
			currentPath := path + "." + k
			if forbiddenKeys[k] {
				t.Errorf("found forbidden key %q at path %q", k, currentPath)
			}
			// Top-level object ID prohibitions
			if k == "id" && (path == ".data.invitation" || path == ".data.template" || path == ".data.event") {
				t.Errorf("found prohibited id field at %q", currentPath)
			}
			checkForbiddenKeysRecursively(t, val, currentPath)
		}
	case []interface{}:
		for i, item := range v {
			checkForbiddenKeysRecursively(t, item, fmt.Sprintf("%s[%d]", path, i))
		}
	}
}

func TestGetPublicInvitation(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createPublicInvitationFixture(t, pool)

	t.Run("sukses_published_mengambil_versi_terbit_dan_fallback_default_value", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug, "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		if cc := resp.Header().Get("Cache-Control"); cc != "public, max-age=60" {
			t.Errorf("expected Cache-Control 'public, max-age=60', got %q", cc)
		}

		var body struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Data    struct {
				Invitation struct {
					Title       string  `json:"title"`
					Slug        string  `json:"slug"`
					PublishedAt *string `json:"published_at"`
				} `json:"invitation"`
				Template struct {
					Name string `json:"name"`
					Slug string `json:"slug"`
				} `json:"template"`
				Event struct {
					Name        string  `json:"name"`
					Date        string  `json:"date"`
					StartTime   *string `json:"start_time"`
					EndTime     *string `json:"end_time"`
					Location    *string `json:"location"`
					Address     *string `json:"address"`
					MapsURL     *string `json:"maps_url"`
					Description *string `json:"description"`
				} `json:"event"`
				Sections []struct {
					ID        int64           `json:"id"`
					Name      string          `json:"name"`
					Type      string          `json:"type"`
					SortOrder int             `json:"sort_order"`
					Settings  json.RawMessage `json:"settings"`
					Fields    []struct {
						ID        int64   `json:"id"`
						FieldKey  string  `json:"field_key"`
						Label     string  `json:"label"`
						FieldType string  `json:"field_type"`
						Value     *string `json:"value"`
						SortOrder int     `json:"sort_order"`
					} `json:"fields"`
				} `json:"sections"`
			} `json:"data"`
		}

		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response body: %v", err)
		}

		if !body.Success {
			t.Fatalf("expected success true")
		}

		// Invitation
		if body.Data.Invitation.Title != "Wedding of Romeo & Juliet" {
			t.Errorf("expected title 'Wedding of Romeo & Juliet', got %q", body.Data.Invitation.Title)
		}
		if body.Data.Invitation.Slug != fixture.publishedSlug {
			t.Errorf("expected slug %q, got %q", fixture.publishedSlug, body.Data.Invitation.Slug)
		}
		if body.Data.Invitation.PublishedAt == nil {
			t.Errorf("expected published_at not nil")
		}

		// Event
		if body.Data.Event.Name != "Akad Nikah" {
			t.Errorf("expected event name 'Akad Nikah', got %q", body.Data.Event.Name)
		}
		if body.Data.Event.Date != "2026-12-31" {
			t.Errorf("expected event date '2026-12-31', got %q", body.Data.Event.Date)
		}
		if body.Data.Event.StartTime == nil || *body.Data.Event.StartTime != "09:00:00" {
			t.Errorf("expected event start_time '09:00:00', got %v", body.Data.Event.StartTime)
		}

		// Sections count and ordering
		if len(body.Data.Sections) != 3 {
			t.Fatalf("expected 3 sections, got %d", len(body.Data.Sections))
		}
		if body.Data.Sections[0].ID != fixture.sec1ID || body.Data.Sections[0].SortOrder != 10 {
			t.Errorf("section 0 order mismatch: id=%d, sort=%d", body.Data.Sections[0].ID, body.Data.Sections[0].SortOrder)
		}
		if body.Data.Sections[1].ID != fixture.sec2ID || body.Data.Sections[1].SortOrder != 20 {
			t.Errorf("section 1 order mismatch: id=%d, sort=%d", body.Data.Sections[1].ID, body.Data.Sections[1].SortOrder)
		}
		if body.Data.Sections[2].ID != fixture.secEmptyID || body.Data.Sections[2].SortOrder != 30 {
			t.Errorf("section 2 order mismatch: id=%d, sort=%d", body.Data.Sections[2].ID, body.Data.Sections[2].SortOrder)
		}

		// Section without fields must have empty slice
		if body.Data.Sections[2].Fields == nil || len(body.Data.Sections[2].Fields) != 0 {
			t.Errorf("empty section fields should be empty slice, got: %v", body.Data.Sections[2].Fields)
		}

		// Fields in Sec 1: fld1 ('Romeo Montagu'), fld2 (fallback 'Default Bride')
		sec1Fields := body.Data.Sections[0].Fields
		if len(sec1Fields) != 2 {
			t.Fatalf("expected 2 fields in sec1, got %d", len(sec1Fields))
		}
		if sec1Fields[0].FieldKey != "groom_name" || sec1Fields[0].Value == nil || *sec1Fields[0].Value != "Romeo Montagu" {
			t.Errorf("field 1 value should be 'Romeo Montagu' from published version (not draft), got %v", sec1Fields[0].Value)
		}
		if sec1Fields[1].FieldKey != "bride_name" || sec1Fields[1].Value == nil || *sec1Fields[1].Value != "Default Bride" {
			t.Errorf("field 2 value should fallback to 'Default Bride', got %v", sec1Fields[1].Value)
		}

		// Field in Sec 2
		sec2Fields := body.Data.Sections[1].Fields
		if len(sec2Fields) != 1 {
			t.Fatalf("expected 1 field in sec2, got %d", len(sec2Fields))
		}
		if sec2Fields[0].FieldKey != "quote_text" || sec2Fields[0].Value == nil || *sec2Fields[0].Value != "Love is eternal" {
			t.Errorf("sec2 field value mismatch: got %v", sec2Fields[0].Value)
		}
	})

	t.Run("undangan_draft_menghasilkan_404_dan_cache_no_store", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.draftSlug, "", "")
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", resp.Code, resp.Body.String())
		}
		if cc := resp.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected Cache-Control 'no-store', got %q", cc)
		}
	})

	t.Run("undangan_expired_menghasilkan_404_dan_cache_no_store", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.expiredSlug, "", "")
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", resp.Code, resp.Body.String())
		}
		if cc := resp.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected Cache-Control 'no-store', got %q", cc)
		}
	})

	t.Run("slug_tidak_ada_menghasilkan_404_dan_cache_no_store", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/non-existent-slug-xyz-123", "", "")
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", resp.Code, resp.Body.String())
		}
		if cc := resp.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected Cache-Control 'no-store', got %q", cc)
		}
	})

	t.Run("ketiga_respons_404_status_dan_body_IDENTIK", func(t *testing.T) {
		respDraft := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.draftSlug, "", "")
		respExpired := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.expiredSlug, "", "")
		respNotFound := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/non-existent-slug-xyz-123", "", "")

		if respDraft.Code != 404 || respExpired.Code != 404 || respNotFound.Code != 404 {
			t.Fatalf("status codes not all 404: draft=%d, exp=%d, nf=%d", respDraft.Code, respExpired.Code, respNotFound.Code)
		}

		if respDraft.Body.String() != respExpired.Body.String() || respDraft.Body.String() != respNotFound.Body.String() {
			t.Fatalf("404 bodies are not identical:\nDraft: %s\nExpired: %s\nNotFound: %s",
				respDraft.Body.String(), respExpired.Body.String(), respNotFound.Body.String())
		}

		var errObj map[string]interface{}
		if err := json.Unmarshal(respNotFound.Body.Bytes(), &errObj); err != nil {
			t.Fatalf("unmarshal 404 body: %v", err)
		}
		if errObj["success"] != false || errObj["message"] != "Invitation not found" {
			t.Errorf("unexpected 404 content: %v", errObj)
		}
	})

	t.Run("published_version_id_null_menghasilkan_404_tanpa_panic", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.corruptNullSlug, "", "")
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for null published version, got %d: %s", resp.Code, resp.Body.String())
		}
		if cc := resp.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected Cache-Control 'no-store', got %q", cc)
		}
	})

	t.Run("versi_bukan_milik_undangan_menghasilkan_404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.corruptWrongSlug, "", "")
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for wrong version owner, got %d: %s", resp.Code, resp.Body.String())
		}
		if cc := resp.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected Cache-Control 'no-store', got %q", cc)
		}
	})

	t.Run("event_tidak_ada_menghasilkan_404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.corruptNoEventSlug, "", "")
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for missing event, got %d: %s", resp.Code, resp.Body.String())
		}
		if cc := resp.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected Cache-Control 'no-store', got %q", cc)
		}
	})

	t.Run("konten_undangan_lain_tidak_tercampur", func(t *testing.T) {
		respA := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug, "", "")
		respB := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.otherSlug, "", "")

		if respA.Code != http.StatusOK || respB.Code != http.StatusOK {
			t.Fatalf("expected 200 for both, got A=%d, B=%d", respA.Code, respB.Code)
		}

		if strings.Contains(respA.Body.String(), "Partner B Specific Groom") {
			t.Errorf("invitation A leaked Partner B content")
		}
		if !strings.Contains(respB.Body.String(), "Partner B Specific Groom") {
			t.Errorf("invitation B missing its own content")
		}
	})

	t.Run("slug_beda_huruf_besar_kecil_menghasilkan_404", func(t *testing.T) {
		upperSlug := strings.ToUpper(fixture.publishedSlug)
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+upperSlug, "", "")
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for uppercase slug %q, got %d: %s", upperSlug, resp.Code, resp.Body.String())
		}
	})

	t.Run("slug_sangat_panjang_dan_kosong_menghasilkan_404", func(t *testing.T) {
		longSlug := strings.Repeat("a", 300)
		respLong := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+longSlug, "", "")
		if respLong.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for overly long slug, got %d", respLong.Code)
		}

		respSpace := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/%20%20", "", "")
		if respSpace.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for whitespace slug, got %d", respSpace.Code)
		}
	})

	t.Run("respons_200_tidak_memuat_key_terlarang", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug, "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", resp.Code)
		}

		var rawData map[string]interface{}
		if err := json.Unmarshal(resp.Body.Bytes(), &rawData); err != nil {
			t.Fatalf("unmarshal json: %v", err)
		}

		checkForbiddenKeysRecursively(t, rawData, "")
	})

	t.Run("tanpa_token_auth_tetap_berhasil_200", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug, "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 without token, got %d", resp.Code)
		}
	})
}
