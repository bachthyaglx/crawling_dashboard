package database

import (
	"crypto/tls"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	driver "github.com/go-sql-driver/mysql"

	"scrawling_dashboard/backend/models"
)

var DB *sql.DB

func ConnectMySQL() {
	dsn := os.Getenv("MYSQL_DSN") // VD: avnadmin:pass@tcp(host:port)/

	if dsn == "" {
		log.Fatal("MYSQL_DSN is not set")
	}

	// Đăng ký TLS config nếu cần (Aiven yêu cầu)
	err := driver.RegisterTLSConfig("custom", &tls.Config{
		InsecureSkipVerify: true, // ⚠️ chỉ dùng cho dev/test, không nên dùng production
	})
	if err != nil {
		log.Fatalf("Failed to register TLS config: %v", err)
	}

	// Nếu DSN chưa có `tls=` thì thêm vào
	if !strings.Contains(dsn, "tls=") {
		if strings.Contains(dsn, "?") {
			dsn += "&tls=custom"
		} else {
			dsn += "?tls=custom"
		}
	}

	// Kết nối ban đầu để tạo DB nếu chưa có
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Error connecting to MySQL: %v", err)
	}
	defer db.Close()

	_, err = db.Exec("CREATE DATABASE IF NOT EXISTS scrawling_db")
	if err != nil {
		log.Fatalf("Failed to create database: %v", err)
	}

	// Thêm tên DB vào DSN
	dsnWithDB := strings.Split(dsn, "?")[0] + "scrawling_db"
	if strings.Contains(dsn, "?") {
		dsnWithDB += "?" + strings.Split(dsn, "?")[1]
	}

	DB, err = sql.Open("mysql", dsnWithDB)
	if err != nil {
		log.Fatalf("Error connecting to scrawling_db: %v", err)
	}

	if err := DB.Ping(); err != nil {
		log.Fatalf("MySQL ping failed: %v", err)
	}

	fmt.Println("✅ Connected to MySQL successfully")

	createTable := `
	CREATE TABLE IF NOT EXISTS urls (
		id INT AUTO_INCREMENT PRIMARY KEY,
		url TEXT NOT NULL,
		html_version VARCHAR(50),
		title TEXT,
		headings JSON,
		internal_links INT DEFAULT 0,
		external_links INT DEFAULT 0,
		broken_links JSON,
		has_login_form BOOLEAN DEFAULT FALSE,
		status ENUM('queued', 'running', 'done', 'error') DEFAULT 'done',
		error_message TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	_, err = DB.Exec(createTable)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}
}

// InsertCrawlResult inserts a result into the database
func InsertCrawlResult(result *models.CrawlResult) error {
	headingsJSON, _ := json.Marshal(result.Headings)
	brokenLinksJSON, _ := json.Marshal(result.BrokenLinks)

	query := `
		INSERT INTO urls (
			url, html_version, title, headings, internal_links, external_links,
			broken_links, has_login_form, status, error_message, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := DB.Exec(
		query,
		result.URL,
		result.HTMLVersion,
		result.Title,
		headingsJSON,
		result.InternalLinks,
		result.ExternalLinks,
		brokenLinksJSON,
		result.HasLoginForm,
		"queued",
		"",
		time.Now(),
	)
	return err
}
