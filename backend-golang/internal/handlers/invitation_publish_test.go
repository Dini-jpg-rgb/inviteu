package handlers_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type invitationPublishFixture struct {
	marker               string
	partnerA             int64
	partnerB             int64
	designerUser         int64
	adminUser            int64
	pkgID                int64
	partnerPackageID     int64
	categoryID           int64
	templateID           int64
	draftTemplateID      int64
	sectionWithFields    int64
	sectionWithoutFields int64
	fieldGroom           int64
	fieldDate            int64
	draftInvitationA     int64
	draftVersionA        int64
	draftEventA          int64
	publishedInvitationA int64
	publishedVersionA    int64
	publishedEventA      int64
}

func createInvitationPublishFixture(t *testing.T, pool *pgxpool.Pool) invitationPublishFixture {
	t.Helper()

	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "inv-pub-" + hex.EncodeToString(randomBytes)
	fixture := invitationPublishFixture{marker: marker}

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
			DELETE FROM templates WHERE id IN ($1, $2)
		`, fixture.templateID, fixture.draftTemplateID)

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
		VALUES ($1, $2, 'Publish test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	// Published Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Published template', 150000, 'publish')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Template", marker+"-tmpl").Scan(&fixture.templateID)
	if err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	// Draft Template
	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Draft template', 150000, 'draft')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Draft Template", marker+"-draft-tmpl").Scan(&fixture.draftTemplateID)
	if err != nil {
		t.Fatalf("insert fixture draft template: %v", err)
	}

	// Section 1: Required section with fields
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Main Details', 'details', 10, true, true, '{"theme":"light"}')
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sectionWithFields)
	if err != nil {
		t.Fatalf("insert fixture sectionWithFields: %v", err)
	}

	// Section 2: Required section WITHOUT fields (media menyusul; should NOT block publish)
	err = pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable, settings)
		VALUES ($1, 'Media Gallery', 'media', 20, true, true, NULL)
		RETURNING id
	`, fixture.templateID).Scan(&fixture.sectionWithoutFields)
	if err != nil {
		t.Fatalf("insert fixture sectionWithoutFields: %v", err)
	}

	// Field 1: Groom Name (required, default "Default Groom")
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'groom-name', 'Groom Name', 'text', 'Default Groom', true, true, 10)
		RETURNING id
	`, fixture.sectionWithFields).Scan(&fixture.fieldGroom)
	if err != nil {
		t.Fatalf("insert fixture fieldGroom: %v", err)
	}

	// Field 2: Event Date (required, default NULL)
	err = pool.QueryRow(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order)
		VALUES ($1, 'event-date', 'Event Date', 'date', NULL, true, true, 20)
		RETURNING id
	`, fixture.sectionWithFields).Scan(&fixture.fieldDate)
	if err != nil {
		t.Fatalf("insert fixture fieldDate: %v", err)
	}

	// Create helper for invitations
	createInv := func(userID int64, title, slug, status string, tmplID int64) (int64, int64, int64) {
		var eid int64
		err := pool.QueryRow(ctx, `
			INSERT INTO events (user_id, name, date, start_time, end_time, location)
			VALUES ($1, $2, '2026-12-25', '10:00:00', '14:00:00', 'Grand Ballroom')
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

	// Draft invitation A (ready: has content for fieldDate)
	fixture.draftInvitationA, fixture.draftVersionA, fixture.draftEventA = createInv(
		fixture.partnerA,
		marker+" Wedding Draft",
		marker+"-wedding-draft",
		"draft",
		fixture.templateID,
	)

	// Insert content for fieldDate so all required fields have effective values
	_, err = pool.Exec(ctx, `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES ($1, $2, '2026-12-25')
	`, fixture.draftVersionA, fixture.fieldDate)
	if err != nil {
		t.Fatalf("insert content for draftInvitationA: %v", err)
	}

	// Published invitation A
	fixture.publishedInvitationA, fixture.publishedVersionA, fixture.publishedEventA = createInv(
		fixture.partnerA,
		marker+" Wedding Published",
		marker+"-wedding-published",
		"published",
		fixture.templateID,
	)

	return fixture
}

func TestPublishInvitation_Success(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)

	resp := templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)
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
			} `json:"invitation"`
			RemainingQuota int64 `json:"remaining_quota"`
		} `json:"data"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if !body.Success {
		t.Errorf("expected success true, got false")
	}
	if body.Message != "Invitation published successfully" {
		t.Errorf("unexpected message: %q", body.Message)
	}
	if body.Data.Invitation.Status != "published" {
		t.Errorf("expected status 'published', got %q", body.Data.Invitation.Status)
	}
	if body.Data.Invitation.PublishedAt == nil {
		t.Errorf("expected published_at not nil")
	}
	if body.Data.RemainingQuota != 4 {
		t.Errorf("expected remaining_quota 4 (5 - 1), got %d", body.Data.RemainingQuota)
	}

	// Verify database state
	var (
		dbStatus             string
		dbPublishedVersionID *int64
		dbPublishedAt        *time.Time
		dbExpiredAt          *time.Time
	)
	err := pool.QueryRow(context.Background(), `
		SELECT status, published_version_id, published_at, expired_at
		FROM invitations
		WHERE id = $1
	`, fixture.draftInvitationA).Scan(&dbStatus, &dbPublishedVersionID, &dbPublishedAt, &dbExpiredAt)
	if err != nil {
		t.Fatalf("query invitation: %v", err)
	}

	if dbStatus != "published" {
		t.Errorf("expected DB status 'published', got %q", dbStatus)
	}
	if dbPublishedVersionID == nil || *dbPublishedVersionID != fixture.draftVersionA {
		t.Errorf("expected published_version_id %d, got %v", fixture.draftVersionA, dbPublishedVersionID)
	}
	if dbPublishedAt == nil {
		t.Errorf("expected published_at in DB not nil")
	}
	if dbExpiredAt != nil {
		t.Errorf("expected expired_at to be NULL by default, got %v", dbExpiredAt)
	}

	var versionStatus string
	err = pool.QueryRow(context.Background(), `
		SELECT status FROM invitation_versions WHERE id = $1
	`, fixture.draftVersionA).Scan(&versionStatus)
	if err != nil {
		t.Fatalf("query invitation_versions: %v", err)
	}
	if versionStatus != "published" {
		t.Errorf("expected version status 'published', got %q", versionStatus)
	}

	var invitationUsed int
	err = pool.QueryRow(context.Background(), `
		SELECT invitation_used FROM partner_packages WHERE id = $1
	`, fixture.partnerPackageID).Scan(&invitationUsed)
	if err != nil {
		t.Fatalf("query partner_packages: %v", err)
	}
	if invitationUsed != 1 {
		t.Errorf("expected invitation_used = 1, got %d", invitationUsed)
	}
}

func TestPublishInvitation_ValidationErrors(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	tokenA := templateFavoritesToken(t, 0) // placeholder

	t.Run("event without location or start_time triggers 400 with event.* keys", func(t *testing.T) {
		fixture := createInvitationPublishFixture(t, pool)
		tokenA = templateFavoritesToken(t, fixture.partnerA)

		// Set location and start_time to NULL
		_, err := pool.Exec(context.Background(), `
			UPDATE events
			SET location = NULL, start_time = NULL
			WHERE id = $1
		`, fixture.draftEventA)
		if err != nil {
			t.Fatalf("update event: %v", err)
		}

		url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Success bool              `json:"success"`
			Message string            `json:"message"`
			Errors  map[string]string `json:"errors"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if body.Message != "Invitation is not ready to be published" {
			t.Errorf("unexpected message: %q", body.Message)
		}
		if _, ok := body.Errors["event.location"]; !ok {
			t.Errorf("expected errors['event.location'], got map: %v", body.Errors)
		}
		if _, ok := body.Errors["event.start_time"]; !ok {
			t.Errorf("expected errors['event.start_time'], got map: %v", body.Errors)
		}
	})

	t.Run("missing required field without default triggers 400 with fields.* keys", func(t *testing.T) {
		fixture := createInvitationPublishFixture(t, pool)
		tokenA = templateFavoritesToken(t, fixture.partnerA)

		// Delete content for fieldDate (which has default_value = NULL)
		_, err := pool.Exec(context.Background(), `
			DELETE FROM invitation_contents
			WHERE invitation_version_id = $1 AND template_field_id = $2
		`, fixture.draftVersionA, fixture.fieldDate)
		if err != nil {
			t.Fatalf("delete content: %v", err)
		}

		url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Message string            `json:"message"`
			Errors  map[string]string `json:"errors"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		fieldKey := fmt.Sprintf("fields.%d", fixture.fieldDate)
		if _, ok := body.Errors[fieldKey]; !ok {
			t.Errorf("expected errors[%q], got: %v", fieldKey, body.Errors)
		}
	})

	t.Run("template not in publish status triggers 400", func(t *testing.T) {
		fixture := createInvitationPublishFixture(t, pool)
		tokenA = templateFavoritesToken(t, fixture.partnerA)

		// Change template to draft
		_, err := pool.Exec(context.Background(), `
			UPDATE templates SET status = 'draft' WHERE id = $1
		`, fixture.templateID)
		if err != nil {
			t.Fatalf("update template: %v", err)
		}

		url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", resp.Code, resp.Body.String())
		}

		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &body)
		if _, ok := body.Errors["template"]; !ok {
			t.Errorf("expected errors['template'], got: %v", body.Errors)
		}
	})
}

