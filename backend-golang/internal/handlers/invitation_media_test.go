package handlers_test

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"hash/crc32"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"backend-golang/internal/crypto"
	"backend-golang/internal/drive"
	"backend-golang/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type mediaTestFixture struct {
	marker            string
	partnerA          int64
	partnerB          int64
	designerUser      int64
	adminUser         int64
	categoryID        int64
	templateA         int64
	templateB         int64
	sectionA          int64
	sectionB          int64
	invitationA1      int64
	versionA1         int64
	invitationA2      int64
	versionA2         int64
	invitationB       int64
	versionB          int64
	packageID         int64
	driveAddonID      int64
	createdDriveAddon bool
	orderSeq          int64
}

func createMediaTestFixture(t *testing.T, pool *pgxpool.Pool) *mediaTestFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate media fixture marker: %v", err)
	}
	marker := "media-" + hex.EncodeToString(randomBytes)
	f := &mediaTestFixture{marker: marker}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{
			f.partnerA,
			f.partnerB,
			f.designerUser,
			f.adminUser,
		}
		invitationIDs := []int64{
			f.invitationA1,
			f.invitationA2,
			f.invitationB,
		}
		versionIDs := []int64{
			f.versionA1,
			f.versionA2,
			f.versionB,
		}

		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM invitation_media WHERE invitation_version_id = ANY($1)`,
			versionIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM storage_files WHERE uploaded_by = ANY($1)`,
			userIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM invitation_addon_entitlements WHERE invitation_id = ANY($1)`,
			invitationIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM partner_packages WHERE user_id = ANY($1)`,
			userIDs,
		)
		if f.packageID > 0 {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM package_limits WHERE package_id = $1`, f.packageID)
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM packages WHERE id = $1`, f.packageID)
		}
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM order_items WHERE order_id IN (
				SELECT id FROM orders WHERE user_id = ANY($1)
			)`,
			userIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM orders WHERE user_id = ANY($1)`,
			userIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM invitations WHERE id = ANY($1)`,
			invitationIDs,
		)
		if f.templateA > 0 || f.templateB > 0 {
			_, _ = pool.Exec(
				cleanupCtx,
				`DELETE FROM templates WHERE id = ANY($1)`,
				[]int64{f.templateA, f.templateB},
			)
		}
		if f.categoryID > 0 {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM template_categories WHERE id = $1`, f.categoryID)
		}
		if f.createdDriveAddon && f.driveAddonID > 0 {
			_, _ = pool.Exec(
				cleanupCtx,
				`DELETE FROM addons
				 WHERE id = $1
				   AND NOT EXISTS (SELECT 1 FROM invitation_addon_entitlements WHERE addon_id = $1)
				   AND NOT EXISTS (SELECT 1 FROM invitation_version_addons WHERE addon_id = $1)`,
				f.driveAddonID,
			)
		}
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM user_drive_credentials WHERE user_id = ANY($1)`,
			userIDs,
		)
		_, _ = pool.Exec(
			cleanupCtx,
			`DELETE FROM users WHERE id = ANY($1)`,
			userIDs,
		)
	})

	ctx := context.Background()
	insertUser := func(name, email, role string) int64 {
		var uid int64
		if err := pool.QueryRow(
			ctx,
			`INSERT INTO users (name, email, role, status)
			 VALUES ($1, $2, $3, 'active')
			 RETURNING id`,
			marker+" "+name,
			marker+"-"+email,
			role,
		).Scan(&uid); err != nil {
			t.Fatalf("insert user %s: %v", name, err)
		}
		return uid
	}

	f.partnerA = insertUser("Partner A", "partner-a@example.test", "partner")
	f.partnerB = insertUser("Partner B", "partner-b@example.test", "partner")
	f.designerUser = insertUser("Designer", "designer@example.test", "designer")
	f.adminUser = insertUser("Admin", "admin@example.test", "admin")

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO template_categories (name, slug, description)
		 VALUES ($1, $2, 'Media test category')
		 RETURNING id`,
		marker+" Category",
		marker+"-cat",
	).Scan(&f.categoryID); err != nil {
		t.Fatalf("insert category: %v", err)
	}

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		 VALUES ($1, $2, $3, $4, 'Template A', 100000, 'publish')
		 RETURNING id`,
		f.categoryID,
		f.designerUser,
		marker+" Template A",
		marker+"-tmpl-a",
	).Scan(&f.templateA); err != nil {
		t.Fatalf("insert template A: %v", err)
	}

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO templates (category_id, designer_id, name, slug, description, price, status)
		 VALUES ($1, $2, $3, $4, 'Template B', 100000, 'publish')
		 RETURNING id`,
		f.categoryID,
		f.designerUser,
		marker+" Template B",
		marker+"-tmpl-b",
	).Scan(&f.templateB); err != nil {
		t.Fatalf("insert template B: %v", err)
	}

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable)
		 VALUES ($1, 'Gallery A', 'gallery', 1, false, true)
		 RETURNING id`,
		f.templateA,
	).Scan(&f.sectionA); err != nil {
		t.Fatalf("insert section A: %v", err)
	}

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable)
		 VALUES ($1, 'Gallery B', 'gallery', 1, false, true)
		 RETURNING id`,
		f.templateB,
	).Scan(&f.sectionB); err != nil {
		t.Fatalf("insert section B: %v", err)
	}

	insertInvitationWithVersion := func(userID, tmplID int64, slugSuffix string) (int64, int64) {
		var invID, verID int64
		if err := pool.QueryRow(
			ctx,
			`INSERT INTO invitations (user_id, template_id, title, slug, status)
			 VALUES ($1, $2, $3, $4, 'draft')
			 RETURNING id`,
			userID,
			tmplID,
			marker+" "+slugSuffix,
			marker+"-"+slugSuffix,
		).Scan(&invID); err != nil {
			t.Fatalf("insert invitation %s: %v", slugSuffix, err)
		}
		if err := pool.QueryRow(
			ctx,
			`INSERT INTO invitation_versions (invitation_id, version_number, status)
			 VALUES ($1, 1, 'draft')
			 RETURNING id`,
			invID,
		).Scan(&verID); err != nil {
			t.Fatalf("insert invitation version %s: %v", slugSuffix, err)
		}
		return invID, verID
	}

	f.invitationA1, f.versionA1 = insertInvitationWithVersion(f.partnerA, f.templateA, "inv-a1")
	f.invitationA2, f.versionA2 = insertInvitationWithVersion(f.partnerA, f.templateA, "inv-a2")
	f.invitationB, f.versionB = insertInvitationWithVersion(f.partnerB, f.templateA, "inv-b")

	if err := pool.QueryRow(
		ctx,
		`INSERT INTO packages (name, description, price, invitation_quota, duration_months, status)
		 VALUES ($1, 'Media Test Package', 150000, 5, 6, 'active')
		 RETURNING id`,
		marker+" Package",
	).Scan(&f.packageID); err != nil {
		t.Fatalf("insert package: %v", err)
	}

	if _, err := pool.Exec(
		ctx,
		`INSERT INTO partner_packages (
			user_id, package_id, invitation_quota, invitation_used, started_at, expired_at, status
		 )
		 VALUES (
			$1, $2, 5, 0,
			CURRENT_TIMESTAMP - INTERVAL '1 day',
			CURRENT_TIMESTAMP + INTERVAL '30 days',
			'active'
		 )`,
		f.partnerA,
		f.packageID,
	); err != nil {
		t.Fatalf("insert partner_packages: %v", err)
	}

	err := pool.QueryRow(
		ctx,
		`SELECT id FROM addons WHERE slug = $1`,
		handlers.GoogleDriveAddonSlug,
	).Scan(&f.driveAddonID)
	if errors.Is(err, pgx.ErrNoRows) {
		err = pool.QueryRow(
			ctx,
			`INSERT INTO addons (name, slug, description, addon_type, price, billing_type, status, sort_order)
			 VALUES ('Google Drive Connect', $1, 'Media test addon', 'storage', 50000, 'one_time', 'active', 0)
			 ON CONFLICT (slug) DO NOTHING
			 RETURNING id`,
			handlers.GoogleDriveAddonSlug,
		).Scan(&f.driveAddonID)
		if err == nil {
			f.createdDriveAddon = true
		} else if errors.Is(err, pgx.ErrNoRows) {
			err = pool.QueryRow(
				ctx,
				`SELECT id FROM addons WHERE slug = $1`,
				handlers.GoogleDriveAddonSlug,
			).Scan(&f.driveAddonID)
		}
	}
	if err != nil {
		t.Fatalf("resolve google-drive-connect addon: %v", err)
	}

	return f
}

