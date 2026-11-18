package drive

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
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

type FakeCreatedFolderRecord struct {
	RefreshToken string
	FolderName   string
	FolderID     string
}

type FakeUploadedFileRecord struct {
	RefreshToken string
	FolderID     string
	FileName     string
	MimeType     string
	Size         int64
	FileID       string
}

type FakeOpenedFileRecord struct {
	RefreshToken string
	FileID       string
	RangeHeader  string
}

// FakeStorage is an in-memory, network-free implementation of Storage for unit and integration tests.
type FakeStorage struct {
	mu sync.Mutex

	CreateFolderID   string
	CreateFolderIDs  []string
	CreateFolderErr  error
	CreateFolderHook func(ctx context.Context, folderName string)

	UploadFileID string
	UploadErr    error
	UploadErrs   []error
	UploadHook   func(ctx context.Context, params UploadFileParams)

	DeleteErr error

	FileContents       map[string][]byte
	DefaultFileContent []byte
	OpenErr            error
	OpenHook           func(ctx context.Context, fileID string, rangeHeader string)

	CreatedFolders []FakeCreatedFolderRecord
	UploadedFiles  []FakeUploadedFileRecord
	DeletedFileIDs []string
	OpenedFiles    []FakeOpenedFileRecord

	folderSeq int
	uploadSeq int
}

func (f *FakeStorage) CreateFolder(
	ctx context.Context,
	refreshToken string,
	folderName string,
) (string, error) {
	f.mu.Lock()
	hook := f.CreateFolderHook
	if f.CreateFolderErr != nil {
		err := f.CreateFolderErr
		f.mu.Unlock()
		return "", err
	}

	f.folderSeq++
	seq := f.folderSeq

	var folderID string
	if len(f.CreateFolderIDs) > 0 {
		folderID = f.CreateFolderIDs[0]
		f.CreateFolderIDs = f.CreateFolderIDs[1:]
	} else if f.CreateFolderID != "" {
		folderID = f.CreateFolderID
	} else {
		folderID = fmt.Sprintf("fake-folder-id-%d", seq)
	}

	f.CreatedFolders = append(f.CreatedFolders, FakeCreatedFolderRecord{
		RefreshToken: refreshToken,
		FolderName:   folderName,
		FolderID:     folderID,
	})
	f.mu.Unlock()

	if hook != nil {
		hook(ctx, folderName)
	}

	return folderID, nil
}

func (f *FakeStorage) UploadFile(
	ctx context.Context,
	refreshToken string,
	params UploadFileParams,
) (*UploadedFile, error) {
	f.mu.Lock()
	hook := f.UploadHook

	var callErr error
	if len(f.UploadErrs) > 0 {
		callErr = f.UploadErrs[0]
		f.UploadErrs = f.UploadErrs[1:]
	} else if f.UploadErr != nil {
		callErr = f.UploadErr
	}

	if callErr != nil {
		f.mu.Unlock()
		return nil, callErr
	}

	f.uploadSeq++
	seq := f.uploadSeq
	fileID := f.UploadFileID
	if fileID == "" {
		fileID = fmt.Sprintf("fake-drive-file-%d", seq)
	} else if seq > 1 {
		fileID = fmt.Sprintf("%s-%d", f.UploadFileID, seq)
	}

	rec := FakeUploadedFileRecord{
		RefreshToken: refreshToken,
		FolderID:     params.FolderID,
		FileName:     params.FileName,
		MimeType:     params.MimeType,
		Size:         int64(len(params.Content)),
		FileID:       fileID,
	}
	f.UploadedFiles = append(f.UploadedFiles, rec)
	if f.FileContents == nil {
		f.FileContents = make(map[string][]byte)
	}
	copied := make([]byte, len(params.Content))
	copy(copied, params.Content)
	f.FileContents[fileID] = copied
	f.mu.Unlock()

	if hook != nil {
		hook(ctx, params)
	}

	return &UploadedFile{
		ID:       fileID,
		Name:     params.FileName,
		MimeType: params.MimeType,
		Size:     int64(len(params.Content)),
	}, nil
}

func (f *FakeStorage) DeleteFile(
	_ context.Context,
	_ string,
	fileID string,
) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.DeletedFileIDs = append(f.DeletedFileIDs, fileID)
	return f.DeleteErr
}

func (f *FakeStorage) SetFileContent(fileID string, content []byte) {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.FileContents == nil {
		f.FileContents = make(map[string][]byte)
	}
	copied := make([]byte, len(content))
	copy(copied, content)
	f.FileContents[fileID] = copied
}

