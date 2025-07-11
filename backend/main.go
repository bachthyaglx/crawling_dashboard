package main

import (
	"log"
	"net/http"
	"scrawling_dashboard/backend/api"
	"scrawling_dashboard/backend/database"
	"scrawling_dashboard/backend/middleware"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, continuing...")
	}

	database.ConnectMySQL()

	http.HandleFunc("/api/urls", middleware.WithCORS(api.URLHandler))
	http.HandleFunc("/api/crawl", middleware.WithCORS(api.CrawlHandler))
	http.HandleFunc("/api/stop", middleware.WithCORS(api.StopHandler))
	http.HandleFunc("/api/progress", middleware.WithCORS(api.ProgressHandler))
	http.HandleFunc("/api/login", middleware.WithCORS(api.LoginHandler))
	http.HandleFunc("/api/logout", middleware.WithCORS(api.LogoutHandler))

	log.Println("✅ Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

