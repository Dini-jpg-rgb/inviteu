
package main

import (
	"fmt"

	"backend-golang/internal/config"
	"backend-golang/internal/database"
	"backend-golang/internal/router"
)

func main() {
	cfg := config.Load()

	pool, err := database.Connect(cfg)
	if err != nil {
		fmt.Println("Database connection failed:", err)
		return
	}

	defer conn.Close()

	fmt.Println("Database connected successfully!")

	r := router.SetupRouter(conn, cfg.JWTSecret, cfg.AppEnv)

	fmt.Println("Invitation Backend running on http://localhost:8080")

	if err := r.Run(":8080"); err != nil {
		fmt.Println("Server failed:", err)
	}
}
