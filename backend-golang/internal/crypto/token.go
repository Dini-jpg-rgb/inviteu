package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hkdf"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
	"strings"
)

const (
	KeySize           = 32
	NonceSize         = 12
	OAuthBindHKDFInfo = "inviteu-drive-oauth-bind"
)

var (
	ErrInvalidKeyLength   = errors.New("encryption key must be exactly 32 bytes")
	ErrInvalidBase64Key   = errors.New("encryption key must be valid base64")
	ErrCiphertextTooShort = errors.New("ciphertext is too short")
)

// DecodeKey decodes a Base64-encoded key and validates that it is exactly 32 bytes.
// It never includes the input value or decoded bytes in returned errors.
func DecodeKey(encoded string) ([]byte, error) {
	trimmed := strings.TrimSpace(encoded)
	if trimmed == "" {
		return nil, ErrInvalidKeyLength
	}

	decoded, err := base64.StdEncoding.DecodeString(trimmed)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(trimmed)
		if err != nil {
			return nil, ErrInvalidBase64Key
		}
	}

	if len(decoded) != KeySize {
		return nil, ErrInvalidKeyLength
	}

	return decoded, nil
}

// Encrypt encrypts plaintext using AES-256-GCM with a random 12-byte nonce.
// Output format: 12-byte nonce || ciphertext || 16-byte GCM authentication tag.
func Encrypt(key, plaintext []byte) ([]byte, error) {
	if len(key) != KeySize {
		return nil, ErrInvalidKeyLength
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, errors.New("could not initialize cipher")
	}

	gcm, err := cipher.NewGCMWithNonceSize(block, NonceSize)
	if err != nil {
		return nil, errors.New("could not initialize GCM")
	}

	nonce := make([]byte, NonceSize)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, errors.New("could not generate nonce")
	}

	out := make([]byte, NonceSize, NonceSize+len(plaintext)+gcm.Overhead())
	copy(out, nonce)
	out = gcm.Seal(out, nonce, plaintext, nil)
	return out, nil
}

// Decrypt decrypts data produced by Encrypt (12-byte nonce || ciphertext || tag).
func Decrypt(key, data []byte) ([]byte, error) {
	if len(key) != KeySize {
		return nil, ErrInvalidKeyLength
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, errors.New("could not initialize cipher")
	}

	gcm, err := cipher.NewGCMWithNonceSize(block, NonceSize)
	if err != nil {
		return nil, errors.New("could not initialize GCM")
	}

	if len(data) < NonceSize+gcm.Overhead() {
		return nil, ErrCiphertextTooShort
	}

	nonce := data[:NonceSize]
	ciphertext := data[NonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, errors.New("decryption failed")
	}

	return plaintext, nil
}

// DeriveOAuthBindKey derives a 32-byte HMAC key from the 32-byte master key
// using HKDF-SHA256 (stdlib crypto/hkdf) with info "inviteu-drive-oauth-bind".
func DeriveOAuthBindKey(masterKey []byte) ([]byte, error) {
	if len(masterKey) != KeySize {
		return nil, ErrInvalidKeyLength
	}

	derived, err := hkdf.Key(sha256.New, masterKey, nil, OAuthBindHKDFInfo, KeySize)
	if err != nil {
		return nil, errors.New("could not derive oauth bind key")
	}

	return derived, nil
}
