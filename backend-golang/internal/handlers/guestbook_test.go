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

type guestbookFixture struct {
	marker        string
	partnerA      int64
	partnerB      int64
	designerUser  int64
	adminUser     int64
	categoryID    int64
	templateID    int64
	publishedInvA int64
	publishedSlug string
	draftInvA     int64
	draftSlug     string
	expiredInvA   int64
	expiredSlug   string
	publishedInvB int64
	otherSlug     string
}

func createGuestbookFixture(t *testing.T, pool *pgxpool.Pool) guestbookFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "gb-" + hex.EncodeToString(randomBytes)

	fixture := guestbookFixture{
		marker:        marker,
		publishedSlug: marker + "-pub",
		draftSlug:     marker + "-draft",
		expiredSlug:   marker + "-exp",
		otherSlug:     marker + "-other",
	}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{fixture.partnerA, fixture.partnerB, fixture.designerUser, fixture.adminUser}

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM guestbook_messages WHERE invitation_id IN (
				SELECT id FROM invitations WHERE user_id = ANY($1)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM invitations WHERE user_id = ANY($1)
		`, userIDs)

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

	err := pool.QueryRow(ctx, `
		INSERT INTO template_categories (name, slug, description)
		VALUES ($1, $2, 'Guestbook test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Guestbook template', 100000, 'published')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Template", marker+"-tmpl").Scan(&fixture.templateID)
	if err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	// 1. Published Invitation for Partner A
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at, expired_at)
		VALUES ($1, $2, 'Partner A Published Wedding', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL)
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.publishedSlug).Scan(&fixture.publishedInvA)
	if err != nil {
		t.Fatalf("insert published invitation: %v", err)
	}

	// 2. Draft Invitation for Partner A
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status)
		VALUES ($1, $2, 'Partner A Draft Wedding', $3, 'draft')
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.draftSlug).Scan(&fixture.draftInvA)
	if err != nil {
		t.Fatalf("insert draft invitation: %v", err)
	}

	// 3. Expired Invitation for Partner A
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at, expired_at)
		VALUES ($1, $2, 'Partner A Expired Wedding', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '1 hour')
		RETURNING id
	`, fixture.partnerA, fixture.templateID, fixture.expiredSlug).Scan(&fixture.expiredInvA)
	if err != nil {
		t.Fatalf("insert expired invitation: %v", err)
	}

	// 4. Published Invitation for Partner B
	err = pool.QueryRow(ctx, `
		INSERT INTO invitations (user_id, template_id, title, slug, status, published_at, expired_at)
		VALUES ($1, $2, 'Partner B Wedding', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL)
		RETURNING id
	`, fixture.partnerB, fixture.templateID, fixture.otherSlug).Scan(&fixture.publishedInvB)
	if err != nil {
		t.Fatalf("insert partner B invitation: %v", err)
	}

	return fixture
}

func checkForbiddenGuestbookPublicKeys(t *testing.T, data interface{}, path string) {
	t.Helper()

	forbiddenKeys := map[string]bool{
		"id":                    true,
		"guest_id":              true,
		"invitation_id":         true,
		"moderated_by":          true,
		"moderated_at":          true,
		"status":                true,
		"user_id":               true,
		"partner":               true,
		"invitation_version_id": true,
	}

	switch v := data.(type) {
	case map[string]interface{}:
		for k, val := range v {
			currentPath := path + "." + k
			if forbiddenKeys[k] {
				t.Errorf("found forbidden key %q in public guestbook response at path %q", k, currentPath)
			}
			checkForbiddenGuestbookPublicKeys(t, val, currentPath)
		}
	case []interface{}:
		for i, item := range v {
			checkForbiddenGuestbookPublicKeys(t, item, fmt.Sprintf("%s[%d]", path, i))
		}
	}
}

func TestPublicGuestbook_POST(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGuestbookFixture(t, pool)

	t.Run("sukses_201_tersimpan_pending_dan_guest_id_null", func(t *testing.T) {
		body := `{"name": "Ahmad Pratama", "message": "Barakallah, selamat menempuh hidup baru!", "status": "approved"}`
		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", body, "")
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Data    struct {
				Status string `json:"status"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if !res.Success || res.Data.Status != "pending" {
			t.Errorf("expected success true and status pending, got %+v", res)
		}

		// Verify in DB directly
		ctx := context.Background()
		var (
			dbStatus    string
			dbGuestID   *int64
			dbGuestName string
			dbMessage   string
		)
		err := pool.QueryRow(ctx, `
			SELECT status, guest_id, guest_name, message
			FROM guestbook_messages
			WHERE invitation_id = $1 AND guest_name = $2
		`, fixture.publishedInvA, "Ahmad Pratama").Scan(&dbStatus, &dbGuestID, &dbGuestName, &dbMessage)
		if err != nil {
			t.Fatalf("query inserted message in db: %v", err)
		}

		if dbStatus != "pending" {
			t.Errorf("expected db status 'pending', got %q", dbStatus)
		}
		if dbGuestID != nil {
			t.Errorf("expected db guest_id to be NULL (Option B), got %v", *dbGuestID)
		}
		if dbGuestName != "Ahmad Pratama" || dbMessage != "Barakallah, selamat menempuh hidup baru!" {
			t.Errorf("unexpected content in db: name=%q, msg=%q", dbGuestName, dbMessage)
		}
	})

	t.Run("nama_non_latin_dan_emoji_diterima", func(t *testing.T) {
		body := `{"name": "田中太郎 🌸", "message": "ご結婚おめでとうございます！🎉✨"}`
		resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", body, "")
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 for emoji/non-Latin, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("validasi_input_nama_dan_pesan_400", func(t *testing.T) {
		cases := []struct {
			name     string
			body     string
			expected string
		}{
			{"nama kosong", `{"name": "", "message": "Selamat!"}`, "name is required"},
			{"nama spasi saja", `{"name": "   ", "message": "Selamat!"}`, "name is required"},
			{"nama > 255 rune", fmt.Sprintf(`{"name": "%s", "message": "Selamat!"}`, strings.Repeat("A", 256)), "name must not exceed 255 characters"},
			{"pesan kosong", `{"name": "Budi", "message": ""}`, "message is required"},
			{"pesan spasi saja", `{"name": "Budi", "message": "   \n\t  "}`, "message is required"},
			{"pesan > 1000 rune", fmt.Sprintf(`{"name": "Budi", "message": "%s"}`, strings.Repeat("M", 1001)), "message must not exceed 1000 characters"},
		}

		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				resp := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", tc.body, "")
				if resp.Code != http.StatusBadRequest {
					t.Fatalf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
				}
				if !strings.Contains(resp.Body.String(), tc.expected) {
					t.Errorf("expected error %q in response, got %s", tc.expected, resp.Body.String())
				}
			})
		}
	})

	t.Run("body_rusak_kosong_dan_melebihi_64kb_400", func(t *testing.T) {
		respEmpty := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", "", "")
		if respEmpty.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty body, got %d", respEmpty.Code)
		}

		respInvalid := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", "{invalid-json", "")
		if respInvalid.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for invalid json, got %d", respInvalid.Code)
		}

		largeMsg := strings.Repeat("X", 65*1024)
		largeBody := fmt.Sprintf(`{"name": "Spammer", "message": "%s"}`, largeMsg)
		respLarge := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", largeBody, "")
		if respLarge.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for body > 64KB, got %d", respLarge.Code)
		}
		if !strings.Contains(respLarge.Body.String(), "64KB") {
			t.Errorf("expected 64KB limit message, got %s", respLarge.Body.String())
		}
	})

	t.Run("undangan_draft_expired_slug_tidak_ada_404_identik", func(t *testing.T) {
		body := `{"name": "Tamu Nyasar", "message": "Selamat menikah!"}`

		respDraft := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.draftSlug+"/guestbook", body, "")
		respExpired := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/"+fixture.expiredSlug+"/guestbook", body, "")
		respNotFound := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/non-existent-slug-xyz/guestbook", body, "")

		if respDraft.Code != 404 || respExpired.Code != 404 || respNotFound.Code != 404 {
			t.Fatalf("expected all 404, got draft=%d, exp=%d, nf=%d", respDraft.Code, respExpired.Code, respNotFound.Code)
		}

		if respDraft.Body.String() != respExpired.Body.String() || respDraft.Body.String() != respNotFound.Body.String() {
			t.Fatalf("404 bodies are not identical:\nDraft: %s\nExpired: %s\nNotFound: %s",
				respDraft.Body.String(), respExpired.Body.String(), respNotFound.Body.String())
		}

		if cc := respDraft.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected Cache-Control 'no-store' on 404, got %q", cc)
		}
	})
}