func (f *mediaTestFixture) insertEntitlement(
	t *testing.T,
	pool *pgxpool.Pool,
	userID int64,
	invitationID int64,
	status string,
	intervalExpr string,
) int64 {
	t.Helper()
	ctx := context.Background()
	seq := atomic.AddInt64(&f.orderSeq, 1)
	orderNum := fmt.Sprintf("ORD-%s-%d", strings.ToUpper(f.marker), seq)

	var orderID int64
	if err := pool.QueryRow(
		ctx,
		`INSERT INTO orders (user_id, order_number, subtotal, discount, total, status)
		 VALUES ($1, $2, 50000, 0, 50000, 'paid')
		 RETURNING id`,
		userID,
		orderNum,
	).Scan(&orderID); err != nil {
		t.Fatalf("insert order: %v", err)
	}

	var orderItemID int64
	if err := pool.QueryRow(
		ctx,
		`INSERT INTO order_items (
			order_id, item_type, item_reference_id, item_name, quantity, unit_price, subtotal, invitation_id
		 )
		 VALUES ($1, 'addon', $2, 'Google Drive Connect', 1, 50000, 50000, $3)
		 RETURNING id`,
		orderID,
		f.driveAddonID,
		invitationID,
	).Scan(&orderItemID); err != nil {
		t.Fatalf("insert order_item: %v", err)
	}

	var entitlementID int64
	if intervalExpr == "" {
		err := pool.QueryRow(
			ctx,
			`INSERT INTO invitation_addon_entitlements (invitation_id, addon_id, order_item_id, status, expires_at)
			 VALUES ($1, $2, $3, $4, NULL)
			 RETURNING id`,
			invitationID,
			f.driveAddonID,
			orderItemID,
			status,
		).Scan(&entitlementID)
		if err != nil {
			t.Fatalf("insert entitlement (NULL expires_at): %v", err)
		}
		return entitlementID
	}

	query := fmt.Sprintf(
		`INSERT INTO invitation_addon_entitlements (invitation_id, addon_id, order_item_id, status, expires_at)
		 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + (%s))
		 RETURNING id`,
		intervalExpr,
	)
	if err := pool.QueryRow(
		ctx,
		query,
		invitationID,
		f.driveAddonID,
		orderItemID,
		status,
	).Scan(&entitlementID); err != nil {
		t.Fatalf("insert entitlement (%s): %v", intervalExpr, err)
	}
	return entitlementID
}

