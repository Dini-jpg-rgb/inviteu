package handlers_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"backend-golang/internal/drive"
	"backend-golang/internal/handlers"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type adminReportTestFixture struct {
	marker      string
	adminUser   int64
	partnerUser int64
	designer    int64
	seq         int64
	orderIDs    []int64
}

func createAdminReportTestFixture(t *testing.T, pool *pgxpool.Pool) *adminReportTestFixture {
	t.Helper()

	randomBytes := make([]byte, 6)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("generate report fixture marker: %v", err)
	}
	marker := "rep-" + hex.EncodeToString(randomBytes)
	f := &adminReportTestFixture{marker: marker}

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

	f.adminUser = insertUser("Admin", "admin@example.test", "admin")
	f.partnerUser = insertUser("Partner", "partner@example.test", "partner")
	f.designer = insertUser("Designer", "designer@example.test", "designer")

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userIDs := []int64{f.adminUser, f.partnerUser, f.designer}
		if len(f.orderIDs) > 0 {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM payments WHERE order_id = ANY($1)`, f.orderIDs)
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM order_items WHERE order_id = ANY($1)`, f.orderIDs)
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM orders WHERE id = ANY($1)`, f.orderIDs)
		}
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM users WHERE id = ANY($1)`, userIDs)
	})

	return f
}

type testReportItemSpec struct {
	itemType string
	itemName string
	subtotal int64
}

func (f *adminReportTestFixture) insertOrderWithPayment(
	t *testing.T,
	pool *pgxpool.Pool,
	paymentStatus string,
	paidAtStr string, // "YYYY-MM-DD HH:MM:SS" or "" if NULL
	items []testReportItemSpec,
) int64 {
	t.Helper()
	ctx := context.Background()
	seq := atomic.AddInt64(&f.seq, 1)

	var total int64
	for _, it := range items {
		total += it.subtotal
	}
	if total <= 0 {
		total = 10000
	}

	orderNumber := fmt.Sprintf("ORD-%s-%d", f.marker, seq)
	var orderID int64
	if err := pool.QueryRow(ctx, `
		INSERT INTO orders (user_id, order_number, subtotal, discount, total, status)
		VALUES ($1, $2, $3, 0, $3, $4)
		RETURNING id
	`, f.partnerUser, orderNumber, total, paymentStatus).Scan(&orderID); err != nil {
		t.Fatalf("insert order: %v", err)
	}
	f.orderIDs = append(f.orderIDs, orderID)

	for _, it := range items {
		if _, err := pool.Exec(ctx, `
			INSERT INTO order_items (order_id, item_type, item_name, quantity, unit_price, subtotal)
			VALUES ($1, $2, $3, 1, $4, $4)
		`, orderID, it.itemType, it.itemName, it.subtotal); err != nil {
			t.Fatalf("insert order_item: %v", err)
		}
	}

	payNumber := fmt.Sprintf("PAY-%s-%d", f.marker, seq)
	var paymentID int64
	if paidAtStr == "" {
		if err := pool.QueryRow(ctx, `
			INSERT INTO payments (order_id, payment_number, payment_method, payment_provider, amount, status, paid_at)
			VALUES ($1, $2, 'qris', 'midtrans', $3, $4, NULL)
			RETURNING id
		`, orderID, payNumber, total, paymentStatus).Scan(&paymentID); err != nil {
			t.Fatalf("insert payment (null paid_at): %v", err)
		}
	} else {
		if err := pool.QueryRow(ctx, `
			INSERT INTO payments (order_id, payment_number, payment_method, payment_provider, amount, status, paid_at)
			VALUES ($1, $2, 'qris', 'midtrans', $3, $4, $5::timestamp)
			RETURNING id
		`, orderID, payNumber, total, paymentStatus, paidAtStr).Scan(&paymentID); err != nil {
			t.Fatalf("insert payment: %v", err)
		}
	}

	return paymentID
}

func setupReportTestEngine(pool *pgxpool.Pool) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	handlers.MountReportRoutes(r, pool, templateFavoritesTestJWTSecret)
	return r
}

