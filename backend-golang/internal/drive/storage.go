package drive

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"strconv"
	"strings"
	"time"

	"golang.org/x/oauth2"
)

const (
	googleDriveUploadURL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size"
	googleDriveFilesURL  = "https://www.googleapis.com/drive/v3/files"
	googleFolderMimeType = "application/vnd.google-apps.folder"

	defaultDriveHTTPTimeout = 30 * time.Second
)

var (
	ErrTokenRevoked   = errors.New("google drive refresh token is revoked or invalid")
	ErrFolderNotFound = errors.New("google drive folder not found")
)

type UploadFileParams struct {
	FolderID string
	FileName string
	MimeType string
	Content  []byte
}

type UploadedFile struct {
	ID       string
	Name     string
	MimeType string
	Size     int64
}

type Storage interface {
	CreateFolder(ctx context.Context, refreshToken string, folderName string) (string, error)
	UploadFile(ctx context.Context, refreshToken string, params UploadFileParams) (*UploadedFile, error)
	DeleteFile(ctx context.Context, refreshToken string, fileID string) error
}

type GoogleStorage struct {
	ClientID     string
	ClientSecret string
	HTTPClient   *http.Client
}

func NewGoogleStorage(clientID, clientSecret string) *GoogleStorage {
	return &GoogleStorage{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		HTTPClient: &http.Client{
			Timeout: defaultDriveHTTPTimeout,
		},
	}
}

func (g *GoogleStorage) httpClient() *http.Client {
	if g.HTTPClient != nil {
		return g.HTTPClient
	}
	return &http.Client{
		Timeout: defaultDriveHTTPTimeout,
	}
}

func (g *GoogleStorage) oauthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     g.ClientID,
		ClientSecret: g.ClientSecret,
		Scopes:       DefaultScopes(),
		Endpoint: oauth2.Endpoint{
			AuthURL:  googleAuthURL,
			TokenURL: googleTokenURL,
		},
	}
}

func (g *GoogleStorage) accessToken(ctx context.Context, refreshToken string) (string, error) {
	trimmed := strings.TrimSpace(refreshToken)
	if trimmed == "" {
		return "", errors.New("refresh token is empty")
	}

	oauthCtx := context.WithValue(ctx, oauth2.HTTPClient, g.httpClient())
	ts := g.oauthConfig().TokenSource(oauthCtx, &oauth2.Token{
		RefreshToken: trimmed,
	})

	tok, err := ts.Token()
	if err != nil {
		if isInvalidGrantError(err) {
			return "", ErrTokenRevoked
		}
		return "", errors.New("could not exchange google refresh token")
	}

	if tok == nil || strings.TrimSpace(tok.AccessToken) == "" {
		return "", errors.New("google access token is empty")
	}

	return tok.AccessToken, nil
}

func isInvalidGrantError(err error) bool {
	var retrieveErr *oauth2.RetrieveError
	if !errors.As(err, &retrieveErr) {
		return false
	}

	if strings.EqualFold(strings.TrimSpace(retrieveErr.ErrorCode), "invalid_grant") {
		return true
	}

	var bodyPayload struct {
		Error string `json:"error"`
	}
	if jsonErr := json.Unmarshal(retrieveErr.Body, &bodyPayload); jsonErr == nil {
		if strings.EqualFold(strings.TrimSpace(bodyPayload.Error), "invalid_grant") {
			return true
		}
	}

	return false
}

