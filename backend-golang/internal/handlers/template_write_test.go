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

	"github.com/jackc/pgx/v5/pgxpool"
)

type templateWriteFixture struct {
	marker        string
	designerA     int64
	designerB     int64
	adminUser     int64
	partnerUser   int64
	categoryID    int64
	categoryID2   int64
	storageFileID int64
}

func createTemplateWriteFixture(t *testing.T, pool *pgxpool.Pool) templateWriteFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "tw-" + hex.EncodeToString(randomBytes)

	fixture := templateWriteFixture{marker: marker}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{fixture.designerA, fixture.designerB, fixture.adminUser, fixture.partnerUser}

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitation_favorites WHERE template_id IN (
				SELECT id FROM templates WHERE designer_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitations WHERE template_id IN (
				SELECT id FROM templates WHERE designer_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM package_templates WHERE template_id IN (
				SELECT id FROM templates WHERE designer_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM template_fields WHERE template_section_id IN (
				SELECT id FROM template_sections WHERE template_id IN (
					SELECT id FROM templates WHERE designer_id = ANY($1)
				)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM template_sections WHERE template_id IN (
				SELECT id FROM templates WHERE designer_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM template_assets WHERE template_id IN (
				SELECT id FROM templates WHERE designer_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM templates WHERE designer_id = ANY($1)
		`, userIDs)

		if fixture.storageFileID > 0 {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM storage_files WHERE id = $1`, fixture.storageFileID)
		}

		catIDs := []int64{fixture.categoryID, fixture.categoryID2}
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM template_categories WHERE id = ANY($1)`, catIDs)

		_, _ = pool.Exec(cleanupCtx, `DELETE FROM users WHERE id = ANY($1)`, userIDs)
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

	fixture.designerA = insertUser("Designer A", "designer-a@example.test", "designer")
	fixture.designerB = insertUser("Designer B", "designer-b@example.test", "designer")
	fixture.adminUser = insertUser("Admin", "admin@example.test", "admin")
	fixture.partnerUser = insertUser("Partner", "partner@example.test", "partner")

	err := pool.QueryRow(ctx, `
		INSERT INTO template_categories (name, slug, description)
		VALUES ($1, $2, 'Template Write test category')
		RETURNING id
	`, marker+" Cat 1", marker+"-cat-1").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category 1: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO template_categories (name, slug, description)
		VALUES ($1, $2, 'Template Write test category 2')
		RETURNING id
	`, marker+" Cat 2", marker+"-cat-2").Scan(&fixture.categoryID2)
	if err != nil {
		t.Fatalf("insert fixture category 2: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO storage_files (provider, file_id, original_name, mime_type, size, uploaded_by)
		VALUES ('local', $1, 'thumb.jpg', 'image/jpeg', 1024, $2)
		RETURNING id
	`, marker+"-file-1", fixture.designerA).Scan(&fixture.storageFileID)
	if err != nil {
		t.Fatalf("insert fixture storage_file: %v", err)
	}

	return fixture
}

func TestTemplateWrite_POST(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createTemplateWriteFixture(t, pool)

	tokenDesignerA := templateFavoritesToken(t, fixture.designerA)
	tokenAdmin := templateFavoritesToken(t, fixture.adminUser)
	tokenPartner := templateFavoritesToken(t, fixture.partnerUser)

	t.Run("sukses_designer_membuat_template_201_draft", func(t *testing.T) {
		body := fmt.Sprintf(`{
			"name": "Elegance Gold",
			"category_id": %d,
			"slug": "%s-elegance-gold",
			"description": "Template bernuansa emas mewah",
			"price": 125000,
			"style": "Luxury",
			"color": "Gold",
			"thumbnail_file_id": %d
		}`, fixture.categoryID, fixture.marker, fixture.storageFileID)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool                           `json:"success"`
			Message string                         `json:"message"`
			Data    handlers.TemplateWriteResponse `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if !res.Success || res.Data.ID <= 0 {
			t.Fatalf("expected positive template ID, got %+v", res)
		}
		if res.Data.Status != handlers.TemplateStatusDraft {
			t.Errorf("expected status 'draft', got %q", res.Data.Status)
		}
		if res.Data.DesignerID != fixture.designerA {
			t.Errorf("expected designer_id %d, got %d", fixture.designerA, res.Data.DesignerID)
		}
		if res.Data.Price != "125000.00" {
			t.Errorf("expected price '125000.00', got %q", res.Data.Price)
		}

		// Verify in DB directly
		var dbStatus string
		var dbDesignerID int64
		err := pool.QueryRow(context.Background(), `SELECT status, designer_id FROM templates WHERE id = $1`, res.Data.ID).Scan(&dbStatus, &dbDesignerID)
		if err != nil {
			t.Fatalf("query template in db: %v", err)
		}
		if dbStatus != "draft" || dbDesignerID != fixture.designerA {
			t.Errorf("db state mismatch: status=%s designer=%d", dbStatus, dbDesignerID)
		}
	})

	t.Run("sukses_admin_membuat_template_designer_id_adalah_id_admin", func(t *testing.T) {
		body := fmt.Sprintf(`{
			"name": "Admin Royal Template",
			"category_id": %d,
			"price": 200000
		}`, fixture.categoryID)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenAdmin)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created for admin, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool                           `json:"success"`
			Data    handlers.TemplateWriteResponse `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if res.Data.DesignerID != fixture.adminUser {
			t.Errorf("expected designer_id to be admin user %d, got %d", fixture.adminUser, res.Data.DesignerID)
		}
		if res.Data.Status != "draft" {
			t.Errorf("expected status 'draft', got %s", res.Data.Status)
		}
	})

	t.Run("auto_generated_slug_ketika_slug_tidak_dikirim", func(t *testing.T) {
		body := fmt.Sprintf(`{
			"name": "Simple Clean Floral",
			"category_id": %d
		}`, fixture.categoryID)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Data handlers.TemplateWriteResponse `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)

		if !strings.HasPrefix(res.Data.Slug, "simple-clean-floral-") {
			t.Errorf("expected auto slug starting with simple-clean-floral-, got %q", res.Data.Slug)
		}
	})

	t.Run("slug_bentrok_menghasilkan_409_conflict", func(t *testing.T) {
		customSlug := fixture.marker + "-custom-duplicate-slug"
		body := fmt.Sprintf(`{
			"name": "Template Original",
			"category_id": %d,
			"slug": "%s"
		}`, fixture.categoryID, customSlug)

		// First insert succeeds
		resp1 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp1.Code != http.StatusCreated {
			t.Fatalf("expected 201 on first insert, got %d: %s", resp1.Code, resp1.Body.String())
		}

		// Second insert with same slug must return 409
		resp2 := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp2.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict for duplicate slug, got %d: %s", resp2.Code, resp2.Body.String())
		}

		var res struct {
			Success bool              `json:"success"`
			Errors  map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(resp2.Body.Bytes(), &res)
		if res.Errors["slug"] != "slug_already_taken" {
			t.Errorf("expected error slug: 'slug_already_taken', got %v", res.Errors)
		}
	})

	t.Run("thumbnail_file_id_tidak_ada_di_storage_files_menghasilkan_400", func(t *testing.T) {
		body := fmt.Sprintf(`{
			"name": "Template with Invalid File",
			"category_id": %d,
			"thumbnail_file_id": 999999999
		}`, fixture.categoryID)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for non-existent thumbnail_file_id, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool              `json:"success"`
			Errors  map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)
		if res.Errors["thumbnail_file_id"] == "" {
			t.Errorf("expected error field thumbnail_file_id, got %+v", res.Errors)
		}
	})

	t.Run("category_id_tidak_ada_menghasilkan_400", func(t *testing.T) {
		body := `{
			"name": "Template Invalid Category",
			"category_id": 999999999
		}`
		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("validasi_input_nama_panjang_format_price", func(t *testing.T) {
		tests := []struct {
			name     string
			body     string
			expField string
		}{
			{
				name:     "nama_kosong",
				body:     fmt.Sprintf(`{"name": "   ", "category_id": %d}`, fixture.categoryID),
				expField: "name",
			},
			{
				name:     "nama_terlalu_panjang",
				body:     fmt.Sprintf(`{"name": %q, "category_id": %d}`, strings.Repeat("A", 256), fixture.categoryID),
				expField: "name",
			},
			{
				name:     "price_negatif",
				body:     fmt.Sprintf(`{"name": "Valid", "category_id": %d, "price": -5000}`, fixture.categoryID),
				expField: "price",
			},
			{
				name:     "price_overflow_1e20",
				body:     fmt.Sprintf(`{"name": "Valid", "category_id": %d, "price": 1e20}`, fixture.categoryID),
				expField: "price",
			},
			{
				name:     "style_terlalu_panjang",
				body:     fmt.Sprintf(`{"name": "Valid", "category_id": %d, "style": %q}`, fixture.categoryID, strings.Repeat("S", 101)),
				expField: "style",
			},
			{
				name:     "color_terlalu_panjang",
				body:     fmt.Sprintf(`{"name": "Valid", "category_id": %d, "color": %q}`, fixture.categoryID, strings.Repeat("C", 101)),
				expField: "color",
			},
			{
				name:     "slug_format_salah",
				body:     fmt.Sprintf(`{"name": "Valid", "category_id": %d, "slug": "Invalid Slug!"}`, fixture.categoryID),
				expField: "slug",
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", tc.body, tokenDesignerA)
				if resp.Code != http.StatusBadRequest {
					t.Fatalf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
				}
				var res struct {
					Errors map[string]string `json:"errors"`
				}
				_ = json.Unmarshal(resp.Body.Bytes(), &res)
				if res.Errors[tc.expField] == "" {
					t.Errorf("expected error field %q, got %+v", tc.expField, res.Errors)
				}
			})
		}
	})

	t.Run("post_price_tepat_di_batas_maksimal_sukses_201", func(t *testing.T) {
		body := fmt.Sprintf(`{
			"name": "Template Max Price",
			"category_id": %d,
			"price": 9999999999999.99
		}`, fixture.categoryID)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Data handlers.TemplateWriteResponse `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)

		if res.Data.Price != "9999999999999.99" {
			t.Errorf("expected price '9999999999999.99', got %q", res.Data.Price)
		}

		var dbPrice string
		err := pool.QueryRow(context.Background(), `SELECT price::text FROM templates WHERE id = $1`, res.Data.ID).Scan(&dbPrice)
		if err != nil {
			t.Fatalf("query template price: %v", err)
		}
		if dbPrice != "9999999999999.99" {
			t.Errorf("expected price in DB '9999999999999.99', got %q", dbPrice)
		}
	})

	t.Run("status_dan_designer_id_dari_body_diabaikan", func(t *testing.T) {
		body := fmt.Sprintf(`{
			"name": "Injected Fields Template",
			"category_id": %d,
			"status": "publish",
			"designer_id": %d
		}`, fixture.categoryID, fixture.designerB)

		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenDesignerA)
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Data handlers.TemplateWriteResponse `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)

		if res.Data.Status != "draft" {
			t.Errorf("expected status 'draft' regardless of body, got %q", res.Data.Status)
		}
		if res.Data.DesignerID != fixture.designerA {
			t.Errorf("expected designer_id %d from token context, got %d", fixture.designerA, res.Data.DesignerID)
		}
	})

	t.Run("body_kosong_rusak_lebih_64kb", func(t *testing.T) {
		// Empty body
		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", "", tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty body, got %d", resp.Code)
		}

		// Malformed JSON
		resp = templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", `{"name":`, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for malformed json, got %d", resp.Code)
		}

		// > 64KB
		oversized := fmt.Sprintf(`{"name": "Huge", "category_id": %d, "description": %q}`, fixture.categoryID, strings.Repeat("x", 65*1024))
		resp = templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", oversized, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for >64KB body, got %d", resp.Code)
		}
	})

	t.Run("tanpa_token_401_dan_role_partner_403", func(t *testing.T) {
		body := fmt.Sprintf(`{"name": "Auth Test", "category_id": %d}`, fixture.categoryID)

		// Without token -> 401
		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, "")
		if resp.Code != http.StatusUnauthorized {
			t.Errorf("expected 401 Unauthorized, got %d", resp.Code)
		}

		// Partner token -> 403
		resp = templateFavoritesRequest(engine, http.MethodPost, "/api/v1/templates", body, tokenPartner)
		if resp.Code != http.StatusForbidden {
			t.Errorf("expected 403 Forbidden for partner, got %d", resp.Code)
		}
	})
}