func TestPublishInvitation_EffectiveValueTrimAndDefault(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)

	// Field 1 (fieldGroom) has default_value = 'Default Groom'.
	// Stored value is only whitespace '   '.
	// Trimmed value is empty, so it should fall back to default_value and pass validation.
	_, err := pool.Exec(context.Background(), `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES ($1, $2, '   ')
	`, fixture.draftVersionA, fixture.fieldGroom)
	if err != nil {
		t.Fatalf("insert whitespace content: %v", err)
	}

	url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
	resp := templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}
}

func TestPublishInvitation_RequiredSectionWithoutFieldsDoesNotBlock(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)

	// Section 2 (fixture.sectionWithoutFields) has is_required = true and 0 fields.
	// Publish should succeed without blocking.
	url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
	resp := templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}
}

func TestPublishInvitation_TwoPackages_AllocationCorrection(t *testing.T) {
	// Skenario (a): dua paket aktif, paket pertama sisa 1 dan paket kedua sisa 5,
	// dua publish bersamaan untuk dua draft berbeda -> keduanya 200 dan masing-masing paket naik 1.
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)
	ctx := context.Background()

	// Update existing package 1: quota 2, used 1 (sisa 1), expires in 1 day
	_, err := pool.Exec(ctx, `
		UPDATE partner_packages
		SET invitation_quota = 2,
		    invitation_used = 1,
		    expired_at = CURRENT_TIMESTAMP + INTERVAL '1 day'
		WHERE id = $1
	`, fixture.partnerPackageID)
	if err != nil {
		t.Fatalf("update package 1: %v", err)
	}

	// Insert package 2: quota 10, used 5 (sisa 5), expires in 2 days
	var pkg2ID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO partner_packages (user_id, package_id, invitation_quota, invitation_used, started_at, expired_at, status)
		VALUES ($1, $2, 10, 5, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '2 days', 'active')
		RETURNING id
	`, fixture.partnerA, fixture.pkgID).Scan(&pkg2ID)
	if err != nil {
		t.Fatalf("insert package 2: %v", err)
	}

	// Create second ready draft invitation for partner A
	var eid2 int64
	err = pool.QueryRow(ctx, `
		INSERT INTO events (user_id, name, date, start_time, end_time, location)
		VALUES ($1, 'Wedding 2 Event', '2026-12-28', '11:00:00', '15:00:00', 'Beach Resort')
		RETURNING id
	`, fixture.partnerA).Scan(&eid2)
	if err != nil {
		t.Fatalf("insert event 2: %v", err)
	}

	var draftInv2 int64
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status)
		VALUES ($1, $2, 'Wedding Draft 2', $3, 'draft')
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.marker+"-wedding-draft-2").Scan(&draftInv2)
	if err != nil {
		t.Fatalf("insert invitation 2: %v", err)
	}

	_, _ = pool.Exec(ctx, `INSERT INTO invitation_events (invitation_id, event_id, sort_order) VALUES ($1, $2, 0)`, draftInv2, eid2)

	var draftVer2 int64
	err = pool.QueryRow(ctx, `
		INSERT INTO invitation_versions (invitation_id, version_number, status)
		VALUES ($1, 1, 'draft')
		RETURNING id
	`, draftInv2).Scan(&draftVer2)
	if err != nil {
		t.Fatalf("insert version 2: %v", err)
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO invitation_contents (invitation_version_id, template_field_id, value)
		VALUES ($1, $2, '2026-12-28')
	`, draftVer2, fixture.fieldDate)
	if err != nil {
		t.Fatalf("insert content for draft 2: %v", err)
	}

	// Launch concurrent publish for Draft 1 and Draft 2 with sync barrier
	url1 := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
	url2 := fmt.Sprintf("/api/v1/invitations/%d/publish", draftInv2)

	var wg sync.WaitGroup
	start := make(chan struct{})
	var resp1, resp2 *httptest.ResponseRecorder

	wg.Add(2)
	go func() {
		defer wg.Done()
		<-start
		resp1 = templateFavoritesRequest(engine, http.MethodPost, url1, "{}", tokenA)
	}()
	go func() {
		defer wg.Done()
		<-start
		resp2 = templateFavoritesRequest(engine, http.MethodPost, url2, "{}", tokenA)
	}()

	close(start) // release barrier simultaneously
	wg.Wait()

	if resp1.Code != http.StatusOK {
		t.Errorf("expected draft 1 to succeed with 200, got %d: %s", resp1.Code, resp1.Body.String())
	}
	if resp2.Code != http.StatusOK {
		t.Errorf("expected draft 2 to succeed with 200, got %d: %s", resp2.Code, resp2.Body.String())
	}

	// Verify both packages were incremented by exactly 1
	var used1, used2 int
	_ = pool.QueryRow(ctx, `SELECT invitation_used FROM partner_packages WHERE id = $1`, fixture.partnerPackageID).Scan(&used1)
	_ = pool.QueryRow(ctx, `SELECT invitation_used FROM partner_packages WHERE id = $1`, pkg2ID).Scan(&used2)

	if used1 != 2 {
		t.Errorf("expected package 1 used to increment from 1 to 2, got %d", used1)
	}
	if used2 != 6 {
		t.Errorf("expected package 2 used to increment from 5 to 6, got %d", used2)
	}
}

