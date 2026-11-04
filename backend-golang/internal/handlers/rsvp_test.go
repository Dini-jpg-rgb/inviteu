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

type rsvpFixture struct {
	marker         string
	partnerA       int64
	partnerB       int64
	designerUser   int64
	adminUser      int64
	categoryID     int64
	templateID     int64
	publishedInvID int64
	publishedSlug  string
	draftInvID     int64
	draftSlug      string
	expiredInvID   int64
	expiredSlug    string
}

func createRSVPFixture(t *testing.T, pool *pgxpool.Pool) rsvpFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate fixture marker: %v", err)
	}
	marker := "rsvp-" + hex.EncodeToString(randomBytes)

	fixture := rsvpFixture{
		marker:        marker,
		publishedSlug: marker + "-pub",
		draftSlug:     marker + "-draft",
		expiredSlug:   marker + "-exp",
	}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{fixture.partnerA, fixture.partnerB, fixture.designerUser, fixture.adminUser}

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM rsvps WHERE guest_id IN (
				SELECT id FROM guests WHERE invitation_id IN (
					SELECT id FROM invitations WHERE user_id = ANY($1)
				)
			)
		`, userIDs)

		_, _ = pool.Exec(cleanupCtx, `
			DELETE FROM guests WHERE invitation_id IN (
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
		VALUES ($1, $2, 'RSVP test category')
		RETURNING id
	`, marker+" Category", marker+"-cat").Scan(&fixture.categoryID)
	if err != nil {
		t.Fatalf("insert fixture category: %v", err)
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		VALUES ($1, $2, $3, $4, 'RSVP template', 100000, 'published')
		RETURNING id
	`, fixture.categoryID, fixture.designerUser, marker+" Template", marker+"-tmpl").Scan(&fixture.templateID)
	if err != nil {
		t.Fatalf("insert fixture template: %v", err)
	}

	insertInv := func(userID int64, title, slug, status string, expiredAt *time.Time) int64 {
		var invID int64
		err := pool.QueryRow(ctx, `
			INSERT INTO invitations (user_id, template_id, title, slug, status, expired_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`, userID, fixture.templateID, marker+" "+title, slug, status, expiredAt).Scan(&invID)
		if err != nil {
			t.Fatalf("insert fixture invitation %s: %v", title, err)
		}
		return invID
	}

	futureTime := time.Now().Add(30 * 24 * time.Hour)
	pastTime := time.Now().Add(-24 * time.Hour)

	fixture.publishedInvID = insertInv(fixture.partnerA, "Published Inv", fixture.publishedSlug, "published", &futureTime)
	fixture.draftInvID = insertInv(fixture.partnerA, "Draft Inv", fixture.draftSlug, "draft", nil)
	fixture.expiredInvID = insertInv(fixture.partnerA, "Expired Inv", fixture.expiredSlug, "published", &pastTime)

	return fixture
}