func TestTemplateWrite_PATCH(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createTemplateWriteFixture(t, pool)

	tokenDesignerA := templateFavoritesToken(t, fixture.designerA)
	tokenAdmin := templateFavoritesToken(t, fixture.adminUser)
	tokenPartner := templateFavoritesToken(t, fixture.partnerUser)

	ctx := context.Background()

	// Helper to insert template with specified status and owner
	insertTemplate := func(ownerID int64, name, slug, status string, thumbID *int64) int64 {
		var id int64
		err := pool.QueryRow(ctx, `
			INSERT INTO templates (category_id, designer_id, name, slug, description, price, style, color, thumbnail_file_id, status)
			VALUES ($1, $2, $3, $4, 'Initial desc', 100000, 'Classic', 'Blue', $5, $6)
			RETURNING id
		`, fixture.categoryID, ownerID, name, fixture.marker+"-"+slug, thumbID, status).Scan(&id)
		if err != nil {
			t.Fatalf("insert template %s: %v", name, err)
		}
		return id
	}

	tmplDraftA := insertTemplate(fixture.designerA, "Template Draft A", "draft-a", "draft", &fixture.storageFileID)
	tmplRevisionA := insertTemplate(fixture.designerA, "Template Revision A", "revision-a", "revision", nil)
	tmplPublishA := insertTemplate(fixture.designerA, "Template Publish A", "publish-a", "publish", nil)
	tmplDraftB := insertTemplate(fixture.designerB, "Template Draft B", "draft-b", "draft", nil)

	t.Run("designer_update_milik_sendiri_sukses_200_dan_updated_at_berubah", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)
		body := `{
			"name": "Template Draft A Renamed",
			"price": 180000,
			"style": "Modern Minimalist"
		}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool                           `json:"success"`
			Data    handlers.TemplateWriteResponse `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)

		if res.Data.Name != "Template Draft A Renamed" {
			t.Errorf("expected updated name, got %s", res.Data.Name)
		}
		if res.Data.Price != "180000.00" {
			t.Errorf("expected price '180000.00', got %s", res.Data.Price)
		}
		if res.Data.Style == nil || *res.Data.Style != "Modern Minimalist" {
			t.Errorf("expected updated style, got %v", res.Data.Style)
		}
		// Unchanged fields should remain intact
		if res.Data.Color == nil || *res.Data.Color != "Blue" {
			t.Errorf("expected color 'Blue' untouched, got %v", res.Data.Color)
		}
		if res.Data.Description == nil || *res.Data.Description != "Initial desc" {
			t.Errorf("expected description untouched, got %v", res.Data.Description)
		}
	})

	t.Run("patch_null_mengosongkan_field_nullable", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)
		body := `{
			"description": null,
			"style": null,
			"color": null,
			"thumbnail_file_id": null
		}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Data handlers.TemplateWriteResponse `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)

		if res.Data.Description != nil {
			t.Errorf("expected description to be null, got %v", *res.Data.Description)
		}
		if res.Data.Style != nil {
			t.Errorf("expected style to be null, got %v", *res.Data.Style)
		}
		if res.Data.Color != nil {
			t.Errorf("expected color to be null, got %v", *res.Data.Color)
		}
		if res.Data.ThumbnailFileID != nil {
			t.Errorf("expected thumbnail_file_id to be null, got %v", *res.Data.ThumbnailFileID)
		}
	})

	t.Run("patch_null_pada_field_wajib_menghasilkan_400", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)

		// null for name -> 400
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, `{"name": null}`, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for null name, got %d: %s", resp.Code, resp.Body.String())
		}

		// null for category_id -> 400
		resp = templateFavoritesRequest(engine, http.MethodPatch, path, `{"category_id": null}`, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for null category_id, got %d: %s", resp.Code, resp.Body.String())
		}

		// null for price -> 400
		resp = templateFavoritesRequest(engine, http.MethodPatch, path, `{"price": null}`, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for null price, got %d: %s", resp.Code, resp.Body.String())
		}

		// null for slug -> 400
		resp = templateFavoritesRequest(engine, http.MethodPatch, path, `{"slug": null}`, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for null slug, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("admin_update_template_designer_lain_sukses_200", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftB)
		body := `{"name": "Admin Super Edit", "price": 99000}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenAdmin)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for admin updating designer B template, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Data handlers.TemplateWriteResponse `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)
		if res.Data.Name != "Admin Super Edit" {
			t.Errorf("expected name updated by admin, got %s", res.Data.Name)
		}
	})

	t.Run("designer_update_template_designer_lain_404_dan_data_utuh", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftB)
		body := `{"name": "Hacked Name"}`

		// Designer A attempts to update Designer B's template
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 Not Found for cross-designer patch, got %d: %s", resp.Code, resp.Body.String())
		}

		// Ensure data in DB is untouched
		var dbName string
		_ = pool.QueryRow(ctx, `SELECT name FROM templates WHERE id = $1`, tmplDraftB).Scan(&dbName)
		if dbName == "Hacked Name" {
			t.Errorf("template was modified by unauthorized designer!")
		}
	})

	t.Run("update_status_revision_diizinkan_200", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplRevisionA)
		body := `{"name": "Revised Template Name"}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for revision status, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("update_status_publish_ditolak_409", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplPublishA)
		body := `{"name": "Attempt Publish Edit"}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict for publish status update, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)
		if res.Errors["status"] != "template_status_not_editable" {
			t.Errorf("expected error status: 'template_status_not_editable', got %v", res.Errors)
		}
	})

	t.Run("patch_thumbnail_file_id_tidak_ada_menghasilkan_400", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)
		body := `{"thumbnail_file_id": 999999999}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for non-existent thumbnail_file_id in PATCH, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("patch_abaikan_status_dan_designer_id_dengan_name_valid", func(t *testing.T) {
		tmplID := insertTemplate(fixture.designerA, "Template Status Designer Test", "status-designer-test", "draft", nil)
		path := fmt.Sprintf("/api/v1/templates/%d", tmplID)

		body := `{
			"name": "Template Name Updated Safely",
			"status": "publish",
			"designer_id": 999
		}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool                           `json:"success"`
			Data    handlers.TemplateWriteResponse `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if res.Data.Name != "Template Name Updated Safely" {
			t.Errorf("expected updated name %q, got %q", "Template Name Updated Safely", res.Data.Name)
		}
		if res.Data.Status != "draft" {
			t.Errorf("expected status 'draft' in response, got %q", res.Data.Status)
		}
		if res.Data.DesignerID != fixture.designerA {
			t.Errorf("expected designer_id %d in response, got %d", fixture.designerA, res.Data.DesignerID)
		}

		var dbName, dbStatus string
		var dbDesignerID int64
		err := pool.QueryRow(ctx, `SELECT name, status, designer_id FROM templates WHERE id = $1`, tmplID).Scan(&dbName, &dbStatus, &dbDesignerID)
		if err != nil {
			t.Fatalf("query template from db: %v", err)
		}

		if dbName != "Template Name Updated Safely" {
			t.Errorf("expected name in DB %q, got %q", "Template Name Updated Safely", dbName)
		}
		if dbStatus != "draft" {
			t.Errorf("expected status in DB 'draft', got %q", dbStatus)
		}
		if dbDesignerID != fixture.designerA {
			t.Errorf("expected designer_id in DB %d, got %d", fixture.designerA, dbDesignerID)
		}
	})

	t.Run("patch_hanya_berisi_status_atau_designer_id_menghasilkan_400", func(t *testing.T) {
		tmplID := insertTemplate(fixture.designerA, "Template Uneditable Only", "uneditable-only", "draft", nil)
		path := fmt.Sprintf("/api/v1/templates/%d", tmplID)

		testCases := []struct {
			name string
			body string
		}{
			{
				name: "only_status",
				body: `{"status": "publish"}`,
			},
			{
				name: "only_designer_id",
				body: `{"designer_id": 999}`,
			},
			{
				name: "status_and_designer_id",
				body: `{"status": "publish", "designer_id": 999}`,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				resp := templateFavoritesRequest(engine, http.MethodPatch, path, tc.body, tokenDesignerA)
				if resp.Code != http.StatusBadRequest {
					t.Errorf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
				}

				// Verify database unchanged
				var dbName, dbStatus string
				var dbDesignerID int64
				err := pool.QueryRow(ctx, `SELECT name, status, designer_id FROM templates WHERE id = $1`, tmplID).Scan(&dbName, &dbStatus, &dbDesignerID)
				if err != nil {
					t.Fatalf("query template from db: %v", err)
				}
				if dbName != "Template Uneditable Only" || dbStatus != "draft" || dbDesignerID != fixture.designerA {
					t.Errorf("template in DB was modified unexpectedly: name=%s, status=%s, designer_id=%d", dbName, dbStatus, dbDesignerID)
				}
			})
		}
	})

	t.Run("patch_slug_bentrok_dengan_template_lain_409", func(t *testing.T) {
		slugA := fixture.marker + "-slug-collision-src"
		slugB := fixture.marker + "-slug-collision-target"

		var tmpl1, tmpl2 int64
		err := pool.QueryRow(ctx, `
			INSERT INTO templates (category_id, designer_id, name, slug, description, price, style, color, status)
			VALUES ($1, $2, 'Collision Source', $3, 'Desc 1', 120000, 'Style 1', 'Color 1', 'draft')
			RETURNING id
		`, fixture.categoryID, fixture.designerA, slugA).Scan(&tmpl1)
		if err != nil {
			t.Fatalf("insert tmpl1: %v", err)
		}

		err = pool.QueryRow(ctx, `
			INSERT INTO templates (category_id, designer_id, name, slug, description, price, style, color, status)
			VALUES ($1, $2, 'Collision Target', $3, 'Desc 2', 150000, 'Style 2', 'Color 2', 'draft')
			RETURNING id
		`, fixture.categoryID, fixture.designerA, slugB).Scan(&tmpl2)
		if err != nil {
			t.Fatalf("insert tmpl2: %v", err)
		}

		var initialUpdatedAt time.Time
		err = pool.QueryRow(ctx, `SELECT updated_at FROM templates WHERE id = $1`, tmpl1).Scan(&initialUpdatedAt)
		if err != nil {
			t.Fatalf("query updated_at: %v", err)
		}

		path := fmt.Sprintf("/api/v1/templates/%d", tmpl1)
		body := fmt.Sprintf(`{"name": "Should Not Update", "slug": %q}`, slugB)

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool              `json:"success"`
			Errors  map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)
		if res.Errors["slug"] != "slug_already_taken" {
			t.Errorf("expected error slug: 'slug_already_taken', got %v", res.Errors)
		}

		// Verify data of tmpl1 is completely untouched
		var dbName, dbSlug, dbDesc, dbStyle, dbColor string
		var dbPrice float64
		var dbUpdatedAt time.Time
		err = pool.QueryRow(ctx, `
			SELECT name, slug, description, price, style, color, updated_at
			FROM templates WHERE id = $1
		`, tmpl1).Scan(&dbName, &dbSlug, &dbDesc, &dbPrice, &dbStyle, &dbColor, &dbUpdatedAt)
		if err != nil {
			t.Fatalf("query tmpl1 from db: %v", err)
		}

		if dbName != "Collision Source" {
			t.Errorf("expected name 'Collision Source', got %q", dbName)
		}
		if dbSlug != slugA {
			t.Errorf("expected slug %q, got %q", slugA, dbSlug)
		}
		if dbDesc != "Desc 1" {
			t.Errorf("expected description 'Desc 1', got %q", dbDesc)
		}
		if dbPrice != 120000 {
			t.Errorf("expected price 120000, got %v", dbPrice)
		}
		if !dbUpdatedAt.Equal(initialUpdatedAt) {
			t.Errorf("expected updated_at to be unchanged, got %v vs initial %v", dbUpdatedAt, initialUpdatedAt)
		}
	})

	t.Run("patch_category_id_tidak_ada_menghasilkan_400", func(t *testing.T) {
		tmplID := insertTemplate(fixture.designerA, "Template Invalid Category", "invalid-category-patch", "draft", nil)
		path := fmt.Sprintf("/api/v1/templates/%d", tmplID)
		body := `{"category_id": 999999999}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool              `json:"success"`
			Errors  map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)
		if res.Errors["category_id"] != "category_id does not exist" {
			t.Errorf("expected error category_id: 'category_id does not exist', got %v", res.Errors)
		}

		// Verify category_id in DB is unchanged
		var dbCategoryID int64
		err := pool.QueryRow(ctx, `SELECT category_id FROM templates WHERE id = $1`, tmplID).Scan(&dbCategoryID)
		if err != nil {
			t.Fatalf("query category_id from db: %v", err)
		}
		if dbCategoryID != fixture.categoryID {
			t.Errorf("expected category_id %d in DB, got %d", fixture.categoryID, dbCategoryID)
		}
	})

	t.Run("patch_price_overflow_1e20_menghasilkan_400", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)
		body := `{"price": 1e20}`

		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &res)
		if res.Errors["price"] == "" {
			t.Errorf("expected error field 'price', got %+v", res.Errors)
		}
	})

	t.Run("patch_body_kosong_400", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, `{}`, tokenDesignerA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty patch body, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("patch_id_invalid_dan_overflow_400", func(t *testing.T) {
		invalidIDs := []string{"abc", "-1", "0", "99999999999999999999"}
		for _, id := range invalidIDs {
			path := "/api/v1/templates/" + id
			resp := templateFavoritesRequest(engine, http.MethodPatch, path, `{"name":"New"}`, tokenDesignerA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("expected 400 for invalid id %q, got %d", id, resp.Code)
			}
		}
	})

	t.Run("patch_auth_401_dan_403", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)
		body := `{"name": "Auth Patch"}`

		// No token
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, "")
		if resp.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", resp.Code)
		}

		// Partner token
		resp = templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenPartner)
		if resp.Code != http.StatusForbidden {
			t.Errorf("expected 403 for partner, got %d", resp.Code)
		}
	})
}

