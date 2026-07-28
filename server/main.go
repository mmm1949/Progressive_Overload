package main

import (
	"context"
	"log"
	"net/http"

	"gym-weight-calculator/server/config"
	"gym-weight-calculator/server/database"
	"gym-weight-calculator/server/middleware"
	"gym-weight-calculator/server/routes"
)

func main() {
	cfg := config.Load()
	db, err := database.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	routes.Register(mux, db)
	log.Printf("API listening on http://localhost:%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, middleware.CORS(cfg.FrontendURL, mux)))
}
