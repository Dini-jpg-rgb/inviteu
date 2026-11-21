package handlers

import (
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	defaultReportRangeDays = 30
	maxReportRangeDays     = 366
	maxReportSearchRunes   = 100
)

var indonesianShortMonths = [...]string{
	"",
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"Mei",
	"Jun",
	"Jul",
	"Agu",
	"Sep",
	"Okt",
	"Nov",
	"Des",
}

type SalesRevenuePreviousPeriod struct {
	TransactionsChangePercent *float64 `json:"transactions_change_percent"`
	AmountChangePercent       *float64 `json:"amount_change_percent"`
}

type SalesRevenueSummary struct {
	SuccessfulTransactions int64                      `json:"successful_transactions"`
	TotalAmount            int64                      `json:"total_amount"`
	PackageRevenue         int64                      `json:"package_revenue"`
	AddonRevenue           int64                      `json:"addon_revenue"`
	AverageAmount          int64                      `json:"average_amount"`
	PreviousPeriod         SalesRevenuePreviousPeriod `json:"previous_period"`
}

type SalesRevenuePeriodItem struct {
	Label          string `json:"label"`
	Start          string `json:"start"`
	End            string `json:"end"`
	Transactions   int64  `json:"transactions"`
	PackageRevenue int64  `json:"package_revenue"`
	AddonRevenue   int64  `json:"addon_revenue"`
	Total          int64  `json:"total"`
	Average        int64  `json:"average"`
}

type SalesRevenueBestPeriod struct {
	Start string `json:"start"`
	End   string `json:"end"`
	Total int64  `json:"total"`
}

type SalesRevenueReportData struct {
	Summary    SalesRevenueSummary      `json:"summary"`
	Periods    []SalesRevenuePeriodItem `json:"periods"`
	BestPeriod *SalesRevenueBestPeriod  `json:"best_period"`
}

// MountReportRoutes registers admin report endpoints without modifying router.go.
func MountReportRoutes(
	engine *gin.Engine,
	pool *pgxpool.Pool,
	jwtSecret string,
) {
	api := engine.Group("/api/v1")
	{
		api.GET(
			"/admin/reports/sales-revenue",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("admin"),
			GetAdminSalesRevenueReport(pool),
		)
	}
}

func escapeILIKEPattern(raw string) string {
	var b strings.Builder
	b.Grow(len(raw) + 4)
	for _, r := range raw {
		switch r {
		case '\\', '%', '_':
			b.WriteByte('\\')
			b.WriteRune(r)
		default:
			b.WriteRune(r)
		}
	}
	return "%" + b.String() + "%"
}

func roundAverageIDR(total int64, count int64) int64 {
	if count <= 0 || total <= 0 {
		return 0
	}
	return (total + count/2) / count
}

func computeChangePercent(current int64, previous int64) *float64 {
	if previous <= 0 {
		return nil
	}
	diff := float64(current - previous)
	pct := math.Round((diff/float64(previous))*1000) / 10
	return &pct
}

func formatPeriodLabel(groupBy string, start, end time.Time) string {
	sMonth := indonesianShortMonths[int(start.Month())]
	eMonth := indonesianShortMonths[int(end.Month())]

	switch groupBy {
	case "day":
		return fmt.Sprintf("%d %s %d", start.Day(), sMonth, start.Year())
	case "month":
		return fmt.Sprintf("%s %d", sMonth, start.Year())
	default: // week
		if start.Equal(end) {
			return fmt.Sprintf("%d %s", start.Day(), sMonth)
		}
		if start.Year() == end.Year() && start.Month() == end.Month() {
			return fmt.Sprintf("%d - %d %s", start.Day(), end.Day(), eMonth)
		}
		return fmt.Sprintf("%d %s - %d %s", start.Day(), sMonth, end.Day(), eMonth)
	}
}

