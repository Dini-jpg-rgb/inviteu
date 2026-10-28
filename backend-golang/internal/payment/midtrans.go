package payment

import (
	"crypto/sha512"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	midtrans "github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
)

type MidtransClient struct {
	client     snap.Client
	coreClient coreapi.Client
	serverKey  string
}

type CreateSnapRequest struct {
	PaymentNumber string
	Amount        int64
}

type SnapCheckout struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

type TransactionStatus struct {
	OrderID           string
	TransactionID     string
	TransactionStatus string
	StatusCode        string
	GrossAmount       string
	Currency          string
}

func NewMidtransClient(
	serverKey string,
	isProduction bool,
) (*MidtransClient, error) {
	serverKey = strings.TrimSpace(serverKey)
	if serverKey == "" {
		return nil, errors.New("MIDTRANS_SERVER_KEY belum diatur")
	}

	env := midtrans.Sandbox
	if isProduction {
		env = midtrans.Production
	}

	var snapClient snap.Client
	snapClient.New(serverKey, env)

	var coreClient coreapi.Client
	coreClient.New(serverKey, env)

	return &MidtransClient{
		client:     snapClient,
		coreClient: coreClient,
		serverKey:  serverKey,
	}, nil
}

func (m *MidtransClient) CreateSnapCheckout(
	req CreateSnapRequest,
) (*SnapCheckout, error) {
	if m == nil {
		return nil, errors.New("Midtrans client belum diinisialisasi")
	}

	if strings.TrimSpace(req.PaymentNumber) == "" {
		return nil, errors.New("payment number wajib diisi")
	}

	if req.Amount <= 0 {
		return nil, errors.New("nominal pembayaran harus lebih dari nol")
	}

	snapReq := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  req.PaymentNumber,
			GrossAmt: req.Amount,
		},
	}

	response, err := m.client.CreateTransaction(snapReq)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat transaksi Snap: %w", err)
	}

	if response == nil || response.Token == "" || response.RedirectURL == "" {
		return nil, errors.New(
			"Midtrans tidak mengembalikan token atau redirect URL",
		)
	}

	return &SnapCheckout{
		Token:       response.Token,
		RedirectURL: response.RedirectURL,
	}, nil
}

func (m *MidtransClient) CheckTransactionStatus(
	paymentNumber string,
) (*TransactionStatus, error) {
	if m == nil {
		return nil, errors.New("Midtrans client belum diinisialisasi")
	}

	paymentNumber = strings.TrimSpace(paymentNumber)
	if paymentNumber == "" {
		return nil, errors.New("payment number wajib diisi")
	}

	response, err := m.coreClient.CheckTransaction(paymentNumber)
	if err != nil {
		return nil, fmt.Errorf(
			"gagal memeriksa status transaksi Midtrans: %w",
			err,
		)
	}

	if response == nil {
		return nil, errors.New(
			"Midtrans tidak mengembalikan status transaksi",
		)
	}

	return &TransactionStatus{
		OrderID:           response.OrderID,
		TransactionID:     response.TransactionID,
		TransactionStatus: response.TransactionStatus,
		StatusCode:        response.StatusCode,
		GrossAmount:       response.GrossAmount,
		Currency:          response.Currency,
	}, nil
}

func (m *MidtransClient) VerifyNotificationSignature(
	orderID string,
	statusCode string,
	grossAmount string,
	signatureKey string,
) bool {
	if m == nil || m.serverKey == "" || signatureKey == "" {
		return false
	}

	raw := orderID + statusCode + grossAmount + m.serverKey
	sum := sha512.Sum512([]byte(raw))
	expected := hex.EncodeToString(sum[:])

	return subtle.ConstantTimeCompare(
		[]byte(strings.ToLower(signatureKey)),
		[]byte(expected),
	) == 1
}
