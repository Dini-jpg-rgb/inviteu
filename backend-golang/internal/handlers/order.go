package handlers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateOrderRequest struct {
	Items []CreateOrderItemRequest `json:"items" binding:"required,min=1"`
}

type CreateOrderItemRequest struct {
	ItemType        string `json:"item_type" binding:"required"`
	ItemReferenceID int64  `json:"item_reference_id" binding:"required,gt=0"`
	Quantity        int    `json:"quantity" binding:"required,gt=0"`
}

func generateOrderNumber() (string, error) {
	randomBytes := make([]byte, 8)

	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	return "ORD-" + strings.ToUpper(hex.EncodeToString(randomBytes)), nil
}

func CreateOrder(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil user ID dari JWT yang sudah diverifikasi middleware.
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

		// Endpoint versi awal hanya menerima pembelian paket.
		var req CreateOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid order request",
			})
			return
		}

		if len(req.Items) != 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "An order must contain exactly one package",
			})
			return
		}

		for _, item := range req.Items {
			if item.ItemType != "package" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Only package items are supported",
				})
				return
			}

			if item.Quantity != 1 {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Package quantity must be 1",
				})
				return
			}
		}

		ctx := c.Request.Context()

		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not start order transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		orderNumber, err := generateOrderNumber()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not generate order number",
			})
			return
		}

		// Buat order sementara. Total akan dihitung oleh PostgreSQL.
		var orderID int64
		err = tx.QueryRow(
			ctx,
			`INSERT INTO orders
				(user_id, order_number, subtotal, discount, total, status)
			 VALUES ($1, $2, 0, 0, 0, 'pending')
			 RETURNING id`,
			userID,
			orderNumber,
		).Scan(&orderID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create order",
			})
			return
		}

		for _, item := range req.Items {
			var itemName string
			var unitPrice string
			var invitationQuota int
			var durationMonths int

			err = tx.QueryRow(
				ctx,
				`SELECT name, price::text, invitation_quota, duration_months
				 FROM packages
				 WHERE id = $1 AND status = 'active'
				 FOR SHARE`,
				item.ItemReferenceID,
			).Scan(
				&itemName,
				&unitPrice,
				&invitationQuota,
				&durationMonths,
			)

			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Package not found or inactive",
				})
				return
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not retrieve package",
				})
				return
			}

			// Paket lama yang belum memiliki durasi tidak boleh dibeli.
			if durationMonths <= 0 {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Package duration is not configured",
				})
				return
			}

			// Hitung subtotal menggunakan NUMERIC PostgreSQL,
			// bukan float64 di Go.
			var itemSubtotal string
			err = tx.QueryRow(
				ctx,
				`SELECT ($1::numeric * $2::integer)::text`,
				unitPrice,
				item.Quantity,
			).Scan(&itemSubtotal)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not calculate order item",
				})
				return
			}

			_, err = tx.Exec(
				ctx,
				`INSERT INTO order_items
					(order_id, item_type, item_reference_id,
					 item_name, quantity, unit_price, subtotal,
					 invitation_quota_snapshot, duration_months_snapshot)
				 VALUES ($1, 'package', $2, $3, $4, $5::numeric, $6::numeric, $7, $8)`,
				orderID,
				item.ItemReferenceID,
				itemName,
				item.Quantity,
				unitPrice,
				itemSubtotal,
				invitationQuota,
				durationMonths,
			)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not save order item",
				})
				return
			}

			_, err = tx.Exec(
				ctx,
				`UPDATE orders
				 SET subtotal = subtotal + $1::numeric,
				     total = total + $1::numeric,
				     updated_at = CURRENT_TIMESTAMP
				 WHERE id = $2`,
				itemSubtotal,
				orderID,
			)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not update order total",
				})
				return
			}
		}

		var subtotal string
		var discount string
		var total string

		err = tx.QueryRow(
			ctx,
			`SELECT subtotal::text, discount::text, total::text
			 FROM orders
			 WHERE id = $1`,
			orderID,
		).Scan(&subtotal, &discount, &total)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve order total",
			})
			return
		}

		// Buat nomor invoice untuk order ini.
		invoiceNumber, err := generateInvoiceNumber()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not generate invoice number",
			})
			return
		}

		// Invoice dibuat dalam transaksi yang sama dengan order.
		// Status awal invoice adalah unpaid.
		var invoiceID int64

		err = tx.QueryRow(
			ctx,
			`INSERT INTO invoices (
				order_id,
				invoice_number,
				subtotal,
				discount,
				tax_amount,
				total,
				status
			)
			VALUES ($1, $2, $3::numeric, $4::numeric, 0, $5::numeric, 'unpaid')
			RETURNING id`,
			orderID,
			invoiceNumber,
			subtotal,
			discount,
			total,
		).Scan(&invoiceID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create invoice",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not finalize order",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Order created successfully",
			"data": gin.H{
				"id":             orderID,
				"order_number":   orderNumber,
				"subtotal":       subtotal,
				"discount":       discount,
				"total":          total,
				"status":         "pending",
				"invoice_id":     invoiceID,
				"invoice_number": invoiceNumber,
			},
		})
	}
}