func buildReportPeriodBuckets(fromDate, toDate time.Time, groupBy string) []SalesRevenuePeriodItem {
	buckets := make([]SalesRevenuePeriodItem, 0)

	switch groupBy {
	case "day":
		for d := fromDate; !d.After(toDate); d = d.AddDate(0, 0, 1) {
			ds := d.Format("2006-01-02")
			buckets = append(buckets, SalesRevenuePeriodItem{
				Label: formatPeriodLabel("day", d, d),
				Start: ds,
				End:   ds,
			})
		}

	case "month":
		cur := time.Date(fromDate.Year(), fromDate.Month(), 1, 0, 0, 0, 0, time.UTC)
		for !cur.After(toDate) {
			mStart := cur
			mEnd := cur.AddDate(0, 1, -1)
			if mStart.Before(fromDate) {
				mStart = fromDate
			}
			if mEnd.After(toDate) {
				mEnd = toDate
			}
			buckets = append(buckets, SalesRevenuePeriodItem{
				Label: formatPeriodLabel("month", mStart, mEnd),
				Start: mStart.Format("2006-01-02"),
				End:   mEnd.Format("2006-01-02"),
			})
			cur = cur.AddDate(0, 1, 0)
		}

	default: // "week": 7-day buckets starting from fromDate, last bucket clipped at toDate
		for bStart := fromDate; !bStart.After(toDate); bStart = bStart.AddDate(0, 0, 7) {
			bEnd := bStart.AddDate(0, 0, 6)
			if bEnd.After(toDate) {
				bEnd = toDate
			}
			buckets = append(buckets, SalesRevenuePeriodItem{
				Label: formatPeriodLabel("week", bStart, bEnd),
				Start: bStart.Format("2006-01-02"),
				End:   bEnd.Format("2006-01-02"),
			})
		}
	}

	return buckets
}

