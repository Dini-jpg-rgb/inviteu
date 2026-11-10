package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"backend-golang/internal/payment"
)

type MidtransNotificationPayload struct {
	OrderID           string `json:"order_id"`
	StatusCode        string `json:"status_code"`
	GrossAmount       string `json:"gross_amount"`
	SignatureKey      string `json:"signature_key"`
	TransactionID     string `json:"transaction_id"`
	TransactionStatus string `json:"transaction_status"`
	PaymentType       string `json:"payment_type"`
	FraudStatus       string `json:"fraud_status"`
}

type notificationResult struct {
	Status string `json:"status"`
}

var midtransAmountPattern = regexp.MustCompile(`^[0-9]+(\.[0-9]{1,2})?$`)

// MidtransNotification menerima dan memverifikasi notifikasi pembayaran Midtrans.
func MidtransNotification(
	pool *pgxpool.Pool,
	client *payment.MidtransClient,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if pool == nil || client == nil {
			log.Printf("MIDTRANS WEBHOOK RECEIVED: %s %s", c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Payment service is not configured",
			})
			log.Printf("Midtrans webhook: payment service is not configured")
			return
		}

		// Batasi ukuran request agar payload tidak terlalu besar.
		c.Request.Body = http.MaxBytesReader(
			c.Writer,
			c.Request.Body,
			1<<20,
		)

		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid notification body",
			})
			return
		}

		var payload MidtransNotificationPayload
		if err := json.Unmarshal(body, &payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid notification JSON",
			})
			return
		}

		payload.OrderID = strings.TrimSpace(payload.OrderID)
		payload.StatusCode = strings.TrimSpace(payload.StatusCode)
		payload.TransactionID = strings.TrimSpace(payload.TransactionID)
		payload.TransactionStatus = strings.ToLower(
			strings.TrimSpace(payload.TransactionStatus),
		)
		payload.FraudStatus = strings.ToLower(
			strings.TrimSpace(payload.FraudStatus),
		)

		// Gunakan nilai gross_amount asli dari payload untuk signature.
		if payload.OrderID == "" ||
			payload.StatusCode == "" ||
			payload.GrossAmount == "" ||
			payload.SignatureKey == "" ||
			payload.TransactionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Required notification fields are missing",
			})
			return
		}

		if !midtransAmountPattern.MatchString(payload.GrossAmount) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid gross_amount",
			})
			return
		}

		if !client.VerifyNotificationSignature(
			payload.OrderID,
			payload.StatusCode,
			payload.GrossAmount,
			payload.SignatureKey,
		) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid notification signature",
			})
			return
		}

		newStatus, recognized := mapMidtransStatus(
			payload.TransactionStatus,
			payload.FraudStatus,
		)
		if !recognized {
			// Jangan mengubah status untuk status provider yang belum didukung.
			// Beri tahu Midtrans bahwa request sudah diterima agar tidak
			// terus mengirim status yang handler ini belum tangani.
			c.JSON(http.StatusOK, gin.H{
				"status": "ignored",
				"reason": "Unsupported transaction status",
			})
			return
		}

		// Status sukses harus memiliki status_code 200.
		if newStatus == "paid" {
			if payload.StatusCode != "200" {
				c.JSON(http.StatusOK, gin.H{
					"status": "ignored",
					"reason": "Invalid success status code",
				})
				return
			}

			// Jika fraud_status tersedia, hanya accept yang boleh
			// diproses sebagai pembayaran berhasil.
			if payload.FraudStatus != "" &&
				payload.FraudStatus != "accept" {
				c.JSON(http.StatusOK, gin.H{
					"status": "ignored",
					"reason": "Fraud status is not accepted",
				})
				return
			}
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("Midtrans webhook: begin transaction failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Could not begin payment transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		var (
			paymentID          int64
			currentStatus      string
			paymentProvider    string
			currentAmount      string
			currentTransaction *string
		)

		err = tx.QueryRow(ctx, `
			SELECT
				id,
				status,
				COALESCE(payment_provider, ''),
				amount::text,
				provider_transaction_id
			FROM payments
			WHERE payment_number = $1
			FOR UPDATE
		`, payload.OrderID).Scan(
			&paymentID,
			&currentStatus,
			&paymentProvider,
			&currentAmount,
			&currentTransaction,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Payment not found",
			})
			return
		}
		if err != nil {
			log.Printf("Midtrans webhook: retrieve payment failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Could not retrieve payment",
			})
			return
		}

		if !strings.EqualFold(paymentProvider, "midtrans") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Payment provider mismatch",
			})
			return
		}

		// Bandingkan nominal sebagai NUMERIC di PostgreSQL, bukan float64.
		var amountMatches bool
		err = tx.QueryRow(ctx, `
			SELECT $1::numeric = $2::numeric
		`, currentAmount, payload.GrossAmount).Scan(&amountMatches)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Could not validate payment amount",
			})
			return
		}
		if !amountMatches {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Payment amount mismatch",
			})
			return
		}

		// Jangan izinkan satu payment_number berpindah ke transaksi
		// Midtrans yang berbeda setelah transaction ID tersimpan.
		if currentTransaction != nil &&
			*currentTransaction != "" &&
			*currentTransaction != payload.TransactionID {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Transaction ID mismatch",
			})
			return
		}

		finalStatus := nextPaymentStatus(currentStatus, newStatus)
		responseJSON, err := json.Marshal(payload)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Could not encode notification",
			})
			return
		}

		var paidAt any
		var expiredAt any

		paymentMethod := mapMidtransPaymentMethod(payload.PaymentType)

		if finalStatus == "paid" {
			paidAt = time.Now()
		}
		if finalStatus == "expired" {
			expiredAt = time.Now()
		}

		_, err = tx.Exec(ctx, `
    UPDATE payments
    SET
        status = $1::text,
        provider_transaction_id = COALESCE(
            provider_transaction_id,
            $2::text
        ),
        payment_method = CASE
            WHEN $3::text <> '' THEN $3::text
            ELSE payment_method
        END,
        provider_response = $4::jsonb,
        paid_at = CASE
            WHEN $1::text = 'paid' THEN COALESCE(paid_at, $5::timestamptz)
            ELSE paid_at
        END,
        expired_at = CASE
            WHEN $1::text = 'expired' THEN COALESCE(expired_at, $6::timestamptz)
            ELSE expired_at
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
`,
			finalStatus,
			payload.TransactionID,
			paymentMethod,
			string(responseJSON),
			paidAt,
			expiredAt,
			paymentID,
		)

		if err != nil {
			log.Printf("Midtrans webhook: update payment failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Could not update payment",
			})
			return
		}

		if finalStatus == "paid" {
			// Ambil order ID untuk memperbarui status order dan invoice.
			var orderID int64

			err = tx.QueryRow(ctx, `
				SELECT order_id
				FROM payments
				WHERE id = $1
			`, paymentID).Scan(&orderID)

			if err != nil {
				log.Printf("Midtrans webhook: retrieve order ID failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Could not retrieve order",
				})
				return
			}

			_, err = tx.Exec(ctx, `
				UPDATE orders
				SET status = 'paid',
					updated_at = CURRENT_TIMESTAMP
				WHERE id = $1
				  AND status = 'pending'
			`, orderID)

			if err != nil {
				log.Printf("Midtrans webhook: update order failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Could not update order",
				})
				return
			}

			// Proses setiap item berdasarkan jenisnya.
			// Query ini mendukung order yang memiliki lebih dari satu item.
			rows, err := tx.Query(ctx, `
				SELECT
					o.id,
					o.user_id,
					oi.id,
					oi.item_type,
					COALESCE(oi.item_reference_id, 0),
					COALESCE(oi.invitation_quota_snapshot, -1),
					COALESCE(oi.duration_months_snapshot, -1),
					COALESCE(oi.invitation_id, 0)
				FROM orders o
				JOIN order_items oi ON oi.order_id = o.id
				WHERE o.id = $1
				ORDER BY oi.id
				FOR UPDATE OF o, oi
			`, orderID)

			if err != nil {
				log.Printf("Midtrans webhook: retrieve order items failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Could not retrieve order items",
				})
				return
			}

			itemCount := 0

			for rows.Next() {
				var (
					itemOrderID     int64
					userID          int64
					orderItemID     int64
					itemType        string
					itemReferenceID int64
					invitationQuota int
					durationMonths  int
					invitationID    int64
				)

				err = rows.Scan(
					&itemOrderID,
					&userID,
					&orderItemID,
					&itemType,
					&itemReferenceID,
					&invitationQuota,
					&durationMonths,
					&invitationID,
				)
				if err != nil {
					rows.Close()
					c.JSON(http.StatusInternalServerError, gin.H{
						"error": "Could not read order item",
					})
					return
				}

				itemCount++

				switch itemType {
				case "package":
					if itemReferenceID <= 0 ||
						invitationQuota < 0 ||
						durationMonths <= 0 {
						rows.Close()
						log.Printf(
							"Midtrans webhook: invalid package entitlement data, orderID=%d itemID=%d",
							itemOrderID,
							orderItemID,
						)
						c.JSON(http.StatusInternalServerError, gin.H{
							"error": "Package entitlement data is invalid",
						})
						return
					}

					_, err = tx.Exec(ctx, `
						INSERT INTO partner_packages (
							user_id,
							package_id,
							order_id,
							order_item_id,
							invitation_quota,
							invitation_used,
							started_at,
							expired_at,
							status
						)
						VALUES (
							$1, $2, $3, $4, $5, 0,
							CURRENT_TIMESTAMP,
							CURRENT_TIMESTAMP + ($6::integer * INTERVAL '1 month'),
							'active'
						)
						ON CONFLICT (order_item_id) DO NOTHING
					`,
						userID,
						itemReferenceID,
						itemOrderID,
						orderItemID,
						invitationQuota,
						durationMonths,
					)

					if err != nil {
						rows.Close()
						log.Printf(
							"Midtrans webhook: grant package entitlement failed: %v",
							err,
						)
						c.JSON(http.StatusInternalServerError, gin.H{
							"error": "Could not grant package entitlement",
						})
						return
					}

				case "addon":
					if itemReferenceID <= 0 || invitationID <= 0 {
						rows.Close()
						log.Printf(
							"Midtrans webhook: invalid addon data, orderID=%d itemID=%d",
							itemOrderID,
							orderItemID,
						)
						c.JSON(http.StatusInternalServerError, gin.H{
							"error": "Add-on entitlement data is invalid",
						})
						return
					}

					// Baca tipe billing untuk menentukan masa berlaku.
					var billingType string
					err = tx.QueryRow(ctx, `
						SELECT billing_type
						FROM addons
						WHERE id = $1
					`, itemReferenceID).Scan(&billingType)

					if err != nil {
						rows.Close()
						log.Printf(
							"Midtrans webhook: retrieve addon failed: %v",
							err,
						)
						c.JSON(http.StatusInternalServerError, gin.H{
							"error": "Could not retrieve add-on",
						})
						return
					}

					var expiresAt any

					switch billingType {
					case "one_time":
						expiresAt = nil
					case "monthly":
						expiresAt = time.Now().AddDate(0, 1, 0)
					case "yearly":
						expiresAt = time.Now().AddDate(1, 0, 0)
					default:
						rows.Close()
						log.Printf(
							"Midtrans webhook: unsupported addon billing type %q",
							billingType,
						)
						c.JSON(http.StatusInternalServerError, gin.H{
							"error": "Add-on billing type is invalid",
						})
						return
					}

					_, err = tx.Exec(ctx, `
						INSERT INTO invitation_addon_entitlements (
							invitation_id,
							addon_id,
							order_item_id,
							status,
							expires_at
						)
						VALUES ($1, $2, $3, 'active', $4)
						ON CONFLICT (order_item_id) DO NOTHING
					`,
						invitationID,
						itemReferenceID,
						orderItemID,
						expiresAt,
					)

					if err != nil {
						rows.Close()
						log.Printf(
							"Midtrans webhook: grant addon entitlement failed: %v",
							err,
						)
						c.JSON(http.StatusInternalServerError, gin.H{
							"error": "Could not grant add-on entitlement",
						})
						return
					}

				default:
					rows.Close()
					log.Printf(
						"Midtrans webhook: unsupported order item type %q, orderID=%d",
						itemType,
						itemOrderID,
					)
					c.JSON(http.StatusInternalServerError, gin.H{
						"error": "Unsupported order item type",
					})
					return
				}
			}

			rowsErr := rows.Err()
			rows.Close()

			if rowsErr != nil {
				log.Printf("Midtrans webhook: iterate order items failed: %v", rowsErr)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Could not process order items",
				})
				return
			}

			if itemCount == 0 {
				log.Printf("Midtrans webhook: order has no items, orderID=%d", orderID)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Order has no items",
				})
				return
			}

			// Invoice mengacu pada orders.id, bukan order_items.id.
			_, err = tx.Exec(ctx, `
				UPDATE invoices
				SET status = 'paid',
					updated_at = CURRENT_TIMESTAMP
				WHERE order_id = $1
				  AND status <> 'paid'
			`, orderID)

			if err != nil {
				log.Printf("Midtrans webhook: update invoice failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Could not update invoice status",
				})
				return
			}
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("Midtrans webhook: commit payment update failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Could not commit payment update",
			})
			return
		}

		c.JSON(http.StatusOK, notificationResult{
			Status: "notification processed",
		})
	}
}