func TestPublicRSVP_SuccessAttending(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	path := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)
	body := `{
		"name": "Budi Santoso",
		"attendance_status": "attending",
		"number_of_guests": 2,
		"message": "Selamat berbahagia!"
	}`

	resp := templateFavoritesRequest(engine, http.MethodPost, path, body, "")
	if resp.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", resp.Code, resp.Body.String())
	}

	var jsonResp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    struct {
			AttendanceStatus string     `json:"attendance_status"`
			NumberOfGuests   int        `json:"number_of_guests"`
			Message          *string    `json:"message"`
			SubmittedAt      *time.Time `json:"submitted_at"`
		} `json:"data"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &jsonResp); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if !jsonResp.Success || jsonResp.Data.AttendanceStatus != "attending" || jsonResp.Data.NumberOfGuests != 2 {
		t.Fatalf("unexpected response data: %+v", jsonResp)
	}
	if jsonResp.Data.Message == nil || *jsonResp.Data.Message != "Selamat berbahagia!" {
		t.Fatalf("unexpected message: %v", jsonResp.Data.Message)
	}
	if jsonResp.Data.SubmittedAt == nil || jsonResp.Data.SubmittedAt.IsZero() {
		t.Fatalf("expected non-zero submitted_at")
	}

	// Verify response does not leak token
	if strings.Contains(resp.Body.String(), "unique_token") || strings.Contains(resp.Body.String(), "token") {
		t.Fatalf("response leaked token: %s", resp.Body.String())
	}

	// Check DB records
	ctx := context.Background()
	var guestID int64
	var uniqueToken string
	err := pool.QueryRow(ctx, `
		SELECT id, unique_token
		FROM guests
		WHERE invitation_id = $1 AND name = $2
	`, fixture.publishedInvID, "Budi Santoso").Scan(&guestID, &uniqueToken)
	if err != nil {
		t.Fatalf("query inserted guest: %v", err)
	}

	if len(uniqueToken) != 64 {
		t.Fatalf("expected 64 hex characters for unique_token, got %d (%s)", len(uniqueToken), uniqueToken)
	}

	var rsvpGuestCount int
	var rsvpStatus string
	err = pool.QueryRow(ctx, `
		SELECT number_of_guests, attendance_status
		FROM rsvps
		WHERE guest_id = $1
	`, guestID).Scan(&rsvpGuestCount, &rsvpStatus)
	if err != nil {
		t.Fatalf("query inserted rsvp: %v", err)
	}

	if rsvpGuestCount != 2 || rsvpStatus != "attending" {
		t.Fatalf("unexpected rsvp in db: count=%d, status=%s", rsvpGuestCount, rsvpStatus)
	}
}

func TestPublicRSVP_SuccessNotAttending(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	path := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)
	body := `{
		"name": "Dewi Sartika",
		"attendance_status": "not_attending",
		"number_of_guests": 0
	}`

	resp := templateFavoritesRequest(engine, http.MethodPost, path, body, "")
	if resp.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", resp.Code, resp.Body.String())
	}

	var jsonResp struct {
		Success bool `json:"success"`
		Data    struct {
			AttendanceStatus string  `json:"attendance_status"`
			NumberOfGuests   int     `json:"number_of_guests"`
			Message          *string `json:"message"`
		} `json:"data"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &jsonResp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if jsonResp.Data.AttendanceStatus != "not_attending" || jsonResp.Data.NumberOfGuests != 0 || jsonResp.Data.Message != nil {
		t.Fatalf("unexpected not_attending data: %+v", jsonResp)
	}
}

func TestPublicRSVP_Identical404Responses(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	body := `{
		"name": "Test Guest",
		"attendance_status": "attending",
		"number_of_guests": 1
	}`

	respSlugNotFound := templateFavoritesRequest(engine, http.MethodPost, "/api/v1/public/invitations/non-existent-slug/rsvp", body, "")
	respDraft := templateFavoritesRequest(engine, http.MethodPost, fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.draftSlug), body, "")
	respExpired := templateFavoritesRequest(engine, http.MethodPost, fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.expiredSlug), body, "")

	if respSlugNotFound.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for non-existent slug, got %d", respSlugNotFound.Code)
	}
	if respDraft.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for draft invitation, got %d", respDraft.Code)
	}
	if respExpired.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for expired invitation, got %d", respExpired.Code)
	}

	body1 := strings.TrimSpace(respSlugNotFound.Body.String())
	body2 := strings.TrimSpace(respDraft.Body.String())
	body3 := strings.TrimSpace(respExpired.Body.String())

	if body1 != body2 || body2 != body3 {
		t.Fatalf("expected identical 404 responses for anti-enumeration:\nBody 1: %s\nBody 2: %s\nBody 3: %s", body1, body2, body3)
	}

	var parsed struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal([]byte(body1), &parsed); err != nil {
		t.Fatalf("decode 404 response: %v", err)
	}
	if parsed.Success || parsed.Message != "Invitation not found" {
		t.Fatalf("expected 'Invitation not found', got: %+v", parsed)
	}
}