func (f *mediaTestFixture) insertDriveCredentials(
	t *testing.T,
	pool *pgxpool.Pool,
	key []byte,
	userID int64,
	refreshToken string,
	status string,
	folderID *string,
) {
	t.Helper()
	enc, err := crypto.Encrypt(key, []byte(refreshToken))
	if err != nil {
		t.Fatalf("encrypt refresh token: %v", err)
	}

	_, err = pool.Exec(
		context.Background(),
		`INSERT INTO user_drive_credentials (
			user_id, google_sub, google_email, encrypted_refresh_token, scopes, drive_folder_id, status
		 )
		 VALUES ($1, 'sub-media-test', 'partner@example.test', $2, $3, $4, $5)
		 ON CONFLICT (user_id) DO UPDATE SET
			encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
			drive_folder_id = EXCLUDED.drive_folder_id,
			status = EXCLUDED.status,
			updated_at = CURRENT_TIMESTAMP`,
		userID,
		enc,
		drive.DefaultScopesString(),
		folderID,
		status,
	)
	if err != nil {
		t.Fatalf("insert user_drive_credentials: %v", err)
	}
}

func validTestJPEGBytes(t *testing.T, w, h int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			img.Set(x, y, color.RGBA{R: 120, G: 160, B: 200, A: 255})
		}
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80}); err != nil {
		t.Fatalf("encode test jpeg: %v", err)
	}
	return buf.Bytes()
}

func validTestPNGBytes(t *testing.T, w, h int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	img.Set(0, 0, color.RGBA{R: 255, G: 100, B: 50, A: 255})
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("encode test png: %v", err)
	}
	return buf.Bytes()
}

