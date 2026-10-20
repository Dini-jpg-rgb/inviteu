package handlers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"backend-golang/internal/middleware"
	"backend-golang/internal/payment"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreatePaymentResponse struct {
	ID            int64  `json:"id"`
	PaymentNumber string `json:"payment_number"`
	OrderID       int64  `json:"order_id"`
	Amount        string `json:"amount"`
	Status        string `json:"status"`
	CheckoutURL   string `json:"checkout_url"`
	SnapToken     string `json:"snap_token"`
}

func generatePaymentNumber() (string, error) {
	randomBytes := make([]byte, 16)

	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	return "PAY-" + strings.ToUpper(hex.EncodeToString(randomBytes)), nil
}

func CreatePayment(
	pool *pgxpool.Pool,
	midtransClient *payment.MidtransClient,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if midtransClient == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"message": "Payment service is unavailable",
			})
			return
		}

		userIDValue, exists := c.Get(middleware.UserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		userID, ok := userIDValue.(int64)
		if !ok || userID <= 0 {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid authenticated user",
			})
			return
		}

		orderID, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || orderID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid order ID",
			})
			return
		}

		idempotencyKey := strings.TrimSpace(c.GetHeader("Idempotency-Key"))
		if idempotencyKey == "" || len(idempotencyKey) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "A valid Idempotency-Key header is required",
			})
			return
		}

		ctx := c.Request.Context()

		// Return the existing payment if this key was already used
		// for the same order and user.
		existing, err := getExistingPayment(ctx, pool, orderID, userID, idempotencyKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve existing payment",
			})
			return
		}
		if existing != nil {
			if existing.CheckoutURL == "" {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Payment checkout is being initialized; retry shortly",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Existing checkout retrieved",
				"data":    existing,
			})
			return
		}

		// Reuse an active payment for this order, even if the client
		// sends a different Idempotency-Key.
		activePayment, err := getActivePayment(ctx, pool, orderID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve active payment",
			})
			return
		}

		if activePayment != nil {
			if activePayment.CheckoutURL == "" || activePayment.SnapToken == "" {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "An active payment is being initialized; retry shortly",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Existing active checkout retrieved",
				"data":    activePayment,
			})
			return
		}

		// Lock the order and reserve one active payment atomically.
		tx, err := pool.Begin(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not start payment transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		var amount int64
		var amountText string
		var orderStatus string
		var isIntegerAmount bool

		err = tx.QueryRow(
			ctx,
			`SELECT total::text, total::bigint, status,
			        total = trunc(total)
			 FROM orders
			 WHERE id = $1 AND user_id = $2
			 FOR UPDATE`,
			orderID,
			userID,
		).Scan(&amountText, &amount, &orderStatus, &isIntegerAmount)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Order not found",
			})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve order",
			})
			return
		}

		if orderStatus != "pending" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Only pending orders can be paid",
			})
			return
		}

		if amount <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Order total must be greater than zero",
			})
			return
		}

		if !isIntegerAmount {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Order total must be a whole IDR amount",
			})
			return
		}

		// Re-check active payment while holding the order lock.
		var active CreatePaymentResponse
		var activeCheckoutURL sql.NullString
		var activeSnapToken string

		err = tx.QueryRow(
			ctx,
			`SELECT p.id, p.payment_number, p.order_id,
			        p.amount::text, p.status, p.checkout_url,
			        COALESCE(p.provider_response->>'token', '')
			 FROM payments p
			 WHERE p.order_id = $1
			   AND p.status IN ('pending', 'processing')
			 ORDER BY p.id DESC
			 LIMIT 1`,
			orderID,
		).Scan(
			&active.ID,
			&active.PaymentNumber,
			&active.OrderID,
			&active.Amount,
			&active.Status,
			&activeCheckoutURL,
			&activeSnapToken,
		)

		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not check active payment",
			})
			return
		}

		if err == nil {
			active.CheckoutURL = activeCheckoutURL.String
			active.SnapToken = activeSnapToken

			if commitErr := tx.Commit(ctx); commitErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not finish payment transaction",
				})
				return
			}

			if active.CheckoutURL == "" || active.SnapToken == "" {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "An active payment is being initialized; retry shortly",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Existing active checkout retrieved",
				"data":    active,
			})
			return
		}

		paymentNumber, err := generatePaymentNumber()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not generate payment number",
			})
			return
		}

		var paymentID int64
		err = tx.QueryRow(
			ctx,
			`INSERT INTO payments (
				order_id,
				payment_number,
				payment_method,
				payment_provider,
				amount,
				status,
				idempotency_key
			)
			VALUES ($1, $2, 'other', 'midtrans', $3, 'pending', $4)
			ON CONFLICT (idempotency_key)
				WHERE idempotency_key IS NOT NULL
			DO NOTHING
			RETURNING id`,
			orderID,
			paymentNumber,
			amountText,
			idempotencyKey,
		).Scan(&paymentID)

		if errors.Is(err, pgx.ErrNoRows) {
			// The idempotency key may have been used by another request.
			// Only return a payment belonging to this user's requested order.
			existing, lookupErr := getExistingPayment(
				ctx, pool, orderID, userID, idempotencyKey,
			)
			if lookupErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve existing payment",
				})
				return
			}

			if existing != nil {
				if existing.CheckoutURL == "" || existing.SnapToken == "" {
					c.JSON(http.StatusConflict, gin.H{
						"success": false,
						"message": "Payment checkout is being initialized; retry shortly",
					})
					return
				}

				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"message": "Existing checkout retrieved",
					"data":    existing,
				})
				return
			}

			// No payment was found for this order and key.
			// The key may belong to a different order, or a concurrent
			// active-payment reservation may have caused the conflict.
			activePayment, activeErr := getActivePayment(
				ctx, pool, orderID, userID,
			)
			if activeErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve active payment",
				})
				return
			}

			if activePayment != nil {
				if activePayment.CheckoutURL == "" || activePayment.SnapToken == "" {
					c.JSON(http.StatusConflict, gin.H{
						"success": false,
						"message": "An active payment is being initialized; retry shortly",
					})
					return
				}

				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"message": "Existing active checkout retrieved",
					"data":    activePayment,
				})
				return
			}

			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Idempotency key has already been used",
			})
			return
		}

		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "An active payment already exists for this order",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create payment record",
			})
			return
		}

		if err = tx.Commit(ctx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not reserve payment",
			})
			return
		}

		// Call Midtrans only after the local payment record is persisted.
		checkout, err := midtransClient.CreateSnapCheckout(
			payment.CreateSnapRequest{
				PaymentNumber: paymentNumber,
				Amount:        amount,
			},
		)
		if err != nil {
			// Keep the payment record for audit/retry. Do not mark it paid.
			_, _ = pool.Exec(
				context.Background(),
				`UPDATE payments
				 SET failure_reason = $1, updated_at = CURRENT_TIMESTAMP
				 WHERE id = $2 AND status = 'pending'`,
				err.Error(),
				paymentID,
			)

			c.JSON(http.StatusBadGateway, gin.H{
				"success": false,
				"message": "Could not initialize payment checkout",
			})
			return
		}

		providerResponse, _ := json.Marshal(map[string]string{
			"token":        checkout.Token,
			"redirect_url": checkout.RedirectURL,
		})

		_, err = pool.Exec(
			ctx,
			`UPDATE payments
			 SET checkout_url = $1,
			     provider_response = $2::jsonb,
			     failure_reason = NULL,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $3 AND status = 'pending'`,
			checkout.RedirectURL,
			providerResponse,
			paymentID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Checkout was created but could not be saved",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Payment checkout created",
			"data": CreatePaymentResponse{
				ID:            paymentID,
				PaymentNumber: paymentNumber,
				OrderID:       orderID,
				Amount:        amountText,
				Status:        "pending",
				CheckoutURL:   checkout.RedirectURL,
				SnapToken:     checkout.Token,
			},
		})
	}
}