func TestPublicRSVP_ValidationErrors(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	url := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)

	testCases := []struct {
		name          string
		body          string
		expectedField string
	}{
		{
			name:          "attendance_status invalid",
			body:          `{"name": "Valid Name", "attendance_status": "maybe", "number_of_guests": 1}`,
			expectedField: "attendance_status",
		},
		{
			name:          "attendance_status pending rejected",
			body:          `{"name": "Valid Name", "attendance_status": "pending", "number_of_guests": 1}`,
			expectedField: "attendance_status",
		},
		{
			name:          "attendance_status empty",
			body:          `{"name": "Valid Name", "attendance_status": "", "number_of_guests": 1}`,
			expectedField: "attendance_status",
		},
		{
			name:          "attending with 0 guests",
			body:          `{"name": "Valid Name", "attendance_status": "attending", "number_of_guests": 0}`,
			expectedField: "number_of_guests",
		},
		{
			name:          "attending with 11 guests",
			body:          `{"name": "Valid Name", "attendance_status": "attending", "number_of_guests": 11}`,
			expectedField: "number_of_guests",
		},
		{
			name:          "attending with negative guests",
			body:          `{"name": "Valid Name", "attendance_status": "attending", "number_of_guests": -1}`,
			expectedField: "number_of_guests",
		},
		{
			name:          "not_attending with 1 guest",
			body:          `{"name": "Valid Name", "attendance_status": "not_attending", "number_of_guests": 1}`,
			expectedField: "number_of_guests",
		},
		{
			name:          "name empty",
			body:          `{"name": "", "attendance_status": "attending", "number_of_guests": 1}`,
			expectedField: "name",
		},
		{
			name:          "name whitespace only",
			body:          `{"name": "   ", "attendance_status": "attending", "number_of_guests": 1}`,
			expectedField: "name",
		},
		{
			name:          "name 256 characters",
			body:          fmt.Sprintf(`{"name": "%s", "attendance_status": "attending", "number_of_guests": 1}`, strings.Repeat("a", 256)),
			expectedField: "name",
		},
		{
			name:          "message 1001 characters",
			body:          fmt.Sprintf(`{"name": "Valid Name", "attendance_status": "attending", "number_of_guests": 1, "message": "%s"}`, strings.Repeat("x", 1001)),
			expectedField: "message",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			resp := templateFavoritesRequest(engine, http.MethodPost, url, tc.body, "")
			if resp.Code != http.StatusBadRequest {
				t.Fatalf("expected 400, got %d: %s", resp.Code, resp.Body.String())
			}

			var errResp struct {
				Success bool              `json:"success"`
				Message string            `json:"message"`
				Errors  map[string]string `json:"errors"`
			}
			if err := json.Unmarshal(resp.Body.Bytes(), &errResp); err != nil {
				t.Fatalf("decode err response: %v", err)
			}
			if errResp.Success {
				t.Fatalf("expected success=false")
			}
			if _, exists := errResp.Errors[tc.expectedField]; !exists {
				t.Fatalf("expected error field %q, got errors: %+v", tc.expectedField, errResp.Errors)
			}
		})
	}

	t.Run("boundary: name 255 chars and message 1000 chars should pass", func(t *testing.T) {
		validBoundaryBody := fmt.Sprintf(`{
			"name": "%s",
			"attendance_status": "attending",
			"number_of_guests": 1,
			"message": "%s"
		}`, strings.Repeat("b", 255), strings.Repeat("m", 1000))

		resp := templateFavoritesRequest(engine, http.MethodPost, url, validBoundaryBody, "")
		if resp.Code != http.StatusCreated {
			t.Fatalf("expected 201 for valid boundaries, got %d: %s", resp.Code, resp.Body.String())
		}
	})
}

func TestPublicRSVP_BodyErrors(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	url := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)

	t.Run("empty body", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodPost, url, "", "")
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for empty body, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("broken json", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodPost, url, "{invalid-json", "")
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for broken json, got %d: %s", resp.Code, resp.Body.String())
		}
	})

	t.Run("body exceeds 64KB", func(t *testing.T) {
		largePayload := fmt.Sprintf(`{"name": "Valid", "attendance_status": "attending", "number_of_guests": 1, "extra": "%s"}`, strings.Repeat("A", 65*1024))
		resp := templateFavoritesRequest(engine, http.MethodPost, url, largePayload, "")
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for body > 64KB, got %d: %s", resp.Code, resp.Body.String())
		}
	})
}