// oversizedDimensionPNGHeader builds a valid PNG signature + IHDR chunk reporting width x height
// so image.DecodeConfig reads dimensions > 6000px without allocating a huge bitmap.
func oversizedDimensionPNGHeader(width, height uint32) []byte {
	var buf bytes.Buffer
	// PNG 8-byte signature
	buf.Write([]byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'})

	// IHDR chunk length = 13
	_ = binary.Write(&buf, binary.BigEndian, uint32(13))

	var chunk bytes.Buffer
	chunk.WriteString("IHDR")
	_ = binary.Write(&chunk, binary.BigEndian, width)
	_ = binary.Write(&chunk, binary.BigEndian, height)
	chunk.Write([]byte{
		8, // bit depth
		2, // color type: truecolor
		0, // compression
		0, // filter
		0, // interlace
	})

	buf.Write(chunk.Bytes())
	crc := crc32.ChecksumIEEE(chunk.Bytes())
	_ = binary.Write(&buf, binary.BigEndian, crc)
	return buf.Bytes()
}

func validID3MP3Bytes() []byte {
	// ID3v2.3 header ("ID3" + version 03 00 + flags 00 + synchsafe size 00 00 00 00) + MPEG-1 Layer III frame
	buf := make([]byte, 64)
	copy(buf, []byte{'I', 'D', '3', 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00})
	copy(buf[10:], []byte{0xFF, 0xFB, 0x90, 0x64})
	return buf
}

func validRawFrameSyncMP3Bytes() []byte {
	// Real MPEG-1 Layer III 128kbps 44.1kHz Joint Stereo frame header (0xFF 0xFB 0x90 0x64)
	// followed by Layer III side-information zero bytes (main_data_begin = 0) and audio data.
	buf := make([]byte, 64)
	buf[0] = 0xFF
	buf[1] = 0xFB
	buf[2] = 0x90
	buf[3] = 0x64
	// bytes 4..35 are 0x00 (side info), bytes 36..63 are non-zero audio payload
	for i := 36; i < len(buf); i++ {
		buf[i] = 0x55
	}
	return buf
}

func sendMultipartMediaRequest(
	t *testing.T,
	engine *gin.Engine,
	invitationIDStr string,
	token string,
	fields map[string]string,
	includeFilePart bool,
	fileName string,
	fileContent []byte,
) *httptest.ResponseRecorder {
	t.Helper()

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)

	for k, v := range fields {
		if err := mw.WriteField(k, v); err != nil {
			t.Fatalf("write multipart field %s: %v", k, err)
		}
	}

	if includeFilePart {
		part, err := mw.CreateFormFile("file", fileName)
		if err != nil {
			t.Fatalf("create form file: %v", err)
		}
		if len(fileContent) > 0 {
			if _, err := part.Write(fileContent); err != nil {
				t.Fatalf("write form file content: %v", err)
			}
		}
	}

	if err := mw.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/invitations/"+invitationIDStr+"/media",
		&body,
	)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func TestUploadInvitationMedia_AuthAndGates(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)
	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	jpgBytes := validTestJPEGBytes(t, 40, 40)
	invIDStr := strconv.FormatInt(fixture.invitationA1, 10)
	partnerAToken := templateFavoritesToken(t, fixture.partnerA)

	t.Run("unauthenticated request returns 401", func(t *testing.T) {
		rec := sendMultipartMediaRequest(t, engine, invIDStr, "", nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("non-partner roles return 403", func(t *testing.T) {
		for _, uid := range []int64{fixture.designerUser, fixture.adminUser} {
			tok := templateFavoritesToken(t, uid)
			rec := sendMultipartMediaRequest(t, engine, invIDStr, tok, nil, true, "photo.jpg", jpgBytes)
			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected 403 for user %d, got %d: %s", uid, rec.Code, rec.Body.String())
			}
		}
	})

	t.Run("invalid invitation id returns 400", func(t *testing.T) {
		for _, badID := range []string{"0", "-5", "abc"} {
			rec := sendMultipartMediaRequest(t, engine, badID, partnerAToken, nil, true, "photo.jpg", jpgBytes)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for id %q, got %d: %s", badID, rec.Code, rec.Body.String())
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["id"] != "invalid_invitation_id" {
				t.Fatalf("expected errors.id=invalid_invitation_id for id %q, got %+v", badID, body.Errors)
			}
		}
	})

	t.Run("non-owner returns 404 and does not call FakeStorage", func(t *testing.T) {
		invBStr := strconv.FormatInt(fixture.invitationB, 10)
		rec := sendMultipartMediaRequest(t, engine, invBStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
		if len(fakeStorage.UploadedFilesSnapshot()) != 0 {
			t.Fatalf("expected 0 FakeStorage uploads, got %d", len(fakeStorage.UploadedFilesSnapshot()))
		}
	})

	t.Run("non-draft invitation returns 409 invitation_is_not_draft", func(t *testing.T) {
		_, err := pool.Exec(
			context.Background(),
			`UPDATE invitations SET status = 'published' WHERE id = $1`,
			fixture.invitationA1,
		)
		if err != nil {
			t.Fatalf("set invitation published: %v", err)
		}
		defer func() {
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE invitations SET status = 'draft' WHERE id = $1`,
				fixture.invitationA1,
			)
		}()

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["status"] != "invitation_is_not_draft" {
			t.Fatalf("expected errors.status=invitation_is_not_draft, got %+v", body.Errors)
		}
	})

	t.Run("without addon on target invitation returns 403 even if partner has addon on another invitation", func(t *testing.T) {
		// Grant active entitlement on invitationA2, NOT on invitationA1
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA2, "active", "")

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["addon"] != "addon_required" {
			t.Fatalf("expected errors.addon=addon_required, got %+v", body.Errors)
		}
	})

	t.Run("expired or revoked addon on target invitation returns 403", func(t *testing.T) {
		entID := fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA1, "active", "- INTERVAL '2 hours'")
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 for expired addon, got %d: %s", rec.Code, rec.Body.String())
		}

		_, err := pool.Exec(
			context.Background(),
			`UPDATE invitation_addon_entitlements
			 SET status = 'revoked', expires_at = NULL
			 WHERE id = $1`,
			entID,
		)
		if err != nil {
			t.Fatalf("update entitlement to revoked: %v", err)
		}

		rec = sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 for revoked addon, got %d: %s", rec.Code, rec.Body.String())
		}

		_, _ = pool.Exec(context.Background(), `DELETE FROM invitation_addon_entitlements WHERE id = $1`, entID)
	})

	t.Run("drive not connected returns 409 drive_not_connected", func(t *testing.T) {
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA1, "active", "INTERVAL '7 days'")

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["drive"] != "drive_not_connected" {
			t.Fatalf("expected errors.drive=drive_not_connected, got %+v", body.Errors)
		}
	})

	t.Run("drive status revoked in DB returns 409 drive_revoked without calling Google", func(t *testing.T) {
		fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "ref-token-revoked", "revoked", nil)

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["drive"] != "drive_revoked" {
			t.Fatalf("expected errors.drive=drive_revoked, got %+v", body.Errors)
		}
		if len(fakeStorage.UploadedFilesSnapshot()) != 0 || len(fakeStorage.CreatedFoldersSnapshot()) != 0 {
			t.Fatalf("expected no Drive API calls when status is already revoked")
		}
	})

	t.Run("invalid_grant during upload returns 409 and updates DB status to revoked", func(t *testing.T) {
		folderID := "existing-folder-id"
		fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "ref-token-active", "connected", &folderID)
		fakeStorage.UploadErr = drive.ErrTokenRevoked
		defer func() {
			fakeStorage.UploadErr = nil
		}()

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["drive"] != "drive_revoked" {
			t.Fatalf("expected errors.drive=drive_revoked, got %+v", body.Errors)
		}

		var dbStatus string
		if err := pool.QueryRow(
			context.Background(),
			`SELECT status FROM user_drive_credentials WHERE user_id = $1`,
			fixture.partnerA,
		).Scan(&dbStatus); err != nil {
			t.Fatalf("query user_drive_credentials status: %v", err)
		}
		if dbStatus != "revoked" {
			t.Fatalf("expected DB status to become 'revoked', got %q", dbStatus)
		}
	})
}

func TestUploadInvitationMedia_Validation(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)
	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	folderID := "folder-val-1"
	fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA1, "active", "")
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "valid-refresh-token", "connected", &folderID)

	invIDStr := strconv.FormatInt(fixture.invitationA1, 10)
	partnerAToken := templateFavoritesToken(t, fixture.partnerA)
	jpgBytes := validTestJPEGBytes(t, 32, 32)

	t.Run("0 byte file returns 400", func(t *testing.T) {
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "empty.jpg", []byte{})
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["file"] != "file_required" {
			t.Fatalf("expected errors.file=file_required, got %+v", body.Errors)
		}
	})

	t.Run("extension .jpg with text content returns 400 unsupported_file_type", func(t *testing.T) {
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "fake.jpg", []byte("this is plain text not an image"))
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["file"] != "unsupported_file_type" {
			t.Fatalf("expected errors.file=unsupported_file_type, got %+v", body.Errors)
		}
	})

	t.Run("disallowed types (pdf, gif, mp4) return 400 unsupported_file_type", func(t *testing.T) {
		cases := []struct {
			name string
			data []byte
		}{
			{name: "doc.pdf", data: []byte("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n")},
			{name: "anim.gif", data: []byte("GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;")},
			{name: "video.mp4", data: []byte{0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'm', 'p', '4', '2', 0x00, 0x00, 0x00, 0x00, 'm', 'p', '4', '2', 'i', 's', 'o', 'm'}},
		}

		for _, tc := range cases {
			rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, tc.name, tc.data)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("%s: expected 400, got %d: %s", tc.name, rec.Code, rec.Body.String())
			}
			var body struct {
				Errors map[string]string `json:"errors"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &body)
			if body.Errors["file"] != "unsupported_file_type" {
				t.Fatalf("%s: expected errors.file=unsupported_file_type, got %+v", tc.name, body.Errors)
			}
		}
	})

	t.Run("file exceeding 10 MB returns 400 file_too_large and FakeStorage is not called", func(t *testing.T) {
		oversized := make([]byte, (10<<20)+1024)
		copy(oversized, validID3MP3Bytes())

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "huge.mp3", oversized)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["file"] != "file_too_large" {
			t.Fatalf("expected errors.file=file_too_large, got %+v", body.Errors)
		}
		if len(fakeStorage.UploadedFilesSnapshot()) != 0 {
			t.Fatalf("expected 0 FakeStorage calls, got %d", len(fakeStorage.UploadedFilesSnapshot()))
		}
	})

	t.Run("corrupted JPEG (valid magic bytes but garbage body) returns 400 invalid_image", func(t *testing.T) {
		corruptJPEG := []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0xFF, 0x00, 0x12, 0x34}
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "corrupt.jpg", corruptJPEG)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["file"] != "invalid_image" {
			t.Fatalf("expected errors.file=invalid_image, got %+v", body.Errors)
		}
	})

	t.Run("image dimensions > 6000 px returns 400 image_dimensions_too_large", func(t *testing.T) {
		oversizedPNG := oversizedDimensionPNGHeader(6001, 100)
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "wide.png", oversizedPNG)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["file"] != "image_dimensions_too_large" {
			t.Fatalf("expected errors.file=image_dimensions_too_large, got %+v", body.Errors)
		}
	})

	t.Run("template_section_id belonging to another template returns 400", func(t *testing.T) {
		fields := map[string]string{
			"template_section_id": strconv.FormatInt(fixture.sectionB, 10),
		}
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, fields, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["template_section_id"] != "invalid_template_section_id" {
			t.Fatalf("expected errors.template_section_id=invalid_template_section_id, got %+v", body.Errors)
		}
	})

	t.Run("negative sort_order returns 400", func(t *testing.T) {
		fields := map[string]string{
			"sort_order": "-1",
		}
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, fields, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["sort_order"] != "invalid_sort_order" {
			t.Fatalf("expected errors.sort_order=invalid_sort_order, got %+v", body.Errors)
		}
	})
}

