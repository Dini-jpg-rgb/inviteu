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
	"sync/atomic"
	"testing"
	"time"

	"backend-golang/internal/handlers"

	"github.com/jackc/pgx/v5/pgxpool"
)

type giftsTestFixture struct {
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

func createGiftsTestFixture(t *testing.T, pool *pgxpool.Pool) giftsTestFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "gift-" + hex.EncodeToString(randomBytes)

	fixture := giftsTestFixture{
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
			DELETE FROM invitation_gifts WHERE invitation_id IN (
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
		VALUES ($1, $2, 'Gifts test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'Gifts template', 100000, 'published')
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

func checkForbiddenGiftsPublicKeys(t *testing.T, data interface{}, path string) {
	t.Helper()

	forbiddenKeys := map[string]bool{
		"id":            true,
		"invitation_id": true,
		"is_active":     true,
		"created_at":    true,
		"updated_at":    true,
		"user_id":       true,
		"partner":       true,
		"partner_id":    true,
		"status":        true,
	}

	switch v := data.(type) {
	case map[string]interface{}:
		for k, val := range v {
			currentPath := path + "." + k
			if forbiddenKeys[k] {
				t.Errorf("found forbidden key %q in public gifts response at path %q", k, currentPath)
			}
			checkForbiddenGiftsPublicKeys(t, val, currentPath)
		}
	case []interface{}:
		for i, item := range v {
			checkForbiddenGiftsPublicKeys(t, item, fmt.Sprintf("%s[%d]", path, i))
		}
	}
}

func TestPartnerInvitationGifts_POST(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGiftsTestFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)

	t.Run("sukses_201_tiap_tipe_dan_cek_db", func(t *testing.T) {
		types := []struct {
			name        string
			body        string
			expectType  string
			expectProv  string
			expectAccN  string
			expectAccNu string
			expectWId   string
			expectInstr string
			expectOrder int
			expectAct   bool
		}{
			{
				name: "bank_transfer",
				body: `{
					"gift_type": "bank_transfer",
					"provider_name": "BCA",
					"account_name": "Romeo Montague",
					"account_number": "123-456-7890",
					"sort_order": 1,
					"is_active": true
				}`,
				expectType:  "bank_transfer",
				expectProv:  "BCA",
				expectAccN:  "Romeo Montague",
				expectAccNu: "123-456-7890",
				expectOrder: 1,
				expectAct:   true,
			},
			{
				name: "e_wallet_with_wallet_identifier",
				body: `{
					"gift_type": "e_wallet",
					"provider_name": "GoPay",
					"account_name": "Juliet Capulet",
					"wallet_identifier": "+62 812-3456-7890",
					"sort_order": 2
				}`,
				expectType:  "e_wallet",
				expectProv:  "GoPay",
				expectAccN:  "Juliet Capulet",
				expectWId:   "+62 812-3456-7890",
				expectOrder: 2,
				expectAct:   true, // default
			},
			{
				name: "e_wallet_with_account_number",
				body: `{
					"gift_type": "e_wallet",
					"provider_name": "OVO",
					"account_name": "Juliet Capulet",
					"account_number": "081234567890"
				}`,
				expectType:  "e_wallet",
				expectProv:  "OVO",
				expectAccN:  "Juliet Capulet",
				expectAccNu: "081234567890",
				expectOrder: 0, // default
				expectAct:   true,
			},
			{
				name: "physical_gift",
				body: `{
					"gift_type": "physical_gift",
					"instructions": "Kirim ke Jl. Mawar No. 10, Jakarta Pusat",
					"sort_order": 3,
					"is_active": false
				}`,
				expectType:  "physical_gift",
				expectInstr: "Kirim ke Jl. Mawar No. 10, Jakarta Pusat",
				expectOrder: 3,
				expectAct:   false,
			},
			{
				name: "other",
				body: `{
					"gift_type": "other",
					"instructions": "Konfirmasi hadiah melalui WhatsApp partner di nomor terkait",
					"sort_order": 4
				}`,
				expectType:  "other",
				expectInstr: "Konfirmasi hadiah melalui WhatsApp partner di nomor terkait",
				expectOrder: 4,
				expectAct:   true,
			},
		}

		for _, tc := range types {
			t.Run(tc.name, func(t *testing.T) {
				path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)
				resp := templateFavoritesRequest(engine, http.MethodPost, path, tc.body, tokenA)
				if resp.Code != http.StatusCreated {
					t.Fatalf("expected 201 Created, got %d: %s", resp.Code, resp.Body.String())
				}

				var res struct {
					Success bool                               `json:"success"`
					Message string                             `json:"message"`
					Data    handlers.PartnerInvitationGiftItem `json:"data"`
				}
				if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
					t.Fatalf("unmarshal response: %v", err)
				}
				if !res.Success || res.Data.ID <= 0 {
					t.Fatalf("expected successful response with positive ID, got %+v", res)
				}
				if res.Data.GiftType != tc.expectType {
					t.Errorf("expected gift_type %q, got %q", tc.expectType, res.Data.GiftType)
				}
				if res.Data.SortOrder != tc.expectOrder {
					t.Errorf("expected sort_order %d, got %d", tc.expectOrder, res.Data.SortOrder)
				}
				if res.Data.IsActive != tc.expectAct {
					t.Errorf("expected is_active %v, got %v", tc.expectAct, res.Data.IsActive)
				}

				// Check directly in database
				var (
					dbType      string
					dbProv      *string
					dbAccN      *string
					dbAccNu     *string
					dbWId       *string
					dbInstr     *string
					dbSortOrder int
					dbIsActive  bool
				)
				err := pool.QueryRow(context.Background(), `
					SELECT gift_type, provider_name, account_name, account_number, wallet_identifier, instructions, sort_order, is_active
					FROM invitation_gifts
					WHERE id = $1 AND invitation_id = $2
				`, res.Data.ID, fixture.publishedInvA).Scan(
					&dbType, &dbProv, &dbAccN, &dbAccNu, &dbWId, &dbInstr, &dbSortOrder, &dbIsActive,
				)
				if err != nil {
					t.Fatalf("query db for inserted gift: %v", err)
				}

				if dbType != tc.expectType {
					t.Errorf("db gift_type mismatch: expected %q, got %q", tc.expectType, dbType)
				}
				if tc.expectProv != "" && (dbProv == nil || *dbProv != tc.expectProv) {
					t.Errorf("db provider mismatch: expected %q, got %v", tc.expectProv, dbProv)
				}
				if tc.expectAccN != "" && (dbAccN == nil || *dbAccN != tc.expectAccN) {
					t.Errorf("db account_name mismatch: expected %q, got %v", tc.expectAccN, dbAccN)
				}
				if tc.expectAccNu != "" && (dbAccNu == nil || *dbAccNu != tc.expectAccNu) {
					t.Errorf("db account_number mismatch: expected %q, got %v", tc.expectAccNu, dbAccNu)
				}
				if tc.expectWId != "" && (dbWId == nil || *dbWId != tc.expectWId) {
					t.Errorf("db wallet_identifier mismatch: expected %q, got %v", tc.expectWId, dbWId)
				}
				if tc.expectInstr != "" && (dbInstr == nil || *dbInstr != tc.expectInstr) {
					t.Errorf("db instructions mismatch: expected %q, got %v", tc.expectInstr, dbInstr)
				}
				if dbSortOrder != tc.expectOrder {
					t.Errorf("db sort_order mismatch: expected %d, got %d", tc.expectOrder, dbSortOrder)
				}
				if dbIsActive != tc.expectAct {
					t.Errorf("db is_active mismatch: expected %v, got %v", tc.expectAct, dbIsActive)
				}
			})
		}
	})

	t.Run("undangan_draft_published_expired_sama_sama_boleh_ditulis", func(t *testing.T) {
		invIDs := []int64{fixture.draftInvA, fixture.publishedInvA, fixture.expiredInvA}
		for _, invID := range invIDs {
			path := fmt.Sprintf("/api/v1/invitations/%d/gifts", invID)
			body := `{
				"gift_type": "physical_gift",
				"instructions": "Alamat penerima kado pernikahan"
			}`
			resp := templateFavoritesRequest(engine, http.MethodPost, path, body, tokenA)
			if resp.Code != http.StatusCreated {
				t.Fatalf("expected 201 for invitation %d, got %d: %s", invID, resp.Code, resp.Body.String())
			}
		}
	})

	t.Run("validasi_per_tipe_field_wajib_kosong", func(t *testing.T) {
		tests := []struct {
			name     string
			body     string
			expField string
		}{
			{
				name:     "bank_transfer_missing_provider",
				body:     `{"gift_type":"bank_transfer","account_name":"Romeo","account_number":"12345"}`,
				expField: "provider_name",
			},
			{
				name:     "bank_transfer_missing_account_name",
				body:     `{"gift_type":"bank_transfer","provider_name":"BCA","account_number":"12345"}`,
				expField: "account_name",
			},
			{
				name:     "bank_transfer_missing_account_number",
				body:     `{"gift_type":"bank_transfer","provider_name":"BCA","account_name":"Romeo"}`,
				expField: "account_number",
			},
			{
				name:     "e_wallet_missing_provider",
				body:     `{"gift_type":"e_wallet","account_name":"Romeo","wallet_identifier":"12345"}`,
				expField: "provider_name",
			},
			{
				name:     "e_wallet_missing_account_name",
				body:     `{"gift_type":"e_wallet","provider_name":"GoPay","wallet_identifier":"12345"}`,
				expField: "account_name",
			},
			{
				name:     "e_wallet_missing_both_identifiers",
				body:     `{"gift_type":"e_wallet","provider_name":"GoPay","account_name":"Romeo"}`,
				expField: "wallet_identifier",
			},
			{
				name:     "physical_gift_missing_instructions",
				body:     `{"gift_type":"physical_gift"}`,
				expField: "instructions",
			},
			{
				name:     "other_missing_instructions",
				body:     `{"gift_type":"other"}`,
				expField: "instructions",
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)
				resp := templateFavoritesRequest(engine, http.MethodPost, path, tc.body, tokenA)
				if resp.Code != http.StatusBadRequest {
					t.Fatalf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
				}
				var res struct {
					Success bool              `json:"success"`
					Errors  map[string]string `json:"errors"`
				}
				if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
					t.Fatalf("unmarshal: %v", err)
				}
				if res.Success || res.Errors[tc.expField] == "" {
					t.Errorf("expected error field %q, got %+v", tc.expField, res.Errors)
				}
			})
		}
	})

	t.Run("gift_type_salah", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)
		body := `{"gift_type":"crypto_wallet","instructions":"0x1234"}`
		resp := templateFavoritesRequest(engine, http.MethodPost, path, body, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("teks_terlalu_panjang_rune", func(t *testing.T) {
		// provider_name > 150 runes
		longProv := strings.Repeat("日", 151)
		bodyProv := fmt.Sprintf(`{"gift_type":"bank_transfer","provider_name":%q,"account_name":"Romeo","account_number":"123"}`, longProv)
		resp := templateFavoritesRequest(engine, http.MethodPost, fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA), bodyProv, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for long provider_name, got %d", resp.Code)
		}

		// account_name > 255 runes
		longAcc := strings.Repeat("A", 256)
		bodyAcc := fmt.Sprintf(`{"gift_type":"bank_transfer","provider_name":"BCA","account_name":%q,"account_number":"123"}`, longAcc)
		resp = templateFavoritesRequest(engine, http.MethodPost, fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA), bodyAcc, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for long account_name, got %d", resp.Code)
		}

		// account_number > 255 runes
		longNum := strings.Repeat("1", 256)
		bodyNum := fmt.Sprintf(`{"gift_type":"bank_transfer","provider_name":"BCA","account_name":"Romeo","account_number":%q}`, longNum)
		resp = templateFavoritesRequest(engine, http.MethodPost, fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA), bodyNum, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for long account_number, got %d", resp.Code)
		}

		// instructions > 2000 runes
		longInstr := strings.Repeat("B", 2001)
		bodyInstr := fmt.Sprintf(`{"gift_type":"physical_gift","instructions":%q}`, longInstr)
		resp = templateFavoritesRequest(engine, http.MethodPost, fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA), bodyInstr, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for long instructions, got %d", resp.Code)
		}
	})

	t.Run("nomor_berformat_salah", func(t *testing.T) {
		invalidNumbers := []string{
			"123-abc-456",
			"rekening123",
			"   ",
			" - + - ",
			"!@#$%^",
			"123.456",
		}
		for _, num := range invalidNumbers {
			body := fmt.Sprintf(`{"gift_type":"bank_transfer","provider_name":"BCA","account_name":"Romeo","account_number":%q}`, num)
			resp := templateFavoritesRequest(engine, http.MethodPost, fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA), body, tokenA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("expected 400 for invalid number format %q, got %d: %s", num, resp.Code, resp.Body.String())
			}
		}
	})

	t.Run("body_kosong_rusak_lebih_64kb", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)

		// Empty
		resp := templateFavoritesRequest(engine, http.MethodPost, path, "", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty body, got %d", resp.Code)
		}

		// Malformed JSON
		resp = templateFavoritesRequest(engine, http.MethodPost, path, `{"gift_type":`, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for malformed json, got %d", resp.Code)
		}

		// > 64 KB
		oversized := fmt.Sprintf(`{"gift_type":"other","instructions":%q}`, strings.Repeat("x", 65*1024))
		resp = templateFavoritesRequest(engine, http.MethodPost, path, oversized, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for >64KB body, got %d", resp.Code)
		}
	})

	t.Run("partner_lain_404_dan_data_tetap_utuh", func(t *testing.T) {
		// Partner B tries to POST to Partner A's invitation
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)
		body := `{"gift_type":"physical_gift","instructions":"Hadiah misterius"}`
		resp := templateFavoritesRequest(engine, http.MethodPost, path, body, tokenB)
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 Not Found for cross-partner post, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("id_tidak_valid_dan_overflow", func(t *testing.T) {
		invalidIDs := []string{"abc", "-5", "0", "99999999999999999999"}
		for _, id := range invalidIDs {
			path := fmt.Sprintf("/api/v1/invitations/%s/gifts", id)
			resp := templateFavoritesRequest(engine, http.MethodPost, path, `{"gift_type":"physical_gift","instructions":"Valid"}`, tokenA)
			if resp.Code != http.StatusBadRequest {
				t.Errorf("expected 400 for invalid id %q, got %d: %s", id, resp.Code, resp.Body.String())
			}
		}
	})

	t.Run("tanpa_token_401_dan_role_bukan_partner_403", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)
		body := `{"gift_type":"physical_gift","instructions":"Valid"}`

		// No token
		resp := templateFavoritesRequest(engine, http.MethodPost, path, body, "")
		if resp.Code != http.StatusUnauthorized {
			t.Errorf("expected 401 Unauthorized, got %d", resp.Code)
		}

		// Designer token
		designerToken := templateFavoritesToken(t, fixture.designerUser)
		resp = templateFavoritesRequest(engine, http.MethodPost, path, body, designerToken)
		if resp.Code != http.StatusForbidden {
			t.Errorf("expected 403 Forbidden for designer role, got %d", resp.Code)
		}

		// Admin token
		adminToken := templateFavoritesToken(t, fixture.adminUser)
		resp = templateFavoritesRequest(engine, http.MethodPost, path, body, adminToken)
		if resp.Code != http.StatusForbidden {
			t.Errorf("expected 403 Forbidden for admin role, got %d", resp.Code)
		}
	})
}

