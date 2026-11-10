package drive

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

const (
	ScopeOpenID    = "openid"
	ScopeEmail     = "email"
	ScopeDriveFile = "https://www.googleapis.com/auth/drive.file"

	googleAuthURL   = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL  = "https://oauth2.googleapis.com/token"
	googleRevokeURL = "https://oauth2.googleapis.com/revoke"
	googleIssuerURL = "https://accounts.google.com"
)

func DefaultScopes() []string {
	return []string{
		ScopeOpenID,
		ScopeEmail,
		ScopeDriveFile,
	}
}

func DefaultScopesString() string {
	return strings.Join(DefaultScopes(), " ")
}

type Identity struct {
	Sub   string
	Email string
}

type OAuth interface {
	AuthCodeURL(state string) string
	Exchange(ctx context.Context, code string) (*oauth2.Token, error)
	VerifyIDToken(ctx context.Context, token *oauth2.Token) (*Identity, error)
	Revoke(ctx context.Context, token string) error
}

type GoogleOAuth struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	HTTPClient   *http.Client
}

func NewGoogleOAuth(clientID, clientSecret, redirectURL string) *GoogleOAuth {
	return &GoogleOAuth{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
	}
}

func (g *GoogleOAuth) oauthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     g.ClientID,
		ClientSecret: g.ClientSecret,
		RedirectURL:  g.RedirectURL,
		Scopes:       DefaultScopes(),
		Endpoint: oauth2.Endpoint{
			AuthURL:  googleAuthURL,
			TokenURL: googleTokenURL,
		},
	}
}

func (g *GoogleOAuth) AuthCodeURL(state string) string {
	return g.oauthConfig().AuthCodeURL(
		state,
		oauth2.AccessTypeOffline,
		oauth2.SetAuthURLParam("prompt", "consent"),
	)
}

func (g *GoogleOAuth) Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	token, err := g.oauthConfig().Exchange(ctx, code)
	if err != nil {
		return nil, errors.New("google authorization code exchange failed")
	}
	return token, nil
}

func (g *GoogleOAuth) VerifyIDToken(ctx context.Context, token *oauth2.Token) (*Identity, error) {
	if token == nil {
		return nil, errors.New("oauth token is nil")
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok || rawIDToken == "" {
		return nil, errors.New("google id_token is missing")
	}

	provider, err := oidc.NewProvider(ctx, googleIssuerURL)
	if err != nil {
		return nil, errors.New("could not initialize google identity verification")
	}

	verifier := provider.Verifier(&oidc.Config{
		ClientID: g.ClientID,
	})

	idToken, err := verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, errors.New("google identity verification failed")
	}

	var profile struct {
		ID    string `json:"sub"`
		Email string `json:"email"`
	}
	if err := idToken.Claims(&profile); err != nil ||
		profile.ID == "" ||
		profile.Email == "" {
		return nil, errors.New("google account information is incomplete")
	}

	var verifiedClaims struct {
		EmailVerified bool `json:"email_verified"`
	}
	if err := idToken.Claims(&verifiedClaims); err != nil ||
		!verifiedClaims.EmailVerified {
		return nil, errors.New("google email is not verified")
	}

	return &Identity{
		Sub:   profile.ID,
		Email: profile.Email,
	}, nil
}

func (g *GoogleOAuth) Revoke(ctx context.Context, token string) error {
	if strings.TrimSpace(token) == "" {
		return errors.New("token is empty")
	}

	form := url.Values{}
	form.Set("token", token)

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		googleRevokeURL,
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		return errors.New("could not build google revoke request")
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := g.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}

	resp, err := client.Do(req)
	if err != nil {
		return errors.New("google revoke request failed")
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("google revoke returned status %d", resp.StatusCode)
	}

	return nil
}