func mapMidtransStatus(
	transactionStatus string,
	fraudStatus string,
) (string, bool) {
	switch transactionStatus {
	case "settlement":
		return "paid", true
	case "capture":
		if fraudStatus == "accept" {
			return "paid", true
		}
		if fraudStatus == "challenge" {
			return "processing", true
		}
		return "pending", true
	case "pending":
		return "pending", true
	case "deny":
		return "failed", true
	case "cancel":
		return "cancelled", true
	case "expire":
		return "expired", true
	case "refund":
		return "refunded", true
	case "partial_refund":
		return "partially_refunded", true
	default:
		return "", false
	}
}

// nextPaymentStatus mencegah notifikasi yang terlambat menurunkan status
// paid/refunded menjadi pending atau failed.
func nextPaymentStatus(currentStatus, incomingStatus string) string {
	currentStatus = strings.ToLower(strings.TrimSpace(currentStatus))

	if currentStatus == incomingStatus {
		return currentStatus
	}

	if currentStatus == "refunded" ||
		currentStatus == "partially_refunded" {
		return currentStatus
	}

	if incomingStatus == "refunded" ||
		incomingStatus == "partially_refunded" {
		return incomingStatus
	}

	if currentStatus == "paid" {
		return currentStatus
	}

	if incomingStatus == "paid" {
		return "paid"
	}

	if currentStatus == "failed" ||
		currentStatus == "expired" ||
		currentStatus == "cancelled" {
		// Status terminal tetap dipertahankan, kecuali ada konfirmasi paid.
		return currentStatus
	}

	return incomingStatus
}

// midtrans payment method
func mapMidtransPaymentMethod(paymentType string) string {
	switch strings.ToLower(strings.TrimSpace(paymentType)) {
	case "bank_transfer":
		return "bank_transfer"

	case "echannel", "permata":
		return "virtual_account"

	case "gopay", "shopeepay", "danamon_online":
		return "e_wallet"

	case "qris":
		return "qris"

	case "credit_card":
		return "credit_card"

	default:
		return "other"
	}
}