func TestUploadInvitationMedia_FailuresAndCompensatingDelete(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)
	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	folderID := "folder-comp-1"
	fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA1, "active", "")
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "valid-refresh-token", "connected", &folderID)

	invIDStr := strconv.FormatInt(fixture.invitationA1, 10)
	partnerAToken := templateFavoritesToken(t, fixture.partnerA)
	jpgBytes := validTestJPEGBytes(t, 24, 24)

	t.Run("Drive API failure returns 500 and writes 0 rows to DB", func(t *testing.T) {
		fakeStorage.UploadErr = errors.New("simulated google 503 error")
		defer func() {
			fakeStorage.UploadErr = nil
		}()

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["drive"] != "drive_upload_failed" {
			t.Fatalf("expected errors.drive=drive_upload_failed, got %+v", body.Errors)
		}

		var mediaCount, storageCount int
		_ = pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM invitation_media WHERE invitation_version_id = $1`, fixture.versionA1).Scan(&mediaCount)
		_ = pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM storage_files WHERE uploaded_by = $1`, fixture.partnerA).Scan(&storageCount)
		if mediaCount != 0 || storageCount != 0 {
			t.Fatalf("expected 0 DB rows, got invitation_media=%d storage_files=%d", mediaCount, storageCount)
		}
	})

	t.Run("DB failure after Drive upload triggers compensating delete and leaves 0 DB rows", func(t *testing.T) {
		var tempSecID int64
		if err := pool.QueryRow(
			context.Background(),
			`INSERT INTO template_sections (template_id, name, type, sort_order, is_required, is_editable)
			 VALUES ($1, 'Temp Section', 'gallery', 2, false, true)
			 RETURNING id`,
			fixture.templateA,
		).Scan(&tempSecID); err != nil {
			t.Fatalf("insert temp section: %v", err)
		}

		fakeStorage.DeletedFileIDs = nil
		fakeStorage.UploadHook = func(_ context.Context, _ drive.UploadFileParams) {
			// Delete tempSecID during upload so INSERT INTO invitation_media fails FK constraint in Step 10.
			_, _ = pool.Exec(context.Background(), `DELETE FROM template_sections WHERE id = $1`, tempSecID)
		}
		defer func() {
			fakeStorage.UploadHook = nil
		}()

		fields := map[string]string{
			"template_section_id": strconv.FormatInt(tempSecID, 10),
		}
		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, fields, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500 on DB failure, got %d: %s", rec.Code, rec.Body.String())
		}

		deletedIDs := fakeStorage.DeletedFileIDsSnapshot()
		if len(deletedIDs) != 1 {
			t.Fatalf("expected 1 compensating delete in FakeStorage.DeletedFileIDs, got %v", deletedIDs)
		}

		var storageCount int
		_ = pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM storage_files WHERE uploaded_by = $1`, fixture.partnerA).Scan(&storageCount)
		if storageCount != 0 {
			t.Fatalf("expected storage_files insert to roll back, got count=%d", storageCount)
		}
	})

	t.Run("re-check in transaction fails when invitation becomes non-draft during upload -> 409 and compensating delete", func(t *testing.T) {
		fakeStorage.DeletedFileIDs = nil
		fakeStorage.UploadHook = func(_ context.Context, _ drive.UploadFileParams) {
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE invitations SET status = 'published' WHERE id = $1`,
				fixture.invitationA1,
			)
		}
		defer func() {
			fakeStorage.UploadHook = nil
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE invitations SET status = 'draft' WHERE id = $1`,
				fixture.invitationA1,
			)
		}()

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["status"] != "invitation_is_not_draft" {
			t.Fatalf("expected errors.status=invitation_is_not_draft, got %+v", body.Errors)
		}

		deletedIDs := fakeStorage.DeletedFileIDsSnapshot()
		if len(deletedIDs) != 1 {
			t.Fatalf("expected uploaded file to be deleted when re-check fails, got %v", deletedIDs)
		}
	})

	t.Run("re-check in transaction fails when invitation_versions status transitions during upload -> 409 and compensating delete", func(t *testing.T) {
		fakeStorage.DeletedFileIDs = nil
		fakeStorage.UploadHook = func(_ context.Context, _ drive.UploadFileParams) {
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE invitation_versions SET status = 'published' WHERE id = $1`,
				fixture.versionA1,
			)
		}
		defer func() {
			fakeStorage.UploadHook = nil
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE invitation_versions SET status = 'draft' WHERE id = $1`,
				fixture.versionA1,
			)
		}()

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "photo.jpg", jpgBytes)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["status"] != "invitation_is_not_draft" {
			t.Fatalf("expected errors.status=invitation_is_not_draft, got %+v", body.Errors)
		}

		deletedIDs := fakeStorage.DeletedFileIDsSnapshot()
		if len(deletedIDs) != 1 {
			t.Fatalf("expected uploaded file to be deleted when version status transitions, got %v", deletedIDs)
		}

		var mediaCount, storageCount int
		_ = pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM invitation_media WHERE invitation_version_id = $1`, fixture.versionA1).Scan(&mediaCount)
		_ = pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM storage_files WHERE uploaded_by = $1`, fixture.partnerA).Scan(&storageCount)
		if mediaCount != 0 || storageCount != 0 {
			t.Fatalf("expected 0 DB rows written to transitioned version, got invitation_media=%d storage_files=%d", mediaCount, storageCount)
		}
	})
}

func TestUploadInvitationMedia_LimitsAndFoldersAndFormats(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createMediaTestFixture(t, pool)
	key := generateDriveTestKey(t)
	fakeStorage := &drive.FakeStorage{}
	driveCfg := defaultDriveTestConfig(key, &drive.FakeOAuth{})
	driveCfg.Storage = fakeStorage
	engine := setupDriveTestEngine(pool, driveCfg)

	fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA1, "active", "")
	// Start with drive_folder_id = NULL to test lazy folder creation!
	fixture.insertDriveCredentials(t, pool, key, fixture.partnerA, "partner-a-refresh-token", "connected", nil)

	invIDStr := strconv.FormatInt(fixture.invitationA1, 10)
	partnerAToken := templateFavoritesToken(t, fixture.partnerA)
	jpgBytes := validTestJPEGBytes(t, 50, 50)
	pngBytes := validTestPNGBytes(t, 40, 40)
	id3MP3 := validID3MP3Bytes()
	rawMP3 := validRawFrameSyncMP3Bytes()

	driveNamePattern := regexp.MustCompile(`^inv-\d+-v\d+-\d+-[0-9a-f]{8}\.(jpg|png|mp3)$`)

	t.Run("lazy folder creation on first JPEG upload and reuse on second PNG upload (fail-open without package_limits)", func(t *testing.T) {
		fields := map[string]string{
			"template_section_id": strconv.FormatInt(fixture.sectionA, 10),
			"sort_order":          "3",
		}
		rec1 := sendMultipartMediaRequest(
			t,
			engine,
			invIDStr,
			partnerAToken,
			fields,
			true,
			"../../my unsafe\tfile.png",
			jpgBytes,
		)
		if rec1.Code != http.StatusCreated {
			t.Fatalf("expected 201 for JPEG, got %d: %s", rec1.Code, rec1.Body.String())
		}

		var resp1 struct {
			Success bool `json:"success"`
			Data    struct {
				Media handlers.InvitationMediaResponse `json:"media"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rec1.Body.Bytes(), &resp1); err != nil {
			t.Fatalf("decode response 1: %v", err)
		}
		if !resp1.Success ||
			resp1.Data.Media.FileType != "image" ||
			resp1.Data.Media.MimeType != "image/jpeg" ||
			resp1.Data.Media.SortOrder != 3 ||
			resp1.Data.Media.OriginalName != "my unsafefile.png" {
			t.Fatalf("unexpected media response 1: %+v", resp1.Data.Media)
		}

		createdFolders := fakeStorage.CreatedFoldersSnapshot()
		if len(createdFolders) != 1 || createdFolders[0].FolderName != "InviteU" {
			t.Fatalf("expected 1 lazy folder creation 'InviteU', got %+v", createdFolders)
		}

		uploads := fakeStorage.UploadedFilesSnapshot()
		if len(uploads) != 1 {
			t.Fatalf("expected 1 upload, got %d", len(uploads))
		}
		if !driveNamePattern.MatchString(uploads[0].FileName) || !strings.HasSuffix(uploads[0].FileName, ".jpg") {
			t.Fatalf("expected safe .jpg Drive filename, got %q", uploads[0].FileName)
		}

		// Second upload (PNG) should reuse the folder without calling CreateFolder again
		rec2 := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "banner.png", pngBytes)
		if rec2.Code != http.StatusCreated {
			t.Fatalf("expected 201 for PNG, got %d: %s", rec2.Code, rec2.Body.String())
		}
		if len(fakeStorage.CreatedFoldersSnapshot()) != 1 {
			t.Fatalf("expected folder to be reused without calling CreateFolder again, got %d folder creations", len(fakeStorage.CreatedFoldersSnapshot()))
		}
	})

	t.Run("gallery_limit enforced when package_limits row exists (including mid-upload race re-check)", func(t *testing.T) {
		// Currently 2 images exist in versionA1. Set gallery_limit = 2 -> next image fails pre-check (409).
		_, err := pool.Exec(
			context.Background(),
			`INSERT INTO package_limits (package_id, resource_key, limit_value)
			 VALUES ($1, 'gallery_limit', 2)`,
			fixture.packageID,
		)
		if err != nil {
			t.Fatalf("insert gallery_limit: %v", err)
		}

		rec := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "third.jpg", jpgBytes)
		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409 when gallery_limit reached, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if body.Errors["media"] != "gallery_limit_reached" {
			t.Fatalf("expected errors.media=gallery_limit_reached, got %+v", body.Errors)
		}

		// Test race condition: increase limit to 3, but during UploadFile another concurrent upload lowers limit to 2
		_, err = pool.Exec(
			context.Background(),
			`UPDATE package_limits SET limit_value = 3 WHERE package_id = $1 AND resource_key = 'gallery_limit'`,
			fixture.packageID,
		)
		if err != nil {
			t.Fatalf("update gallery_limit to 3: %v", err)
		}

		fakeStorage.DeletedFileIDs = nil
		fakeStorage.UploadHook = func(_ context.Context, _ drive.UploadFileParams) {
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE package_limits SET limit_value = 2 WHERE package_id = $1 AND resource_key = 'gallery_limit'`,
				fixture.packageID,
			)
		}
		defer func() {
			fakeStorage.UploadHook = nil
		}()

		recRace := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "race.jpg", jpgBytes)
		if recRace.Code != http.StatusConflict {
			t.Fatalf("expected 409 on tx re-check of gallery_limit, got %d: %s", recRace.Code, recRace.Body.String())
		}
		if len(fakeStorage.DeletedFileIDsSnapshot()) != 1 {
			t.Fatalf("expected compensating delete when tx gallery_limit re-check fails")
		}
	})

	t.Run("MP3 with ID3 header succeeds, second MP3 on same version returns 409 audio_limit_reached", func(t *testing.T) {
		rec1 := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "song-id3.mp3", id3MP3)
		if rec1.Code != http.StatusCreated {
			t.Fatalf("expected 201 for first MP3, got %d: %s", rec1.Code, rec1.Body.String())
		}

		rec2 := sendMultipartMediaRequest(t, engine, invIDStr, partnerAToken, nil, true, "song-second.mp3", rawMP3)
		if rec2.Code != http.StatusConflict {
			t.Fatalf("expected 409 for second MP3, got %d: %s", rec2.Code, rec2.Body.String())
		}
		var body struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec2.Body.Bytes(), &body)
		if body.Errors["media"] != "audio_limit_reached" {
			t.Fatalf("expected errors.media=audio_limit_reached, got %+v", body.Errors)
		}
	})

	t.Run("MP3 with raw MPEG Layer III frame sync succeeds on another invitation and retries once on folder 404", func(t *testing.T) {
		fixture.insertEntitlement(t, pool, fixture.partnerA, fixture.invitationA2, "active", "")
		invA2Str := strconv.FormatInt(fixture.invitationA2, 10)

		// First UploadFile returns ErrFolderNotFound (404), triggering CreateFolder + 1 retry
		fakeStorage.UploadErrs = []error{drive.ErrFolderNotFound, nil}
		fakeStorage.CreateFolderIDs = []string{"recreated-folder-id-99"}

		rec := sendMultipartMediaRequest(t, engine, invA2Str, partnerAToken, nil, true, "raw-frame.mp3", rawMP3)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201 after folder 404 retry, got %d: %s", rec.Code, rec.Body.String())
		}

		var dbFolderID string
		if err := pool.QueryRow(
			context.Background(),
			`SELECT drive_folder_id FROM user_drive_credentials WHERE user_id = $1`,
			fixture.partnerA,
		).Scan(&dbFolderID); err != nil {
			t.Fatalf("query updated drive_folder_id: %v", err)
		}
		if dbFolderID != "recreated-folder-id-99" {
			t.Fatalf("expected drive_folder_id='recreated-folder-id-99', got %q", dbFolderID)
		}

		uploads := fakeStorage.UploadedFilesSnapshot()
		lastUpload := uploads[len(uploads)-1]
		if lastUpload.FolderID != "recreated-folder-id-99" ||
			lastUpload.MimeType != "audio/mpeg" ||
			!driveNamePattern.MatchString(lastUpload.FileName) ||
			!strings.HasSuffix(lastUpload.FileName, ".mp3") {
			t.Fatalf("unexpected last upload record: %+v", lastUpload)
		}
	})

	t.Run("concurrent first folder creation race uses winner folder_id", func(t *testing.T) {
		// Reset partnerA drive_folder_id to NULL
		_, err := pool.Exec(
			context.Background(),
			`UPDATE user_drive_credentials SET drive_folder_id = NULL WHERE user_id = $1`,
			fixture.partnerA,
		)
		if err != nil {
			t.Fatalf("reset drive_folder_id: %v", err)
		}
		_, _ = pool.Exec(
			context.Background(),
			`DELETE FROM package_limits WHERE package_id = $1`,
			fixture.packageID,
		)

		fakeStorage.CreateFolderIDs = []string{"loser-folder-id"}
		fakeStorage.CreateFolderHook = func(_ context.Context, _ string) {
			// Simulate another concurrent upload winning the race before our UPDATE WHERE drive_folder_id IS NULL
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE user_drive_credentials SET drive_folder_id = 'winner-folder-id' WHERE user_id = $1`,
				fixture.partnerA,
			)
		}
		defer func() {
			fakeStorage.CreateFolderHook = nil
		}()

		invA2Str := strconv.FormatInt(fixture.invitationA2, 10)
		rec := sendMultipartMediaRequest(t, engine, invA2Str, partnerAToken, nil, true, "race-folder.jpg", jpgBytes)
		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}

		uploads := fakeStorage.UploadedFilesSnapshot()
		lastUpload := uploads[len(uploads)-1]
		if lastUpload.FolderID != "winner-folder-id" {
			t.Fatalf("expected upload to use winner-folder-id, got %q", lastUpload.FolderID)
		}
	})
}