func TestPublicRSVP_RollbackTransaction(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	ctx := context.Background()

	// Install a trigger that forces an exception on rsvps table to test rollback
	_, err := pool.Exec(ctx, `
		CREATE OR REPLACE FUNCTION fail_rsvp_insert_test() RETURNS trigger AS $$
		BEGIN
			RAISE EXCEPTION 'forced rsvp failure for rollback test';
		END;
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS trg_fail_rsvp_test ON rsvps;
		CREATE TRIGGER trg_fail_rsvp_test
		BEFORE INSERT ON rsvps
		FOR EACH ROW EXECUTE FUNCTION fail_rsvp_insert_test();
	`)
	if err != nil {
		t.Fatalf("create test failure trigger: %v", err)
	}

	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `
			DROP TRIGGER IF EXISTS trg_fail_rsvp_test ON rsvps;
			DROP FUNCTION IF EXISTS fail_rsvp_insert_test();
		`)
	})

	url := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)
	body := `{
		"name": "Failed Transaction Guest",
		"attendance_status": "attending",
		"number_of_guests": 2
	}`

	resp := templateFavoritesRequest(engine, http.MethodPost, url, body, "")
	if resp.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 when insert fails, got %d: %s", resp.Code, resp.Body.String())
	}

	// Verify that the guest record was rolled back and NOT left orphaned
	var guestCount int
	err = pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM guests
		WHERE invitation_id = $1 AND name = 'Failed Transaction Guest'
	`, fixture.publishedInvID).Scan(&guestCount)
	if err != nil {
		t.Fatalf("query guests count: %v", err)
	}

	if guestCount != 0 {
		t.Fatalf("transaction rollback failed: expected 0 guests, found %d", guestCount)
	}
}

func TestPublicRSVP_MultipleSubmissions(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	url := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)
	body := `{
		"name": "Repeat Guest",
		"attendance_status": "attending",
		"number_of_guests": 1
	}`

	resp1 := templateFavoritesRequest(engine, http.MethodPost, url, body, "")
	if resp1.Code != http.StatusCreated {
		t.Fatalf("first submit expected 201, got %d", resp1.Code)
	}

	resp2 := templateFavoritesRequest(engine, http.MethodPost, url, body, "")
	if resp2.Code != http.StatusCreated {
		t.Fatalf("second submit expected 201, got %d", resp2.Code)
	}

	ctx := context.Background()
	var count int
	err := pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM guests
		WHERE invitation_id = $1 AND name = 'Repeat Guest'
	`, fixture.publishedInvID).Scan(&count)
	if err != nil {
		t.Fatalf("query count: %v", err)
	}

	if count != 2 {
		t.Fatalf("expected 2 distinct guest rows for repeat submit, got %d", count)
	}
}

