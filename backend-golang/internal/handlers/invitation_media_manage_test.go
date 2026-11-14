package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"backend-golang/internal/drive"
	"backend-golang/internal/handlers"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func insertTestMediaRecord(
	t *testing.T,
	pool *pgxpool.Pool,
	userID int64,
	versionID int64,
	sectionID *int64,
	provider string,
	driveFileID string,
	fileType string,
	mimeType string,
	originalName string,
	size int64,
	sortOrder int,
) (mediaID int64, storageFileID int64) {
	t.Helper()
	ctx := context.Background()

	if err := pool.QueryRow(ctx, `
		INSERT INTO storage_files (
			provider,
			file_id,
			folder_id,
			original_name,
			mime_type,
			size,
			uploaded_by
		)
		VALUES ($1, $2, 'folder-test', $3, $4, $5, $6)
		RETURNING id
	`,
		provider,
		driveFileID,
		originalName,
		mimeType,
		size,
		userID,
	).Scan(&storageFileID); err != nil {
		t.Fatalf("insert storage_files: %v", err)
	}

	if err := pool.QueryRow(ctx, `
		INSERT INTO invitation_media (
			invitation_version_id,
			template_section_id,
			storage_file_id,
			file_type,
			sort_order
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`,
		versionID,
		sectionID,
		storageFileID,
		fileType,
		sortOrder,
	).Scan(&mediaID); err != nil {
		t.Fatalf("insert invitation_media: %v", err)
	}

	return mediaID, storageFileID
}

func setTestGalleryLimit(t *testing.T, pool *pgxpool.Pool, packageID int64, limit int) {
	t.Helper()
	ctx := context.Background()
	_, _ = pool.Exec(ctx, `DELETE FROM package_limits WHERE package_id = $1 AND resource_key = 'gallery_limit'`, packageID)
	if _, err := pool.Exec(ctx, `
		INSERT INTO package_limits (package_id, resource_key, limit_value)
		VALUES ($1, 'gallery_limit', $2)
	`, packageID, limit); err != nil {
		t.Fatalf("insert gallery_limit: %v", err)
	}
}

