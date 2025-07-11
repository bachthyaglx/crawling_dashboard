package models

import (
	"time"
)

type BrokenLink struct {
	URL        string `json:"url"`
	StatusCode int    `json:"status_code"`
}

type CrawlResult struct {
	URL           string         `json:"url"`
	HTMLVersion   string         `json:"html_version"`
	Title         string         `json:"title"`
	Headings      map[string]int `json:"headings"`
	InternalLinks int            `json:"internal_links"`
	ExternalLinks int            `json:"external_links"`
	BrokenLinks   []BrokenLink   `json:"broken_links"`
	HasLoginForm  bool           `json:"has_login_form"`
}

type Link struct {
	Href    string
	PageURL string
}

type RequestPayload struct {
	URL string `json:"url"`
}

type Result struct {
	ID            int                    `json:"id"`
	URL           string                 `json:"url"`
	HTMLVersion   string                 `json:"html_version"`
	Title         string                 `json:"title"`
	Headings      map[string]int         `json:"headings"`
	InternalLinks int                    `json:"internal_links"`
	ExternalLinks int                    `json:"external_links"`
	BrokenLinks   []BrokenLink 					 `json:"broken_links"`		
	HasLoginForm  bool                   `json:"has_login_form"`
	Status        string                 `json:"status"`
	ErrorMessage  string                 `json:"error_message"`
	CreatedAt     time.Time              `json:"created_at"`
}