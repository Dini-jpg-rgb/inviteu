package main

import (
	"fmt"
	"log"

	"backend-golang/internal/config"
	"backend-golang/internal/database"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Configuration failed: ", err)
	}
	fmt.Printf(
		"DEBUG DBHost=%q DBPort=%q DBUser=%q DBName=%q DBPasswordSet=%t\n",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBName,
		cfg.DBPassword != "",
	)

	pool, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Database connection failed: ", err)
	}
	defer pool.Close()

	fmt.Println("Database connected successfully!")

	midtransClient, err := payment.NewMidtransClient(
		cfg.MidtransServerKey,
		cfg.MidtransIsProduction,
	)
	if err != nil {
		log.Fatal("Midtrans configuration failed: ", err)
	}

	r := router.SetupRouter(
		pool,
		cfg.JWTSecret,
		cfg.AppEnv,
		midtransClient,
	)

	fmt.Println("Invitation Backend running on http://localhost:8080")

	if err := r.Run(":8080"); err != nil {
		log.Fatal("Server failed: ", err)
	}
}
