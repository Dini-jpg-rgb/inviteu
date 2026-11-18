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
	"testing"
	"time"

	"backend-golang/internal/drive"
	"backend-golang/internal/handlers"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"

	"github.com/gin-gonic/gin"
)

func sendPublicStreamMediaRequest(
	engine *gin.Engine,
	slug string,
	mediaIDStr string,
	headers map[string]string,
) *httptest.ResponseRecorder {
	path := "/api/v1/public/invitations/" + slug + "/media/" + mediaIDStr
	req := httptest.NewRequest(http.MethodGet, path, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func sendOwnerStreamMediaRequest(
	engine *gin.Engine,
	invitationIDStr string,
	mediaIDStr string,
	token string,
	headers map[string]string,
) *httptest.ResponseRecorder {
	path := "/api/v1/invitations/" + invitationIDStr + "/media/" + mediaIDStr + "/content"
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func assertUniformPublicMediaNotFound(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 Not Found, got %d: %s", rec.Code, rec.Body.String())
	}
	if cc := rec.Header().Get("Cache-Control"); cc != "no-store" {
		t.Fatalf("expected Cache-Control=no-store on 404, got %q", cc)
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal 404 body: %v (raw=%s)", err, rec.Body.String())
	}
	if body["success"] != false || body["message"] != "Media not found" {
		t.Fatalf("expected uniform 404 {\"success\":false,\"message\":\"Media not found\"}, got %s", rec.Body.String())
	}
	if _, hasErrors := body["errors"]; hasErrors {
		t.Fatalf("expected no errors field on uniform public 404, got %s", rec.Body.String())
	}
}

func TestMountDriveRoutes_Slice3RealRouterNoConflict(t *testing.T) {
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
	foundOwnerStream := false
	foundPublicStream := false
	for _, rt := range routes {
		if rt.Method == http.MethodGet && rt.Path == "/api/v1/invitations/:id/media/:media_id/content" {
			foundOwnerStream = true
		}
		if rt.Method == http.MethodGet && rt.Path == "/api/v1/public/invitations/:slug/media/:media_id" {
			foundPublicStream = true
		}
	}
	if !foundOwnerStream || !foundPublicStream {
		t.Fatalf(
			"expected owner and public stream routes registered on real router, got owner=%v public=%v",
			foundOwnerStream,
			foundPublicStream,
		)
	}
}

func TestStreamPublicInvitationMedia(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)

	folderID := "folder-partner-a-stream"
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerB, "refresh-partner-b", "connected", &folderID)

	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	ctx := context.Background()
	slugA1 := fixture.marker + "-inv-a1"
	slugA2 := fixture.marker + "-inv-a2"
	slugB1 := fixture.marker + "-inv-b1"

	// Transition invitationA1 and versionA1 to published
	if _, err := pool.Exec(ctx, `
		UPDATE invitation_versions
		SET status = 'published', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, fixture.versionA1); err != nil {
		t.Fatalf("publish versionA1: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		UPDATE invitations
		SET status = 'published',
		    published_version_id = $1,
		    published_at = CURRENT_TIMESTAMP,
		    expired_at = NULL
		WHERE id = $2
	`, fixture.versionA1, fixture.invitationA1); err != nil {
		t.Fatalf("publish invitationA1: %v", err)
	}

	jpgBytes := validTestJPEGBytes(t, 24, 24)
	mp3Bytes := validID3MP3Bytes()

	imgDriveID := "secret-drive-file-id-img-a1"
	audDriveID := "secret-drive-file-id-aud-a1"
	fakeStorage.SetFileContent(imgDriveID, jpgBytes)
	fakeStorage.SetFileContent(audDriveID, mp3Bytes)

	imgMediaID, _ := insertTestMediaRecord(
		t, pool, fixture.partnerA, fixture.versionA1, &fixture.sectionA,
		"google_drive", imgDriveID, "image", "image/jpeg", "Foto Pengantin & Keluarga (Ümlaut).jpg", int64(len(jpgBytes)), 0,
	)
	audMediaID, _ := insertTestMediaRecord(
		t, pool, fixture.partnerA, fixture.versionA1, nil,
		"google_drive", audDriveID, "audio", "audio/mpeg", "lagu-pernikahan.mp3", int64(len(mp3Bytes)), 1,
	)

	imgMediaIDStr := strconv.FormatInt(imgMediaID, 10)
	audMediaIDStr := strconv.FormatInt(audMediaID, 10)

	t.Run("published invitation serves image and audio with exact bytes, safe headers, and no drive file_id leak", func(t *testing.T) {
		recImg := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		if recImg.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for published image, got %d: %s", recImg.Code, recImg.Body.String())
		}
		if !bytes.Equal(recImg.Body.Bytes(), jpgBytes) {
			t.Fatalf("expected image body len=%d, got len=%d", len(jpgBytes), recImg.Body.Len())
		}
		if ct := recImg.Header().Get("Content-Type"); ct != "image/jpeg" {
			t.Fatalf("expected Content-Type=image/jpeg, got %q", ct)
		}
		if cl := recImg.Header().Get("Content-Length"); cl != strconv.Itoa(len(jpgBytes)) {
			t.Fatalf("expected Content-Length=%d, got %q", len(jpgBytes), cl)
		}
		if nosniff := recImg.Header().Get("X-Content-Type-Options"); nosniff != "nosniff" {
			t.Fatalf("expected X-Content-Type-Options=nosniff, got %q", nosniff)
		}
		if ar := recImg.Header().Get("Accept-Ranges"); ar != "bytes" {
			t.Fatalf("expected Accept-Ranges=bytes, got %q", ar)
		}
		if cc := recImg.Header().Get("Cache-Control"); cc != "public, max-age=300" {
			t.Fatalf("expected Cache-Control='public, max-age=300', got %q", cc)
		}
		cd := recImg.Header().Get("Content-Disposition")
		if !strings.HasPrefix(cd, "inline") {
			t.Fatalf("expected inline Content-Disposition, got %q", cd)
		}
		etag := recImg.Header().Get("ETag")
		if etag == "" {
			t.Fatalf("expected non-empty ETag on public media response")
		}
		for k, vals := range recImg.Header() {
			for _, v := range vals {
				if strings.Contains(v, imgDriveID) {
					t.Fatalf("header %s leaked drive file_id %q: %q", k, imgDriveID, v)
				}
			}
		}

		// Audio check
		recAud := sendPublicStreamMediaRequest(engine, slugA1, audMediaIDStr, nil)
		if recAud.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for published audio, got %d: %s", recAud.Code, recAud.Body.String())
		}
		if !bytes.Equal(recAud.Body.Bytes(), mp3Bytes) {
			t.Fatalf("expected audio body len=%d, got len=%d", len(mp3Bytes), recAud.Body.Len())
		}
		if ct := recAud.Header().Get("Content-Type"); ct != "audio/mpeg" {
			t.Fatalf("expected Content-Type=audio/mpeg, got %q", ct)
		}
	})

	t.Run("If-None-Match matching ETag without Range returns 304 and does not call Drive", func(t *testing.T) {
		rec1 := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		if rec1.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rec1.Code)
		}
		etag := rec1.Header().Get("ETag")
		if etag == "" {
			t.Fatalf("expected ETag header")
		}

		beforeOpens := len(fakeStorage.OpenedFilesSnapshot())
		rec304 := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, map[string]string{
			"If-None-Match": etag,
		})
		if rec304.Code != http.StatusNotModified {
			t.Fatalf("expected 304 Not Modified, got %d", rec304.Code)
		}
		if rec304.Body.Len() != 0 {
			t.Fatalf("expected empty body on 304, got %d bytes", rec304.Body.Len())
		}
		if afterOpens := len(fakeStorage.OpenedFilesSnapshot()); afterOpens != beforeOpens {
			t.Fatalf("expected Drive OpenFile NOT called on 304, before=%d after=%d", beforeOpens, afterOpens)
		}
	})

	t.Run("draft invitation returns uniform 404", func(t *testing.T) {
		// invitationA2 is in draft status
		draftFileID := "drive-draft-a2"
		fakeStorage.SetFileContent(draftFileID, jpgBytes)
		draftMediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA2, nil,
			"google_drive", draftFileID, "image", "image/jpeg", "draft.jpg", int64(len(jpgBytes)), 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, draftMediaID)
		}()

		beforeOpens := len(fakeStorage.OpenedFilesSnapshot())
		rec := sendPublicStreamMediaRequest(engine, slugA2, strconv.FormatInt(draftMediaID, 10), nil)
		assertUniformPublicMediaNotFound(t, rec)
		if len(fakeStorage.OpenedFilesSnapshot()) != beforeOpens {
			t.Fatalf("expected Drive not called for draft invitation")
		}
	})

	t.Run("expired invitation status or expired_at in the past returns uniform 404", func(t *testing.T) {
		defer func() {
			_, _ = pool.Exec(ctx, `
				UPDATE invitations
				SET status = 'published', expired_at = NULL
				WHERE id = $1
			`, fixture.invitationA1)
		}()

		// Case 1: status = 'expired'
		_, _ = pool.Exec(ctx, `UPDATE invitations SET status = 'expired' WHERE id = $1`, fixture.invitationA1)
		rec1 := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, rec1)

		// Case 2: status = 'published' but expired_at < CURRENT_TIMESTAMP
		_, _ = pool.Exec(ctx, `
			UPDATE invitations
			SET status = 'published', expired_at = CURRENT_TIMESTAMP - INTERVAL '1 hour'
			WHERE id = $1
		`, fixture.invitationA1)
		rec2 := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, rec2)
	})

	t.Run("non-existent slug and invalid media_id return uniform 404", func(t *testing.T) {
		recMissingSlug := sendPublicStreamMediaRequest(engine, "non-existent-slug-999999", imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, recMissingSlug)

		for _, badMediaID := range []string{"0", "-5", "abc", "999999999"} {
			rec := sendPublicStreamMediaRequest(engine, slugA1, badMediaID, nil)
			assertUniformPublicMediaNotFound(t, rec)
		}
	})

	t.Run("media belonging to another invitation returns uniform 404", func(t *testing.T) {
		otherFileID := "drive-other-inv-b1"
		fakeStorage.SetFileContent(otherFileID, jpgBytes)
		otherMediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerB, fixture.versionB, nil,
			"google_drive", otherFileID, "image", "image/jpeg", "other.jpg", int64(len(jpgBytes)), 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, otherMediaID)
		}()

		// Request otherMediaID under slugA1 -> must be 404
		rec := sendPublicStreamMediaRequest(engine, slugA1, strconv.FormatInt(otherMediaID, 10), nil)
		assertUniformPublicMediaNotFound(t, rec)

		// Also request imgMediaID (from A1) under slugB1 -> must be 404
		rec2 := sendPublicStreamMediaRequest(engine, slugB1, imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, rec2)
	})

	t.Run("media from a new draft version on a published invitation returns uniform 404", func(t *testing.T) {
		var draftVer2ID int64
		if err := pool.QueryRow(ctx, `
			INSERT INTO invitation_versions (invitation_id, version_number, status)
			VALUES ($1, 2, 'draft')
			RETURNING id
		`, fixture.invitationA1).Scan(&draftVer2ID); err != nil {
			t.Fatalf("insert draft v2: %v", err)
		}
		unpubFileID := "drive-unpublished-v2"
		fakeStorage.SetFileContent(unpubFileID, jpgBytes)
		unpubMediaID, _ := insertTestMediaRecord(
			t, pool, fixture.partnerA, draftVer2ID, nil,
			"google_drive", unpubFileID, "image", "image/jpeg", "unpub-v2.jpg", int64(len(jpgBytes)), 0,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, unpubMediaID)
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_versions WHERE id = $1`, draftVer2ID)
		}()

		rec := sendPublicStreamMediaRequest(engine, slugA1, strconv.FormatInt(unpubMediaID, 10), nil)
		assertUniformPublicMediaNotFound(t, rec)
	})

	t.Run("soft-deleted media returns uniform 404", func(t *testing.T) {
		softFileID := "drive-soft-deleted-public"
		fakeStorage.SetFileContent(softFileID, jpgBytes)
		softMediaID, softSFID := insertTestMediaRecord(
			t, pool, fixture.partnerA, fixture.versionA1, nil,
			"google_drive", softFileID, "image", "image/jpeg", "soft.jpg", int64(len(jpgBytes)), 2,
		)
		defer func() {
			_, _ = pool.Exec(ctx, `DELETE FROM invitation_media WHERE id = $1`, softMediaID)
		}()
		_, _ = pool.Exec(ctx, `UPDATE storage_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, softSFID)

		rec := sendPublicStreamMediaRequest(engine, slugA1, strconv.FormatInt(softMediaID, 10), nil)
		assertUniformPublicMediaNotFound(t, rec)
	})

	t.Run("Range requests: valid single range 206, out of bounds or malformed 416, multi-range 200 full", func(t *testing.T) {
		// 1. Valid closed range bytes=0-9
		rec206 := sendPublicStreamMediaRequest(engine, slugA1, audMediaIDStr, map[string]string{
			"Range": "bytes=0-9",
		})
		if rec206.Code != http.StatusPartialContent {
			t.Fatalf("expected 206 Partial Content, got %d: %s", rec206.Code, rec206.Body.String())
		}
		if !bytes.Equal(rec206.Body.Bytes(), mp3Bytes[:10]) {
			t.Fatalf("expected first 10 bytes of mp3, got %v", rec206.Body.Bytes())
		}
		expectedCR := "bytes 0-9/" + strconv.Itoa(len(mp3Bytes))
		if cr := rec206.Header().Get("Content-Range"); cr != expectedCR {
			t.Fatalf("expected Content-Range=%q, got %q", expectedCR, cr)
		}
		if cl := rec206.Header().Get("Content-Length"); cl != "10" {
			t.Fatalf("expected Content-Length=10, got %q", cl)
		}

		// 2. Valid suffix range bytes=-4
		recSuffix := sendPublicStreamMediaRequest(engine, slugA1, audMediaIDStr, map[string]string{
			"Range": "bytes=-4",
		})
		if recSuffix.Code != http.StatusPartialContent {
			t.Fatalf("expected 206 on suffix range, got %d", recSuffix.Code)
		}
		if !bytes.Equal(recSuffix.Body.Bytes(), mp3Bytes[len(mp3Bytes)-4:]) {
			t.Fatalf("unexpected suffix bytes")
		}

		// 3. Out of bounds range (start >= size) -> 416 without calling Drive
		beforeOpens := len(fakeStorage.OpenedFilesSnapshot())
		for _, invalidRange := range []string{
			"bytes=999999-1000000",
			"bytes=999999-",
			"bytes=20-10",
			"bytes=-0",
			"bytes=abc-def",
			"items=0-5",
		} {
			rec416 := sendPublicStreamMediaRequest(engine, slugA1, audMediaIDStr, map[string]string{
				"Range": invalidRange,
			})
			if rec416.Code != http.StatusRequestedRangeNotSatisfiable {
				t.Fatalf("range %q: expected 416, got %d", invalidRange, rec416.Code)
			}
			expectedStarCR := "bytes */" + strconv.Itoa(len(mp3Bytes))
			if cr := rec416.Header().Get("Content-Range"); cr != expectedStarCR {
				t.Fatalf("range %q: expected Content-Range=%q, got %q", invalidRange, expectedStarCR, cr)
			}
		}
		if afterOpens := len(fakeStorage.OpenedFilesSnapshot()); afterOpens != beforeOpens {
			t.Fatalf("expected Drive NOT called on pre-validated 416 ranges, before=%d after=%d", beforeOpens, afterOpens)
		}

		// 4. Multi-range (contains comma) -> ignored per RFC 9110, returns 200 full
		recMulti := sendPublicStreamMediaRequest(engine, slugA1, audMediaIDStr, map[string]string{
			"Range": "bytes=0-3, 8-11",
		})
		if recMulti.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on multi-range, got %d", recMulti.Code)
		}
		if !bytes.Equal(recMulti.Body.Bytes(), mp3Bytes) {
			t.Fatalf("expected full body on multi-range 200 OK")
		}
	})

	t.Run("revoked or missing credentials return uniform 404 without leaking details", func(t *testing.T) {
		defer func() {
			fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
		}()

		// Revoked credentials
		fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "revoked", &folderID)
		recRevoked := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, recRevoked)

		// Missing credentials
		_, _ = pool.Exec(ctx, `DELETE FROM user_drive_credentials WHERE user_id = $1`, fixture.partnerA)
		recMissing := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, recMissing)
	})

	t.Run("invalid_grant marks credentials revoked and returns uniform 404", func(t *testing.T) {
		fakeStorage.OpenErr = drive.ErrTokenRevoked
		defer func() {
			fakeStorage.OpenErr = nil
			fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
		}()

		rec := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, rec)

		var status string
		if err := pool.QueryRow(ctx, `SELECT status FROM user_drive_credentials WHERE user_id = $1`, fixture.partnerA).Scan(&status); err != nil {
			t.Fatalf("query cred status: %v", err)
		}
		if status != "revoked" {
			t.Fatalf("expected credentials status='revoked', got %q", status)
		}
	})

	t.Run("Drive 404 returns uniform 404 and Drive 5xx returns 500 without leaking internals", func(t *testing.T) {
		defer func() {
			fakeStorage.OpenErr = nil
		}()

		fakeStorage.OpenErr = drive.ErrFileNotFound
		rec404 := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		assertUniformPublicMediaNotFound(t, rec404)

		fakeStorage.OpenErr = errors.New("google drive upstream 503 internal details")
		rec500 := sendPublicStreamMediaRequest(engine, slugA1, imgMediaIDStr, nil)
		if rec500.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500 on Drive 5xx, got %d: %s", rec500.Code, rec500.Body.String())
		}
		if strings.Contains(rec500.Body.String(), "503") || strings.Contains(rec500.Body.String(), imgDriveID) {
			t.Fatalf("500 response leaked upstream details: %s", rec500.Body.String())
		}
	})
}