func TestPartnerRSVPs_SuccessAndSummary(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	urlPublic := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)

	// Submit 3 RSVPs: 2 attending (total guests = 2 + 3 = 5), 1 not_attending (guests = 0)
	_ = templateFavoritesRequest(engine, http.MethodPost, urlPublic, `{"name": "Guest 1", "attendance_status": "attending", "number_of_guests": 2}`, "")
	_ = templateFavoritesRequest(engine, http.MethodPost, urlPublic, `{"name": "Guest 2", "attendance_status": "attending", "number_of_guests": 3}`, "")
	_ = templateFavoritesRequest(engine, http.MethodPost, urlPublic, `{"name": "Guest 3", "attendance_status": "not_attending", "number_of_guests": 0}`, "")

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	urlPartner := fmt.Sprintf("/api/v1/invitations/%d/rsvps", fixture.publishedInvID)

	resp := templateFavoritesRequest(engine, http.MethodGet, urlPartner, "", tokenA)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body.String())
	}

	// Verify no token leaked in partner response
	if strings.Contains(resp.Body.String(), "unique_token") {
		t.Fatalf("partner response leaked token: %s", resp.Body.String())
	}

	var jsonResp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    struct {
			Summary struct {
				TotalResponses    int64 `json:"total_responses"`
				AttendingCount    int64 `json:"attending_count"`
				NotAttendingCount int64 `json:"not_attending_count"`
				TotalGuests       int64 `json:"total_guests"`
			} `json:"summary"`
			RSVPs []struct {
				ID               int64      `json:"id"`
				Name             string     `json:"name"`
				AttendanceStatus string     `json:"attendance_status"`
				NumberOfGuests   int        `json:"number_of_guests"`
				Message          *string    `json:"message"`
				SubmittedAt      *time.Time `json:"submitted_at"`
			} `json:"rsvps"`
			Pagination struct {
				Page       int64 `json:"page"`
				Limit      int64 `json:"limit"`
				Total      int64 `json:"total"`
				TotalPages int64 `json:"total_pages"`
			} `json:"pagination"`
		} `json:"data"`
	}

	if err := json.Unmarshal(resp.Body.Bytes(), &jsonResp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if jsonResp.Data.Summary.TotalResponses != 3 {
		t.Errorf("expected 3 total_responses, got %d", jsonResp.Data.Summary.TotalResponses)
	}
	if jsonResp.Data.Summary.AttendingCount != 2 {
		t.Errorf("expected 2 attending_count, got %d", jsonResp.Data.Summary.AttendingCount)
	}
	if jsonResp.Data.Summary.NotAttendingCount != 1 {
		t.Errorf("expected 1 not_attending_count, got %d", jsonResp.Data.Summary.NotAttendingCount)
	}
	if jsonResp.Data.Summary.TotalGuests != 5 {
		t.Errorf("expected 5 total_guests, got %d", jsonResp.Data.Summary.TotalGuests)
	}

	if len(jsonResp.Data.RSVPs) != 3 {
		t.Fatalf("expected 3 items in rsvps list, got %d", len(jsonResp.Data.RSVPs))
	}
	if jsonResp.Data.Pagination.Total != 3 || jsonResp.Data.Pagination.Limit != 12 || jsonResp.Data.Pagination.Page != 1 {
		t.Errorf("unexpected pagination: %+v", jsonResp.Data.Pagination)
	}
}

func TestPartnerRSVPs_FiltersAndSearch(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	urlPublic := fmt.Sprintf("/api/v1/public/invitations/%s/rsvp", fixture.publishedSlug)

	_ = templateFavoritesRequest(engine, http.MethodPost, urlPublic, `{"name": "Alpha Attending", "attendance_status": "attending", "number_of_guests": 2}`, "")
	_ = templateFavoritesRequest(engine, http.MethodPost, urlPublic, `{"name": "Beta Not Attending", "attendance_status": "not_attending", "number_of_guests": 0}`, "")
	_ = templateFavoritesRequest(engine, http.MethodPost, urlPublic, `{"name": "Special_%_Guest", "attendance_status": "attending", "number_of_guests": 1}`, "")

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	baseURL := fmt.Sprintf("/api/v1/invitations/%d/rsvps", fixture.publishedInvID)

	t.Run("filter status attending", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, baseURL+"?status=attending", "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", resp.Code)
		}

		var jsonResp struct {
			Data struct {
				Summary struct {
					TotalResponses int64 `json:"total_responses"`
				} `json:"summary"`
				RSVPs []struct {
					AttendanceStatus string `json:"attendance_status"`
				} `json:"rsvps"`
				Pagination struct {
					Total int64 `json:"total"`
				} `json:"pagination"`
			} `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &jsonResp)

		if jsonResp.Data.Summary.TotalResponses != 3 {
			t.Errorf("summary should not be affected by filter, expected 3, got %d", jsonResp.Data.Summary.TotalResponses)
		}
		if jsonResp.Data.Pagination.Total != 2 {
			t.Errorf("pagination total should reflect filter, expected 2, got %d", jsonResp.Data.Pagination.Total)
		}
		for _, r := range jsonResp.Data.RSVPs {
			if r.AttendanceStatus != "attending" {
				t.Errorf("expected only attending, got %s", r.AttendanceStatus)
			}
		}
	})

	t.Run("search with literal wildcard chars % and _", func(t *testing.T) {
		// Search for "%" should only match "Special_%_Guest", not everything
		resp := templateFavoritesRequest(engine, http.MethodGet, baseURL+"?search=%25", "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", resp.Code)
		}

		var jsonResp struct {
			Data struct {
				RSVPs []struct {
					Name string `json:"name"`
				} `json:"rsvps"`
				Pagination struct {
					Total int64 `json:"total"`
				} `json:"pagination"`
			} `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &jsonResp)

		if jsonResp.Data.Pagination.Total != 1 {
			t.Fatalf("expected 1 exact match for '%%', got %d", jsonResp.Data.Pagination.Total)
		}
		if len(jsonResp.Data.RSVPs) > 0 && jsonResp.Data.RSVPs[0].Name != "Special_%_Guest" {
			t.Errorf("expected Special_%%_Guest, got %s", jsonResp.Data.RSVPs[0].Name)
		}
	})

	t.Run("search query too long > 100 chars", func(t *testing.T) {
		longSearch := strings.Repeat("x", 101)
		resp := templateFavoritesRequest(engine, http.MethodGet, baseURL+"?search="+longSearch, "", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for search > 100, got %d", resp.Code)
		}
	})

	t.Run("invalid status filter", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, baseURL+"?status=invalid_status", "", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for invalid status, got %d", resp.Code)
		}
	})
}

