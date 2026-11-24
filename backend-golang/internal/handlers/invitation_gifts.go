package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var giftNumberRegex = regexp.MustCompile(`^[0-9 \-+]+$`)

func isValidGiftNumber(s string) bool {
	if !giftNumberRegex.MatchString(s) {
		return false
	}
	return strings.ContainsAny(s, "0123456789")
}

type PartnerInvitationGiftItem struct {
	ID               int64     `json:"id"`
	GiftType         string    `json:"gift_type"`
	ProviderName     *string   `json:"provider_name"`
	AccountName      *string   `json:"account_name"`
	AccountNumber    *string   `json:"account_number"`
	WalletIdentifier *string   `json:"wallet_identifier"`
	Instructions     *string   `json:"instructions"`
	SortOrder        int       `json:"sort_order"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type PublicInvitationGiftItem struct {
	GiftType         string  `json:"gift_type"`
	ProviderName     *string `json:"provider_name"`
	AccountName      *string `json:"account_name"`
	AccountNumber    *string `json:"account_number"`
	WalletIdentifier *string `json:"wallet_identifier"`
	Instructions     *string `json:"instructions"`
	SortOrder        int     `json:"sort_order"`
}

type CreateInvitationGiftRequest struct {
	GiftType         string  `json:"gift_type"`
	ProviderName     *string `json:"provider_name"`
	AccountName      *string `json:"account_name"`
	AccountNumber    *string `json:"account_number"`
	WalletIdentifier *string `json:"wallet_identifier"`
	Instructions     *string `json:"instructions"`
	SortOrder        *int    `json:"sort_order"`
	IsActive         *bool   `json:"is_active"`
}

type UpdateInvitationGiftRequest struct {
	GiftType         *string `json:"gift_type"`
	ProviderName     *string `json:"provider_name"`
	AccountName      *string `json:"account_name"`
	AccountNumber    *string `json:"account_number"`
	WalletIdentifier *string `json:"wallet_identifier"`
	Instructions     *string `json:"instructions"`
	SortOrder        *int    `json:"sort_order"`
	IsActive         *bool   `json:"is_active"`
}

func sendPublicGiftsNotFound(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusNotFound, gin.H{
		"success": false,
		"message": "Invitation not found",
	})
}

// GetInvitationGifts lists all gift information for a partner's invitation.
func GetInvitationGifts(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		if idParam == "" {
			idParam = strings.TrimSpace(c.Param("invitation_id"))
		}
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
				"errors": gin.H{
					"id": "invitation id must be a positive integer",
				},
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		ctx := c.Request.Context()

		var exists bool
		err = pool.QueryRow(
			ctx,
			`SELECT EXISTS (
				SELECT 1 FROM invitations WHERE id = $1 AND user_id = $2
			)`,
			invitationID,
			userID,
		).Scan(&exists)
		if err != nil {
			log.Printf("GetInvitationGifts: check ownership: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Invitation not found",
			})
			return
		}

		rows, err := pool.Query(
			ctx,
			`SELECT id, gift_type, provider_name, account_name, account_number, wallet_identifier, instructions, sort_order, is_active, created_at, updated_at
			 FROM invitation_gifts
			 WHERE invitation_id = $1
			 ORDER BY sort_order ASC, id ASC`,
			invitationID,
		)
		if err != nil {
			log.Printf("GetInvitationGifts: query gifts: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation gifts",
			})
			return
		}
		defer rows.Close()

		items := make([]PartnerInvitationGiftItem, 0)
		for rows.Next() {
			var item PartnerInvitationGiftItem
			if err := rows.Scan(
				&item.ID,
				&item.GiftType,
				&item.ProviderName,
				&item.AccountName,
				&item.AccountNumber,
				&item.WalletIdentifier,
				&item.Instructions,
				&item.SortOrder,
				&item.IsActive,
				&item.CreatedAt,
				&item.UpdatedAt,
			); err != nil {
				log.Printf("GetInvitationGifts: scan gift: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read invitation gifts",
				})
				return
			}
			items = append(items, item)
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetInvitationGifts: rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read invitation gifts",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation gifts retrieved successfully",
			"data":    items,
		})
	}
}

// CreateInvitationGift creates a new gift entry for an invitation.
func CreateInvitationGift(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		if idParam == "" {
			idParam = strings.TrimSpace(c.Param("invitation_id"))
		}
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
				"errors": gin.H{
					"id": "invitation id must be a positive integer",
				},
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024)

		var req CreateInvitationGiftRequest
		decoder := json.NewDecoder(c.Request.Body)
		if err := decoder.Decode(&req); err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Request body exceeds maximum size of 64KB",
					"errors": gin.H{
						"body": "request body must not exceed 64KB",
					},
				})
				return
			}
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
				"errors": gin.H{
					"body": "request body must be valid JSON",
				},
			})
			return
		}

		fieldErrors := make(map[string]string)

		giftType := strings.TrimSpace(req.GiftType)
		if giftType != "bank_transfer" && giftType != "e_wallet" && giftType != "physical_gift" && giftType != "other" {
			fieldErrors["gift_type"] = "gift_type must be one of: bank_transfer, e_wallet, physical_gift, other"
		}

		cleanString := func(p *string, maxLen int, fieldName string) *string {
			if p == nil {
				return nil
			}
			s := strings.TrimSpace(*p)
			if s == "" {
				return nil
			}
			if utf8.RuneCountInString(s) > maxLen {
				fieldErrors[fieldName] = fieldName + " must not exceed " + strconv.Itoa(maxLen) + " characters"
			}
			return &s
		}

		cleanProvider := cleanString(req.ProviderName, 150, "provider_name")
		cleanAccountName := cleanString(req.AccountName, 255, "account_name")
		cleanAccountNumber := cleanString(req.AccountNumber, 255, "account_number")
		cleanWalletIdentifier := cleanString(req.WalletIdentifier, 255, "wallet_identifier")
		cleanInstructions := cleanString(req.Instructions, 2000, "instructions")

		if cleanAccountNumber != nil && !isValidGiftNumber(*cleanAccountNumber) {
			fieldErrors["account_number"] = "account_number must only contain digits, spaces, hyphens, and plus signs, and contain at least one digit"
		}
		if cleanWalletIdentifier != nil && !isValidGiftNumber(*cleanWalletIdentifier) {
			fieldErrors["wallet_identifier"] = "wallet_identifier must only contain digits, spaces, hyphens, and plus signs, and contain at least one digit"
		}

		sortOrder := 0
		if req.SortOrder != nil {
			if *req.SortOrder < 0 {
				fieldErrors["sort_order"] = "sort_order must be a non-negative integer"
			} else {
				sortOrder = *req.SortOrder
			}
		}

		isActive := true
		if req.IsActive != nil {
			isActive = *req.IsActive
		}

		switch giftType {
		case "bank_transfer":
			if cleanProvider == nil {
				fieldErrors["provider_name"] = "provider_name is required for bank_transfer"
			}
			if cleanAccountName == nil {
				fieldErrors["account_name"] = "account_name is required for bank_transfer"
			}
			if cleanAccountNumber == nil {
				fieldErrors["account_number"] = "account_number is required for bank_transfer"
			}
		case "e_wallet":
			if cleanProvider == nil {
				fieldErrors["provider_name"] = "provider_name is required for e_wallet"
			}
			if cleanAccountName == nil {
				fieldErrors["account_name"] = "account_name is required for e_wallet"
			}
			if cleanAccountNumber == nil && cleanWalletIdentifier == nil {
				fieldErrors["account_number"] = "account_number or wallet_identifier is required for e_wallet"
				fieldErrors["wallet_identifier"] = "account_number or wallet_identifier is required for e_wallet"
			}
		case "physical_gift":
			if cleanInstructions == nil {
				fieldErrors["instructions"] = "instructions is required for physical_gift"
			}
		case "other":
			if cleanInstructions == nil {
				fieldErrors["instructions"] = "instructions is required for other"
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

		ctx := c.Request.Context()
		tx, err := pool.Begin(ctx)
		if err != nil {
			log.Printf("CreateInvitationGift: begin tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not start transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(ctx)
		}()

		var invID int64
		err = tx.QueryRow(
			ctx,
			`SELECT id
			 FROM invitations
			 WHERE id = $1 AND user_id = $2
			 FOR UPDATE`,
			invitationID,
			userID,
		).Scan(&invID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Invitation not found",
				})
				return
			}
			log.Printf("CreateInvitationGift: lock invitation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		var count int
		err = tx.QueryRow(
			ctx,
			`SELECT COUNT(*)
			 FROM invitation_gifts
			 WHERE invitation_id = $1`,
			invitationID,
		).Scan(&count)
		if err != nil {
			log.Printf("CreateInvitationGift: count gifts: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		if count >= 10 {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Maximum number of gifts reached",
				"errors": gin.H{
					"gifts": "gift_limit_reached",
				},
			})
			return
		}

		var item PartnerInvitationGiftItem
		err = tx.QueryRow(
			ctx,
			`INSERT INTO invitation_gifts (
				invitation_id, gift_type, provider_name, account_name,
				account_number, wallet_identifier, instructions, sort_order, is_active
			 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 RETURNING id, gift_type, provider_name, account_name, account_number, wallet_identifier, instructions, sort_order, is_active, created_at, updated_at`,
			invitationID,
			giftType,
			cleanProvider,
			cleanAccountName,
			cleanAccountNumber,
			cleanWalletIdentifier,
			cleanInstructions,
			sortOrder,
			isActive,
		).Scan(
			&item.ID,
			&item.GiftType,
			&item.ProviderName,
			&item.AccountName,
			&item.AccountNumber,
			&item.WalletIdentifier,
			&item.Instructions,
			&item.SortOrder,
			&item.IsActive,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		if err != nil {
			log.Printf("CreateInvitationGift: insert: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create invitation gift",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("CreateInvitationGift: commit: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not commit transaction",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Invitation gift created successfully",
			"data":    item,
		})
	}
}

// UpdateInvitationGift updates an existing gift entry with partial merge validation.
func UpdateInvitationGift(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		if idParam == "" {
			idParam = strings.TrimSpace(c.Param("invitation_id"))
		}
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
				"errors": gin.H{
					"id": "invitation id must be a positive integer",
				},
			})
			return
		}

		giftIDParam := strings.TrimSpace(c.Param("gift_id"))
		giftID, err := strconv.ParseInt(giftIDParam, 10, 64)
		if err != nil || giftID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid gift ID",
				"errors": gin.H{
					"gift_id": "gift id must be a positive integer",
				},
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024)

		var req UpdateInvitationGiftRequest
		decoder := json.NewDecoder(c.Request.Body)
		if err := decoder.Decode(&req); err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Request body exceeds maximum size of 64KB",
					"errors": gin.H{
						"body": "request body must not exceed 64KB",
					},
				})
				return
			}
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request body",
				"errors": gin.H{
					"body": "request body must be valid JSON",
				},
			})
			return
		}

		if req.GiftType == nil && req.ProviderName == nil && req.AccountName == nil &&
			req.AccountNumber == nil && req.WalletIdentifier == nil && req.Instructions == nil &&
			req.SortOrder == nil && req.IsActive == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Validation failed",
				"errors": gin.H{
					"body": "at least one field must be provided for update",
				},
			})
			return
		}

		ctx := c.Request.Context()
		tx, err := pool.Begin(ctx)
		if err != nil {
			log.Printf("UpdateInvitationGift: begin tx: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not start transaction",
			})
			return
		}
		defer func() {
			_ = tx.Rollback(ctx)
		}()

		var current struct {
			ID               int64
			GiftType         string
			ProviderName     *string
			AccountName      *string
			AccountNumber    *string
			WalletIdentifier *string
			Instructions     *string
			SortOrder        int
			IsActive         bool
		}

		err = tx.QueryRow(
			ctx,
			`SELECT ig.id, ig.gift_type, ig.provider_name, ig.account_name, ig.account_number, ig.wallet_identifier, ig.instructions, ig.sort_order, ig.is_active
			 FROM invitation_gifts ig
			 JOIN invitations i ON i.id = ig.invitation_id
			 WHERE ig.id = $1 AND ig.invitation_id = $2 AND i.user_id = $3
			 FOR UPDATE OF ig`,
			giftID,
			invitationID,
			userID,
		).Scan(
			&current.ID,
			&current.GiftType,
			&current.ProviderName,
			&current.AccountName,
			&current.AccountNumber,
			&current.WalletIdentifier,
			&current.Instructions,
			&current.SortOrder,
			&current.IsActive,
		)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Gift not found",
			})
			return
		}
		if err != nil {
			log.Printf("UpdateInvitationGift: query row for update: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		fieldErrors := make(map[string]string)

		mergedGiftType := current.GiftType
		if req.GiftType != nil {
			trimmedType := strings.TrimSpace(*req.GiftType)
			if trimmedType != "bank_transfer" && trimmedType != "e_wallet" && trimmedType != "physical_gift" && trimmedType != "other" {
				fieldErrors["gift_type"] = "gift_type must be one of: bank_transfer, e_wallet, physical_gift, other"
			} else {
				mergedGiftType = trimmedType
			}
		}

		cleanStringPatch := func(newVal *string, curVal *string, maxLen int, fieldName string) *string {
			if newVal == nil {
				return curVal
			}
			s := strings.TrimSpace(*newVal)
			if s == "" {
				return nil
			}
			if utf8.RuneCountInString(s) > maxLen {
				fieldErrors[fieldName] = fieldName + " must not exceed " + strconv.Itoa(maxLen) + " characters"
			}
			return &s
		}

		mergedProvider := cleanStringPatch(req.ProviderName, current.ProviderName, 150, "provider_name")
		mergedAccountName := cleanStringPatch(req.AccountName, current.AccountName, 255, "account_name")
		mergedAccountNumber := cleanStringPatch(req.AccountNumber, current.AccountNumber, 255, "account_number")
		mergedWalletIdentifier := cleanStringPatch(req.WalletIdentifier, current.WalletIdentifier, 255, "wallet_identifier")
		mergedInstructions := cleanStringPatch(req.Instructions, current.Instructions, 2000, "instructions")

		if mergedAccountNumber != nil && !isValidGiftNumber(*mergedAccountNumber) {
			fieldErrors["account_number"] = "account_number must only contain digits, spaces, hyphens, and plus signs, and contain at least one digit"
		}
		if mergedWalletIdentifier != nil && !isValidGiftNumber(*mergedWalletIdentifier) {
			fieldErrors["wallet_identifier"] = "wallet_identifier must only contain digits, spaces, hyphens, and plus signs, and contain at least one digit"
		}

		mergedSortOrder := current.SortOrder
		if req.SortOrder != nil {
			if *req.SortOrder < 0 {
				fieldErrors["sort_order"] = "sort_order must be a non-negative integer"
			} else {
				mergedSortOrder = *req.SortOrder
			}
		}

		mergedIsActive := current.IsActive
		if req.IsActive != nil {
			mergedIsActive = *req.IsActive
		}

		switch mergedGiftType {
		case "bank_transfer":
			if mergedProvider == nil {
				fieldErrors["provider_name"] = "provider_name is required for bank_transfer"
			}
			if mergedAccountName == nil {
				fieldErrors["account_name"] = "account_name is required for bank_transfer"
			}
			if mergedAccountNumber == nil {
				fieldErrors["account_number"] = "account_number is required for bank_transfer"
			}
		case "e_wallet":
			if mergedProvider == nil {
				fieldErrors["provider_name"] = "provider_name is required for e_wallet"
			}
			if mergedAccountName == nil {
				fieldErrors["account_name"] = "account_name is required for e_wallet"
			}
			if mergedAccountNumber == nil && mergedWalletIdentifier == nil {
				fieldErrors["account_number"] = "account_number or wallet_identifier is required for e_wallet"
				fieldErrors["wallet_identifier"] = "account_number or wallet_identifier is required for e_wallet"
			}
		case "physical_gift":
			if mergedInstructions == nil {
				fieldErrors["instructions"] = "instructions is required for physical_gift"
			}
		case "other":
			if mergedInstructions == nil {
				fieldErrors["instructions"] = "instructions is required for other"
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

		var item PartnerInvitationGiftItem
		err = tx.QueryRow(
			ctx,
			`UPDATE invitation_gifts
			 SET gift_type = $1,
			     provider_name = $2,
			     account_name = $3,
			     account_number = $4,
			     wallet_identifier = $5,
			     instructions = $6,
			     sort_order = $7,
			     is_active = $8,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $9
			 RETURNING id, gift_type, provider_name, account_name, account_number, wallet_identifier, instructions, sort_order, is_active, created_at, updated_at`,
			mergedGiftType,
			mergedProvider,
			mergedAccountName,
			mergedAccountNumber,
			mergedWalletIdentifier,
			mergedInstructions,
			mergedSortOrder,
			mergedIsActive,
			giftID,
		).Scan(
			&item.ID,
			&item.GiftType,
			&item.ProviderName,
			&item.AccountName,
			&item.AccountNumber,
			&item.WalletIdentifier,
			&item.Instructions,
			&item.SortOrder,
			&item.IsActive,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		if err != nil {
			log.Printf("UpdateInvitationGift: update: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not update invitation gift",
			})
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("UpdateInvitationGift: commit: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not commit transaction",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation gift updated successfully",
			"data":    item,
		})
	}
}

// DeleteInvitationGift deletes a gift entry for an invitation.
func DeleteInvitationGift(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := strings.TrimSpace(c.Param("id"))
		if idParam == "" {
			idParam = strings.TrimSpace(c.Param("invitation_id"))
		}
		invitationID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil || invitationID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid invitation ID",
				"errors": gin.H{
					"id": "invitation id must be a positive integer",
				},
			})
			return
		}

		giftIDParam := strings.TrimSpace(c.Param("gift_id"))
		giftID, err := strconv.ParseInt(giftIDParam, 10, 64)
		if err != nil || giftID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid gift ID",
				"errors": gin.H{
					"gift_id": "gift id must be a positive integer",
				},
			})
			return
		}

		userID, ok := invitationUserID(c)
		if !ok {
			return
		}

		tag, err := pool.Exec(
			c.Request.Context(),
			`DELETE FROM invitation_gifts ig
			 USING invitations i
			 WHERE ig.id = $1
			   AND ig.invitation_id = $2
			   AND i.id = $2
			   AND i.user_id = $3`,
			giftID,
			invitationID,
			userID,
		)
		if err != nil {
			log.Printf("DeleteInvitationGift: delete: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not delete invitation gift",
			})
			return
		}

		if tag.RowsAffected() == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Gift not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Gift deleted successfully",
		})
	}
}

// GetPublicInvitationGifts returns active gift information for a published invitation.
func GetPublicInvitationGifts(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := strings.TrimSpace(c.Param("slug"))
		if slug == "" || utf8.RuneCountInString(slug) > 255 {
			sendPublicGiftsNotFound(c)
			return
		}

		var invitationID int64
		err := pool.QueryRow(
			c.Request.Context(),
			`SELECT id
			 FROM invitations
			 WHERE slug = $1
			   AND status = 'published'
			   AND (expired_at IS NULL OR expired_at > CURRENT_TIMESTAMP)`,
			slug,
		).Scan(&invitationID)

		if errors.Is(err, pgx.ErrNoRows) {
			sendPublicGiftsNotFound(c)
			return
		}
		if err != nil {
			log.Printf("GetPublicInvitationGifts: query invitation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Internal server error",
			})
			return
		}

		rows, err := pool.Query(
			c.Request.Context(),
			`SELECT gift_type, provider_name, account_name, account_number, wallet_identifier, instructions, sort_order
			 FROM invitation_gifts
			 WHERE invitation_id = $1 AND is_active = TRUE
			 ORDER BY sort_order ASC, id ASC`,
			invitationID,
		)
		if err != nil {
			log.Printf("GetPublicInvitationGifts: query gifts: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not retrieve invitation gifts",
			})
			return
		}
		defer rows.Close()

		items := make([]PublicInvitationGiftItem, 0)
		for rows.Next() {
			var item PublicInvitationGiftItem
			if err := rows.Scan(
				&item.GiftType,
				&item.ProviderName,
				&item.AccountName,
				&item.AccountNumber,
				&item.WalletIdentifier,
				&item.Instructions,
				&item.SortOrder,
			); err != nil {
				log.Printf("GetPublicInvitationGifts: scan gift: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read invitation gifts",
				})
				return
			}
			items = append(items, item)
		}
		if err := rows.Err(); err != nil {
			log.Printf("GetPublicInvitationGifts: rows err: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read invitation gifts",
			})
			return
		}

		c.Header("Cache-Control", "public, max-age=60")
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Invitation gifts retrieved successfully",
			"data": gin.H{
				"gifts": items,
			},
		})
	}
}
