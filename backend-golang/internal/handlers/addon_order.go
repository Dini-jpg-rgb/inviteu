package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateAddonOrderRequest struct {
	AddonID int64 `json:"addon_id" binding:"required,gt=0"`
}

// CreateAddonOrder membuat order untuk satu add-on pada satu invitation.
func CreateAddonOrder(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if pool == nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database is not configured",
			})
			return
		}

		userIDValue, exists := c.Get(middleware.UserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
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

		invitationID, err := strconv.ParseInt(
			strings.TrimSpace(c.Param("invitation_id")),
			10,
			64,
		)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
			})
			return
		}

		var req CreateAddonOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "A valid addon_id is required",
			})
			return
		}

		ctx, cancel := context.WithTimeout(
			c.Request.Context(),
			10*time.Second,
		)
		defer cancel()

		tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("CreateAddonOrder: begin transaction failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not start transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		// Pastikan invitation dimiliki oleh partner yang sedang login.
		// Lock baris invitation agar dua request pembelian untuk
		// invitation yang sama tidak melewati pemeriksaan bersamaan.
		var ownedInvitationID int64
		err = tx.QueryRow(ctx, `
			SELECT id
			FROM invitations
			WHERE id = $1
			  AND user_id = $2
			FOR UPDATE
		`, invitationID, userID).Scan(&ownedInvitationID)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}
		if err != nil {
			log.Printf(
				"CreateAddonOrder: verify invitation ownership failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify invitation ownership",
			})
			return
		}

		// Partner wajib memiliki paket aktif yang sudah mulai
		// dan belum kedaluwarsa.
		var hasActivePackage bool
		err = tx.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM partner_packages
				WHERE user_id = $1
				  AND status = 'active'
				  AND (
					  started_at IS NULL
					  OR started_at <= CURRENT_TIMESTAMP
				  )
				  AND (
					  expired_at IS NULL
					  OR expired_at > CURRENT_TIMESTAMP
				  )
			)
		`, userID).Scan(&hasActivePackage)

		if err != nil {
			log.Printf(
				"CreateAddonOrder: check active package failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify active package",
			})
			return
		}

		if !hasActivePackage {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "An active package is required to purchase an add-on",
			})
			return
		}

		// Ambil harga dan informasi add-on dari database.
		var (
			addonName   string
			addonPrice  string
			addonStatus string
		)

		err = tx.QueryRow(ctx, `
			SELECT name, price::text, status
			FROM addons
			WHERE id = $1
			FOR SHARE
		`, req.AddonID).Scan(
			&addonName,
			&addonPrice,
			&addonStatus,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Add-on not found",
			})
			return
		}
		if err != nil {
			log.Printf("CreateAddonOrder: retrieve add-on failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve add-on",
			})
			return
		}

		if addonStatus != "active" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "This add-on is not available",
			})
			return
		}

		// Cegah pembelian ulang jika entitlement add-on masih aktif.
		// Untuk add-on berjangka, entitlement yang sudah kedaluwarsa
		// tidak dianggap aktif meskipun statusnya belum diperbarui.
		var alreadyEntitled bool
		err = tx.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM invitation_addon_entitlements
				WHERE invitation_id = $1
				  AND addon_id = $2
				  AND status = 'active'
				  AND (
					  expires_at IS NULL
					  OR expires_at > CURRENT_TIMESTAMP
				  )
			)
		`, invitationID, req.AddonID).Scan(&alreadyEntitled)

		if err != nil {
			log.Printf(
				"CreateAddonOrder: check existing entitlement failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not check existing add-on entitlement",
			})
			return
		}

		if alreadyEntitled {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "This add-on is already active for this invitation",
			})
			return
		}

		// Gunakan helper nomor order dan invoice yang sudah ada.
		orderNumber, err := generateOrderNumber()
		if err != nil {
			log.Printf(
				"CreateAddonOrder: generate order number failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not generate order number",
			})
			return
		}

		invoiceNumber, err := generateInvoiceNumber()
		if err != nil {
			log.Printf(
				"CreateAddonOrder: generate invoice number failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not generate invoice number",
			})
			return
		}

		// Buat order dengan status pending.
		// PostgreSQL NUMERIC dipakai untuk nilai uang.
		var orderID int64
		err = tx.QueryRow(ctx, `
			INSERT INTO orders (
				user_id,
				order_number,
				subtotal,
				discount,
				total,
				status
			)
			VALUES (
				$1,
				$2,
				$3::numeric,
				0,
				$3::numeric,
				'pending'
			)
			RETURNING id
		`, userID, orderNumber, addonPrice).Scan(&orderID)

		if err != nil {
			log.Printf("CreateAddonOrder: create order failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create add-on order",
			})
			return
		}

		// Simpan jenis item, referensi add-on, dan invitation tujuan.
		var orderItemID int64
		err = tx.QueryRow(ctx, `
			INSERT INTO order_items (
				order_id,
				item_type,
				item_reference_id,
				item_name,
				quantity,
				unit_price,
				subtotal,
				invitation_id
			)
			VALUES (
				$1,
				'addon',
				$2,
				$3,
				1,
				$4::numeric,
				$4::numeric,
				$5
			)
			RETURNING id
		`,
			orderID,
			req.AddonID,
			addonName,
			addonPrice,
			invitationID,
		).Scan(&orderItemID)

		if err != nil {
			log.Printf(
				"CreateAddonOrder: create order item failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create add-on order item",
			})
			return
		}

		// Setiap order mempunyai satu invoice.
		var invoiceID int64
		err = tx.QueryRow(ctx, `
			INSERT INTO invoices (
				order_id,
				invoice_number,
				subtotal,
				discount,
				tax_amount,
				total,
				status
			)
			VALUES (
				$1,
				$2,
				$3::numeric,
				0,
				0,
				$3::numeric,
				'unpaid'
			)
			RETURNING id
		`, orderID, invoiceNumber, addonPrice).Scan(&invoiceID)

		if err != nil {
			log.Printf(
				"CreateAddonOrder: create invoice failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create invoice",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf(
				"CreateAddonOrder: commit transaction failed: %v",
				err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not save add-on order",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Add-on order created successfully",
			"data": gin.H{
				"id":             orderID,
				"order_number":   orderNumber,
				"order_item_id":  orderItemID,
				"item_type":      "addon",
				"addon_id":       req.AddonID,
				"invitation_id":  invitationID,
				"subtotal":       addonPrice,
				"discount":       "0",
				"total":          addonPrice,
				"status":         "pending",
				"invoice_id":     invoiceID,
				"invoice_number": invoiceNumber,
			},
		})
	}
}