func TestPublishInvitation_Concurrency_SameInvitation(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)

	url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)

	const goroutines = 2
	var wg sync.WaitGroup
	start := make(chan struct{})
	responses := make([]*httptest.ResponseRecorder, goroutines)

	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		idx := i
		go func() {
			defer wg.Done()
			<-start
			responses[idx] = templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)
		}()
	}

	close(start)
	wg.Wait()

	successCount := 0
	conflictCount := 0
	for _, r := range responses {
		switch r.Code {
		case http.StatusOK:
			successCount++
		case http.StatusConflict:
			conflictCount++
		default:
			t.Errorf("unexpected status code: %d: %s", r.Code, r.Body.String())
		}
	}

	if successCount != 1 || conflictCount != 1 {
		t.Fatalf("expected exactly 1 success (200) and 1 conflict (409), got %d success and %d conflict", successCount, conflictCount)
	}

	// Quota must only increment by 1
	var used int
	_ = pool.QueryRow(context.Background(), `SELECT invitation_used FROM partner_packages WHERE id = $1`, fixture.partnerPackageID).Scan(&used)
	if used != 1 {
		t.Errorf("expected invitation_used = 1, got %d", used)
	}
}

func TestPublishInvitation_Concurrency_QuotaRace(t *testing.T) {
	// Two different draft invitations competing for the last 1 quota
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)
	ctx := context.Background()

	// Set partner package to have exactly 1 remaining quota (quota 5, used 4)
	_, err := pool.Exec(ctx, `
		UPDATE partner_packages
		SET invitation_quota = 5, invitation_used = 4
		WHERE id = $1
	`, fixture.partnerPackageID)
	if err != nil {
		t.Fatalf("update quota: %v", err)
	}

	// Create second ready draft
	var eid2, draftInv2, draftVer2 int64
	_ = pool.QueryRow(ctx, `
		INSERT INTO events (user_id, name, date, start_time, end_time, location)
		VALUES ($1, 'Wedding Race Event', '2026-12-30', '12:00:00', '16:00:00', 'Sunset Pavilion')
		RETURNING id
	`, fixture.partnerA).Scan(&eid2)

	_ = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status)
		VALUES ($1, $2, 'Wedding Draft Race', $3, 'draft')
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.marker+"-wedding-race").Scan(&draftInv2)

	_, _ = pool.Exec(ctx, `INSERT INTO invitation_events (invitation_id, event_id, sort_order) VALUES ($1, $2, 0)`, draftInv2, eid2)
	_ = pool.QueryRow(ctx, `INSERT INTO invitation_versions (invitation_id, version_number, status) VALUES ($1, 1, 'draft') RETURNING id`, draftInv2).Scan(&draftVer2)
	_, _ = pool.Exec(ctx, `INSERT INTO invitation_contents (invitation_version_id, template_field_id, value) VALUES ($1, $2, '2026-12-30')`, draftVer2, fixture.fieldDate)

	url1 := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
	url2 := fmt.Sprintf("/api/v1/invitations/%d/publish", draftInv2)

	var wg sync.WaitGroup
	start := make(chan struct{})
	var resp1, resp2 *httptest.ResponseRecorder

	wg.Add(2)
	go func() {
		defer wg.Done()
		<-start
		resp1 = templateFavoritesRequest(engine, http.MethodPost, url1, "{}", tokenA)
	}()
	go func() {
		defer wg.Done()
		<-start
		resp2 = templateFavoritesRequest(engine, http.MethodPost, url2, "{}", tokenA)
	}()

	close(start)
	wg.Wait()

	codes := []int{resp1.Code, resp2.Code}
	successCount := 0
	forbiddenCount := 0
	for _, code := range codes {
		if code == http.StatusOK {
			successCount++
		} else if code == http.StatusForbidden {
			forbiddenCount++
		}
	}

	if successCount != 1 || forbiddenCount != 1 {
		t.Fatalf("expected 1 success (200) and 1 forbidden (403), got %d success and %d forbidden (resp1=%d, resp2=%d)", successCount, forbiddenCount, resp1.Code, resp2.Code)
	}

	var used int
	_ = pool.QueryRow(ctx, `SELECT invitation_used FROM partner_packages WHERE id = $1`, fixture.partnerPackageID).Scan(&used)
	if used != 5 {
		t.Errorf("expected invitation_used = 5 (all quota used), got %d", used)
	}
}

