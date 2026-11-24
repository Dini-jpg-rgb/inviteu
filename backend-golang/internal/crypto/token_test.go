package crypto_test

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"strings"
	"testing"

	"backend-golang/internal/crypto"
)

func generateTestKey(t *testing.T) []byte {
	t.Helper()
	key := make([]byte, crypto.KeySize)
	if _, err := rand.Read(key); err != nil {
		t.Fatalf("read random key: %v", err)
	}
	return key
}

func TestEncryptDecrypt_RoundTripAndUniqueNonce(t *testing.T) {
	key := generateTestKey(t)
	plaintext := []byte("1//0g_sample_google_drive_refresh_token_value")

	ct1, err := crypto.Encrypt(key, plaintext)
	if err != nil {
		t.Fatalf("first Encrypt failed: %v", err)
	}
	ct2, err := crypto.Encrypt(key, plaintext)
	if err != nil {
		t.Fatalf("second Encrypt failed: %v", err)
	}

	if len(ct1) <= crypto.NonceSize+len(plaintext) {
		t.Fatalf("expected ciphertext length > %d, got %d", crypto.NonceSize+len(plaintext), len(ct1))
	}

	nonce1 := ct1[:crypto.NonceSize]
	nonce2 := ct2[:crypto.NonceSize]
	if bytes.Equal(nonce1, nonce2) {
		t.Fatal("expected different 12-byte nonces across Encrypt calls, got identical nonces")
	}
	if bytes.Equal(ct1, ct2) {
		t.Fatal("expected different ciphertexts across Encrypt calls, got identical ciphertexts")
	}
	if bytes.Contains(ct1, plaintext) {
		t.Fatal("ciphertext must not contain plaintext")
	}

	got1, err := crypto.Decrypt(key, ct1)
	if err != nil {
		t.Fatalf("Decrypt ct1 failed: %v", err)
	}
	if !bytes.Equal(got1, plaintext) {
		t.Fatalf("round-trip mismatch for ct1: got %q, want %q", got1, plaintext)
	}

	got2, err := crypto.Decrypt(key, ct2)
	if err != nil {
		t.Fatalf("Decrypt ct2 failed: %v", err)
	}
	if !bytes.Equal(got2, plaintext) {
		t.Fatalf("round-trip mismatch for ct2: got %q, want %q", got2, plaintext)
	}
}

func TestEncryptDecrypt_RejectsNon32ByteKey(t *testing.T) {
	plaintext := []byte("sample-refresh-token")
	validKey := generateTestKey(t)
	validCiphertext, err := crypto.Encrypt(validKey, plaintext)
	if err != nil {
		t.Fatalf("Encrypt setup failed: %v", err)
	}

	invalidSizes := []int{0, 1, 16, 24, 31, 33, 64}
	for _, sz := range invalidSizes {
		badKey := make([]byte, sz)
		if _, err := crypto.Encrypt(badKey, plaintext); err == nil {
			t.Errorf("Encrypt with %d-byte key: expected error, got nil", sz)
		}
		if _, err := crypto.Decrypt(badKey, validCiphertext); err == nil {
			t.Errorf("Decrypt with %d-byte key: expected error, got nil", sz)
		}
		if _, err := crypto.DeriveOAuthBindKey(badKey); err == nil {
			t.Errorf("DeriveOAuthBindKey with %d-byte key: expected error, got nil", sz)
		}
	}
}

func TestDecrypt_FailsWithDifferentKeyOrTamperedData(t *testing.T) {
	keyA := generateTestKey(t)
	keyB := generateTestKey(t)
	plaintext := []byte("refresh-token-for-partner-a")

	ct, err := crypto.Encrypt(keyA, plaintext)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	if _, err := crypto.Decrypt(keyB, ct); err == nil {
		t.Fatal("expected Decrypt with different key to fail, got nil")
	}

	tampered := append([]byte(nil), ct...)
	tampered[len(tampered)-1] ^= 0xff
	if _, err := crypto.Decrypt(keyA, tampered); err == nil {
		t.Fatal("expected Decrypt with tampered tag to fail, got nil")
	}

	if _, err := crypto.Decrypt(keyA, ct[:crypto.NonceSize]); err == nil {
		t.Fatal("expected Decrypt with truncated ciphertext to fail, got nil")
	}
}

func TestDecodeKey(t *testing.T) {
	raw := generateTestKey(t)
	encoded := base64.StdEncoding.EncodeToString(raw)

	decoded, err := crypto.DecodeKey(encoded)
	if err != nil {
		t.Fatalf("DecodeKey valid 32-byte key failed: %v", err)
	}
	if !bytes.Equal(decoded, raw) {
		t.Fatal("decoded key does not match original 32-byte key")
	}

	shortSecret := "short-secret-value-16"
	shortB64 := base64.StdEncoding.EncodeToString([]byte(shortSecret))
	if _, err := crypto.DecodeKey(shortB64); err == nil {
		t.Fatal("expected error for base64 key decoding to != 32 bytes")
	} else if strings.Contains(err.Error(), shortB64) || strings.Contains(err.Error(), shortSecret) {
		t.Fatalf("error message leaked secret value: %v", err)
	}

	badInput := "not_valid_base64$$$"
	if _, err := crypto.DecodeKey(badInput); err == nil {
		t.Fatal("expected error for invalid base64")
	} else if strings.Contains(err.Error(), badInput) {
		t.Fatalf("error message leaked input value: %v", err)
	}
}

func TestDeriveOAuthBindKey(t *testing.T) {
	masterKey := generateTestKey(t)

	k1, err := crypto.DeriveOAuthBindKey(masterKey)
	if err != nil {
		t.Fatalf("DeriveOAuthBindKey failed: %v", err)
	}
	if len(k1) != crypto.KeySize {
		t.Fatalf("expected 32-byte derived key, got %d", len(k1))
	}
	if bytes.Equal(k1, masterKey) {
		t.Fatal("derived key must differ from master key")
	}

	k2, err := crypto.DeriveOAuthBindKey(masterKey)
	if err != nil {
		t.Fatalf("second DeriveOAuthBindKey failed: %v", err)
	}
	if !bytes.Equal(k1, k2) {
		t.Fatal("DeriveOAuthBindKey must be deterministic for the same master key")
	}
}