func TestTemplateWrite_DELETE(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createTemplateWriteFixture(t, pool)

	tokenDesignerA := templateFavoritesToken(t, fixture.designerA)
	tokenAdmin := templateFavoritesToken(t, fixture.adminUser)
	tokenPartner := templateFavoritesToken(t, fixture.partnerUser)

	ctx := context.Background()

	insertTemplate := func(ownerID int64, name, slug, status string) int64 {
		var id int64
		err := pool.QueryRow(ctx, `
			INSERT INTO templates (category_id, designer_id, name, slug, status)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, fixture.categoryID, ownerID, name, fixture.marker+"-"+slug, status).Scan(&id)
		if err != nil {
			t.Fatalf("insert template %s: %v", name, err)
		}
		return id
	}

	tmplDraftA := insertTemplate(fixture.designerA, "Draft Delete A", "del-draft-a", "draft")
	tmplDraftAdminDel := insertTemplate(fixture.designerA, "Draft Admin Del", "del-admin", "draft")
	tmplPublishA := insertTemplate(fixture.designerA, "Publish Delete A", "del-pub-a", "publish")
	tmplRevisionA := insertTemplate(fixture.designerA, "Revision Delete A", "del-rev-a", "revision")
	tmplDraftB := insertTemplate(fixture.designerB, "Draft Delete B", "del-draft-b", "draft")

	// Template with sections and assets to test cascade
	tmplCascade := insertTemplate(fixture.designerA, "Draft Cascade", "del-cascade", "draft")
	var sectionID int64
	err := pool.QueryRow(ctx, `
		INSERT INTO template_sections (template_id, name, type, sort_order)
		VALUES ($1, 'Cover Section', 'cover', 1)
		RETURNING id
	`, tmplCascade).Scan(&sectionID)
	if err != nil {
		t.Fatalf("insert template section: %v", err)
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO template_fields (template_section_id, field_key, label, field_type)
		VALUES ($1, 'title_key', 'Title Label', 'text')
	`, sectionID)
	if err != nil {
		t.Fatalf("insert template field: %v", err)
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO template_assets (template_id, storage_file_id, asset_type)
		VALUES ($1, $2, 'image')
	`, tmplCascade, fixture.storageFileID)
	if err != nil {
		t.Fatalf("insert template asset: %v", err)
	}

	// Template referenced by invitation
	tmplRefInv := insertTemplate(fixture.designerA, "Draft Ref Inv", "del-ref-inv", "draft")
	var invID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status)
		VALUES ($1, $2, 'Wedding Ref Test', $3, 'draft')
		RETURNING id
	`, fixture.partnerUser, tmplRefInv, fixture.marker+"-inv-ref").Scan(&invID)
	if err != nil {
		t.Fatalf("insert referencing invitation: %v", err)
	}

	// Template referenced by package_templates
	tmplRefPkg := insertTemplate(fixture.designerA, "Draft Ref Pkg", "del-ref-pkg", "draft")
	var pkgID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO packages (name, price, status)
		VALUES ($1, 500000, 'active')
		RETURNING id
	`, fixture.marker+" Package").Scan(&pkgID)
	if err != nil {
		t.Fatalf("insert package: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM packages WHERE id = $1`, pkgID)
	})

	_, err = pool.Exec(ctx, `
		INSERT INTO package_templates (package_id, template_id)
		VALUES ($1, $2)
	`, pkgID, tmplRefPkg)
	if err != nil {
		t.Fatalf("insert package_template reference: %v", err)
	}

	// Template referenced by invitation_favorites
	tmplRefFav := insertTemplate(fixture.designerA, "Draft Ref Fav", "del-ref-fav", "draft")
	_, err = pool.Exec(ctx, `
		INSERT INTO invitation_favorites (user_id, template_id)
		VALUES ($1, $2)
	`, fixture.partnerUser, tmplRefFav)
	if err != nil {
		t.Fatalf("insert invitation_favorite reference: %v", err)
	}

	t.Run("designer_delete_milik_sendiri_sukses_200_dan_dua_kali_404", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftA)

		// First delete -> 200
		resp1 := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
		if resp1.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on first delete, got %d: %s", resp1.Code, resp1.Body.String())
		}

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(resp1.Body.Bytes(), &res)
		if !res.Success || res.Message != "Template deleted successfully" {
			t.Errorf("unexpected body on delete: %+v", res)
		}

		// Second delete -> 404
		resp2 := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
		if resp2.Code != http.StatusNotFound {
			t.Fatalf("expected 404 Not Found on second delete, got %d: %s", resp2.Code, resp2.Body.String())
		}
	})

	t.Run("admin_delete_draft_template_designer_sukses_200", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftAdminDel)
		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenAdmin)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for admin deleting designer template, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("designer_delete_template_designer_lain_404_dan_data_utuh", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftB)

		// Designer A attempts to delete Designer B's template
		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 Not Found for other designer delete, got %d: %s", resp.Code, resp.Body.String())
		}

		// Ensure template B still exists
		var exists bool
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM templates WHERE id = $1)`, tmplDraftB).Scan(&exists)
		if !exists {
			t.Errorf("template was deleted by unauthorized designer!")
		}
	})

	t.Run("delete_template_bukan_draft_ditolak_409", func(t *testing.T) {
		// Publish template -> 409
		pathPub := fmt.Sprintf("/api/v1/templates/%d", tmplPublishA)
		respPub := templateFavoritesRequest(engine, http.MethodDelete, pathPub, "", tokenDesignerA)
		if respPub.Code != http.StatusConflict {
			t.Errorf("expected 409 Conflict for deleting published template, got %d: %s", respPub.Code, respPub.Body.String())
		}

		// Revision template -> 409
		pathRev := fmt.Sprintf("/api/v1/templates/%d", tmplRevisionA)
		respRev := templateFavoritesRequest(engine, http.MethodDelete, pathRev, "", tokenDesignerA)
		if respRev.Code != http.StatusConflict {
			t.Errorf("expected 409 Conflict for deleting revision template, got %d: %s", respRev.Code, respRev.Body.String())
		}
	})

	t.Run("delete_draft_dengan_section_dan_asset_boleh_dihapus_cascade", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplCascade)

		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK when deleting draft with sections/assets, got %d: %s", resp.Code, resp.Body.String())
		}

		// Verify cascade: sections and assets should be gone
		var secExists bool
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM template_sections WHERE template_id = $1)`, tmplCascade).Scan(&secExists)
		if secExists {
			t.Errorf("expected sections to be deleted via cascade")
		}

		var assetExists bool
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM template_assets WHERE template_id = $1)`, tmplCascade).Scan(&assetExists)
		if assetExists {
			t.Errorf("expected assets to be deleted via cascade")
		}
	})

	t.Run("delete_template_dirujuk_invitations_ditolak_409", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplRefInv)
		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
		if resp.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict when deleting template referenced by invitation, got %d: %s", resp.Code, resp.Body.String())
		}

		// Data in DB remains intact
		var exists bool
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM templates WHERE id = $1)`, tmplRefInv).Scan(&exists)
		if !exists {
			t.Errorf("template was deleted despite invitation reference!")
		}
	})

	t.Run("delete_template_dirujuk_packages_ditolak_409", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplRefPkg)
		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
		if resp.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict when deleting template referenced by package, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("delete_template_dirujuk_favorites_ditolak_409", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplRefFav)
		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
		if resp.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict when deleting template referenced by favorites, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("delete_id_invalid_dan_overflow_400", func(t *testing.T) {
		invalidIDs := []string{"abc", "-1", "0", "99999999999999999999"}
		for _, id := range invalidIDs {
			path := "/api/v1/templates/" + id
			resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenDesignerA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("expected 400 for invalid id %q, got %d", id, resp.Code)
			}
		}
	})

	t.Run("delete_auth_401_dan_403", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/templates/%d", tmplDraftB)

		// Without token
		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", "")
		if resp.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", resp.Code)
		}

		// Partner token
		resp = templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenPartner)
		if resp.Code != http.StatusForbidden {
			t.Errorf("expected 403 for partner, got %d", resp.Code)
		}
	})
}