func TestPartnerInvitationGifts_LimitAndConcurrency(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGiftsTestFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)

	t.Run("batas_10_hadiah_dan_hadiah_ke_11_409", func(t *testing.T) {
		// Create a separate invitation specifically for this limit test
		var limitInvID int64
		err := pool.QueryRow(context.Background(), `
			INSERT INTO invitations (user_id, template_id, title, slug, status)
			VALUES ($1, $2, 'Limit Test Wedding', $3, 'published')
			RETURNING id
		`, fixture.partnerA, fixture.templateID, fixture.marker+"-limit-10").Scan(&limitInvID)
		if err != nil {
			t.Fatalf("insert limit invitation: %v", err)
		}

		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", limitInvID)

		// Insert 10 gifts
		for i := 1; i <= 10; i++ {
			body := fmt.Sprintf(`{
				"gift_type": "physical_gift",
				"instructions": "Hadiah ke-%d",
				"sort_order": %d
			}`, i, i)
			resp := templateFavoritesRequest(engine, http.MethodPost, path, body, tokenA)
			if resp.Code != http.StatusCreated {
				t.Fatalf("expected 201 for gift #%d, got %d: %s", i, resp.Code, resp.Body.String())
			}
		}

		// 11th gift attempt should return 409 Conflict
		body11 := `{
			"gift_type": "physical_gift",
			"instructions": "Hadiah ke-11 yang harus ditolak"
		}`
		resp11 := templateFavoritesRequest(engine, http.MethodPost, path, body11, tokenA)
		if resp11.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict for 11th gift, got %d: %s", resp11.Code, resp11.Body.String())
		}

		var res struct {
			Success bool              `json:"success"`
			Message string            `json:"message"`
			Errors  map[string]string `json:"errors"`
		}
		if err := json.Unmarshal(resp11.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal 11th response: %v", err)
		}
		if res.Errors["gifts"] != "gift_limit_reached" {
			t.Errorf("expected error gifts: 'gift_limit_reached', got %v", res.Errors)
		}

		// Ensure total in DB is strictly 10
		var count int
		err = pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM invitation_gifts WHERE invitation_id = $1`, limitInvID).Scan(&count)
		if err != nil {
			t.Fatalf("count gifts in db: %v", err)
		}
		if count != 10 {
			t.Errorf("expected exactly 10 rows in db, got %d", count)
		}
	})

	t.Run("batas_dicek_konkuren_parallel_posts_pada_9_hadiah_tepat_10", func(t *testing.T) {
		// Create invitation with 9 gifts
		var concInvID int64
		err := pool.QueryRow(context.Background(), `
			INSERT INTO invitations (user_id, template_id, title, slug, status)
			VALUES ($1, $2, 'Concurrent Test Wedding', $3, 'published')
			RETURNING id
		`, fixture.partnerA, fixture.templateID, fixture.marker+"-conc-limit").Scan(&concInvID)
		if err != nil {
			t.Fatalf("insert concurrent invitation: %v", err)
		}

		// Insert 9 gifts directly
		ctx := context.Background()
		for i := 1; i <= 9; i++ {
			_, err = pool.Exec(ctx, `
				INSERT INTO invitation_gifts (invitation_id, gift_type, instructions, sort_order, is_active)
				VALUES ($1, 'physical_gift', $2, $3, true)
			`, concInvID, fmt.Sprintf("Hadiah Awal %d", i), i)
			if err != nil {
				t.Fatalf("insert initial gift %d: %v", i, err)
			}
		}

		// Launch 10 parallel requests trying to insert the 10th gift
		concurrency := 10
		var wg sync.WaitGroup
		wg.Add(concurrency)

		var successCount int32
		var conflictCount int32
		var otherCount int32

		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", concInvID)

		for i := 0; i < concurrency; i++ {
			go func(idx int) {
				defer wg.Done()

				reqBody := fmt.Sprintf(`{
					"gift_type": "physical_gift",
					"instructions": "Hadiah Konkuren %d"
				}`, idx)

				req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(reqBody))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", "Bearer "+tokenA)
				rec := httptest.NewRecorder()

				engine.ServeHTTP(rec, req)

				switch rec.Code {
				case http.StatusCreated:
					atomic.AddInt32(&successCount, 1)
				case http.StatusConflict:
					atomic.AddInt32(&conflictCount, 1)
				default:
					atomic.AddInt32(&otherCount, 1)
				}
			}(i)
		}

		wg.Wait()

		if successCount != 1 {
			t.Errorf("expected exactly 1 concurrent request to succeed (201), got %d", successCount)
		}
		if conflictCount != int32(concurrency-1) {
			t.Errorf("expected %d concurrent requests to receive 409 Conflict, got %d (other: %d)", concurrency-1, conflictCount, otherCount)
		}

		// Final check in DB: exactly 10
		var finalCount int
		err = pool.QueryRow(ctx, `SELECT COUNT(*) FROM invitation_gifts WHERE invitation_id = $1`, concInvID).Scan(&finalCount)
		if err != nil {
			t.Fatalf("query final count in db: %v", err)
		}
		if finalCount != 10 {
			t.Fatalf("expected total in DB to be strictly 10, got %d", finalCount)
		}
	})
}

func TestPartnerInvitationGifts_GET(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGiftsTestFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)

	// Insert active and inactive gifts with specific sort orders
	ctx := context.Background()
	_, err := pool.Exec(ctx, `
		INSERT INTO invitation_gifts (invitation_id, gift_type, provider_name, account_name, account_number, sort_order, is_active)
		VALUES
			($1, 'bank_transfer', 'BCA', 'Romeo', '111', 20, false),
			($1, 'bank_transfer', 'Mandiri', 'Romeo', '222', 10, true),
			($1, 'bank_transfer', 'BNI', 'Romeo', '333', 10, true)
	`, fixture.publishedInvA)
	if err != nil {
		t.Fatalf("insert test gifts: %v", err)
	}

	t.Run("sukses_list_aktif_dan_nonaktif_urut_sort_order_id", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)
		resp := templateFavoritesRequest(engine, http.MethodGet, path, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool                                 `json:"success"`
			Data    []handlers.PartnerInvitationGiftItem `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if len(res.Data) != 3 {
			t.Fatalf("expected 3 gifts, got %d", len(res.Data))
		}

		// Check sorting: Mandiri (10, lower ID) -> BNI (10, higher ID) -> BCA (20)
		if *res.Data[0].ProviderName != "Mandiri" || !res.Data[0].IsActive {
			t.Errorf("item 0 mismatch: %+v", res.Data[0])
		}
		if *res.Data[1].ProviderName != "BNI" || !res.Data[1].IsActive {
			t.Errorf("item 1 mismatch: %+v", res.Data[1])
		}
		if *res.Data[2].ProviderName != "BCA" || res.Data[2].IsActive {
			t.Errorf("item 2 mismatch (should be inactive): %+v", res.Data[2])
		}
	})

	t.Run("partner_lain_404", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts", fixture.publishedInvA)
		resp := templateFavoritesRequest(engine, http.MethodGet, path, "", tokenB)
		if resp.Code != http.StatusNotFound {
			t.Errorf("expected 404 for other partner, got %d", resp.Code)
		}
	})

	t.Run("id_tidak_valid_400", func(t *testing.T) {
		path := "/api/v1/invitations/99999999999999999999/gifts"
		resp := templateFavoritesRequest(engine, http.MethodGet, path, "", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for overflow id, got %d", resp.Code)
		}
	})
}