func sendSalesRevenueRequest(
	engine *gin.Engine,
	query string,
	token string,
) *httptest.ResponseRecorder {
	path := "/api/v1/admin/reports/sales-revenue"
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

func TestMountReportRoutes_RealRouterNoConflict(t *testing.T) {
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
	handlers.MountReportRoutes(realEngine, pool, templateFavoritesTestJWTSecret)

	found := false
	for _, rt := range realEngine.Routes() {
		if rt.Method == http.MethodGet && rt.Path == "/api/v1/admin/reports/sales-revenue" {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected GET /api/v1/admin/reports/sales-revenue registered on real router")
	}
}

func TestPaidAtTimezoneVerification(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	ctx := context.Background()

	var dbTimeZone string
	if err := pool.QueryRow(ctx, `SHOW TimeZone`).Scan(&dbTimeZone); err != nil {
		t.Fatalf("SHOW TimeZone: %v", err)
	}

	// Simulate exact MidtransNotification behavior: paidAt := time.Now() passed as $1::timestamptz
	// into a TIMESTAMP (without time zone) expression and formatted as YYYY-MM-DD HH24:MI:SS.
	goNow := time.Now()
	var storedWallClock string
	var storedDate string
	if err := pool.QueryRow(ctx, `
		SELECT
			to_char(($1::timestamptz)::timestamp, 'YYYY-MM-DD HH24:MI:SS'),
			to_char((($1::timestamptz)::timestamp)::date, 'YYYY-MM-DD')
	`, goNow).Scan(&storedWallClock, &storedDate); err != nil {
		t.Fatalf("verify timestamptz->timestamp conversion: %v", err)
	}

	goLocalDate := goNow.Format("2006-01-02")
	t.Logf(
		"Timezone verification: Go time.Now() zone=%s (%s), DB TimeZone=%s, stored paid_at TIMESTAMP=%s (date=%s)",
		goNow.Location().String(),
		goNow.Format(time.RFC3339),
		dbTimeZone,
		storedWallClock,
		storedDate,
	)

	if storedDate != goLocalDate {
		t.Logf("note: Go local date (%s) differs from DB session date (%s) because DB TimeZone=%s", goLocalDate, storedDate, dbTimeZone)
	}
}

func TestGetAdminSalesRevenueReport(t *testing.T) {
	pool := templateFavoritesTestPool(t)
	fixture := createAdminReportTestFixture(t, pool)
	engine := setupReportTestEngine(pool)

	adminToken := templateFavoritesToken(t, fixture.adminUser)
	partnerToken := templateFavoritesToken(t, fixture.partnerUser)
	designerToken := templateFavoritesToken(t, fixture.designer)

	t.Run("authentication and admin role checks", func(t *testing.T) {
		rec401 := sendSalesRevenueRequest(engine, "", "")
		if rec401.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 without token, got %d", rec401.Code)
		}

		for _, tok := range []string{partnerToken, designerToken} {
			rec403 := sendSalesRevenueRequest(engine, "", tok)
			if rec403.Code != http.StatusForbidden {
				t.Fatalf("expected 403 for non-admin token, got %d: %s", rec403.Code, rec403.Body.String())
			}
		}
	})

	t.Run("query parameter validation errors return 400", func(t *testing.T) {
		invalidQueries := []string{
			"from=2031-10-15",               // missing to
			"to=2031-11-13",                 // missing from
			"from=15-10-2031&to=2031-11-13", // invalid from format
			"from=2031-10-15&to=2031/11/13", // invalid to format
			"from=2031-11-15&to=2031-11-10", // from > to
			"from=2030-01-01&to=2031-12-31", // > 366 days
			"from=2031-10-01&to=2031-10-10&group_by=year",
			"from=2031-10-01&to=2031-10-10&type=template",
		}
		for _, q := range invalidQueries {
			rec := sendSalesRevenueRequest(engine, q, adminToken)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("query %q: expected 400, got %d: %s", q, rec.Code, rec.Body.String())
			}
		}
	})

	t.Run("empty range with zero transactions returns 0 summary, null change_percent, and null best_period", func(t *testing.T) {
		rec := sendSalesRevenueRequest(engine, "from=2035-05-01&to=2035-05-10", adminToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool                            `json:"success"`
			Data    handlers.SalesRevenueReportData `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		if resp.Data.Summary.SuccessfulTransactions != 0 ||
			resp.Data.Summary.TotalAmount != 0 ||
			resp.Data.Summary.PackageRevenue != 0 ||
			resp.Data.Summary.AddonRevenue != 0 ||
			resp.Data.Summary.AverageAmount != 0 {
			t.Fatalf("expected all 0 summary metrics, got %+v", resp.Data.Summary)
		}
		if resp.Data.Summary.PreviousPeriod.TransactionsChangePercent != nil ||
			resp.Data.Summary.PreviousPeriod.AmountChangePercent != nil {
			t.Fatalf("expected null change_percent when previous=0, got %+v", resp.Data.Summary.PreviousPeriod)
		}
		if resp.Data.BestPeriod != nil {
			t.Fatalf("expected best_period=null when all periods are 0, got %+v", resp.Data.BestPeriod)
		}
		// 10 days with default group_by=week -> 2 buckets: [2035-05-01..2035-05-07] and [2035-05-08..2035-05-10]
		if len(resp.Data.Periods) != 2 {
			t.Fatalf("expected 2 weekly buckets for 10-day range, got %d", len(resp.Data.Periods))
		}
		if resp.Data.Periods[0].Start != "2035-05-01" || resp.Data.Periods[0].End != "2035-05-07" {
			t.Fatalf("unexpected bucket 0 bounds: %+v", resp.Data.Periods[0])
		}
		if resp.Data.Periods[1].Start != "2035-05-08" || resp.Data.Periods[1].End != "2035-05-10" {
			t.Fatalf("unexpected bucket 1 bounds (clipped at to): %+v", resp.Data.Periods[1])
		}
	})

	t.Run("aggregation, weekly bucketing clipped at to, type filter, previous_period, best_period, and non-paid exclusion", func(t *testing.T) {
		// Current period: 2031-10-01 to 2031-10-10 (10 days -> 2 weekly buckets:
		// Bucket 0: 2031-10-01 .. 2031-10-07 (7 days)
		// Bucket 1: 2031-10-08 .. 2031-10-10 (3 days, clipped at to)
		// Previous period (10 days immediately prior): 2031-09-21 to 2031-09-30

		// 1. Previous period paid transactions:
		// - 1 package payment of 100,000 on 2031-09-25
		// - 1 addon payment of 50,000 on 2031-09-30 23:59:59
		// Total previous: 2 transactions, amount = 150,000
		fixture.insertOrderWithPayment(t, pool, "paid", "2031-09-25 10:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Basic Package", subtotal: 100000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2031-09-30 23:59:59", []testReportItemSpec{
			{itemType: "addon", itemName: "Google Drive Connect", subtotal: 50000},
		})

		// 2. Current period Bucket 0 (2031-10-01 .. 2031-10-07):
		// - Payment 1 on 2031-10-01 00:00:00: package 150,000
		// - Payment 2 on 2031-10-05 14:30:00: addon 30,000 ("Video Greeting")
		// Bucket 0 total = 180,000, transactions = 2, average = 90,000
		fixture.insertOrderWithPayment(t, pool, "paid", "2031-10-01 00:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Pro Package", subtotal: 150000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2031-10-05 14:30:00", []testReportItemSpec{
			{itemType: "addon", itemName: "Video Greeting", subtotal: 30000},
		})

		// 3. Current period Bucket 1 (2031-10-08 .. 2031-10-10):
		// - Payment 3 on 2031-10-09 18:00:00: 1 order containing BOTH package (200,000) and addon (40,000)
		// Bucket 1 total = 240,000, transactions = 1 (COUNT DISTINCT payments.id), average = 240,000
		fixture.insertOrderWithPayment(t, pool, "paid", "2031-10-09 18:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Medium Package", subtotal: 200000},
			{itemType: "addon", itemName: "Video Greeting", subtotal: 40000},
		})

		// 4. Non-paid payments inside current period (MUST BE IGNORED):
		fixture.insertOrderWithPayment(t, pool, "pending", "2031-10-03 12:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Pro Package", subtotal: 999999},
		})
		fixture.insertOrderWithPayment(t, pool, "failed", "2031-10-04 12:00:00", []testReportItemSpec{
			{itemType: "addon", itemName: "Video Greeting", subtotal: 888888},
		})

		// Query with default group_by=week and type=all
		rec := sendSalesRevenueRequest(engine, "from=2031-10-01&to=2031-10-10", adminToken)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool                            `json:"success"`
			Data    handlers.SalesRevenueReportData `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}

		// Summary expectations:
		// successful_transactions = 3 (vs prev 2 -> +50.0%)
		// package_revenue = 150,000 + 200,000 = 350,000
		// addon_revenue = 30,000 + 40,000 = 70,000
		// total_amount = 420,000 (vs prev 150,000 -> +180.0%)
		// average_amount = 420,000 / 3 = 140,000
		s := resp.Data.Summary
		if s.SuccessfulTransactions != 3 {
			t.Fatalf("expected successful_transactions=3, got %d", s.SuccessfulTransactions)
		}
		if s.PackageRevenue != 350000 || s.AddonRevenue != 70000 || s.TotalAmount != 420000 {
			t.Fatalf("unexpected revenues: pkg=%d addon=%d total=%d", s.PackageRevenue, s.AddonRevenue, s.TotalAmount)
		}
		if s.AverageAmount != 140000 {
			t.Fatalf("expected average_amount=140000, got %d", s.AverageAmount)
		}
		if s.PreviousPeriod.TransactionsChangePercent == nil || *s.PreviousPeriod.TransactionsChangePercent != 50.0 {
			t.Fatalf("expected transactions_change_percent=50.0, got %v", s.PreviousPeriod.TransactionsChangePercent)
		}
		if s.PreviousPeriod.AmountChangePercent == nil || *s.PreviousPeriod.AmountChangePercent != 180.0 {
			t.Fatalf("expected amount_change_percent=180.0, got %v", s.PreviousPeriod.AmountChangePercent)
		}

		// Periods expectations:
		if len(resp.Data.Periods) != 2 {
			t.Fatalf("expected 2 periods, got %d", len(resp.Data.Periods))
		}
		p0 := resp.Data.Periods[0]
		if p0.Start != "2031-10-01" || p0.End != "2031-10-07" || p0.Transactions != 2 || p0.PackageRevenue != 150000 || p0.AddonRevenue != 30000 || p0.Total != 180000 || p0.Average != 90000 {
			t.Fatalf("unexpected period[0]: %+v", p0)
		}
		p1 := resp.Data.Periods[1]
		if p1.Start != "2031-10-08" || p1.End != "2031-10-10" || p1.Transactions != 1 || p1.PackageRevenue != 200000 || p1.AddonRevenue != 40000 || p1.Total != 240000 || p1.Average != 240000 {
			t.Fatalf("unexpected period[1]: %+v", p1)
		}

		// BestPeriod expectation: Bucket 1 (total 240,000 > 180,000)
		if resp.Data.BestPeriod == nil || resp.Data.BestPeriod.Start != "2031-10-08" || resp.Data.BestPeriod.End != "2031-10-10" || resp.Data.BestPeriod.Total != 240000 {
			t.Fatalf("unexpected best_period: %+v", resp.Data.BestPeriod)
		}

		// Filter type=addon -> only addon items counted (2 transactions, addon_revenue=70000, package_revenue=0, total=70000)
		recAddon := sendSalesRevenueRequest(engine, "from=2031-10-01&to=2031-10-10&type=addon", adminToken)
		if recAddon.Code != http.StatusOK {
			t.Fatalf("expected 200 for type=addon, got %d", recAddon.Code)
		}
		var respAddon struct {
			Data handlers.SalesRevenueReportData `json:"data"`
		}
		_ = json.Unmarshal(recAddon.Body.Bytes(), &respAddon)
		if respAddon.Data.Summary.SuccessfulTransactions != 2 ||
			respAddon.Data.Summary.PackageRevenue != 0 ||
			respAddon.Data.Summary.AddonRevenue != 70000 ||
			respAddon.Data.Summary.TotalAmount != 70000 {
			t.Fatalf("unexpected type=addon summary: %+v", respAddon.Data.Summary)
		}

		// Filter group_by=day -> 10 daily buckets
		recDay := sendSalesRevenueRequest(engine, "from=2031-10-01&to=2031-10-10&group_by=day", adminToken)
		if recDay.Code != http.StatusOK {
			t.Fatalf("expected 200 for group_by=day, got %d", recDay.Code)
		}
		var respDay struct {
			Data handlers.SalesRevenueReportData `json:"data"`
		}
		_ = json.Unmarshal(recDay.Body.Bytes(), &respDay)
		if len(respDay.Data.Periods) != 10 {
			t.Fatalf("expected 10 daily buckets, got %d", len(respDay.Data.Periods))
		}

		// Filter group_by=month across Oct & Nov -> 2 monthly buckets clipped at from and to
		recMonth := sendSalesRevenueRequest(engine, "from=2031-10-05&to=2031-11-12&group_by=month", adminToken)
		if recMonth.Code != http.StatusOK {
			t.Fatalf("expected 200 for group_by=month, got %d", recMonth.Code)
		}
		var respMonth struct {
			Data handlers.SalesRevenueReportData `json:"data"`
		}
		_ = json.Unmarshal(recMonth.Body.Bytes(), &respMonth)
		if len(respMonth.Data.Periods) != 2 {
			t.Fatalf("expected 2 monthly buckets, got %d", len(respMonth.Data.Periods))
		}
		if respMonth.Data.Periods[0].Start != "2031-10-05" || respMonth.Data.Periods[0].End != "2031-10-31" {
			t.Fatalf("unexpected first month bucket: %+v", respMonth.Data.Periods[0])
		}
		if respMonth.Data.Periods[1].Start != "2031-11-01" || respMonth.Data.Periods[1].End != "2031-11-12" {
			t.Fatalf("unexpected second month bucket: %+v", respMonth.Data.Periods[1])
		}
	})

	t.Run("search query parameter q: partial case-insensitive match, literal %, _, backslash, >100 chars 400, empty q, and consistent summary/periods/previous_period", func(t *testing.T) {
		// Dedicated date range for q tests:
		// Current period: 2032-03-01 to 2032-03-10 (10 days -> Bucket 0: 03-01..03-07, Bucket 1: 03-08..03-10)
		// Previous period: 2032-02-19 to 2032-02-28 (10 days immediately prior)

		// Previous period items:
		// - "Basic Wedding Package" on 2032-02-22: 100,000
		// - "Pro Wedding Package" on 2032-02-25: 300,000
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-02-22 10:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Basic Wedding Package", subtotal: 100000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-02-25 10:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Pro Wedding Package", subtotal: 300000},
		})

		// Current period items:
		// 1. "Basic Starter" on 2032-03-02 (Bucket 0): 120,000
		// 2. "BASIC Addon Video" on 2032-03-09 (Bucket 1): 30,000
		// 3. "Promo 50% Discount Package" on 2032-03-03 (Bucket 0): 80,000 (contains literal '%')
		// 4. "Special_Tier_One" on 2032-03-04 (Bucket 0): 90,000 (contains literal '_')
		// 5. "SpecialXTierXOne" on 2032-03-04 (Bucket 0): 95,000 (same positions without '_')
		// 6. `Folder\Path Addon` on 2032-03-05 (Bucket 0): 45,000 (contains literal '\')
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-03-02 11:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Basic Starter", subtotal: 120000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-03-09 11:00:00", []testReportItemSpec{
			{itemType: "addon", itemName: "BASIC Addon Video", subtotal: 30000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-03-03 11:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Promo 50% Discount Package", subtotal: 80000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-03-04 11:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "Special_Tier_One", subtotal: 90000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-03-04 12:00:00", []testReportItemSpec{
			{itemType: "package", itemName: "SpecialXTierXOne", subtotal: 95000},
		})
		fixture.insertOrderWithPayment(t, pool, "paid", "2032-03-05 11:00:00", []testReportItemSpec{
			{itemType: "addon", itemName: `Folder\Path Addon`, subtotal: 45000},
		})

		decodeReport := func(rec *httptest.ResponseRecorder) handlers.SalesRevenueReportData {
			t.Helper()
			if rec.Code != http.StatusOK {
				t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
			}
			var resp struct {
				Data handlers.SalesRevenueReportData `json:"data"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatalf("unmarshal report: %v", err)
			}
			return resp.Data
		}

		// (1) & (7) q="basic" matches partial & case-insensitive ("Basic Starter" 120k in Bucket 0,
		// "BASIC Addon Video" 30k in Bucket 1; and in previous_period matches "Basic Wedding Package" 100k,
		// excluding "Pro Wedding Package" 300k):
		// Current: 2 tx, pkg=120k, addon=30k, total=150k, avg=75k
		// Previous: 1 tx, total=100k -> tx_change = +100.0%, amount_change = +50.0%
		dataBasic := decodeReport(sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10&q=basic", adminToken))
		if dataBasic.Summary.SuccessfulTransactions != 2 ||
			dataBasic.Summary.PackageRevenue != 120000 ||
			dataBasic.Summary.AddonRevenue != 30000 ||
			dataBasic.Summary.TotalAmount != 150000 ||
			dataBasic.Summary.AverageAmount != 75000 {
			t.Fatalf("q=basic unexpected summary: %+v", dataBasic.Summary)
		}
		if dataBasic.Summary.PreviousPeriod.TransactionsChangePercent == nil ||
			*dataBasic.Summary.PreviousPeriod.TransactionsChangePercent != 100.0 ||
			dataBasic.Summary.PreviousPeriod.AmountChangePercent == nil ||
			*dataBasic.Summary.PreviousPeriod.AmountChangePercent != 50.0 {
			t.Fatalf("q=basic unexpected previous_period: %+v", dataBasic.Summary.PreviousPeriod)
		}
		if len(dataBasic.Periods) != 2 ||
			dataBasic.Periods[0].Transactions != 1 || dataBasic.Periods[0].Total != 120000 ||
			dataBasic.Periods[1].Transactions != 1 || dataBasic.Periods[1].Total != 30000 {
			t.Fatalf("q=basic unexpected periods: %+v", dataBasic.Periods)
		}
		if dataBasic.BestPeriod == nil || dataBasic.BestPeriod.Start != "2032-03-01" || dataBasic.BestPeriod.Total != 120000 {
			t.Fatalf("q=basic unexpected best_period: %+v", dataBasic.BestPeriod)
		}

		// (2) q="%" (URL-encoded as %25) matches ONLY "Promo 50% Discount Package" (80,000) and excludes items without "%"
		dataPercent := decodeReport(sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10&q=%25", adminToken))
		if dataPercent.Summary.SuccessfulTransactions != 1 || dataPercent.Summary.TotalAmount != 80000 {
			t.Fatalf("q=%% expected 1 tx with total 80000, got %+v", dataPercent.Summary)
		}

		// (3) q="Special_Tier" treats "_" as a literal underscore: matches "Special_Tier_One" (90,000),
		// and does NOT match "SpecialXTierXOne" (95,000)
		dataUnderscore := decodeReport(sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10&q=Special_Tier", adminToken))
		if dataUnderscore.Summary.SuccessfulTransactions != 1 || dataUnderscore.Summary.TotalAmount != 90000 {
			t.Fatalf("q=Special_Tier expected 1 tx with total 90000 (excluding SpecialXTierXOne), got %+v", dataUnderscore.Summary)
		}

		// (4) q="\" (URL-encoded as %5C) does not error and matches ONLY `Folder\Path Addon` (45,000)
		dataBackslash := decodeReport(sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10&q=%5C", adminToken))
		if dataBackslash.Summary.SuccessfulTransactions != 1 || dataBackslash.Summary.TotalAmount != 45000 {
			t.Fatalf("q=\\ expected 1 tx with total 45000, got %+v", dataBackslash.Summary)
		}

		// (5) q with > 100 characters returns 400 Bad Request
		longQ := make([]byte, 101)
		for i := range longQ {
			longQ[i] = 'a'
		}
		rec400 := sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10&q="+string(longQ), adminToken)
		if rec400.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for q > 100 chars, got %d: %s", rec400.Code, rec400.Body.String())
		}
		var errBody struct {
			Errors map[string]string `json:"errors"`
		}
		_ = json.Unmarshal(rec400.Body.Bytes(), &errBody)
		if errBody.Errors["q"] == "" {
			t.Fatalf("expected errors.q populated on >100 chars, got %+v", errBody.Errors)
		}

		// (6) Empty q ("q=" or whitespace "q=%20%20") produces the exact same result as omitting q
		recNoQ := sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10", adminToken)
		recEmptyQ := sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10&q=", adminToken)
		recSpaceQ := sendSalesRevenueRequest(engine, "from=2032-03-01&to=2032-03-10&q=%20%20", adminToken)
		_ = decodeReport(recNoQ)
		_ = decodeReport(recEmptyQ)
		_ = decodeReport(recSpaceQ)

		if recNoQ.Body.String() != recEmptyQ.Body.String() || recNoQ.Body.String() != recSpaceQ.Body.String() {
			t.Fatalf("expected empty q to match omitted q:\nnoQ=%s\nemptyQ=%s\nspaceQ=%s", recNoQ.Body.String(), recEmptyQ.Body.String(), recSpaceQ.Body.String())
		}
	})
}
