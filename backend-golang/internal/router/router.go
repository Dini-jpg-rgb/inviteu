
package router

import (
	"net/http"

	"backend-golang/internal/handlers"
	"backend-golang/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRouter(pool *pgxpool.Pool, jwtSecret string, appEnv string) *gin.Engine {
	router := gin.Default()

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Invitation Backend API is running!",
		})
	})

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	api := router.Group("/api/v1")
	{
		api.POST("/auth/register", handlers.Register(pool))
		api.POST("/auth/login", handlers.Login(pool, jwtSecret))

		api.POST("/auth/forgot-password", handlers.ForgotPassword(pool, appEnv))
		api.POST("/auth/reset-password", handlers.ResetPassword(pool))

		api.POST("/auth/logout", middleware.AuthRequired(pool, jwtSecret), handlers.Logout())

		api.GET("/users/me", middleware.AuthRequired(pool, jwtSecret), handlers.GetMe(pool))
		api.GET(
			"/admin/test",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("admin"),
			func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"message": "Admin access granted",
				})
			},
		)
		api.PATCH(
			"/users/me",
			middleware.AuthRequired(pool, jwtSecret),
			handlers.UpdateMe(pool),
		)

		api.GET("/packages", handlers.GetPackages(pool))
		api.GET("/packages/:id", handlers.GetPackageByID(pool))

		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(pool, jwtSecret))
		admin.Use(middleware.RequireRole("admin"))

		admin.POST("/packages", handlers.CreatePackage(pool))
		admin.PATCH("/packages/:id", handlers.UpdatePackage(pool))
		admin.PATCH("/packages/:id/status", handlers.UpdatePackageStatus(pool))
	}

	return router
}