// Hindari error unused import bila file diedit saat pengembangan.
var _ = fmt.Sprintf

func GetOrders(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT id, order_number, subtotal::text,
			        discount::text, total::text, status,
			        created_at, updated_at
			 FROM orders
			 WHERE user_id = $1
			 ORDER BY created_at DESC, id DESC`,
			userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve orders",
			})
			return
		}
		defer rows.Close()

		type OrderResponse struct {
			ID          int64     `json:"id"`
			OrderNumber string    `json:"order_number"`
			Subtotal    string    `json:"subtotal"`
			Discount    string    `json:"discount"`
			Total       string    `json:"total"`
			Status      string    `json:"status"`
			CreatedAt   time.Time `json:"created_at"`
			UpdatedAt   time.Time `json:"updated_at"`
		}

		orders := make([]OrderResponse, 0)

		for rows.Next() {
			var order OrderResponse

			if err := rows.Scan(
				&order.ID,
				&order.OrderNumber,
				&order.Subtotal,
				&order.Discount,
				&order.Total,
				&order.Status,
				&order.CreatedAt,
				&order.UpdatedAt,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read order data",
				})
				return
			}

			orders = append(orders, order)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read order data",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Orders retrieved successfully",
			"data":    orders,
		})
	}
}

func GetOrderByID(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ambil user ID dari JWT yang sudah diverifikasi middleware.
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

		// 2. Validasi format ID dari URL.
		orderID, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || orderID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid order ID",
			})
			return
		}

		ctx := c.Request.Context()

		// 3. Cari order sekaligus validasi kepemilikannya.
		// Order milik user lain diperlakukan sama dengan order yang tidak ditemukan.
		type OrderResponse struct {
			ID          int64               `json:"id"`
			OrderNumber string              `json:"order_number"`
			Subtotal    string              `json:"subtotal"`
			Discount    string              `json:"discount"`
			Total       string              `json:"total"`
			Status      string              `json:"status"`
			CreatedAt   time.Time           `json:"created_at"`
			UpdatedAt   time.Time           `json:"updated_at"`
			Items       []OrderItemResponse `json:"items"`
		}

		var order OrderResponse

		err = pool.QueryRow(
			ctx,
			`SELECT id, order_number, subtotal::text,
			        discount::text, total::text, status,
			        created_at, updated_at
			 FROM orders
			 WHERE id = $1 AND user_id = $2`,
			orderID,
			userID,
		).Scan(
			&order.ID,
			&order.OrderNumber,
			&order.Subtotal,
			&order.Discount,
			&order.Total,
			&order.Status,
			&order.CreatedAt,
			&order.UpdatedAt,
		)

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

		// 4. Ambil item yang termasuk dalam order tersebut.
		rows, err := pool.Query(
			ctx,
			`SELECT id, item_type, item_reference_id,
			        item_name, quantity, unit_price::text,
			        subtotal::text, invitation_id,
			        created_at, updated_at
			 FROM order_items
			 WHERE order_id = $1
			 ORDER BY id ASC`,
			order.ID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve order items",
			})
			return
		}
		defer rows.Close()

		order.Items = make([]OrderItemResponse, 0)

		for rows.Next() {
			var item OrderItemResponse
			var itemReferenceID sql.NullInt64
			var invitationID sql.NullInt64

			if err := rows.Scan(
				&item.ID,
				&item.ItemType,
				&itemReferenceID,
				&item.ItemName,
				&item.Quantity,
				&item.UnitPrice,
				&item.Subtotal,
				&invitationID,
				&item.CreatedAt,
				&item.UpdatedAt,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read order item data",
				})
				return
			}

			if itemReferenceID.Valid {
				value := itemReferenceID.Int64
				item.ItemReferenceID = &value
			}

			if invitationID.Valid {
				value := invitationID.Int64
				item.InvitationID = &value
			}

			order.Items = append(order.Items, item)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read order item data",
			})
			return
		}

		// 5. Kirim detail order beserta item-nya.
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Order retrieved successfully",
			"data":    order,
		})
	}
}

type OrderItemResponse struct {
	ID              int64     `json:"id"`
	ItemType        string    `json:"item_type"`
	ItemReferenceID *int64    `json:"item_reference_id"`
	ItemName        string    `json:"item_name"`
	Quantity        int       `json:"quantity"`
	UnitPrice       string    `json:"unit_price"`
	Subtotal        string    `json:"subtotal"`
	InvitationID    *int64    `json:"invitation_id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
