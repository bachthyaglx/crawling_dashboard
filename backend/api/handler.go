package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"scrawling_dashboard/backend/crawler"
	"scrawling_dashboard/backend/database"
	"scrawling_dashboard/backend/models"
)

var (
	statusMap    = make(map[string]string)
	cancelMap    = make(map[string]context.CancelFunc)
	statusMutex  sync.Mutex
	crawlQueue   = make([]string, 0)
	crawlRunning = false
)

func enqueueCrawl(url string) {
	statusMutex.Lock()
	defer statusMutex.Unlock()

	if statusMap[url] == "queued" || statusMap[url] == "running" {
		return
	}
	statusMap[url] = "queued"
	crawlQueue = append(crawlQueue, url)

	if !crawlRunning {
		crawlRunning = true
		go processQueue()
	}
}

func processQueue() {
	for {
		statusMutex.Lock()
		if len(crawlQueue) == 0 {
			crawlRunning = false
			statusMutex.Unlock()
			return
		}
		url := crawlQueue[0]
		crawlQueue = crawlQueue[1:]
		statusMap[url] = "running"
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		cancelMap[url] = cancel
		statusMutex.Unlock()

		result, err := crawler.CrawlURLWithContext(ctx, url)

		statusMutex.Lock()
		delete(cancelMap, url)
		if err != nil {
			statusMap[url] = "error"
			database.DB.Exec(`INSERT INTO urls (url, status, error_message, created_at) VALUES (?, 'error', ?, ?)`, url, err.Error(), time.Now())
		} else {
			headingsJSON, _ := json.Marshal(result.Headings)
			brokenLinksJSON, _ := json.Marshal(result.BrokenLinks)
			statusMap[url] = "done"
			database.DB.Exec(`INSERT INTO urls 
				(url, html_version, title, headings, internal_links, external_links, broken_links, has_login_form, status, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'done', ?)`,
				url, result.HTMLVersion, result.Title, headingsJSON, result.InternalLinks,
				result.ExternalLinks, brokenLinksJSON, result.HasLoginForm, time.Now())
		}
		statusMutex.Unlock()
	}
}

func URLHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		w.WriteHeader(http.StatusCreated)
	case http.MethodGet:
		handleGetCrawled(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleGetCrawled(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, url, html_version, title, headings, internal_links, external_links, 
		       broken_links, has_login_form, status, error_message, created_at 
		FROM urls ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, "Query failed", http.StatusInternalServerError)
		log.Println("❌ Query failed:", err)
		return
	}
	defer rows.Close()

	var results []models.Result

	for rows.Next() {
		var id int
		var url, htmlVersion, title, status string
		var errorMessage sql.NullString
		var headingsJSON, brokenLinksJSON []byte
		var internal, external int
		var hasLogin bool
		var createdAtStr string
		var headings map[string]int
		var brokenLinks []models.BrokenLink

		if err := rows.Scan(&id, &url, &htmlVersion, &title, &headingsJSON, &internal,
			&external, &brokenLinksJSON, &hasLogin, &status, &errorMessage, &createdAtStr); err != nil {
			log.Printf("❌ Row scan failed: %v\n", err)
			continue
		}

		if err := json.Unmarshal(headingsJSON, &headings); err != nil {
			log.Printf("❌ Unmarshal headings failed: %v\n", err)
			continue
		}
		if err := json.Unmarshal(brokenLinksJSON, &brokenLinks); err != nil {
			log.Printf("❌ Unmarshal broken links failed: %v\n", err)
			continue
		}

		parsedTime, err := time.Parse("2006-01-02 15:04:05", createdAtStr)
		if err != nil {
			log.Printf("❌ Parse created_at failed: %v\n", err)
			continue
		}

		results = append(results, models.Result{
			ID:            id,
			URL:           url,
			HTMLVersion:   htmlVersion,
			Title:         title,
			Headings:      headings,
			InternalLinks: internal,
			ExternalLinks: external,
			BrokenLinks:   brokenLinks,
			HasLoginForm:  hasLogin,
			Status:        status,
			ErrorMessage:  errorMessage.String,
			CreatedAt:     parsedTime,
		})
	}

	if results == nil {
		results = []models.Result{}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(results); err != nil {
		log.Println("❌ Encode failed:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func CrawlHandler(w http.ResponseWriter, r *http.Request) {
	var payload models.RequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.URL == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	enqueueCrawl(payload.URL)
	w.WriteHeader(http.StatusAccepted)
	w.Write([]byte(`{"message": "Added to crawl queue"}`))
}

func StopHandler(w http.ResponseWriter, r *http.Request) {
	var payload models.RequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.URL == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	statusMutex.Lock()
	defer statusMutex.Unlock()
	if cancel, exists := cancelMap[payload.URL]; exists {
		cancel()
		delete(cancelMap, payload.URL)
		statusMap[payload.URL] = "stopped"
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "Stopped"}`))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Not running"}`))
}

func ProgressHandler(w http.ResponseWriter, r *http.Request) {
	statusMutex.Lock()
	defer statusMutex.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(statusMap)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	expectedUsername := os.Getenv("APP_USERNAME")
	expectedPassword := os.Getenv("APP_PASSWORD")
	if creds.Username != expectedUsername || creds.Password != expectedPassword {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	session, _ := GetSession(r)
	session.Values["authenticated"] = true
	session.Save(r, w)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Login successful"}`))
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	session, _ := GetSession(r)
	session.Options.MaxAge = -1
	session.Save(r, w)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Logout successful"}`))
}