func TestStreamOwnerInvitationMedia(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)

	folderID := "folder-owner-stream"
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerB, "refresh-partner-b", "connected", &folderID)

	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	partnerAToken := templateFavoritesToken(t, fixture.partnerA)
	partnerBToken := templateFavoritesToken(t, fixture.partnerB)
	designerToken := templateFavoritesToken(t, fixture.designerUser)
	adminToken := templateFavoritesToken(t, fixture.adminUser)

	invA1Str := strconv.FormatInt(fixture.invitationA1, 10)
	invB1Str := strconv.FormatInt(fixture.invitationB, 10)

	jpgBytes := validTestJPEGBytes(t, 20, 20)
	ownerFileID := "drive-owner-draft-img"
	fakeStorage.SetFileContent(ownerFileID, jpgBytes)

	mediaID, sfID := insertTestMediaRecord(
		t, pool, fixture.partnerA, fixture.versionA1, &fixture.sectionA,
		"google_drive", ownerFileID, "image", "image/png", "preview-banner.png", int64(len(jpgBytes)), 0,
	)
	mediaIDStr := strconv.FormatInt(mediaID, 10)

	t.Run("unauthenticated returns 401 and non-partner roles return 403", func(t *testing.T) {
		rec401 := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, "", nil)
		if rec401.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rec401.Code)
		}

		for _, tok := range []string{designerToken, adminToken} {
			rec403 := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, tok, nil)
			if rec403.Code != http.StatusForbidden {
				t.Fatalf("expected 403 for non-partner, got %d", rec403.Code)
			}
		}
	})

	t.Run("invalid invitation id and media id return 400", func(t *testing.T) {
		for _, badID := range []string{"0", "-5", "abc"} {
			rec := sendOwnerStreamMediaRequest(engine, badID, mediaIDStr, partnerAToken, nil)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("bad invitation id %q: expected 400, got %d", badID, rec.Code)
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["id"] != "invalid_invitation_id" {
				t.Fatalf("expected errors.id=invalid_invitation_id, got %+v", body.Errors)
			}
		}

		for _, badMediaID := range []string{"0", "-5", "abc"} {
			rec := sendOwnerStreamMediaRequest(engine, invA1Str, badMediaID, partnerAToken, nil)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("bad media_id %q: expected 400, got %d", badMediaID, rec.Code)
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["media_id"] != "invalid_media_id" {
				t.Fatalf("expected errors.media_id=invalid_media_id, got %+v", body.Errors)
			}
		}
	})

	t.Run("owner streams draft media 200 with Cache-Control private, no-store, supports Range 206, and works when addon is expired", func(t *testing.T) {
		// Expire addon entitlement to prove GET content does not require active addon
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA1, "expired", "'-2 days'")

		rec := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken, nil)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for owner draft media, got %d: %s", rec.Code, rec.Body.String())
		}
		if !bytes.Equal(rec.Body.Bytes(), jpgBytes) {
			t.Fatalf("expected exact media bytes")
		}
		if cc := rec.Header().Get("Cache-Control"); cc != "private, no-store" {
			t.Fatalf("expected Cache-Control='private, no-store', got %q", cc)
		}
		if ct := rec.Header().Get("Content-Type"); ct != "image/png" {
			t.Fatalf("expected Content-Type=image/png, got %q", ct)
		}
		if nosniff := rec.Header().Get("X-Content-Type-Options"); nosniff != "nosniff" {
			t.Fatalf("expected X-Content-Type-Options=nosniff, got %q", nosniff)
		}

		// Range 206
		rec206 := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken, map[string]string{
			"Range": "bytes=0-7",
		})
		if rec206.Code != http.StatusPartialContent {
			t.Fatalf("expected 206 Partial Content for owner range, got %d", rec206.Code)
		}
		if !bytes.Equal(rec206.Body.Bytes(), jpgBytes[:8]) {
			t.Fatalf("expected first 8 bytes on owner Range")
		}
	})

	t.Run("non-owner returns 404 Invitation not found and missing or soft-deleted media returns 404 Media not found", func(t *testing.T) {
		ctx := context.Background()
		beforeOpens := len(fakeStorage.OpenedFilesSnapshot())

		// Partner B trying to access Partner A's invitation
		recNonOwner := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, partnerBToken, nil)
		if recNonOwner.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for non-owner, got %d", recNonOwner.Code)
		}
		var errBody struct {
			Message string `json:"message"`
		}
		_ = json.Unmarshal(recNonOwner.Body.Bytes(), &errBody)
		if errBody.Message != "Invitation not found" {
			t.Fatalf("expected 'Invitation not found', got %q", errBody.Message)
		}
		if len(fakeStorage.OpenedFilesSnapshot()) != beforeOpens {
			t.Fatalf("expected Drive not called for non-owner")
		}

		// Partner B accessing their own invitationB, but with Partner A's mediaID
		recWrongInv := sendOwnerStreamMediaRequest(engine, invB1Str, mediaIDStr, partnerBToken, nil)
		if recWrongInv.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for media of another invitation, got %d", recWrongInv.Code)
		}
		_ = json.Unmarshal(recWrongInv.Body.Bytes(), &errBody)
		if errBody.Message != "Media not found" {
			t.Fatalf("expected 'Media not found', got %q", errBody.Message)
		}

		// Soft-delete storage_files -> returns 404 "Media not found"
		_, _ = pool.Exec(ctx, `UPDATE storage_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, sfID)
		defer func() {
			_, _ = pool.Exec(ctx, `UPDATE storage_files SET deleted_at = NULL WHERE id = $1`, sfID)
		}()
		recSoftDel := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken, nil)
		if recSoftDel.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for soft-deleted media, got %d", recSoftDel.Code)
		}
		_ = json.Unmarshal(recSoftDel.Body.Bytes(), &errBody)
		if errBody.Message != "Media not found" {
			t.Fatalf("expected 'Media not found', got %q", errBody.Message)
		}
	})

	t.Run("revoked or missing credentials return 409 and invalid_grant marks credentials revoked", func(t *testing.T) {
		ctx := context.Background()
		defer func() {
			fakeStorage.OpenErr = nil
			fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
		}()

		// 1. Credentials status = 'revoked' in DB -> 409 drive_revoked
		fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "revoked", &folderID)
		recRev := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken, nil)
		if recRev.Code != http.StatusConflict {
			t.Fatalf("expected 409 when credentials revoked, got %d: %s", recRev.Code, recRev.Body.String())
		}
		var errBody struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(recRev.Body.Bytes(), &errBody)
		if errBody.Errors["drive"] != "drive_revoked" {
			t.Fatalf("expected errors.drive=drive_revoked, got %+v", errBody.Errors)
		}

		// 2. Missing credentials row -> 409 drive_not_connected
		_, _ = pool.Exec(ctx, `DELETE FROM user_drive_credentials WHERE user_id = $1`, fixture.partnerA)
		recMissing := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken, nil)
		if recMissing.Code != http.StatusConflict {
			t.Fatalf("expected 409 when credentials missing, got %d: %s", recMissing.Code, recMissing.Body.String())
		}
		_ = json.Unmarshal(recMissing.Body.Bytes(), &errBody)
		if errBody.Errors["drive"] != "drive_not_connected" {
			t.Fatalf("expected errors.drive=drive_not_connected, got %+v", errBody.Errors)
		}

		// 3. Connected in DB, but Google returns invalid_grant -> 409 drive_revoked and updates DB status to 'revoked'
		fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "refresh-partner-a", "connected", &folderID)
		fakeStorage.OpenErr = drive.ErrTokenRevoked
		recInvalidGrant := sendOwnerStreamMediaRequest(engine, invA1Str, mediaIDStr, partnerAToken, nil)
		if recInvalidGrant.Code != http.StatusConflict {
			t.Fatalf("expected 409 on invalid_grant, got %d: %s", recInvalidGrant.Code, recInvalidGrant.Body.String())
		}
		_ = json.Unmarshal(recInvalidGrant.Body.Bytes(), &errBody)
		if errBody.Errors["drive"] != "drive_revoked" {
			t.Fatalf("expected errors.drive=drive_revoked, got %+v", errBody.Errors)
		}

		var dbStatus string
		if err := pool.QueryRow(ctx, `SELECT status FROM user_drive_credentials WHERE user_id = $1`, fixture.partnerA).Scan(&dbStatus); err != nil {
			t.Fatalf("query cred status: %v", err)
		}
		if dbStatus != "revoked" {
			t.Fatalf("expected DB status='revoked', got %q", dbStatus)
		}
	})
}

func TestGoogleStorage_OpenFile(t *testing.T) {
	ctx := context.Background()
	fullPayload := []byte("0123456789abcdefghijklmnopqrstuvwxyz")

	var (
		mode            string
		lastAuthHeader  string
		lastRangeHeader string
		lastAltQuery    string
	)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/token":
			if mode == "invalid_grant" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				_, _ = io.WriteString(w, `{"error":"invalid_grant","error_description":"Token has been expired or revoked."}`)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			_, _ = io.WriteString(w, `{"access_token":"stream-access-token-123","token_type":"Bearer","expires_in":3600}`)

		case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/drive/v3/files/"):
			lastAuthHeader = r.Header.Get("Authorization")
			lastRangeHeader = r.Header.Get("Range")
			lastAltQuery = r.URL.Query().Get("alt")

			switch mode {
			case "not_found":
				w.WriteHeader(http.StatusNotFound)
				_, _ = io.WriteString(w, `{"error":{"code":404,"message":"File not found"}}`)
			case "range_416":
				w.WriteHeader(http.StatusRequestedRangeNotSatisfiable)
			case "slow_stream":
				w.Header().Set("Content-Type", "audio/mpeg")
				w.Header().Set("Content-Length", strconv.Itoa(len(fullPayload)))
				w.WriteHeader(http.StatusOK)
				if flusher, ok := w.(http.Flusher); ok {
					flusher.Flush()
				}
				// Sleep longer than HTTPClient.Timeout (30ms) after headers are sent
				time.Sleep(80 * time.Millisecond)
				_, _ = w.Write(fullPayload)
			default:
				if lastRangeHeader == "bytes=0-9" {
					w.Header().Set("Content-Range", "bytes 0-9/36")
					w.Header().Set("Content-Length", "10")
					w.WriteHeader(http.StatusPartialContent)
					_, _ = w.Write(fullPayload[:10])
					return
				}
				w.Header().Set("Content-Length", strconv.Itoa(len(fullPayload)))
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(fullPayload)
			}
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer srv.Close()

	storage := drive.NewGoogleStorage("client-id", "client-secret")
	// Set a tiny total Timeout (30ms) on HTTPClient to prove OpenFile streaming is NOT cut off by HTTPClient.Timeout!
	storage.HTTPClient = &http.Client{
		Timeout:   30 * time.Millisecond,
		Transport: rewriteHostTransport{base: srv.Client().Transport, targetURL: srv.URL},
	}

	// 1. 200 OK full download with Bearer header and alt=media
	mode = "ok"
	stream, err := storage.OpenFile(ctx, "refresh-tok", "drive-file-1", "")
	if err != nil {
		t.Fatalf("OpenFile 200 failed: %v", err)
	}
	gotBytes, err := io.ReadAll(stream.Body)
	_ = stream.Body.Close()
	if err != nil || !bytes.Equal(gotBytes, fullPayload) {
		t.Fatalf("unexpected body: err=%v got=%q", err, string(gotBytes))
	}
	if lastAuthHeader != "Bearer stream-access-token-123" || lastAltQuery != "media" {
		t.Fatalf("expected Bearer auth and alt=media, got auth=%q alt=%q", lastAuthHeader, lastAltQuery)
	}

	// 2. 206 Partial Content with Range header forwarded
	stream206, err := storage.OpenFile(ctx, "refresh-tok", "drive-file-1", "bytes=0-9")
	if err != nil {
		t.Fatalf("OpenFile 206 failed: %v", err)
	}
	got206, _ := io.ReadAll(stream206.Body)
	_ = stream206.Body.Close()
	if stream206.StatusCode != http.StatusPartialContent || stream206.ContentRange != "bytes 0-9/36" || !bytes.Equal(got206, fullPayload[:10]) {
		t.Fatalf("unexpected 206 response: status=%d range=%q body=%q", stream206.StatusCode, stream206.ContentRange, string(got206))
	}

	// 3. 404 -> ErrFileNotFound
	mode = "not_found"
	if _, err := storage.OpenFile(ctx, "refresh-tok", "missing-id", ""); !errors.Is(err, drive.ErrFileNotFound) {
		t.Fatalf("expected ErrFileNotFound on 404, got %v", err)
	}

	// 4. 416 -> ErrRangeNotSatisfiable
	mode = "range_416"
	if _, err := storage.OpenFile(ctx, "refresh-tok", "drive-file-1", "bytes=999-1000"); !errors.Is(err, drive.ErrRangeNotSatisfiable) {
		t.Fatalf("expected ErrRangeNotSatisfiable on 416, got %v", err)
	}

	// 5. invalid_grant -> ErrTokenRevoked
	mode = "invalid_grant"
	if _, err := storage.OpenFile(ctx, "revoked-tok", "drive-file-1", ""); !errors.Is(err, drive.ErrTokenRevoked) {
		t.Fatalf("expected ErrTokenRevoked on invalid_grant, got %v", err)
	}

	// 6. Slow stream (80ms > HTTPClient.Timeout 30ms) succeeds completely without being cut off
	mode = "slow_stream"
	slowStream, err := storage.OpenFile(ctx, "refresh-tok", "drive-file-1", "")
	if err != nil {
		t.Fatalf("OpenFile slow_stream failed: %v", err)
	}
	slowBytes, err := io.ReadAll(slowStream.Body)
	_ = slowStream.Body.Close()
	if err != nil || !bytes.Equal(slowBytes, fullPayload) {
		t.Fatalf("expected slow stream not cut off by HTTPClient.Timeout, got err=%v len=%d", err, len(slowBytes))
	}
}