func TestPartnerInvitationGifts_PATCH(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGiftsTestFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)

	// Insert initial gift: bank_transfer
	var giftID int64
	err := pool.QueryRow(context.Background(), `
		INSERT INTO invitation_gifts (invitation_id, gift_type, provider_name, account_name, account_number, sort_order, is_active)
		VALUES ($1, 'bank_transfer', 'BCA', 'Romeo', '123456', 5, true)
		RETURNING id
	`, fixture.publishedInvA).Scan(&giftID)
	if err != nil {
		t.Fatalf("insert initial gift: %v", err)
	}

	t.Run("patch_parsial_sukses", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts/%d", fixture.publishedInvA, giftID)
		body := `{
			"account_name": "Romeo & Juliet",
			"is_active": false,
			"sort_order": 1
		}`
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool                               `json:"success"`
			Data    handlers.PartnerInvitationGiftItem `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if *res.Data.AccountName != "Romeo & Juliet" {
			t.Errorf("expected account_name updated, got %v", *res.Data.AccountName)
		}
		if res.Data.IsActive != false {
			t.Errorf("expected is_active false, got %v", res.Data.IsActive)
		}
		if res.Data.SortOrder != 1 {
			t.Errorf("expected sort_order 1, got %v", res.Data.SortOrder)
		}
		// Unchanged fields should remain intact
		if *res.Data.ProviderName != "BCA" {
			t.Errorf("expected provider_name untouched (BCA), got %v", *res.Data.ProviderName)
		}
		if *res.Data.AccountNumber != "123456" {
			t.Errorf("expected account_number untouched (123456), got %v", *res.Data.AccountNumber)
		}
	})

	t.Run("patch_validasi_berdasarkan_hasil_merge", func(t *testing.T) {
		// Insert physical gift: has instructions, but no provider/account_name/account_number
		var physGiftID int64
		err := pool.QueryRow(context.Background(), `
			INSERT INTO invitation_gifts (invitation_id, gift_type, instructions, sort_order, is_active)
			VALUES ($1, 'physical_gift', 'Kirim ke rumah', 1, true)
			RETURNING id
		`, fixture.publishedInvA).Scan(&physGiftID)
		if err != nil {
			t.Fatalf("insert physical gift: %v", err)
		}

		path := fmt.Sprintf("/api/v1/invitations/%d/gifts/%d", fixture.publishedInvA, physGiftID)

		// Change type to bank_transfer without providing provider_name, account_name, account_number -> 400
		body := `{"gift_type": "bank_transfer"}`
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, body, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request when changing to bank_transfer without required fields, got %d: %s", resp.Code, resp.Body.String())
		}

		// Providing required fields along with type change should succeed
		validBody := `{
			"gift_type": "bank_transfer",
			"provider_name": "BNI",
			"account_name": "Juliet",
			"account_number": "987654"
		}`
		resp = templateFavoritesRequest(engine, http.MethodPatch, path, validBody, tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("patch_body_kosong_400", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts/%d", fixture.publishedInvA, giftID)
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, `{}`, tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty patch body, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("partner_lain_patch_404", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts/%d", fixture.publishedInvA, giftID)
		resp := templateFavoritesRequest(engine, http.MethodPatch, path, `{"is_active": true}`, tokenB)
		if resp.Code != http.StatusNotFound {
			t.Errorf("expected 404 for other partner patch, got %d", resp.Code)
		}
	})
}

func TestPartnerInvitationGifts_DELETE(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGiftsTestFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)

	// Insert gift for Inv A and Inv B
	var giftIDA, giftIDB int64
	ctx := context.Background()
	err := pool.QueryRow(ctx, `
		INSERT INTO invitation_gifts (invitation_id, gift_type, instructions)
		VALUES ($1, 'other', 'Gift A')
		RETURNING id
	`, fixture.publishedInvA).Scan(&giftIDA)
	if err != nil {
		t.Fatalf("insert gift A: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO invitation_gifts (invitation_id, gift_type, instructions)
		VALUES ($1, 'other', 'Gift B')
		RETURNING id
	`, fixture.publishedInvB).Scan(&giftIDB)
	if err != nil {
		t.Fatalf("insert gift B: %v", err)
	}

	t.Run("partner_lain_delete_404_dan_data_utuh", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts/%d", fixture.publishedInvA, giftIDA)
		resp := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenB)
		if resp.Code != http.StatusNotFound {
			t.Errorf("expected 404 for other partner delete, got %d", resp.Code)
		}

		// Ensure gift A still exists in DB
		var exists bool
		err := pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM invitation_gifts WHERE id = $1)`, giftIDA).Scan(&exists)
		if err != nil || !exists {
			t.Errorf("expected gift A to remain untouched in DB")
		}
	})

	t.Run("delete_sukses_dan_dua_kali_404", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/invitations/%d/gifts/%d", fixture.publishedInvA, giftIDA)

		// First delete -> 200
		resp1 := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenA)
		if resp1.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on first delete, got %d: %s", resp1.Code, resp1.Body.String())
		}

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		if err := json.Unmarshal(resp1.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if !res.Success || res.Message != "Gift deleted successfully" {
			t.Errorf("unexpected body on delete: %+v", res)
		}

		// Second delete -> 404
		resp2 := templateFavoritesRequest(engine, http.MethodDelete, path, "", tokenA)
		if resp2.Code != http.StatusNotFound {
			t.Fatalf("expected 404 Not Found on second delete, got %d: %s", resp2.Code, resp2.Body.String())
		}
	})

	t.Run("hadiah_undangan_lain_tidak_ikut_terhapus", func(t *testing.T) {
		var exists bool
		err := pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM invitation_gifts WHERE id = $1)`, giftIDB).Scan(&exists)
		if err != nil || !exists {
			t.Errorf("expected gift B from other invitation to still exist")
		}
	})
}

