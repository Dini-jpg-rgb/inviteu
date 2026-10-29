package main

import (
	"fmt"
	"log"

	"backend-golang/internal/config"
	"backend-golang/internal/database"
	"backend-golang/internal/handlers"
	"backend-golang/internal/payment"
	"backend-golang/internal/router"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Configuration failed: ", err)
	}

	pool, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Database connection failed: ", err)
	}
	defer pool.Close()

	fmt.Println("Database connected successfully!")

	googleCfg := handlers.GoogleAuthConfig{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		JWTSecret:    cfg.JWTSecret,
		AppEnv:       cfg.AppEnv,
	}

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
		googleCfg,
		midtransClient,
	)

	fmt.Println("Invitation Backend running on http://localhost:8080")

	if err := r.Run(":8080"); err != nil {
		log.Fatal("Server failed: ", err)
	}
}