func TestPublicGuestbook_GET(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGuestbookFixture(t, pool)

	ctx := context.Background()

	// Insert messages for fixture.publishedInvA:
	// msg1: approved
	// msg2: pending (should NOT appear)
	// msg3: rejected (should NOT appear)
	// msg4: hidden (should NOT appear)
	// msg5: approved
	var id1, id2, id3, id4, id5 int64
	err := pool.QueryRow(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status, created_at)
		VALUES ($1, 'Approved User 1', 'Pesan disetujui pertama', 'approved', CURRENT_TIMESTAMP - INTERVAL '2 hours')
		RETURNING id
	`, fixture.publishedInvA).Scan(&id1)
	if err != nil {
		t.Fatalf("insert msg1: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status, created_at)
		VALUES ($1, 'Pending User', 'Pesan masih pending', 'pending', CURRENT_TIMESTAMP - INTERVAL '1 hour')
		RETURNING id
	`, fixture.publishedInvA).Scan(&id2)
	if err != nil {
		t.Fatalf("insert msg2: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status, created_at)
		VALUES ($1, 'Rejected User', 'Pesan ditolak', 'rejected', CURRENT_TIMESTAMP - INTERVAL '50 minutes')
		RETURNING id
	`, fixture.publishedInvA).Scan(&id3)
	if err != nil {
		t.Fatalf("insert msg3: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status, created_at)
		VALUES ($1, 'Hidden User', 'Pesan disembunyikan', 'hidden', CURRENT_TIMESTAMP - INTERVAL '40 minutes')
		RETURNING id
	`, fixture.publishedInvA).Scan(&id4)
	if err != nil {
		t.Fatalf("insert msg4: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status, created_at)
		VALUES ($1, 'Approved User 2', 'Pesan disetujui kedua (terbaru)', 'approved', CURRENT_TIMESTAMP - INTERVAL '10 minutes')
		RETURNING id
	`, fixture.publishedInvA).Scan(&id5)
	if err != nil {
		t.Fatalf("insert msg5: %v", err)
	}

	// Insert message for Partner B (should not mix)
	_, err = pool.Exec(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status, created_at)
		VALUES ($1, 'Partner B Guest', 'Khusus undangan partner B', 'approved', CURRENT_TIMESTAMP)
	`, fixture.publishedInvB)
	if err != nil {
		t.Fatalf("insert partner B msg: %v", err)
	}

	t.Run("hanya_pesan_approved_yang_muncul_urut_terbaru_dulu", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
		}

		if cc := resp.Header().Get("Cache-Control"); cc != "public, max-age=60" {
			t.Errorf("expected Cache-Control 'public, max-age=60', got %q", cc)
		}

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Data    struct {
				Messages []struct {
					GuestName string `json:"guest_name"`
					Message   string `json:"message"`
					CreatedAt string `json:"created_at"`
				} `json:"messages"`
				Pagination struct {
					Page       int   `json:"page"`
					Limit      int   `json:"limit"`
					Total      int64 `json:"total"`
					TotalPages int64 `json:"total_pages"`
				} `json:"pagination"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		if len(res.Data.Messages) != 2 {
			t.Fatalf("expected 2 approved messages, got %d", len(res.Data.Messages))
		}
		if res.Data.Pagination.Total != 2 {
			t.Errorf("expected pagination total 2, got %d", res.Data.Pagination.Total)
		}

		// Urut terbaru dulu (Approved User 2 first, then Approved User 1)
		if res.Data.Messages[0].GuestName != "Approved User 2" {
			t.Errorf("expected first message to be newest 'Approved User 2', got %q", res.Data.Messages[0].GuestName)
		}
		if res.Data.Messages[1].GuestName != "Approved User 1" {
			t.Errorf("expected second message to be 'Approved User 1', got %q", res.Data.Messages[1].GuestName)
		}

		// Verify non-approved messages are NOT present
		raw := resp.Body.String()
		if strings.Contains(raw, "Pending User") || strings.Contains(raw, "Rejected User") || strings.Contains(raw, "Hidden User") {
			t.Errorf("public response leaked non-approved messages: %s", raw)
		}
		if strings.Contains(raw, "Partner B Guest") {
			t.Errorf("public response mixed message from another invitation: %s", raw)
		}
	})

	t.Run("respons_publik_tidak_memuat_key_terlarang", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", resp.Code)
		}

		var rawData map[string]interface{}
		if err := json.Unmarshal(resp.Body.Bytes(), &rawData); err != nil {
			t.Fatalf("unmarshal json: %v", err)
		}

		checkForbiddenGuestbookPublicKeys(t, rawData, "")
	})

	t.Run("limit_100_dipotong_maksimal_50", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook?limit=100", "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", resp.Code)
		}

		var res struct {
			Data struct {
				Pagination struct {
					Limit int `json:"limit"`
				} `json:"pagination"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if res.Data.Pagination.Limit != 50 {
			t.Errorf("expected limit capped at 50, got %d", res.Data.Pagination.Limit)
		}
	})

	t.Run("moderasi_dinamis_approve_muncul_hide_hilang_lagi", func(t *testing.T) {
		tokenA := templateFavoritesToken(t, fixture.partnerA)

		// 1. Approve msg2 ("Pending User") via partner PATCH
		patchBody := `{"status": "approved"}`
		respPatch := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, id2), patchBody, tokenA)
		if respPatch.Code != http.StatusOK {
			t.Fatalf("partner approve failed: %d %s", respPatch.Code, respPatch.Body.String())
		}

		// Check public GET: now "Pending User" must appear (total 3)
		respPub1 := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", "", "")
		if !strings.Contains(respPub1.Body.String(), "Pending User") {
			t.Fatalf("expected approved message to appear publicly")
		}

		// 2. Hide msg2 via partner PATCH
		hideBody := `{"status": "hidden"}`
		respHide := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, id2), hideBody, tokenA)
		if respHide.Code != http.StatusOK {
			t.Fatalf("partner hide failed: %d %s", respHide.Code, respHide.Body.String())
		}

		// Check public GET: now "Pending User" must disappear
		respPub2 := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.publishedSlug+"/guestbook", "", "")
		if strings.Contains(respPub2.Body.String(), "Pending User") {
			t.Fatalf("expected hidden message to disappear from public")
		}
	})

	t.Run("public_get_404_seragam_dengan_cache_no_store", func(t *testing.T) {
		respDraft := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.draftSlug+"/guestbook", "", "")
		respExpired := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/"+fixture.expiredSlug+"/guestbook", "", "")
		respNotFound := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/public/invitations/non-existent-xyz/guestbook", "", "")

		if respDraft.Code != 404 || respExpired.Code != 404 || respNotFound.Code != 404 {
			t.Fatalf("expected all 404, got draft=%d, exp=%d, nf=%d", respDraft.Code, respExpired.Code, respNotFound.Code)
		}
		if respDraft.Body.String() != respExpired.Body.String() || respDraft.Body.String() != respNotFound.Body.String() {
			t.Fatalf("expected identical 404 bodies")
		}
		if cc := respDraft.Header().Get("Cache-Control"); cc != "no-store" {
			t.Errorf("expected no-store on 404, got %q", cc)
		}
	})

	_ = id1
	_ = id3
	_ = id4
	_ = id5
}

