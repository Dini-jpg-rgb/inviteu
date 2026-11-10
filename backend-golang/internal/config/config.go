package config

import (
	"fmt"
	"os"
	"strings"

	"backend-golang/internal/crypto"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	AppEnv     string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	GoogleDriveRedirectURL string
	TokenEncryptionKey     []byte
	FrontendURL            string

	MidtransServerKey    string
	MidtransClientKey    string
	MidtransIsProduction bool
}

func ParseTokenEncryptionKey(raw string) ([]byte, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, nil
	}
	key, err := crypto.DecodeKey(trimmed)
	if err != nil {
		return nil, fmt.Errorf("TOKEN_ENCRYPTION_KEY tidak valid: harus berupa Base64 yang terdekode tepat 32 byte")
	}
	return key, nil
}

func Load() (*Config, error) {
	if err := godotenv.Load(".env"); err != nil {
		return nil, fmt.Errorf("gagal memuat file .env: %w", err)
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	tokenEncryptionKey, err := ParseTokenEncryptionKey(os.Getenv("TOKEN_ENCRYPTION_KEY"))
	if err != nil {
		return nil, err
	}

	return &Config{
		DBHost:                 os.Getenv("DB_HOST"),
		DBPort:                 os.Getenv("DB_PORT"),
		DBUser:                 os.Getenv("DB_USER"),
		DBPassword:             os.Getenv("DB_PASSWORD"),
		DBName:                 os.Getenv("DB_NAME"),
		JWTSecret:              os.Getenv("JWT_SECRET"),
		AppEnv:                 appEnv,
		GoogleClientID:         os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret:     os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:      os.Getenv("GOOGLE_REDIRECT_URL"),
		GoogleDriveRedirectURL: strings.TrimSpace(os.Getenv("GOOGLE_DRIVE_REDIRECT_URL")),
		TokenEncryptionKey:     tokenEncryptionKey,
		FrontendURL:            strings.TrimSpace(os.Getenv("FRONTEND_URL")),
		MidtransServerKey:      os.Getenv("MIDTRANS_SERVER_KEY"),
		MidtransClientKey:      os.Getenv("MIDTRANS_CLIENT_KEY"),
		MidtransIsProduction:   strings.EqualFold(os.Getenv("MIDTRANS_IS_PRODUCTION"), "true"),
	}, nil
}
