package drive

import (
	"context"
	"errors"
	"sync"

	"golang.org/x/oauth2"
)

// FakeOAuth is an in-memory, network-free implementation of OAuth for unit and integration tests.
type FakeOAuth struct {
	mu sync.Mutex

	ClientID     string
	ClientSecret string
	RedirectURL  string

	ExchangeToken *oauth2.Token
	ExchangeErr   error
	Identity      *Identity
	VerifyErr     error
	RevokeErr     error

	ExchangedCodes []string
	RevokedTokens  []string
}

func (f *FakeOAuth) AuthCodeURL(state string) string {
	f.mu.Lock()
	clientID := f.ClientID
	clientSecret := f.ClientSecret
	redirectURL := f.RedirectURL
	f.mu.Unlock()

	if clientID == "" {
		clientID = "fake-google-client-id"
	}
	if clientSecret == "" {
		clientSecret = "fake-google-client-secret"
	}
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/api/v1/auth/google/drive/callback"
	}

	realCfg := NewGoogleOAuth(clientID, clientSecret, redirectURL)
	return realCfg.AuthCodeURL(state)
}

func (f *FakeOAuth) Exchange(_ context.Context, code string) (*oauth2.Token, error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.ExchangedCodes = append(f.ExchangedCodes, code)
	if f.ExchangeErr != nil {
		return nil, f.ExchangeErr
	}
	if f.ExchangeToken == nil {
		return nil, errors.New("fake exchange token is not configured")
	}

	tokenCopy := *f.ExchangeToken
	return &tokenCopy, nil
}

func (f *FakeOAuth) VerifyIDToken(_ context.Context, token *oauth2.Token) (*Identity, error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	if token == nil {
		return nil, errors.New("oauth token is nil")
	}
	if f.VerifyErr != nil {
		return nil, f.VerifyErr
	}
	if f.Identity == nil || f.Identity.Sub == "" || f.Identity.Email == "" {
		return nil, errors.New("fake google identity is incomplete")
	}

	return &Identity{
		Sub:   f.Identity.Sub,
		Email: f.Identity.Email,
	}, nil
}

func (f *FakeOAuth) Revoke(_ context.Context, token string) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.RevokedTokens = append(f.RevokedTokens, token)
	return f.RevokeErr
}

func (f *FakeOAuth) RevokedTokensSnapshot() []string {
	f.mu.Lock()
	defer f.mu.Unlock()

	out := make([]string, len(f.RevokedTokens))
	copy(out, f.RevokedTokens)
	return out
}