// GetAdminSalesRevenueReport handles GET /api/v1/admin/reports/sales-revenue.
func GetAdminSalesRevenueReport(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if pool == nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database is not configured",
			})
			return
		}

		fromRaw := strings.TrimSpace(c.Query("from"))
		toRaw := strings.TrimSpace(c.Query("to"))
		groupBy := strings.TrimSpace(c.Query("group_by"))
		itemType := strings.TrimSpace(c.Query("type"))
		searchQ := strings.TrimSpace(c.Query("q"))

		if groupBy == "" {
			groupBy = "week"
		}
		if itemType == "" {
			itemType = "all"
		}

		fieldErrors := make(map[string]string)

		if groupBy != "day" && groupBy != "week" && groupBy != "month" {
			fieldErrors["group_by"] = "group_by must be one of: day, week, month"
		}
		if itemType != "all" && itemType != "package" && itemType != "addon" {
			fieldErrors["type"] = "type must be one of: all, package, addon"
		}
		if utf8.RuneCountInString(searchQ) > maxReportSearchRunes {
			fieldErrors["q"] = "q must not exceed 100 characters"
		}

		var (
			fromDate time.Time
			toDate   time.Time
		)

		now := time.Now()
		todayUTC := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

		if fromRaw == "" && toRaw == "" {
			toDate = todayUTC
			fromDate = todayUTC.AddDate(0, 0, -(defaultReportRangeDays - 1))
		} else {
			if fromRaw == "" {
				fieldErrors["from"] = "from date is required in YYYY-MM-DD format"
			} else {
				parsedFrom, err := time.Parse("2006-01-02", fromRaw)
				if err != nil {
					fieldErrors["from"] = "from date must be in YYYY-MM-DD format"
				} else {
					fromDate = parsedFrom
				}
			}

			if toRaw == "" {
				fieldErrors["to"] = "to date is required in YYYY-MM-DD format"
			} else {
				parsedTo, err := time.Parse("2006-01-02", toRaw)
				if err != nil {
					fieldErrors["to"] = "to date must be in YYYY-MM-DD format"
				} else {
					toDate = parsedTo
				}
			}
		}

		if len(fieldErrors) == 0 {
			if fromDate.After(toDate) {
				fieldErrors["from"] = "from date must not be after to date"
			} else {
				numDays := int(toDate.Sub(fromDate)/(24*time.Hour)) + 1
				if numDays > maxReportRangeDays {
					fieldErrors["date_range"] = "date range must not exceed 366 days"
				}
			}
		}

		if len(fieldErrors) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors":  fieldErrors,
			})
			return
		}

		numDays := int(toDate.Sub(fromDate)/(24*time.Hour)) + 1
		prevToDate := fromDate.AddDate(0, 0, -1)
		prevFromDate := fromDate.AddDate(0, 0, -numDays)

		fromStr := fromDate.Format("2006-01-02")
		toStr := toDate.Format("2006-01-02")
		prevFromStr := prevFromDate.Format("2006-01-02")
		prevToStr := prevToDate.Format("2006-01-02")

		qPattern := ""
		if searchQ != "" {
			qPattern = escapeILIKEPattern(searchQ)
		}

		ctx := c.Request.Context()

		var (
			currTransactions   int64
			currPackageRevenue int64
			currAddonRevenue   int64
			prevTransactions   int64
			prevTotalAmount    int64
		)

		err := pool.QueryRow(ctx, `
			SELECT
				COUNT(DISTINCT p.id) FILTER (
					WHERE p.paid_at >= $1::date::timestamp
					  AND p.paid_at < ($2::date + INTERVAL '1 day')::timestamp
				) AS curr_transactions,
				COALESCE(ROUND(SUM(
					CASE
						WHEN p.paid_at >= $1::date::timestamp
						 AND p.paid_at < ($2::date + INTERVAL '1 day')::timestamp
						 AND oi.item_type = 'package'
						THEN oi.subtotal
						ELSE 0
					END
				)), 0)::BIGINT AS curr_package_revenue,
				COALESCE(ROUND(SUM(
					CASE
						WHEN p.paid_at >= $1::date::timestamp
						 AND p.paid_at < ($2::date + INTERVAL '1 day')::timestamp
						 AND oi.item_type = 'addon'
						THEN oi.subtotal
						ELSE 0
					END
				)), 0)::BIGINT AS curr_addon_revenue,
				COUNT(DISTINCT p.id) FILTER (
					WHERE p.paid_at >= $3::date::timestamp
					  AND p.paid_at < ($4::date + INTERVAL '1 day')::timestamp
				) AS prev_transactions,
				COALESCE(ROUND(SUM(
					CASE
						WHEN p.paid_at >= $3::date::timestamp
						 AND p.paid_at < ($4::date + INTERVAL '1 day')::timestamp
						THEN oi.subtotal
						ELSE 0
					END
				)), 0)::BIGINT AS prev_total_amount
			FROM payments p
			INNER JOIN order_items oi ON oi.order_id = p.order_id
			WHERE p.status = 'paid'
			  AND p.paid_at IS NOT NULL
			  AND p.paid_at >= $3::date::timestamp
			  AND p.paid_at < ($2::date + INTERVAL '1 day')::timestamp
			  AND (
				  ($5 = 'all' AND oi.item_type IN ('package', 'addon'))
				  OR ($5 = 'package' AND oi.item_type = 'package')
				  OR ($5 = 'addon' AND oi.item_type = 'addon')
			  )
			  AND ($6 = '' OR oi.item_name ILIKE $6 ESCAPE '\')
		`,
			fromStr,
			toStr,
			prevFromStr,
			prevToStr,
			itemType,
			qPattern,
		).Scan(
			&currTransactions,
			&currPackageRevenue,
			&currAddonRevenue,
			&prevTransactions,
			&prevTotalAmount,
		)
		if err != nil {
			log.Printf("GetAdminSalesRevenueReport: summary query failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve sales and revenue report",
			})
			return
		}

		rows, err := pool.Query(ctx, `
			SELECT
				to_char(p.paid_at::date, 'YYYY-MM-DD') AS paid_day,
				COUNT(DISTINCT p.id) AS day_transactions,
				COALESCE(ROUND(SUM(CASE WHEN oi.item_type = 'package' THEN oi.subtotal ELSE 0 END)), 0)::BIGINT AS day_package_revenue,
				COALESCE(ROUND(SUM(CASE WHEN oi.item_type = 'addon' THEN oi.subtotal ELSE 0 END)), 0)::BIGINT AS day_addon_revenue
			FROM payments p
			INNER JOIN order_items oi ON oi.order_id = p.order_id
			WHERE p.status = 'paid'
			  AND p.paid_at IS NOT NULL
			  AND p.paid_at >= $1::date::timestamp
			  AND p.paid_at < ($2::date + INTERVAL '1 day')::timestamp
			  AND (
				  ($3 = 'all' AND oi.item_type IN ('package', 'addon'))
				  OR ($3 = 'package' AND oi.item_type = 'package')
				  OR ($3 = 'addon' AND oi.item_type = 'addon')
			  )
			  AND ($4 = '' OR oi.item_name ILIKE $4 ESCAPE '\')
			GROUP BY p.paid_at::date
			ORDER BY p.paid_at::date ASC
		`,
			fromStr,
			toStr,
			itemType,
			qPattern,
		)
		if err != nil {
			log.Printf("GetAdminSalesRevenueReport: period query failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve sales and revenue report",
			})
			return
		}
		defer rows.Close()

		periods := buildReportPeriodBuckets(fromDate, toDate, groupBy)

		for rows.Next() {
			var (
				paidDay   string
				dayTx     int64
				dayPkgRev int64
				dayAddRev int64
			)
			if err := rows.Scan(&paidDay, &dayTx, &dayPkgRev, &dayAddRev); err != nil {
				log.Printf("GetAdminSalesRevenueReport: scan daily row failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read sales and revenue report",
				})
				return
			}

			for i := range periods {
				if paidDay >= periods[i].Start && paidDay <= periods[i].End {
					periods[i].Transactions += dayTx
					periods[i].PackageRevenue += dayPkgRev
					periods[i].AddonRevenue += dayAddRev
					break
				}
			}
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetAdminSalesRevenueReport: iterate daily rows failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read sales and revenue report",
			})
			return
		}

		var bestPeriod *SalesRevenueBestPeriod
		for i := range periods {
			periods[i].Total = periods[i].PackageRevenue + periods[i].AddonRevenue
			periods[i].Average = roundAverageIDR(periods[i].Total, periods[i].Transactions)

			if periods[i].Total > 0 {
				if bestPeriod == nil || periods[i].Total > bestPeriod.Total {
					bestPeriod = &SalesRevenueBestPeriod{
						Start: periods[i].Start,
						End:   periods[i].End,
						Total: periods[i].Total,
					}
				}
			}
		}

		currTotalAmount := currPackageRevenue + currAddonRevenue
		currAverageAmount := roundAverageIDR(currTotalAmount, currTransactions)

		summary := SalesRevenueSummary{
			SuccessfulTransactions: currTransactions,
			TotalAmount:            currTotalAmount,
			PackageRevenue:         currPackageRevenue,
			AddonRevenue:           currAddonRevenue,
			AverageAmount:          currAverageAmount,
			PreviousPeriod: SalesRevenuePreviousPeriod{
				TransactionsChangePercent: computeChangePercent(currTransactions, prevTransactions),
				AmountChangePercent:       computeChangePercent(currTotalAmount, prevTotalAmount),
			},
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Sales and revenue report retrieved successfully",
			"data": SalesRevenueReportData{
				Summary:    summary,
				Periods:    periods,
				BestPeriod: bestPeriod,
			},
		})
	}
}

// Keep errors referenced if needed.
var _ = errors.Is