func TestPublishInvitation_RollbackWithTrigger(t *testing.T) {
	// Skenario (e): test rollback memakai trigger sementara di database test yang
	// dilempar error pada update invitations dan dihapus lewat t.Cleanup.
	// Cara kerja:
	// 1. Kita pasang trigger function plpgsql di tabel invitations sebelum update.
	// 2. Trigger memeriksa jika baris yang diupdate adalah ID invitation test ini,
	//    maka melempar RAISE EXCEPTION 'simulated rollback failure in invitation update trigger'.
	// 3. Handler PublishInvitation akan menangkap error dari tx.QueryRow(update invitations),
	//    otomatis memicu rollback via defer tx.Rollback.
	// 4. Test memeriksa respon 500, status invitation tetap 'draft', dan quota tetap utuh (used 0).
	// 5. t.Cleanup menjamin trigger dan function dihapus setelah test selesai.
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)
	tokenA := templateFavoritesToken(t, fixture.partnerA)
	ctx := context.Background()

	funcName := fmt.Sprintf("fail_invitation_update_%d", fixture.draftInvitationA)
	triggerName := fmt.Sprintf("trg_fail_invitation_update_%d", fixture.draftInvitationA)

	t.Cleanup(func() {
		cleanCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, _ = pool.Exec(cleanCtx, fmt.Sprintf("DROP TRIGGER IF EXISTS %s ON invitations", triggerName))
		_, _ = pool.Exec(cleanCtx, fmt.Sprintf("DROP FUNCTION IF EXISTS %s()", funcName))
	})

	createFuncSQL := fmt.Sprintf(`
		CREATE OR REPLACE FUNCTION %s()
		RETURNS TRIGGER AS $$
		BEGIN
			IF NEW.id = %d THEN
				RAISE EXCEPTION 'simulated rollback failure in invitation update trigger';
			END IF;
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;
	`, funcName, fixture.draftInvitationA)

	if _, err := pool.Exec(ctx, createFuncSQL); err != nil {
		t.Fatalf("create trigger function: %v", err)
	}

	createTrgSQL := fmt.Sprintf(`
		CREATE TRIGGER %s
		BEFORE UPDATE ON invitations
		FOR EACH ROW
		EXECUTE FUNCTION %s();
	`, triggerName, funcName)

	if _, err := pool.Exec(ctx, createTrgSQL); err != nil {
		t.Fatalf("create trigger: %v", err)
	}

	url := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)
	resp := templateFavoritesRequest(engine, http.MethodPost, url, "{}", tokenA)

	if resp.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d: %s", resp.Code, resp.Body.String())
	}

	// Verify rollback integrity in database: status is STILL 'draft', used is STILL 0
	var status string
	_ = pool.QueryRow(ctx, `SELECT status FROM invitations WHERE id = $1`, fixture.draftInvitationA).Scan(&status)
	if status != "draft" {
		t.Errorf("expected invitation status 'draft' after rollback, got %q", status)
	}

	var used int
	_ = pool.QueryRow(ctx, `SELECT invitation_used FROM partner_packages WHERE id = $1`, fixture.partnerPackageID).Scan(&used)
	if used != 0 {
		t.Errorf("expected package invitation_used 0 after rollback, got %d", used)
	}
}

