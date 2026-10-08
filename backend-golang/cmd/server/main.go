package main

import (
	"context"
	"fmt"

	"backend-golang/internal/config"
	"backend-golang/internal/database"
	"backend-golang/internal/router"
)

func main() {
	cfg := config.Load()

	conn, err := database.Connect(cfg)

	if err != nil {
		fmt.Println("Database connection failed:", err)
		return
	}

	defer conn.Close(context.Background())

	fmt.Println("Database connected successfully!")

	r := router.SetupRouter()

	fmt.Println("Invitation Backend running on http://localhost:8080")

	err = r.Run(":8080")

	if err != nil {
		fmt.Println("Server failed:", err)
	}
}