func TestPartnerRSVPs_Pagination(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	baseURL := fmt.Sprintf("/api/v1/invitations/%d/rsvps", fixture.publishedInvID)

	t.Run("default limit is 12", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, baseURL, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", resp.Code)
		}

		var jsonResp struct {
			Data struct {
				Pagination struct {
					Limit int64 `json:"limit"`
				} `json:"pagination"`
			} `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &jsonResp)
		if jsonResp.Data.Pagination.Limit != 12 {
			t.Errorf("expected default limit 12, got %d", jsonResp.Data.Pagination.Limit)
		}
	})

	t.Run("limit 100 is clamped to 50", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, baseURL+"?limit=100", "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", resp.Code)
		}

		var jsonResp struct {
			Data struct {
				Pagination struct {
					Limit int64 `json:"limit"`
				} `json:"pagination"`
			} `json:"data"`
		}
		_ = json.Unmarshal(resp.Body.Bytes(), &jsonResp)
		if jsonResp.Data.Pagination.Limit != 50 {
			t.Errorf("expected clamped limit 50, got %d", jsonResp.Data.Pagination.Limit)
		}
	})
}

func TestPartnerRSVPs_AuthorizationAndOwnership(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	engine := setupInvitationTestEngine(pool)
	fixture := createRSVPFixture(t, pool)

	tokenA := templateFavoritesToken(t, fixture.partnerA)
	tokenB := templateFavoritesToken(t, fixture.partnerB)
	designerToken := templateFavoritesToken(t, fixture.designerUser)

	urlA := fmt.Sprintf("/api/v1/invitations/%d/rsvps", fixture.publishedInvID)

	t.Run("without token gives 401", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, urlA, "", "")
		if resp.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", resp.Code)
		}
	})

	t.Run("designer token gives 403", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, urlA, "", designerToken)
		if resp.Code != http.StatusForbidden {
			t.Fatalf("expected 403 for non-partner role, got %d", resp.Code)
		}
	})

	t.Run("partner B accessing partner A gives 404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, urlA, "", tokenB)
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for different partner, got %d", resp.Code)
		}
	})

	t.Run("non-existent invitation gives 404", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations/999999999/rsvps", "", tokenA)
		if resp.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for non-existent invitation, got %d", resp.Code)
		}
	})

	t.Run("invalid id format gives 400", func(t *testing.T) {
		resp := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations/abc/rsvps", "", tokenA)
		if resp.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for non-numeric id, got %d", resp.Code)
		}

		respZero := templateFavoritesRequest(engine, http.MethodGet, "/api/v1/invitations/0/rsvps", "", tokenA)
		if respZero.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for id 0, got %d", respZero.Code)
		}
	})

	t.Run("owner can view rsvps of draft invitation", func(t *testing.T) {
		urlDraft := fmt.Sprintf("/api/v1/invitations/%d/rsvps", fixture.draftInvID)
		resp := templateFavoritesRequest(engine, http.MethodGet, urlDraft, "", tokenA)
		if resp.Code != http.StatusOK {
			t.Fatalf("expected 200 for owner viewing draft invitation rsvps, got %d: %s", resp.Code, resp.Body.String())
		}
	})
}