func (f *FakeStorage) OpenFile(
	ctx context.Context,
	refreshToken string,
	fileID string,
	rangeHeader string,
) (*DownloadFileStream, error) {
	f.mu.Lock()
	hook := f.OpenHook
	openErr := f.OpenErr
	f.OpenedFiles = append(f.OpenedFiles, FakeOpenedFileRecord{
		RefreshToken: refreshToken,
		FileID:       fileID,
		RangeHeader:  rangeHeader,
	})

	var (
		content []byte
		found   bool
	)
	if f.FileContents != nil {
		if b, ok := f.FileContents[fileID]; ok {
			content = make([]byte, len(b))
			copy(content, b)
			found = true
		}
	}
	if !found && f.DefaultFileContent != nil {
		content = make([]byte, len(f.DefaultFileContent))
		copy(content, f.DefaultFileContent)
		found = true
	}
	f.mu.Unlock()

	if hook != nil {
		hook(ctx, fileID, rangeHeader)
	}

	if openErr != nil {
		return nil, openErr
	}
	if !found {
		return nil, ErrFileNotFound
	}

	trimmedRange := strings.TrimSpace(rangeHeader)
	if trimmedRange == "" {
		return &DownloadFileStream{
			StatusCode:    http.StatusOK,
			Body:          io.NopCloser(bytes.NewReader(content)),
			ContentLength: int64(len(content)),
		}, nil
	}

	totalSize := int64(len(content))
	if totalSize == 0 || !strings.HasPrefix(trimmedRange, "bytes=") {
		return nil, ErrRangeNotSatisfiable
	}
	spec := strings.TrimSpace(strings.TrimPrefix(trimmedRange, "bytes="))
	if spec == "" || strings.Contains(spec, ",") {
		return nil, ErrRangeNotSatisfiable
	}
	parts := strings.Split(spec, "-")
	if len(parts) != 2 {
		return nil, ErrRangeNotSatisfiable
	}

	var start, end int64
	if parts[0] == "" {
		// Suffix range: bytes=-suffix
		suffixLen, err := strconv.ParseInt(parts[1], 10, 64)
		if err != nil || suffixLen <= 0 {
			return nil, ErrRangeNotSatisfiable
		}
		if suffixLen >= totalSize {
			start = 0
		} else {
			start = totalSize - suffixLen
		}
		end = totalSize - 1
	} else {
		parsedStart, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil || parsedStart < 0 || parsedStart >= totalSize {
			return nil, ErrRangeNotSatisfiable
		}
		start = parsedStart
		if parts[1] == "" {
			end = totalSize - 1
		} else {
			parsedEnd, err := strconv.ParseInt(parts[1], 10, 64)
			if err != nil || parsedEnd < start {
				return nil, ErrRangeNotSatisfiable
			}
			if parsedEnd >= totalSize {
				parsedEnd = totalSize - 1
			}
			end = parsedEnd
		}
	}

	chunk := content[start : end+1]
	return &DownloadFileStream{
		StatusCode:    http.StatusPartialContent,
		Body:          io.NopCloser(bytes.NewReader(chunk)),
		ContentLength: int64(len(chunk)),
		ContentRange:  fmt.Sprintf("bytes %d-%d/%d", start, end, totalSize),
	}, nil
}

func (f *FakeStorage) OpenedFilesSnapshot() []FakeOpenedFileRecord {
	f.mu.Lock()
	defer f.mu.Unlock()

	out := make([]FakeOpenedFileRecord, len(f.OpenedFiles))
	copy(out, f.OpenedFiles)
	return out
}

func (f *FakeStorage) CreatedFoldersSnapshot() []FakeCreatedFolderRecord {
	f.mu.Lock()
	defer f.mu.Unlock()

	out := make([]FakeCreatedFolderRecord, len(f.CreatedFolders))
	copy(out, f.CreatedFolders)
	return out
}

func (f *FakeStorage) UploadedFilesSnapshot() []FakeUploadedFileRecord {
	f.mu.Lock()
	defer f.mu.Unlock()

	out := make([]FakeUploadedFileRecord, len(f.UploadedFiles))
	copy(out, f.UploadedFiles)
	return out
}

func (f *FakeStorage) DeletedFileIDsSnapshot() []string {
	f.mu.Lock()
	defer f.mu.Unlock()

	out := make([]string, len(f.DeletedFileIDs))
	copy(out, f.DeletedFileIDs)
	return out
}