func sendGetMediaRequest(
	engine *gin.Engine,
	invitationIDStr string,
	query string,
	token string,
) *httptest.ResponseRecorder {
	path := "/api/v1/invitations/" + invitationIDStr + "/media"
	if query != "" {
		path += "?" + query
	}
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func sendDeleteMediaRequest(
	engine *gin.Engine,
	invitationIDStr string,
	mediaIDStr string,
	token string,
) *httptest.ResponseRecorder {
	path := "/api/v1/invitations/" + invitationIDStr + "/media/" + mediaIDStr
	req := httptest.NewRequest(http.MethodDelete, path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func TestMountDriveRoutes_RealRouterNoConflict(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	key := generateDriveTestKey(t)
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = &drive.FakeStorage{}

	gin.SetMode(gin.TestMode)
	realEngine := router.SetupRouter(
		pool,
		templateFavoritesTestJWTSecret,
		"test",
		handlers.GoogleAuthConfig{},
		(*payment.MidtransClient)(nil),
	)
	handlers.MountDriveRoutes(realEngine, pool, driveCfg)

	routes := realEngine.Routes()
	foundPost := false
	foundGet := false
	foundDelete := false
	for _, rt := range routes {
		if rt.Method == http.MethodPost && rt.Path == "/api/v1/invitations/:invitation_id/media" {
			foundPost = true
		}
		if rt.Method == http.MethodGet && rt.Path == "/api/v1/invitations/:id/media" {
			foundGet = true
		}
		if rt.Method == http.MethodDelete && rt.Path == "/api/v1/invitations/:id/media/:media_id" {
			foundDelete = true
		}
	}
	if !foundPost || !foundGet || !foundDelete {
		t.Fatalf(
			"expected POST/GET/DELETE media routes registered on real router, got post=%v get=%v delete=%v",
			foundPost,
			foundGet,
			foundDelete,
		)
	}
}

func TestGetInvitationMedia(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)
	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	invA1Str := strconv.FormatInt(fixture.invitationA1, 10)
	invBStr := strconv.FormatInt(fixture.invitationB, 10)
	partnerAToken := templateFavoritesToken(t, fixture.partnerA)

	t.Run("unauthenticated returns 401", func(t *testing.T) {
		rec := sendGetMediaRequest(engine, invA1Str, "", "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("non-partner roles designer and admin return 403", func(t *testing.T) {
		for _, uid := range []int64{fixture.designerUser, fixture.adminUser} {
			tok := templateFavoritesToken(t, uid)
			rec := sendGetMediaRequest(engine, invA1Str, "", tok)
			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected 403 for user %d, got %d: %s", uid, rec.Code, rec.Body.String())
			}
		}
	})

	t.Run("invalid invitation id returns 400 invalid_invitation_id", func(t *testing.T) {
		for _, badID := range []string{"0", "-5", "abc"} {
			rec := sendGetMediaRequest(engine, badID, "", partnerAToken)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for id %q, got %d: %s", badID, rec.Code, rec.Body.String())
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["id"] != "invalid_invitation_id" {
				t.Fatalf("expected errors.id=invalid_invitation_id for %q, got %+v", badID, body.Errors)
			}
		}
	})

	t.Run("non-existent invitation returns 404 without errors field", func(t *testing.T) {
		rec := sendGetMediaRequest(engine, "999999999", "", partnerAToken)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
		var raw map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &raw)
		if _, hasErrors := raw["errors"]; hasErrors {
			t.Fatalf("expected 404 without errors field, got %s", rec.Body.String())
		}
	})

	t.Run("other partner invitation returns 404", func(t *testing.T) {
		rec := sendGetMediaRequest(engine, invBStr, "", partnerAToken)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("invalid file_type query returns 400 invalid_file_type", func(t *testing.T) {
		for _, badType := range []string{"video", "pdf", "IMAGE"} {
			rec := sendGetMediaRequest(engine, invA1Str, "file_type="+badType, partnerAToken)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for file_type=%q, got %d: %s", badType, rec.Code, rec.Body.String())
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["file_type"] != "invalid_file_type" {
				t.Fatalf("expected errors.file_type=invalid_file_type, got %+v", body.Errors)
			}
		}
	})

	t.Run("empty media list returns [] not null and succeeds without addon", func(t *testing.T) {
		// Note: no addon entitlement and no drive credentials exist for partnerA yet
		rec := sendGetMediaRequest(engine, invA1Str, "", partnerAToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 without addon, got %d: %s", rec.Code, rec.Body.String())
		}
		if !strings.Contains(rec.Body.String(), `"media":[]`) {
			t.Fatalf("expected media array to be [] (not null), got %s", rec.Body.String())
		}

		var resp struct {
			Success bool `json:"success"`
			Data    struct {
				InvitationID int64                                     `json:"invitation_id"`
				Version      handlers.InvitationContentVersionResponse `json:"version"`
				Media        []handlers.InvitationMediaResponse        `json:"media"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if resp.Data.InvitationID != fixture.invitationA1 || resp.Data.Version.ID != fixture.versionA1 {
			t.Fatalf("unexpected invitation_id or version: %+v", resp.Data)
		}
		if len(resp.Data.Media) != 0 {
			t.Fatalf("expected 0 media items, got %d", len(resp.Data.Media))
		}
	})

	t.Run("ordering sort_order ASC id ASC, file_type filter, excludes other versions and soft-deleted rows", func(t *testing.T) {
		ctx := context.Background()

		// Bump versionA1 to version_number=2 (draft) and insert an older version_number=1 (published)
		if _, err := pool.Exec(ctx, `
			UPDATE invitation_versions SET version_number = 2 WHERE id = $1
		`, fixture.versionA1); err != nil {
			t.Fatalf("bump versionA1 to 2: %v", err)
		}
		var oldVersionID int64
		if err := pool.QueryRow(ctx, `
			INSERT INTO invitation_versions (invitation_id, version_number, status)
			VALUES ($1, 1, 'published')
			RETURNING id
		`, fixture.invitationA1).Scan(&oldVersionID); err != nil {
			t.Fatalf("insert old version: %v", err)
		}
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE invitation_version_id = $1`, oldVersionID)
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_versions WHERE id = $1`, oldVersionID)
			_, _ = pool.Exec(ctx, `UPDATE invitation_versions SET version_number = 1 WHERE id = $1`, fixture.versionA1)
		}()

		insertTestMediaRecord(
			t, pool, fixture.partnerA, oldVersionID, nil,
			"google_drive", "drive-old-ver", "image", "image/jpeg", "old.jpg", 100, 0,
		)

		// Insert media on working draft version (versionA1):
		// m1: sort_order=10, image
		// m2: sort_order=2, image
		// m3: sort_order=2, audio (inserted after m2, so id > m2.id)
		// mDeleted: sort_order=1, image, but storage_files.deleted_at is set
		m1ID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, &fixture.sectionA,
			"google_drive", "drive-m1", "image", "image/jpeg", "m1.jpg", 1111, 10,
		)
		m2ID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-m2", "image", "image/png", "m2.png", 2222, 2,
		)
		m3ID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-m3", "audio", "audio/mpeg", "song.mp3", 3333, 2,
		)
		_, deletedSFID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-deleted", "image", "image/jpeg", "gone.jpg", 4444, 1,
		)
		if _, err := pool.Exec(ctx, `
			UPDATE storage_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1
		`, deletedSFID); err != nil {
			t.Fatalf("soft-delete storage_file: %v", err)
		}
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE invitation_version_id = $1`, fixture.versionA1)
		}()

		// 1. All media (no filter) -> [m2 (sort 2), m3 (sort 2), m1 (sort 10)]
		recAll := sendGetMediaRequest(engine, invA1Str, "", partnerAToken)
		if recAll.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", recAll.Code, recAll.Body.String())
		}
		var respAll struct {
			Data struct {
				Media []handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		if err := json.Unmarshal(recAll.Body.Bytes(), &respAll); err != nil {
			t.Fatalf("unmarshal all: %v", err)
		}
		if len(respAll.Data.Media) != 3 {
			t.Fatalf("expected 3 active media items on draft version, got %d: %+v", len(respAll.Data.Media), respAll.Data.Media)
		}
		if respAll.Data.Media[0].ID != m2ID || respAll.Data.Media[1].ID != m3ID || respAll.Data.Media[2].ID != m1ID {
			t.Fatalf(
				"expected order [%d, %d, %d], got [%d, %d, %d]",
				m2ID, m3ID, m1ID,
				respAll.Data.Media[0].ID, respAll.Data.Media[1].ID, respAll.Data.Media[2].ID,
			)
		}
		if respAll.Data.Media[0].FileID != "drive-m2" || respAll.Data.Media[2].TemplateSectionID == nil || *respAll.Data.Media[2].TemplateSectionID != fixture.sectionA {
			t.Fatalf("unexpected item fields: %+v", respAll.Data.Media)
		}

		// 2. Filter file_type=image -> [m2, m1]
		recImg := sendGetMediaRequest(engine, invA1Str, "file_type=image", partnerAToken)
		if recImg.Code != http.StatusOK {
			t.Fatalf("expected 200 for image filter, got %d", recImg.Code)
		}
		var respImg struct {
			Data struct {
				Media []handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		_ = json.Unmarshal(recImg.Body.Bytes(), &respImg)
		if len(respImg.Data.Media) != 2 || respImg.Data.Media[0].ID != m2ID || respImg.Data.Media[1].ID != m1ID {
			t.Fatalf("unexpected image filter items: %+v", respImg.Data.Media)
		}

		// 3. Filter file_type=audio -> [m3]
		recAud := sendGetMediaRequest(engine, invA1Str, "file_type=audio", partnerAToken)
		if recAud.Code != http.StatusOK {
			t.Fatalf("expected 200 for audio filter, got %d", recAud.Code)
		}
		var respAud struct {
			Data struct {
				Media []handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		_ = json.Unmarshal(recAud.Body.Bytes(), &respAud)
		if len(respAud.Data.Media) != 1 || respAud.Data.Media[0].ID != m3ID || respAud.Data.Media[0].FileID != "drive-m3" {
			t.Fatalf("unexpected audio filter items: %+v", respAud.Data.Media)
		}
	})

	t.Run("published invitation without draft version resolves published working version", func(t *testing.T) {
		ctx := context.Background()
		invA2Str := strconv.FormatInt(fixture.invitationA2, 10)

		pubMediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA2, nil,
			"google_drive", "drive-pub-1", "image", "image/jpeg", "published.jpg", 5555, 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE invitation_version_id = $1`, fixture.versionA2)
			_, _ = pool.Exec(ctx, `
				UPDATE invitations
				SET status = 'draft', published_version_id = NULL
				WHERE id = $1
			`, fixture.invitationA2)
			_, _ = pool.Exec(ctx, `
				UPDATE invitation_versions
				SET status = 'draft'
				WHERE id = $1
			`, fixture.versionA2)
		}()

		if _, err := pool.Exec(ctx, `
			UPDATE invitation_versions SET status = 'published' WHERE id = $1
		`, fixture.versionA2); err != nil {
			t.Fatalf("set versionA2 published: %v", err)
		}
		if _, err := pool.Exec(ctx, `
			UPDATE invitations
			SET status = 'published', published_version_id = $2
			WHERE id = $1
		`, fixture.invitationA2, fixture.versionA2); err != nil {
			t.Fatalf("set invitationA2 published: %v", err)
		}

		rec := sendGetMediaRequest(engine, invA2Str, "", partnerAToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 on published invitation, got %d: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Data struct {
				Version handlers.InvitationContentVersionResponse `json:"version"`
				Media   []handlers.InvitationMediaResponse        `json:"media"`
			} `json:"data"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &resp)
		if resp.Data.Version.ID != fixture.versionA2 || resp.Data.Version.Status != "published" {
			t.Fatalf("expected published version %d, got %+v", fixture.versionA2, resp.Data.Version)
		}
		if len(resp.Data.Media) != 1 || resp.Data.Media[0].ID != pubMediaID {
			t.Fatalf("expected published media %d, got %+v", pubMediaID, resp.Data.Media)
		}
	})
}

func TestDeleteInvitationMedia(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)
	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	invA1Str := strconv.FormatInt(fixture.invitationA1, 10)
	invA2Str := strconv.FormatInt(fixture.invitationA2, 10)
	invBStr := strconv.FormatInt(fixture.invitationB, 10)
	partnerAToken := templateFavoritesToken(t, fixture.partnerA)

	folderID := "folder-partner-a"
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
	fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA1, "active", "'30 days'")

	t.Run("unauthenticated returns 401", func(t *testing.T) {
		rec := sendDeleteMediaRequest(engine, invA1Str, "1", "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("non-partner roles designer and admin return 403", func(t *testing.T) {
		for _, uid := range []int64{fixture.designerUser, fixture.adminUser} {
			tok := templateFavoritesToken(t, uid)
			rec := sendDeleteMediaRequest(engine, invA1Str, "1", tok)
			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected 403 for user %d, got %d: %s", uid, rec.Code, rec.Body.String())
			}
		}
	})

	t.Run("invalid invitation id and media_id return 400 (0, -5, abc)", func(t *testing.T) {
		for _, badID := range []string{"0", "-5", "abc"} {
			rec := sendDeleteMediaRequest(engine, badID, "1", partnerAToken)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for invitation id %q, got %d: %s", badID, rec.Code, rec.Body.String())
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["id"] != "invalid_invitation_id" {
				t.Fatalf("expected errors.id=invalid_invitation_id for %q, got %+v", badID, body.Errors)
			}
		}

		for _, badMediaID := range []string{"0", "-5", "abc"} {
			rec := sendDeleteMediaRequest(engine, invA1Str, badMediaID, partnerAToken)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for media_id %q, got %d: %s", badMediaID, rec.Code, rec.Body.String())
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["media_id"] != "invalid_media_id" {
				t.Fatalf("expected errors.media_id=invalid_media_id for %q, got %+v", badMediaID, body.Errors)
			}
		}
	})

	t.Run("non-existent invitation returns 404 without errors", func(t *testing.T) {
		rec := sendDeleteMediaRequest(engine, "999999999", "1", partnerAToken)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
		var raw map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &raw)
		if _, hasErrors := raw["errors"]; hasErrors {
			t.Fatalf("expected 404 without errors, got %s", rec.Body.String())
		}
	})

	t.Run("other partner invitation returns 404 and leaves DB and FakeStorage untouched", func(t *testing.T) {
		ctx := context.Background()
		mediaBID, sfBID := insertTestMediaRecord(
			t, pool, fixture.partnerB, fixture.versionB, nil,
			"google_drive", "drive-partner-b-file", "image", "image/jpeg", "b.jpg", 1024, 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, mediaBID)
		}()

		beforeDeleted := len(fakeStorage.DeletedFileIDsSnapshot())
		rec := sendDeleteMediaRequest(engine, invBStr, strconv.FormatInt(mediaBID, 10), partnerAToken)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
		if len(fakeStorage.DeletedFileIDsSnapshot()) != beforeDeleted {
			t.Fatalf("expected FakeStorage untouched")
		}

		var exists bool
		var deletedAt *time.Time
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invitation_media WHERE id = $1)`, mediaBID).Scan(&exists)
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfBID).Scan(&deletedAt)
		if !exists || deletedAt != nil {
			t.Fatalf("expected DB untouched: exists=%v deletedAt=%v", exists, deletedAt)
		}
	})

	t.Run("published or expired invitation returns 409 invitation_is_not_draft and does not touch FakeStorage", func(t *testing.T) {
		ctx := context.Background()
		mediaID, sfID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-non-draft", "image", "image/jpeg", "nondraft.jpg", 1024, 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, mediaID)
			_, _ = pool.Exec(ctx, `UPDATE invitations SET status = 'draft' WHERE id = $1`, fixture.invitationA1)
		}()

		for _, st := range []string{"published", "expired"} {
			if _, err := pool.Exec(ctx, `UPDATE invitations SET status = $2 WHERE id = $1`, fixture.invitationA1, st); err != nil {
				t.Fatalf("set status %s: %v", st, err)
			}

			beforeDeleted := len(fakeStorage.DeletedFileIDsSnapshot())
			rec := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaID, 10), partnerAToken)
			if rec.Code != http.StatusConflict {
				t.Fatalf("expected 409 for status %s, got %d: %s", st, rec.Code, rec.Body.String())
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["status"] != "invitation_is_not_draft" {
				t.Fatalf("expected errors.status=invitation_is_not_draft, got %+v", body.Errors)
			}
			if len(fakeStorage.DeletedFileIDsSnapshot()) != beforeDeleted {
				t.Fatalf("expected FakeStorage untouched on 409")
			}
			var deletedAt *time.Time
			_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfID).Scan(&deletedAt)
			if deletedAt != nil {
				t.Fatalf("expected storage_files.deleted_at to remain NULL")
			}
		}
	})

	t.Run("missing media, media from another invitation, and media from older version on draft invitation return 404", func(t *testing.T) {
		ctx := context.Background()

		// 1. Missing media ID
		recMissing := sendDeleteMediaRequest(engine, invA1Str, "999999999", partnerAToken)
		if recMissing.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for missing media, got %d: %s", recMissing.Code, recMissing.Body.String())
		}

		// 2. Media belonging to invitationA2 (also owned by partnerA)
		mediaA2ID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA2, nil,
			"google_drive", "drive-a2-file", "image", "image/jpeg", "a2.jpg", 1024, 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, mediaA2ID)
		}()

		recOtherInv := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaA2ID, 10), partnerAToken)
		if recOtherInv.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for media of another invitation, got %d: %s", recOtherInv.Code, recOtherInv.Body.String())
		}

		// 3. Media belonging to an older version (version 1 published while draft is version 2) of draft invitationA1
		if _, err := pool.Exec(ctx, `
			UPDATE invitation_versions SET version_number = 2 WHERE id = $1
		`, fixture.versionA1); err != nil {
			t.Fatalf("bump versionA1 to 2: %v", err)
		}
		var oldVerID int64
		if err := pool.QueryRow(ctx, `
			INSERT INTO invitation_versions (invitation_id, version_number, status)
			VALUES ($1, 1, 'published')
			RETURNING id
		`, fixture.invitationA1).Scan(&oldVerID); err != nil {
			t.Fatalf("insert old version: %v", err)
		}
		oldMediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, oldVerID, nil,
			"google_drive", "drive-old-v1", "image", "image/jpeg", "oldv1.jpg", 1024, 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, oldMediaID)
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_versions WHERE id = $1`, oldVerID)
			_, _ = pool.Exec(ctx, `UPDATE invitation_versions SET version_number = 1 WHERE id = $1`, fixture.versionA1)
		}()

		recOldVer := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(oldMediaID, 10), partnerAToken)
		if recOldVer.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for media of older version on draft invitation, got %d: %s", recOldVer.Code, recOldVer.Body.String())
		}
	})

	t.Run("delete twice sequentially returns 200 then 404 (not 500)", func(t *testing.T) {
		mediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-seq-del", "image", "image/jpeg", "seq.jpg", 1024, 0,
		)
		mediaIDStr := strconv.FormatInt(mediaID, 10)

		rec1 := sendDeleteMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken)
		if rec1.Code != http.StatusOK {
			t.Fatalf("expected first delete 200, got %d: %s", rec1.Code, rec1.Body.String())
		}

		rec2 := sendDeleteMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken)
		if rec2.Code != http.StatusNotFound {
			t.Fatalf("expected second delete 404, got %d: %s", rec2.Code, rec2.Body.String())
		}
	})

	t.Run("two concurrent DELETE requests for same media_id return one 200 and one 404", func(t *testing.T) {
		ctx := context.Background()
		mediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-concurrent-double-del", "image", "image/jpeg", "double.jpg", 1024, 0,
		)
		mediaIDStr := strconv.FormatInt(mediaID, 10)

		// Deterministic barrier: hold FOR UPDATE lock on invitations(invitationA1) so both DELETE
		// requests enter their transactions and queue simultaneously on the row lock.
		barrierTx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("begin barrier tx: %v", err)
		}
		defer func() {
			_ = barrierTx.Rollback(ctx)
		}()

		var dummyStatus string
		if err := barrierTx.QueryRow(ctx, `
			SELECT status FROM invitations WHERE id = $1 FOR UPDATE
		`, fixture.invitationA1).Scan(&dummyStatus); err != nil {
			t.Fatalf("lock invitation in barrier tx: %v", err)
		}

		var wg sync.WaitGroup
		wg.Add(2)
		codes := make([]int, 2)

		for i := 0; i < 2; i++ {
			idx := i
			go func() {
				defer wg.Done()
				rec := sendDeleteMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken)
				codes[idx] = rec.Code
			}()
		}

		// Wait until both DELETE goroutines are blocked on the row lock held by barrierTx
		// (waiter #1 blocks on locktype='transactionid', waiter #2 on the same row blocks on locktype='tuple')
		deadline := time.Now().Add(3 * time.Second)
		for time.Now().Before(deadline) {
			var waitingCount int
			_ = pool.QueryRow(ctx, `
				SELECT COUNT(DISTINCT l.pid)
				FROM pg_locks l
				JOIN pg_stat_activity a ON a.pid = l.pid
				WHERE a.datname = current_database()
				  AND a.wait_event_type = 'Lock'
				  AND NOT l.granted
				  AND l.locktype IN ('transactionid', 'tuple')
			`).Scan(&waitingCount)
			if waitingCount >= 2 {
				break
			}
			time.Sleep(10 * time.Millisecond)
		}

		// Release the barrier lock so both DELETE transactions race under PostgreSQL row locking
		_ = barrierTx.Rollback(ctx)
		wg.Wait()

		if !((codes[0] == http.StatusOK && codes[1] == http.StatusNotFound) ||
			(codes[0] == http.StatusNotFound && codes[1] == http.StatusOK)) {
			t.Fatalf("expected one 200 and one 404, got codes=%v", codes)
		}

		deletedIDs := fakeStorage.DeletedFileIDsSnapshot()
		countInDrive := 0
		for _, id := range deletedIDs {
			if id == "drive-concurrent-double-del" {
				countInDrive++
			}
		}
		if countInDrive != 1 {
			t.Fatalf("expected FakeStorage.DeleteFile called exactly once for drive-concurrent-double-del, got %d", countInDrive)
		}
	})

	t.Run("delete image frees gallery_limit slot, sets deleted_at, records DeletedFileIDs, and next upload succeeds 201", func(t *testing.T) {
		ctx := context.Background()
		setTestGalleryLimit(t, pool, fixture.packageID, 1)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM package_limits WHERE package_id = $1`, fixture.packageID)
		}()

		jpgBytes := validTestJPEGBytes(t, 32, 32)
		upRec1 := sendMultipartMediaRequest(t, engine, invA1Str, partnerAToken, nil, true, "img1.jpg", jpgBytes)
		if upRec1.Code != http.StatusCreated {
			t.Fatalf("expected first upload 201, got %d: %s", upRec1.Code, upRec1.Body.String())
		}
		var upResp1 struct {
			Data struct {
				Media handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		_ = json.Unmarshal(upRec1.Body.Bytes(), &upResp1)
		uploadedMedia := upResp1.Data.Media

		// Verify gallery_limit=1 blocks a second upload with 409 gallery_limit_reached
		upRecBlocked := sendMultipartMediaRequest(t, engine, invA1Str, partnerAToken, nil, true, "img2.jpg", jpgBytes)
		if upRecBlocked.Code != http.StatusConflict {
			t.Fatalf("expected 409 at gallery_limit=1, got %d: %s", upRecBlocked.Code, upRecBlocked.Body.String())
		}

		// Delete the first image
		delRec := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(uploadedMedia.ID, 10), partnerAToken)
		if delRec.Code != http.StatusOK {
			t.Fatalf("expected delete 200, got %d: %s", delRec.Code, delRec.Body.String())
		}
		var delBody struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(delRec.Body.Bytes(), &delBody)
		if !delBody.Success || delBody.Message != "Invitation media deleted successfully" {
			t.Fatalf("unexpected delete response body: %s", delRec.Body.String())
		}

		// Verify invitation_media row is gone and storage_files.deleted_at is set
		var mediaExists bool
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invitation_media WHERE id = $1)`, uploadedMedia.ID).Scan(&mediaExists)
		if mediaExists {
			t.Fatalf("expected invitation_media row %d hard-deleted", uploadedMedia.ID)
		}
		var deletedAt *time.Time
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, uploadedMedia.StorageFileID).Scan(&deletedAt)
		if deletedAt == nil {
			t.Fatalf("expected storage_files.deleted_at to be populated for id=%d", uploadedMedia.StorageFileID)
		}

		// Verify FakeStorage.DeletedFileIDs contains file_id
		foundFileID := false
		for _, fid := range fakeStorage.DeletedFileIDsSnapshot() {
			if fid == uploadedMedia.FileID {
				foundFileID = true
				break
			}
		}
		if !foundFileID {
			t.Fatalf("expected FakeStorage.DeletedFileIDs to contain %q, got %v", uploadedMedia.FileID, fakeStorage.DeletedFileIDsSnapshot())
		}

		// Next image upload now succeeds with 201 Created
		upRec2 := sendMultipartMediaRequest(t, engine, invA1Str, partnerAToken, nil, true, "img2-after-del.jpg", jpgBytes)
		if upRec2.Code != http.StatusCreated {
			t.Fatalf("expected upload after delete to succeed 201, got %d: %s", upRec2.Code, upRec2.Body.String())
		}
		var upResp2 struct {
			Data struct {
				Media handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		_ = json.Unmarshal(upRec2.Body.Bytes(), &upResp2)
		_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, upResp2.Data.Media.ID)
	})

	t.Run("delete audio frees audio slot and next MP3 upload succeeds 201", func(t *testing.T) {
		ctx := context.Background()
		mp3Bytes := validID3MP3Bytes()

		upRec1 := sendMultipartMediaRequest(t, engine, invA1Str, partnerAToken, nil, true, "song1.mp3", mp3Bytes)
		if upRec1.Code != http.StatusCreated {
			t.Fatalf("expected first MP3 upload 201, got %d: %s", upRec1.Code, upRec1.Body.String())
		}
		var upResp1 struct {
			Data struct {
				Media handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		_ = json.Unmarshal(upRec1.Body.Bytes(), &upResp1)

		// Second MP3 blocked by audio_limit_reached
		upRecBlocked := sendMultipartMediaRequest(t, engine, invA1Str, partnerAToken, nil, true, "song2.mp3", mp3Bytes)
		if upRecBlocked.Code != http.StatusConflict {
			t.Fatalf("expected 409 audio_limit_reached, got %d: %s", upRecBlocked.Code, upRecBlocked.Body.String())
		}

		// Delete first MP3
		delRec := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(upResp1.Data.Media.ID, 10), partnerAToken)
		if delRec.Code != http.StatusOK {
			t.Fatalf("expected delete MP3 200, got %d: %s", delRec.Code, delRec.Body.String())
		}

		// Replacement MP3 upload succeeds 201
		upRec2 := sendMultipartMediaRequest(t, engine, invA1Str, partnerAToken, nil, true, "song2.mp3", mp3Bytes)
		if upRec2.Code != http.StatusCreated {
			t.Fatalf("expected replacement MP3 upload 201, got %d: %s", upRec2.Code, upRec2.Body.String())
		}
		var upResp2 struct {
			Data struct {
				Media handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		_ = json.Unmarshal(upRec2.Body.Bytes(), &upResp2)
		_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, upResp2.Data.Media.ID)
	})

	t.Run("Google Drive 404 on delete still returns 200 OK", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch {
			case r.URL.Path == "/token":
				w.Header().Set("Content-Type", "application/json")
				_, _ = io.WriteString(w, `{"access_token":"test-access-token","token_type":"Bearer","expires_in":3600}`)
			case r.Method == http.MethodDelete && strings.HasPrefix(r.URL.Path, "/drive/v3/files/"):
				w.WriteHeader(http.StatusNotFound)
				_, _ = io.WriteString(w, `{"error":{"code":404,"message":"File not found"}}`)
			default:
				w.WriteHeader(http.StatusNotFound)
			}
		}))
		defer srv.Close()

		googleStorage := drive.NewGoogleStorage("cid", "csecret")
		googleStorage.HTTPClient = &http.Client{
			Timeout:   5 * time.Second,
			Transport: rewriteHostTransport{base: srv.Client().Transport, targetURL: srv.URL},
		}
		cfg404 := defaultDriveTestConfig(key, &drive.FakeOAuth{})
		cfg404.Storage = googleStorage
		engine404 := setupDriveTestEngine(pool, cfg404)

		mediaID, sfID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "missing-on-drive-404", "image", "image/jpeg", "404.jpg", 1024, 0,
		)

		rec := sendDeleteMediaRequest(engine404, invA1Str, strconv.FormatInt(mediaID, 10), partnerAToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 when Drive returns 404, got %d: %s", rec.Code, rec.Body.String())
		}
		var deletedAt *time.Time
		_ = pool.QueryRow(context.Background(), `SELECT deleted_at FROM storage_files WHERE id = $1`, sfID).Scan(&deletedAt)
		if deletedAt == nil {
			t.Fatalf("expected storage_files.deleted_at set")
		}
	})

	t.Run("Drive error still returns 200 and DB is deleted", func(t *testing.T) {
		ctx := context.Background()
		fakeStorage.DeleteErr = errors.New("drive 503 error")
		defer func() {
			fakeStorage.DeleteErr = nil
		}()

		mediaID, sfID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-err-503", "image", "image/jpeg", "err503.jpg", 1024, 0,
		)

		rec := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaID, 10), partnerAToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 on Drive error, got %d: %s", rec.Code, rec.Body.String())
		}
		var exists bool
		var deletedAt *time.Time
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invitation_media WHERE id = $1)`, mediaID).Scan(&exists)
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfID).Scan(&deletedAt)
		if exists || deletedAt == nil {
			t.Fatalf("expected DB deleted even when Drive fails: exists=%v deletedAt=%v", exists, deletedAt)
		}
	})

	t.Run("invalid_grant on Drive delete returns 200, deletes DB, and marks credentials revoked", func(t *testing.T) {
		ctx := context.Background()
		fakeStorage.DeleteErr = drive.ErrTokenRevoked
		defer func() {
			fakeStorage.DeleteErr = nil
			fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
		}()

		mediaID, sfID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-invalid-grant", "image", "image/jpeg", "revoked.jpg", 1024, 0,
		)

		rec := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaID, 10), partnerAToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 on ErrTokenRevoked, got %d: %s", rec.Code, rec.Body.String())
		}
		var deletedAt *time.Time
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfID).Scan(&deletedAt)
		if deletedAt == nil {
			t.Fatalf("expected storage_files.deleted_at set")
		}

		var credStatus string
		if err := pool.QueryRow(ctx, `
			SELECT status FROM user_drive_credentials WHERE user_id = $1
		`, fixture.partnerA).Scan(&credStatus); err != nil {
			t.Fatalf("query cred status: %v", err)
		}
		if credStatus != "revoked" {
			t.Fatalf("expected credentials status='revoked', got %q", credStatus)
		}
	})

	t.Run("revoked credentials or missing credentials delete DB and skip Drive call", func(t *testing.T) {
		ctx := context.Background()
		defer func() {
			fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
		}()

		// Case 1: status = 'revoked'
		fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "revoked", &folderID)
		mediaRevID, sfRevID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-skip-when-revoked", "image", "image/jpeg", "skip1.jpg", 1024, 0,
		)

		beforeLen := len(fakeStorage.DeletedFileIDsSnapshot())
		rec1 := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaRevID, 10), partnerAToken)
		if rec1.Code != http.StatusOK {
			t.Fatalf("expected 200 when credentials revoked, got %d: %s", rec1.Code, rec1.Body.String())
		}
		if len(fakeStorage.DeletedFileIDsSnapshot()) != beforeLen {
			t.Fatalf("expected Drive NOT called when credentials revoked")
		}
		var deletedAt1 *time.Time
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfRevID).Scan(&deletedAt1)
		if deletedAt1 == nil {
			t.Fatalf("expected storage_files.deleted_at set when credentials revoked")
		}

		// Case 2: no credentials row at all
		_, _ = pool.Exec(ctx, `DELETE FROM user_drive_credentials WHERE user_id = $1`, fixture.partnerA)
		mediaNoCredID, sfNoCredID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-skip-no-cred", "image", "image/jpeg", "skip2.jpg", 1024, 0,
		)

		rec2 := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaNoCredID, 10), partnerAToken)
		if rec2.Code != http.StatusOK {
			t.Fatalf("expected 200 without credentials, got %d: %s", rec2.Code, rec2.Body.String())
		}
		if len(fakeStorage.DeletedFileIDsSnapshot()) != beforeLen {
			t.Fatalf("expected Drive NOT called when credentials missing")
		}
		var deletedAt2 *time.Time
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfNoCredID).Scan(&deletedAt2)
		if deletedAt2 == nil {
			t.Fatalf("expected storage_files.deleted_at set when credentials missing")
		}
	})

	t.Run("expired addon but connected Drive still returns 200 and calls Drive", func(t *testing.T) {
		ctx := context.Background()
		// Expire all entitlements for invitationA1
		_, err := pool.Exec(ctx, `
			UPDATE invitation_addon_entitlements
			SET status = 'expired',
			    expires_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
			WHERE invitation_id = $1
		`, fixture.invitationA1)
		if err != nil {
			t.Fatalf("expire entitlements: %v", err)
		}
		defer func() {
			_, _ = pool.Exec(ctx, `
				UPDATE invitation_addon_entitlements
				SET status = 'active',
				    expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
				WHERE invitation_id = $1
			`, fixture.invitationA1)
		}()

		mediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-expired-addon-file", "image", "image/jpeg", "exp.jpg", 1024, 0,
		)

		rec := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaID, 10), partnerAToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 with expired addon, got %d: %s", rec.Code, rec.Body.String())
		}

		found := false
		for _, fid := range fakeStorage.DeletedFileIDsSnapshot() {
			if fid == "drive-expired-addon-file" {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("expected Drive DeleteFile called even when addon is expired")
		}
	})

	t.Run("shared storage_file_id across two invitation_media rows keeps deleted_at NULL and skips Drive until last reference is removed", func(t *testing.T) {
		ctx := context.Background()
		media1ID, sharedSFID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-shared-file-id", "image", "image/jpeg", "shared.jpg", 1024, 0,
		)

		var media2ID int64
		if err := pool.QueryRow(ctx, `
			INSERT INTO invitation_media (
				invitation_version_id,
				storage_file_id,
				file_type,
				sort_order
			)
			VALUES ($1, $2, 'image', 1)
			RETURNING id
		`, fixture.versionA1, sharedSFID).Scan(&media2ID); err != nil {
			t.Fatalf("insert second invitation_media referencing same storage_file_id: %v", err)
		}

		// Delete first reference -> storage_files.deleted_at must remain NULL and Drive must NOT be called
		rec1 := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(media1ID, 10), partnerAToken)
		if rec1.Code != http.StatusOK {
			t.Fatalf("expected 200 on first shared delete, got %d: %s", rec1.Code, rec1.Body.String())
		}

		var deletedAtAfterFirst *time.Time
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sharedSFID).Scan(&deletedAtAfterFirst)
		if deletedAtAfterFirst != nil {
			t.Fatalf("expected storage_files.deleted_at to remain NULL while second reference exists")
		}
		for _, fid := range fakeStorage.DeletedFileIDsSnapshot() {
			if fid == "drive-shared-file-id" {
				t.Fatalf("expected Drive NOT called while second reference still exists")
			}
		}

		// Delete second (last) reference -> now storage_files.deleted_at is set and Drive IS called
		rec2 := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(media2ID, 10), partnerAToken)
		if rec2.Code != http.StatusOK {
			t.Fatalf("expected 200 on second shared delete, got %d: %s", rec2.Code, rec2.Body.String())
		}

		var deletedAtAfterSecond *time.Time
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sharedSFID).Scan(&deletedAtAfterSecond)
		if deletedAtAfterSecond == nil {
			t.Fatalf("expected storage_files.deleted_at set after last reference is deleted")
		}
		found := false
		for _, fid := range fakeStorage.DeletedFileIDsSnapshot() {
			if fid == "drive-shared-file-id" {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("expected Drive called after last reference is deleted")
		}

		// Also verify reference from templates.thumbnail_file_id prevents soft-delete & Drive delete
		mediaThumbID, sfThumbID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-shared-thumbnail-file", "image", "image/jpeg", "thumb.jpg", 1024, 0,
		)
		if _, err := pool.Exec(ctx, `UPDATE templates SET thumbnail_file_id = $1 WHERE id = $2`, sfThumbID, fixture.templateA); err != nil {
			t.Fatalf("set template thumbnail_file_id: %v", err)
		}
		defer func() {
			_, _ = pool.Exec(ctx, `UPDATE templates SET thumbnail_file_id = NULL WHERE id = $1`, fixture.templateA)
		}()

		recThumb := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaThumbID, 10), partnerAToken)
		if recThumb.Code != http.StatusOK {
			t.Fatalf("expected 200 on thumbnail-referenced media delete, got %d: %s", recThumb.Code, recThumb.Body.String())
		}
		var deletedAtThumb *time.Time
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfThumbID).Scan(&deletedAtThumb)
		if deletedAtThumb != nil {
			t.Fatalf("expected storage_files.deleted_at NULL when still referenced by templates.thumbnail_file_id")
		}
		for _, fid := range fakeStorage.DeletedFileIDsSnapshot() {
			if fid == "drive-shared-thumbnail-file" {
				t.Fatalf("expected Drive NOT called when referenced by templates.thumbnail_file_id")
			}
		}
	})

	t.Run("storage_files already soft-deleted returns 200 without 500 and skips Drive", func(t *testing.T) {
		ctx := context.Background()
		mediaID, sfID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-already-soft-deleted", "image", "image/jpeg", "already.jpg", 1024, 0,
		)
		if _, err := pool.Exec(ctx, `
			UPDATE storage_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1
		`, sfID); err != nil {
			t.Fatalf("pre-soft-delete storage_files: %v", err)
		}

		beforeLen := len(fakeStorage.DeletedFileIDsSnapshot())
		rec := sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(mediaID, 10), partnerAToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 when storage_files already soft-deleted, got %d: %s", rec.Code, rec.Body.String())
		}
		if len(fakeStorage.DeletedFileIDsSnapshot()) != beforeLen {
			t.Fatalf("expected Drive skipped when storage_files was already soft-deleted")
		}
	})

	t.Run("deterministic race DELETE vs PublishInvitation serializes on invitations FOR UPDATE", func(t *testing.T) {
		ctx := context.Background()

		// Prepare invitationA2 so PublishInvitation will pass readiness validation (requires an event with start_time)
		var eventID int64
		if err := pool.QueryRow(ctx, `
			INSERT INTO events (user_id, name, date, start_time, location)
			VALUES ($1, 'Wedding Event', '2026-12-31', '10:00:00', 'Jakarta')
			RETURNING id
		`, fixture.partnerA).Scan(&eventID); err != nil {
			t.Fatalf("insert event: %v", err)
		}
		if _, err := pool.Exec(ctx, `
			INSERT INTO invitation_events (invitation_id, event_id, sort_order)
			VALUES ($1, $2, 0)
		`, fixture.invitationA2, eventID); err != nil {
			t.Fatalf("insert invitation_events: %v", err)
		}
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_events WHERE invitation_id = $1`, fixture.invitationA2)
			_, _ = pool.Exec(ctx, `DELETE FROM events WHERE id = $1`, eventID)
			_, _ = pool.Exec(ctx, `
				UPDATE invitations SET status = 'draft', published_version_id = NULL, published_at = NULL WHERE id = $1
			`, fixture.invitationA2)
			_, _ = pool.Exec(ctx, `
				UPDATE invitation_versions SET status = 'draft' WHERE id = $1
			`, fixture.versionA2)
		}()

		mediaID, sfID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA2, nil,
			"google_drive", "drive-race-publish", "image", "image/jpeg", "racepub.jpg", 1024, 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, mediaID)
		}()

		// Deterministic mechanism:
		// 1. barrierTx locks partner_packages FOR UPDATE.
		// 2. PublishInvitation locks invitations FOR UPDATE, then invitation_versions FOR UPDATE,
		//    then blocks waiting for partner_packages FOR UPDATE.
		// 3. DeleteInvitationMedia starts and blocks waiting for invitations FOR UPDATE behind PublishInvitation.
		// 4. barrierTx rolls back -> PublishInvitation finishes (200 OK) and commits status='published' ->
		//    DeleteInvitationMedia unblocks, reads status='published', and returns 409 invitation_is_not_draft!
		barrierTx, err := pool.Begin(ctx)
		if err != nil {
			t.Fatalf("begin barrierTx: %v", err)
		}
		defer func() {
			_ = barrierTx.Rollback(ctx)
		}()

		var lockedPkgID int64
		if err := barrierTx.QueryRow(ctx, `
			SELECT id FROM partner_packages WHERE user_id = $1 FOR UPDATE
		`, fixture.partnerA).Scan(&lockedPkgID); err != nil {
			t.Fatalf("lock partner_packages in barrierTx: %v", err)
		}

		var publishRec *httptest.ResponseRecorder
		var deleteRec *httptest.ResponseRecorder
		var wg sync.WaitGroup
		wg.Add(2)

		go func() {
			defer wg.Done()
			req := httptest.NewRequest(http.MethodPost, "/api/v1/invitations/"+invA2Str+"/publish", bytes.NewReader(nil))
			req.Header.Set("Authorization", "Bearer "+partnerAToken)
			rec := httptest.NewRecorder()
			engine.ServeHTTP(rec, req)
			publishRec = rec
		}()

		// Poll pg_locks until PublishInvitation is blocked on the row-level transaction lock (meaning it already holds invitations FOR UPDATE)
		deadline := time.Now().Add(3 * time.Second)
		for time.Now().Before(deadline) {
			var waitingTx int
			_ = pool.QueryRow(ctx, `
				SELECT COUNT(*)
				FROM pg_locks
				WHERE locktype = 'transactionid'
				  AND NOT granted
			`).Scan(&waitingTx)
			if waitingTx >= 1 {
				break
			}
			time.Sleep(10 * time.Millisecond)
		}

		go func() {
			defer wg.Done()
			deleteRec = sendDeleteMediaRequest(engine, invA2Str, strconv.FormatInt(mediaID, 10), partnerAToken)
		}()

		// Poll pg_locks until DeleteInvitationMedia is also blocked on the row-level transaction lock (waitingTx >= 2)
		deadline = time.Now().Add(3 * time.Second)
		for time.Now().Before(deadline) {
			var waitingTx int
			_ = pool.QueryRow(ctx, `
				SELECT COUNT(*)
				FROM pg_locks
				WHERE locktype = 'transactionid'
				  AND NOT granted
			`).Scan(&waitingTx)
			if waitingTx >= 2 {
				break
			}
			time.Sleep(10 * time.Millisecond)
		}

		// Release partner_packages lock
		_ = barrierTx.Rollback(ctx)
		wg.Wait()

		if publishRec.Code != http.StatusOK {
			t.Fatalf("expected PublishInvitation 200 OK, got %d: %s", publishRec.Code, publishRec.Body.String())
		}
		if deleteRec.Code != http.StatusConflict {
			t.Fatalf("expected DeleteInvitationMedia 409 Conflict after publish wins lock, got %d: %s", deleteRec.Code, deleteRec.Body.String())
		}
		var delErrBody struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(deleteRec.Body.Bytes(), &delErrBody)
		if delErrBody.Errors["status"] != "invitation_is_not_draft" {
			t.Fatalf("expected errors.status=invitation_is_not_draft, got %+v", delErrBody.Errors)
		}

		// Media row and storage_files.deleted_at must remain intact
		var stillExists bool
		var deletedAt *time.Time
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invitation_media WHERE id = $1)`, mediaID).Scan(&stillExists)
		_ = pool.QueryRow(ctx, `SELECT deleted_at FROM storage_files WHERE id = $1`, sfID).Scan(&deletedAt)
		if !stillExists || deletedAt != nil {
			t.Fatalf("expected published media intact: exists=%v deletedAt=%v", stillExists, deletedAt)
		}
	})

	t.Run("race DELETE vs UploadInvitationMedia serializes cleanly without deadlock", func(t *testing.T) {
		ctx := context.Background()
		setTestGalleryLimit(t, pool, fixture.packageID, 2)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM package_limits WHERE package_id = $1`, fixture.packageID)
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE invitation_version_id = $1`, fixture.versionA1)
		}()

		existingMediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", "drive-race-upload-existing", "image", "image/jpeg", "existing.jpg", 1024, 0,
		)

		var delRec *httptest.ResponseRecorder
		var delWG sync.WaitGroup

		fakeStorage.UploadHook = func(_ context.Context, _ drive.UploadFileParams) {
			delWG.Add(1)
			go func() {
				defer delWG.Done()
				delRec = sendDeleteMediaRequest(engine, invA1Str, strconv.FormatInt(existingMediaID, 10), partnerAToken)
			}()
			delWG.Wait()
		}
		defer func() {
			fakeStorage.UploadHook = nil
		}()

		jpgBytes := validTestJPEGBytes(t, 32, 32)
		upRec := sendMultipartMediaRequest(t, engine, invA1Str, partnerAToken, nil, true, "concurrent-new.jpg", jpgBytes)
		if upRec.Code != http.StatusCreated {
			t.Fatalf("expected concurrent upload 201, got %d: %s", upRec.Code, upRec.Body.String())
		}
		if delRec == nil || delRec.Code != http.StatusOK {
			t.Fatalf("expected concurrent delete 200, got %+v", delRec)
		}

		// Verify only the newly uploaded media remains active on versionA1
		var activeCount int
		_ = pool.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM invitation_media im
			JOIN storage_files sf ON sf.id = im.storage_file_id
			WHERE im.invitation_version_id = $1 AND sf.deleted_at IS NULL
		`, fixture.versionA1).Scan(&activeCount)
		if activeCount != 1 {
			t.Fatalf("expected exactly 1 active media after concurrent delete + upload, got %d", activeCount)
		}
	})
}