func TestGoogleStorage_HTTP(t *testing.T) {
	t.Run("CreateFolder, UploadFile, DeleteFile, 404 ErrFolderNotFound, and invalid_grant ErrTokenRevoked", func(t *testing.T) {
		var mode string
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
				_, _ = io.WriteString(w, `{"access_token":"test-access-token","token_type":"Bearer","expires_in":3600}`)

			case r.Method == http.MethodPost && r.URL.Path == "/drive/v3/files":
				w.Header().Set("Content-Type", "application/json")
				_, _ = io.WriteString(w, `{"id":"folder-123"}`)

			case r.Method == http.MethodPost && r.URL.Path == "/upload/drive/v3/files":
				if mode == "folder_404" {
					w.WriteHeader(http.StatusNotFound)
					_, _ = io.WriteString(w, `{"error":{"code":404,"message":"File not found"}}`)
					return
				}
				w.Header().Set("Content-Type", "application/json")
				_, _ = io.WriteString(w, `{"id":"file-xyz","name":"inv-1.jpg","mimeType":"image/jpeg","size":"128"}`)

			case r.Method == http.MethodDelete && strings.HasPrefix(r.URL.Path, "/drive/v3/files/"):
				w.WriteHeader(http.StatusNoContent)

			default:
				w.WriteHeader(http.StatusNotFound)
			}
		}))
		defer srv.Close()

		storage := drive.NewGoogleStorage("cid", "csecret")
		storage.HTTPClient = &http.Client{
			Timeout:   5 * time.Second,
			Transport: rewriteHostTransport{base: srv.Client().Transport, targetURL: srv.URL},
		}

		ctx := context.Background()
		folderID, err := storage.CreateFolder(ctx, "valid-refresh", "InviteU")
		if err != nil || folderID != "folder-123" {
			t.Fatalf("CreateFolder failed: id=%q err=%v", folderID, err)
		}

		uploaded, err := storage.UploadFile(ctx, "valid-refresh", drive.UploadFileParams{
			FolderID: folderID,
			FileName: "inv-1.jpg",
			MimeType: "image/jpeg",
			Content:  []byte("dummy-bytes"),
		})
		if err != nil || uploaded == nil || uploaded.ID != "file-xyz" || uploaded.Size != 128 {
			t.Fatalf("UploadFile failed: uploaded=%+v err=%v", uploaded, err)
		}

		if err := storage.DeleteFile(ctx, "valid-refresh", "file-xyz"); err != nil {
			t.Fatalf("DeleteFile failed: %v", err)
		}

		mode = "folder_404"
		_, err = storage.UploadFile(ctx, "valid-refresh", drive.UploadFileParams{
			FolderID: "missing-folder",
			FileName: "inv-1.jpg",
			MimeType: "image/jpeg",
			Content:  []byte("dummy-bytes"),
		})
		if !errors.Is(err, drive.ErrFolderNotFound) {
			t.Fatalf("expected ErrFolderNotFound on 404, got %v", err)
		}

		mode = "invalid_grant"
		_, err = storage.UploadFile(ctx, "revoked-refresh", drive.UploadFileParams{
			FolderID: "folder-123",
			FileName: "inv-1.jpg",
			MimeType: "image/jpeg",
			Content:  []byte("dummy-bytes"),
		})
		if !errors.Is(err, drive.ErrTokenRevoked) {
			t.Fatalf("expected ErrTokenRevoked on invalid_grant, got %v", err)
		}
	})
}

type rewriteHostTransport struct {
	base      http.RoundTripper
	targetURL string
}

func (t rewriteHostTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	target, err := http.NewRequest(req.Method, t.targetURL+req.URL.RequestURI(), req.Body)
	if err != nil {
		return nil, err
	}
	clone.URL = target.URL
	clone.Host = target.Host
	rt := t.base
	if rt == nil {
		rt = http.DefaultTransport
	}
	return rt.RoundTrip(clone)
}
