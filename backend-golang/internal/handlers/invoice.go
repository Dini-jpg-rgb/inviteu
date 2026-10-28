package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"backend-golang/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func generateInvoiceNumber() (string, error) {
	randomBytes := make([]byte, 8)

	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	return "INV-" + strings.ToUpper(hex.EncodeToString(randomBytes)), nil
}

type InvoiceHistoryItem struct {
	ID            int64      `json:"id"`
	OrderID       int64      `json:"order_id"`
	OrderNumber   string     `json:"order_number"`
	InvoiceNumber string     `json:"invoice_number"`
	IssuedAt      time.Time  `json:"issued_at"`
	DueAt         *time.Time `json:"due_at"`
	Total         string     `json:"total"`
	Status        string     `json:"status"`
}

func GetInvoices(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := c.Get(middleware.UserIDKey)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		partnerID, ok := userID.(int64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid user identity",
			})
			return
		}

		ctx := c.Request.Context()

		rows, err := pool.Query(ctx, `
            SELECT
                i.id,
                i.order_id,
                o.order_number,
                i.invoice_number,
                i.issued_at,
                i.due_at,
                i.total::text,
                i.status
            FROM invoices i
            JOIN orders o ON o.id = i.order_id
            WHERE o.user_id = $1
            ORDER BY i.issued_at DESC, i.id DESC
        `, partnerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invoices",
			})
			return
		}
		defer rows.Close()

		invoices := make([]InvoiceHistoryItem, 0)

		for rows.Next() {
			var invoice InvoiceHistoryItem

			if err := rows.Scan(
				&invoice.ID,
				&invoice.OrderID,
				&invoice.OrderNumber,
				&invoice.InvoiceNumber,
				&invoice.IssuedAt,
				&invoice.DueAt,
				&invoice.Total,
				&invoice.Status,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read invoice data",
				})
				return
			}

			invoices = append(invoices, invoice)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read invoice data",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    invoices,
		})
	}
}