func TestPublicInvitationGifts_GET(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createGiftsTestFixture(t, pool)

	ctx := context.Background()

	// Insert into publishedInvA: 1 active, 1 inactive
	_, err := pool.Exec(ctx, `
		INSERT INTO invitation_gifts (invitation_id, gift_type, provider_name, account_name, account_number, sort_order, is_active)
		VALUES
			($1, 'bank_transfer', 'BCA', 'Romeo', '123456', 2, true),
			($1, 'bank_transfer', 'Mandiri', 'Romeo', '654321', 1, false)
	`, fixture.publishedInvA)
	if err != nil {
		t.Fatalf("insert published gifts: %v", err)
	}

	// Insert into publishedInvB: 1 active
	_, err = pool.Exec(ctx, `
		INSERT INTO invitation_gifts (invitation_id, gift_type, provider_name, account_name, account_number, sort_order, is_active)
		VALUES ($1, 'bank_transfer', 'BNI', 'Partner B', '999888', 1, true)
	`, fixture.publishedInvB)
	if err != nil {
		t.Fatalf("insert other invitation gift: %v", err)
	}

	t.Run("hanya_is_active_nonaktif_tidak_muncul_urutan_dan_tanpa_key_terlarang", func(t *testing.T) {
		path := "/api/v1/public/invitations/" + fixture.publishedSlug + "/gifts"
		// Public endpoint does not require token
		resp := templateFavoritesRequest(engine, http.MethodGet, path, "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		// Verify Cache-Control header
		cacheHeader := resp.Header().Get("Cache-Control")
		if cacheHeader != "public, max-age=60" {
			t.Errorf("expected Cache-Control 'public, max-age=60', got %q", cacheHeader)
		}

		var rawMap map[string]interface{}
		if err := json.Unmarshal(resp.Body.Bytes(), &rawMap); err != nil {
			t.Fatalf("unmarshal raw map: %v", err)
		}

		// Check forbidden keys recursively
		checkForbiddenGiftsPublicKeys(t, rawMap, "root")

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Gifts []handlers.PublicInvitationGiftItem `json:"gifts"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal typed response: %v", err)
		}

		// Only 1 gift should appear (BCA), Mandiri is inactive
		if len(res.Data.Gifts) != 1 {
			t.Fatalf("expected 1 active gift, got %d", len(res.Data.Gifts))
		}
		if *res.Data.Gifts[0].ProviderName != "BCA" {
			t.Errorf("expected BCA gift, got %v", *res.Data.Gifts[0].ProviderName)
		}
	})

	t.Run("hadiah_undangan_lain_tidak_tercampur", func(t *testing.T) {
		path := "/api/v1/public/invitations/" + fixture.otherSlug + "/gifts"
		resp := templateFavoritesRequest(engine, http.MethodGet, path, "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Data struct {
				Gifts []handlers.PublicInvitationGiftItem `json:"gifts"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		if len(res.Data.Gifts) != 1 || *res.Data.Gifts[0].ProviderName != "BNI" {
			t.Errorf("expected only Partner B's gift, got %+v", res.Data.Gifts)
		}
	})

	t.Run("undangan_tanpa_hadiah_gifts_kosong", func(t *testing.T) {
		// Create published invitation with 0 gifts
		var emptyInvSlug string
		err := pool.QueryRow(ctx, `
			INSERT INTO invitations (user_id, template_id, title, slug, status, published_at)
			VALUES ($1, $2, 'No Gifts Wedding', $3, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day')
			RETURNING slug
		`, fixture.partnerA, fixture.templateID, fixture.marker+"-no-gifts").Scan(&emptyInvSlug)
		if err != nil {
			t.Fatalf("insert empty invitation: %v", err)
		}

		path := "/api/v1/public/invitations/" + emptyInvSlug + "/gifts"
		resp := templateFavoritesRequest(engine, http.MethodGet, path, "", "")
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", resp.Code, resp.Body.String())
		}

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Gifts []handlers.PublicInvitationGiftItem `json:"gifts"`
			} `json:"data"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &res); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if res.Data.Gifts == nil || len(res.Data.Gifts) != 0 {
			t.Errorf("expected empty array for gifts, got %+v", res.Data.Gifts)
		}
	})

	t.Run("draft_expired_slug_tidak_ada_404_identik_no_store", func(t *testing.T) {
		slugs := []struct {
			name string
			slug string
		}{
			{name: "draft", slug: fixture.draftSlug},
			{name: "expired", slug: fixture.expiredSlug},
			{name: "non_existent", slug: "this-slug-definitely-does-not-exist"},
		}

		expectedBody := `{"message":"Invitation not found","success":false}`

		for _, tc := range slugs {
			t.Run(tc.name, func(t *testing.T) {
				path := "/api/v1/public/invitations/" + tc.slug + "/gifts"
				resp := templateFavoritesRequest(engine, http.MethodGet, path, "", "")
				if resp.Code != http.StatusNotFound {
					t.Fatalf("expected 404 Not Found for %s, got %d: %s", tc.name, resp.Code, resp.Body.String())
				}

				cacheHeader := resp.Header().Get("Cache-Control")
				if cacheHeader != "no-store" {
					t.Errorf("expected Cache-Control 'no-store' for %s, got %q", tc.name, cacheHeader)
				}

				var gotBody map[string]interface{}
				var expBody map[string]interface{}
				_ = json.Unmarshal(resp.Body.Bytes(), &gotBody)
				_ = json.Unmarshal([]byte(expectedBody), &expBody)

				if gotBody["success"] != expBody["success"] || gotBody["message"] != expBody["message"] {
					t.Errorf("body mismatch for %s: expected %v, got %v", tc.name, expBody, gotBody)
				}
			})
		}
	})
}
