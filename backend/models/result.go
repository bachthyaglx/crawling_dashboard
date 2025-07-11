package models

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