func (g *GoogleStorage) CreateFolder(
	ctx context.Context,
	refreshToken string,
	folderName string,
) (string, error) {
	name := strings.TrimSpace(folderName)
	if name == "" {
		return "", errors.New("folder name is required")
	}

	accessToken, err := g.accessToken(ctx, refreshToken)
	if err != nil {
		return "", err
	}

	payload, err := json.Marshal(map[string]any{
		"name":     name,
		"mimeType": googleFolderMimeType,
	})
	if err != nil {
		return "", errors.New("could not encode folder metadata")
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		googleDriveFilesURL+"?fields=id",
		bytes.NewReader(payload),
	)
	if err != nil {
		return "", errors.New("could not build create folder request")
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json; charset=UTF-8")

	resp, err := g.httpClient().Do(req)
	if err != nil {
		return "", errors.New("google drive create folder request failed")
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return "", errors.New("could not read google drive create folder response")
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return "", fmt.Errorf("google drive create folder returned status %d", resp.StatusCode)
	}

	var parsed struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(bodyBytes, &parsed); err != nil || strings.TrimSpace(parsed.ID) == "" {
		return "", errors.New("google drive create folder response missing id")
	}

	return strings.TrimSpace(parsed.ID), nil
}

func (g *GoogleStorage) UploadFile(
	ctx context.Context,
	refreshToken string,
	params UploadFileParams,
) (*UploadedFile, error) {
	if strings.TrimSpace(params.FileName) == "" {
		return nil, errors.New("file name is required")
	}
	if strings.TrimSpace(params.MimeType) == "" {
		return nil, errors.New("mime type is required")
	}
	if len(params.Content) == 0 {
		return nil, errors.New("file content is empty")
	}

	accessToken, err := g.accessToken(ctx, refreshToken)
	if err != nil {
		return nil, err
	}

	metaMap := map[string]any{
		"name":     params.FileName,
		"mimeType": params.MimeType,
	}
	if folderID := strings.TrimSpace(params.FolderID); folderID != "" {
		metaMap["parents"] = []string{folderID}
	}

	metaJSON, err := json.Marshal(metaMap)
	if err != nil {
		return nil, errors.New("could not encode drive file metadata")
	}

	var bodyBuf bytes.Buffer
	mw := multipart.NewWriter(&bodyBuf)

	metaHeader := make(textproto.MIMEHeader)
	metaHeader.Set("Content-Type", "application/json; charset=UTF-8")
	metaPart, err := mw.CreatePart(metaHeader)
	if err != nil {
		return nil, errors.New("could not create metadata multipart section")
	}
	if _, err := metaPart.Write(metaJSON); err != nil {
		return nil, errors.New("could not write metadata multipart section")
	}

	mediaHeader := make(textproto.MIMEHeader)
	mediaHeader.Set("Content-Type", params.MimeType)
	mediaPart, err := mw.CreatePart(mediaHeader)
	if err != nil {
		return nil, errors.New("could not create media multipart section")
	}
	if _, err := mediaPart.Write(params.Content); err != nil {
		return nil, errors.New("could not write media multipart section")
	}

	if err := mw.Close(); err != nil {
		return nil, errors.New("could not finalize multipart body")
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		googleDriveUploadURL,
		&bodyBuf,
	)
	if err != nil {
		return nil, errors.New("could not build google drive upload request")
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "multipart/related; boundary="+mw.Boundary())

	resp, err := g.httpClient().Do(req)
	if err != nil {
		return nil, errors.New("google drive upload request failed")
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return nil, errors.New("could not read google drive upload response")
	}

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrFolderNotFound
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("google drive upload returned status %d", resp.StatusCode)
	}

	var rawResp struct {
		ID       string          `json:"id"`
		Name     string          `json:"name"`
		MimeType string          `json:"mimeType"`
		Size     json.RawMessage `json:"size"`
	}
	if err := json.Unmarshal(respBytes, &rawResp); err != nil || strings.TrimSpace(rawResp.ID) == "" {
		return nil, errors.New("invalid google drive upload response")
	}

	parsedSize := int64(len(params.Content))
	if len(rawResp.Size) > 0 {
		var sizeStr string
		if err := json.Unmarshal(rawResp.Size, &sizeStr); err == nil {
			if s, errConv := strconv.ParseInt(sizeStr, 10, 64); errConv == nil && s >= 0 {
				parsedSize = s
			}
		} else {
			var sizeNum int64
			if err := json.Unmarshal(rawResp.Size, &sizeNum); err == nil && sizeNum >= 0 {
				parsedSize = sizeNum
			}
		}
	}

	name := strings.TrimSpace(rawResp.Name)
	if name == "" {
		name = params.FileName
	}
	mimeType := strings.TrimSpace(rawResp.MimeType)
	if mimeType == "" {
		mimeType = params.MimeType
	}

	return &UploadedFile{
		ID:       strings.TrimSpace(rawResp.ID),
		Name:     name,
		MimeType: mimeType,
		Size:     parsedSize,
	}, nil
}

func (g *GoogleStorage) DeleteFile(
	ctx context.Context,
	refreshToken string,
	fileID string,
) error {
	trimmedID := strings.TrimSpace(fileID)
	if trimmedID == "" {
		return errors.New("file id is empty")
	}

	accessToken, err := g.accessToken(ctx, refreshToken)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodDelete,
		googleDriveFilesURL+"/"+url.PathEscape(trimmedID),
		nil,
	)
	if err != nil {
		return errors.New("could not build google drive delete request")
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := g.httpClient().Do(req)
	if err != nil {
		return errors.New("google drive delete request failed")
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	if resp.StatusCode != http.StatusNoContent &&
		resp.StatusCode != http.StatusOK &&
		resp.StatusCode != http.StatusNotFound {
		return fmt.Errorf("google drive delete returned status %d", resp.StatusCode)
	}

	return nil
}