func getExistingPayment(
	ctx context.Context,
	pool *pgxpool.Pool,
	orderID int64,
	userID int64,
	idempotencyKey string,
) (*CreatePaymentResponse, error) {
	var result CreatePaymentResponse
	var checkoutURL sql.NullString

	err := pool.QueryRow(
		ctx,
		`SELECT
    		p.id,
    		p.payment_number,
    		p.order_id,
    		p.amount::text,
    		p.status,
    		p.checkout_url,
    		COALESCE(p.provider_response->>'token', '')
		FROM payments p
		JOIN orders o ON o.id = p.order_id
		WHERE p.order_id = $1
  			AND o.user_id = $2
  			AND p.idempotency_key = $3`,
		orderID,
		userID,
		idempotencyKey,
	).Scan(
		&result.ID,
		&result.PaymentNumber,
		&result.OrderID,
		&result.Amount,
		&result.Status,
		&checkoutURL,
		&result.SnapToken,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if checkoutURL.Valid {
		result.CheckoutURL = checkoutURL.String
	}
	return &result, nil
}

// Keep fmt referenced only if it is needed for later handler diagnostics.
var _ = fmt.Sprintf

func getActivePayment(
	ctx context.Context,
	pool *pgxpool.Pool,
	orderID int64,
	userID int64,
) (*CreatePaymentResponse, error) {
	var result CreatePaymentResponse

	var checkoutURL sql.NullString
	var snapToken string

	err := pool.QueryRow(
		ctx,
		`SELECT
            p.id,
            p.payment_number,
            p.order_id,
            p.amount::text,
            p.status,
            p.checkout_url,
            COALESCE(p.provider_response->>'token', '')
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         WHERE p.order_id = $1
           AND o.user_id = $2
           AND p.status IN ('pending', 'processing')
         ORDER BY p.id DESC
         LIMIT 1`,
		orderID,
		userID,
	).Scan(
		&result.ID,
		&result.PaymentNumber,
		&result.OrderID,
		&result.Amount,
		&result.Status,
		&checkoutURL,
		&snapToken,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	result.CheckoutURL = checkoutURL.String
	result.SnapToken = snapToken

	return &result, nil
}
