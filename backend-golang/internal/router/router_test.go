package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name            string
		method          string
		origin          string
		wantStatus      int
		wantAllowOrigin string
	}{
		{
			name:            "allows localhost frontend",
			method:          http.MethodGet,
			origin:          "http://localhost:3000",
			wantStatus:      http.StatusOK,
			wantAllowOrigin: "http://localhost:3000",
		},
		{
			name:            "allows 127.0.0.1 preflight",
			method:          http.MethodOptions,
			origin:          "http://127.0.0.1:3000",
			wantStatus:      http.StatusNoContent,
			wantAllowOrigin: "http://127.0.0.1:3000",
		},
		{
			name:       "does not allow other origins",
			method:     http.MethodGet,
			origin:     "http://example.com",
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(corsMiddleware())
			router.GET("/api/v1/test", func(c *gin.Context) {
				c.Status(http.StatusOK)
			})

			request := httptest.NewRequest(tt.method, "/api/v1/test", nil)
			request.Header.Set("Origin", tt.origin)
			response := httptest.NewRecorder()

			router.ServeHTTP(response, request)

			if response.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, tt.wantStatus)
			}

			if got := response.Header().Get("Access-Control-Allow-Origin"); got != tt.wantAllowOrigin {
				t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, tt.wantAllowOrigin)
			}

			if tt.method == http.MethodOptions &&
				!strings.Contains(response.Header().Get("Access-Control-Allow-Headers"), "Authorization") {
				t.Error("preflight response does not allow the Authorization header")
			}
		})
	}
}