func TestPublishInvitation_PermissionsAndAbuse(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createInvitationPublishFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)
	urlA := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.draftInvitationA)

	t.Run("unauthenticated request returns 401", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodPost, urlA, "{}", "")
		if resp.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", resp.Code)
		}
	})

	t.Run("designer and admin role rejected with 403", func(t *testing.T) {
		for _, uid := range []int64{fixture.designerUser, fixture.adminUser} {
			token := templateFavoritesToken(t, uid)
			resp := templateFavoritesRequest(engine, http.MethodPost, urlA, "{}", token)
			if resp.Code != http.StatusForbidden {
				t.Errorf("user %d: expected 403, got %d", uid, resp.Code)
			}
		}
	})

	t.Run("invitation owned by another partner returns 404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodPost, urlA, "{}", tokenB)
		if resp.Code != http.StatusNotFound {
			t.Errorf("expected 404, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("already published invitation returns 409", func(t *testing.T) {
		pubURL := fmt.Sprintf("/api/v1/invitations/%d/publish", fixture.publishedInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodPost, pubURL, "{}", tokenA)
		if resp.Code != http.StatusConflict {
			t.Errorf("expected 409, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("partner without active package returns 403 no_active_package", func(t *testing.T) {
		// Partner B has no package
		// Create draft for partner B
		var eidB, invB, verB int64
		_ = pool.QueryRow(context.Background(), `
			INSERT INTO events (user_id, name, date, start_time, end_time, location)
			VALUES ($1, 'Event B', '2026-12-25', '10:00:00', '14:00:00', 'Hall B')
			RETURNING id
		`, fixture.partnerB).Scan(&eidB)

		_ = pool.QueryRow(context.Background(), `
			INSERT INTO invitations (user_id, template_id, title, slug, status)
			VALUES ($1, $2, 'Draft B', $3, 'draft')
			RETURNING id
		`, fixture.partnerB, fixture.templateID, fixture.marker+"-draft-b").Scan(&invB)

		_, _ = pool.Exec(context.Background(), `INSERT INTO invitation_events (invitation_id, event_id, sort_order) VALUES ($1, $2, 0)`, invB, eidB)
		_ = pool.QueryRow(context.Background(), `INSERT INTO invitation_versions (invitation_id, version_number, status) VALUES ($1, 1, 'draft') RETURNING id`, invB).Scan(&verB)
		_, _ = pool.Exec(context.Background(), `INSERT INTO invitation_contents (invitation_version_id, template_field_id, value) VALUES ($1, $2, '2026-12-25')`, verB, fixture.fieldDate)

		urlB := fmt.Sprintf("/api/v1/invitations/%d/publish", invB)
		resp := templateFavoritesRequest(engine, http.MethodPost, urlB, "{}", tokenB)
		if resp.Code != http.StatusForbidden {
			t.Errorf("expected 403, got %d: %s", resp.Code, resp.Body.String())
		}
		if !strings.Contains(resp.Body.String(), "no_active_package") {
			t.Errorf("expected errors.package 'no_active_package': %s", resp.Body.String())
		}
	})

	t.Run("partner with exhausted quota returns 403 quota_exhausted", func(t *testing.T) {
		fixtureExhausted := createInvitationPublishFixture(t, pool)
		tokenExhausted := templateFavoritesToken(t, fixtureExhausted.partnerA)

		// Set used = quota
		_, _ = pool.Exec(context.Background(), `
			UPDATE partner_packages
			SET invitation_quota = 5, invitation_used = 5
			WHERE id = $1
		`, fixtureExhausted.partnerPackageID)

		urlExhausted := fmt.Sprintf("/api/v1/invitations/%d/publish", fixtureExhausted.draftInvitationA)
		resp := templateFavoritesRequest(engine, http.MethodPost, urlExhausted, "{}", tokenExhausted)
		if resp.Code != http.StatusForbidden {
			t.Errorf("expected 403, got %d: %s", resp.Code, resp.Body.String())
		}
		if !strings.Contains(resp.Body.String(), "quota_exhausted") {
			t.Errorf("expected errors.package 'quota_exhausted': %s", resp.Body.String())
		}
	})

	t.Run("invalid invitation ID returns 400", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/invitations/invalid-id/publish", "{}", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", resp.Code)
		}
	})
}