func TestPartnerGuestbook(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGuestbookFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)
	tokenDesigner := templateFavoritesToken(t, fixture.designerUser)

	ctx := context.Background()

	// Seed messages on fixture.publishedInvA:
	// 2 pending, 2 approved, 1 rejected, 1 hidden = total 6
	var pMsgID1, pMsgID2 int64
	err := pool.QueryRow(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status)
		VALUES ($1, 'Tamu 1', 'Pesan 1', 'pending')
		RETURNING id
	`, fixture.publishedInvA).Scan(&pMsgID1)
	if err != nil {
		t.Fatalf("seed 1: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status)
		VALUES ($1, 'Tamu 2', 'Pesan 2', 'pending')
		RETURNING id
	`, fixture.publishedInvA).Scan(&pMsgID2)
	if err != nil {
		t.Fatalf("seed 2: %v", err)
	}

	_, _ = pool.Exec(ctx, `
		INSERT INTO guestbook_messages (invitation_id, guest_name, message, status)
		VALUES
			($1, 'Tamu 3', 'Pesan 3', 'approved'),
			($1, 'Tamu 4', 'Pesan 4', 'approved'),
			($1, 'Tamu 5', 'Pesan 5', 'rejected'),
			($1, 'Tamu 6', 'Pesan 6', 'hidden')
	`, fixture.publishedInvA)

	t.Run("auth_dan_role_checks", func(t *testing.T) {
		// Without token -> 401
		respNoToken := templateFavoritesRequest(engine, http.MethodGet, fmt.Sprintf("/api/v1/invitations/%d/guestbook", fixture.publishedInvA), "", "")
		if respNoToken.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", respNoToken.Code)
		}

		// Non-partner (designer) -> 403
		respForbidden := templateFavoritesRequest(engine, http.MethodGet, fmt.Sprintf("/api/v1/invitations/%d/guestbook", fixture.publishedInvA), "", tokenDesigner)
		if respForbidden.Code != http.StatusForbidden {
			t.Errorf("expected 403, got %d", respForbidden.Code)
		}
	})

	t.Run("get_partner_list_dan_summary_tidak_berubah_oleh_filter", func(t *testing.T) {
		// All messages (no filter)
		respAll := templateFavoritesRequest(engine, http.MethodGet, fmt.Sprintf("/api/v1/invitations/%d/guestbook", fixture.publishedInvA), "", tokenA)
		if respAll.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", respAll.Code, respAll.Body.String())
		}

		var resAll struct {
			Data struct {
				Summary struct {
					Total    int64 `json:"total"`
					Pending  int64 `json:"pending"`
					Approved int64 `json:"approved"`
					Rejected int64 `json:"rejected"`
					Hidden   int64 `json:"hidden"`
				} `json:"summary"`
				Messages []struct {
					ID        int64  `json:"id"`
					GuestName string `json:"guest_name"`
					Status    string `json:"status"`
				} `json:"messages"`
				Pagination struct {
					Total int64 `json:"total"`
				} `json:"pagination"`
			} `json:"data"`
		}
		if err := json.Unmarshal(respAll.Body.Bytes(), &resAll); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		if resAll.Data.Summary.Total != 6 {
			t.Errorf("expected total 6, got %d", resAll.Data.Summary.Total)
		}
		if resAll.Data.Summary.Pending != 2 || resAll.Data.Summary.Approved != 2 || resAll.Data.Summary.Rejected != 1 || resAll.Data.Summary.Hidden != 1 {
			t.Errorf("summary counts mismatch: %+v", resAll.Data.Summary)
		}
		if len(resAll.Data.Messages) != 6 {
			t.Errorf("expected 6 messages, got %d", len(resAll.Data.Messages))
		}

		// Filter status=pending
		respFiltered := templateFavoritesRequest(engine, http.MethodGet, fmt.Sprintf("/api/v1/invitations/%d/guestbook?status=pending", fixture.publishedInvA), "", tokenA)
		if respFiltered.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", respFiltered.Code)
		}

		var resFiltered struct {
			Data struct {
				Summary struct {
					Total   int64 `json:"total"`
					Pending int64 `json:"pending"`
				} `json:"summary"`
				Messages []struct {
					Status string `json:"status"`
				} `json:"messages"`
				Pagination struct {
					Total int64 `json:"total"`
				} `json:"pagination"`
			} `json:"data"`
		}
		if err := json.Unmarshal(respFiltered.Body.Bytes(), &resFiltered); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		// Summary MUST NOT change by filter
		if resFiltered.Data.Summary.Total != 6 || resFiltered.Data.Summary.Pending != 2 {
			t.Errorf("summary should not be affected by filter: %+v", resFiltered.Data.Summary)
		}
		// But messages and pagination total MUST be filtered (2 pending)
		if len(resFiltered.Data.Messages) != 2 || resFiltered.Data.Pagination.Total != 2 {
			t.Errorf("expected 2 filtered items, got msgs=%d, total=%d", len(resFiltered.Data.Messages), resFiltered.Data.Pagination.Total)
		}
	})

	t.Run("filter_status_invalid_400", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, fmt.Sprintf("/api/v1/invitations/%d/guestbook?status=unsupported_status", fixture.publishedInvA), "", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for invalid status filter, got %d", resp.Code)
		}
	})

	t.Run("patch_moderasi_sukses_dan_idempoten", func(t *testing.T) {
		// PATCH status to 'approved'
		body := `{"status": "approved"}`
		resp := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, pMsgID1), body, tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 for PATCH, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Data struct {
				ID          int64   `json:"id"`
				Status      string  `json:"status"`
				ModeratedAt *string `json:"moderated_at"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal patch resp: %v", err)
		}
		if res.Data.Status != "approved" || res.Data.ModeratedAt == nil {
			t.Errorf("expected status approved and moderated_at not nil, got %+v", res.Data)
		}

		// Verify moderated_by in DB directly
		var modBy *int64
		err := pool.QueryRow(ctx, "SELECT moderated_by FROM guestbook_messages WHERE id = $1", pMsgID1).Scan(&modBy)
		if err != nil {
			t.Fatalf("query db: %v", err)
		}
		if modBy == nil || *modBy != fixture.partnerA {
			t.Errorf("expected moderated_by to be partnerA (%d), got %v", fixture.partnerA, modBy)
		}

		// Idempotent: patch same status again returns 200
		respIdemp := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, pMsgID1), body, tokenA)
		if respIdemp.Code != http.StatusOK {
			t.Errorf("expected 200 for idempotent patch, got %d", respIdemp.Code)
		}
	})

	t.Run("patch_status_invalid_400", func(t *testing.T) {
		body := `{"status": "banned"}`
		resp := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, pMsgID1), body, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for invalid patch status, got %d", resp.Code)
		}
	})

	t.Run("id_tidak_valid_dan_overflow_int64_400", func(t *testing.T) {
		// `:id` overflow
		resp1 := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations/99999999999999999999/guestbook", "", tokenA)
		if resp1.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for overflow id, got %d", resp1.Code)
		}

		// `:message_id` overflow
		resp2 := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/99999999999999999999", fixture.publishedInvA), `{"status":"approved"}`, tokenA)
		if resp2.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for overflow message_id, got %d", resp2.Code)
		}

		// `:id` non-numeric
		resp3 := templateFavoritesRequest(engine, http.MethodDelete, fmt.Sprintf("/api/v1/invitations/abc/guestbook/%d", pMsgID1), "", tokenA)
		if resp3.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for non-numeric id, got %d", resp3.Code)
		}
	})

	t.Run("partner_lain_atau_id_tidak_ada_404", func(t *testing.T) {
		// Partner B accessing Partner A's guestbook list -> 404
		respBList := templateFavoritesRequest(engine, http.MethodGet, fmt.Sprintf("/api/v1/invitations/%d/guestbook", fixture.publishedInvA), "", tokenB)
		if respBList.Code != http.StatusNotFound {
			t.Errorf("expected 404 for partner B list, got %d", respBList.Code)
		}

		// Partner B patching Partner A's message -> 404
		respBPatch := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, pMsgID1), `{"status":"approved"}`, tokenB)
		if respBPatch.Code != http.StatusNotFound {
			t.Errorf("expected 404 for partner B patch, got %d", respBPatch.Code)
		}

		// Partner B deleting Partner A's message -> 404
		respBDelete := templateFavoritesRequest(engine, http.MethodDelete, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, pMsgID1), "", tokenB)
		if respBDelete.Code != http.StatusNotFound {
			t.Errorf("expected 404 for partner B delete, got %d", respBDelete.Code)
		}

		// Non-existent message ID -> 404
		respNonExistent := templateFavoritesRequest(engine, http.MethodPatch, fmt.Sprintf("/api/v1/invitations/%d/guestbook/999999999", fixture.publishedInvA), `{"status":"approved"}`, tokenA)
		if respNonExistent.Code != http.StatusNotFound {
			t.Errorf("expected 404 for non-existent message, got %d", respNonExistent.Code)
		}
	})

	t.Run("delete_sukses_dan_hapus_dua_kali_404", func(t *testing.T) {
		// First delete -> 200
		respDel1 := templateFavoritesRequest(engine, http.MethodDelete, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, pMsgID2), "", tokenA)
		if respDel1.Code != http.StatusOK {
			t.Fatalf("expected 200 for first delete, got %d: %s", respDel1.Code, respDel1.Body.String())
		}

		// Verify in DB: row is gone
		var cnt int
		_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM guestbook_messages WHERE id = $1", pMsgID2).Scan(&cnt)
		if cnt != 0 {
			t.Errorf("expected message %d to be completely deleted from db", pMsgID2)
		}

		// Second delete -> 404
		respDel2 := templateFavoritesRequest(engine, http.MethodDelete, fmt.Sprintf("/api/v1/invitations/%d/guestbook/%d", fixture.publishedInvA, pMsgID2), "", tokenA)
		if respDel2.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for second delete, got %d", respDel2.Code)
		}

		// Ensure other messages (pMsgID1) still exist
		var checkID int64
		err := pool.QueryRow(ctx, "SELECT id FROM guestbook_messages WHERE id = $1", pMsgID1).Scan(&checkID)
		if err != nil {
			t.Errorf("other message was unexpectedly affected: %v", err)
		}
	})
}
