package router

import (
	"net/http"

	"backend-golang/internal/handlers"
	"backend-golang/internal/middleware"
	"backend-golang/internal/payment"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRouter(
	pool *pgxpool.Pool,
	jwtSecret string,
	appEnv string,
	midtransClient *payment.MidtransClient,
) *gin.Engine {
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
		api.POST(
			"/users/me/favorites",
			middleware.AuthRequired(pool, jwtSecret),
			handlers.AddTemplateFavorite(pool),
		)
		api.GET(
			"/users/me/favorites",
			middleware.AuthRequired(pool, jwtSecret),
			handlers.GetTemplateFavorites(pool),
		)
		api.DELETE(
			"/users/me/favorites/:template_id",
			middleware.AuthRequired(pool, jwtSecret),
			handlers.DeleteTemplateFavorite(pool),
		)
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

		// Public template detail route.
		api.GET("/templates/:id", handlers.GetTemplateByID(pool))

		api.POST(
			"/orders",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("partner"),
			handlers.CreateOrder(pool),
		)

		api.GET(
			"/orders",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("partner"),
			handlers.GetOrders(pool),
		)

		api.GET(
			"/orders/:id",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("partner"),
			handlers.GetOrderByID(pool),
		)

		api.POST(
			"/orders/:id/payments",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("partner"),
			handlers.CreatePayment(pool, midtransClient),
		)

		api.POST(
			"/invitations/:invitation_id/addon-orders",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("partner"),
			handlers.CreateAddonOrder(pool),
		)

		api.GET(
			"/invoices",
			middleware.AuthRequired(pool, jwtSecret),
			middleware.RequireRole("partner"),
			handlers.GetInvoices(pool),
		)

		api.GET("/addons", handlers.GetAddons(pool))
		api.GET("/addons/:id", handlers.GetAddonByID(pool))

		// Public template catalog route.
		api.GET("/templates", handlers.GetTemplates(pool))
		// Public template category route.
		api.GET("/templates/categories", handlers.GetTemplateCategories(pool))

		api.POST(
			"/payments/midtrans/notification",
			handlers.MidtransNotification(pool, midtransClient),
		)

		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(pool, jwtSecret))
		admin.Use(middleware.RequireRole("admin"))

		admin.POST("/packages", handlers.CreatePackage(pool))
		admin.PATCH("/packages/:id", handlers.UpdatePackage(pool))
		admin.PATCH("/packages/:id/status", handlers.UpdatePackageStatus(pool))

		admin.POST("/addons", handlers.CreateAddon(pool))
		admin.PATCH("/addons/:id", handlers.UpdateAddon(pool))
		admin.PATCH("/addons/:id/status", handlers.UpdateAddonStatus(pool))
		admin.GET("/addons", handlers.GetAddons(pool))
		admin.GET("/addons/:id", handlers.GetAddonByID(pool))
	}

	return router
}
