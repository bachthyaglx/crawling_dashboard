package crawler

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/chromedp"

	"scrawling_dashboard/backend/models"
)

// CrawlURLWithContext hỗ trợ dừng giữa chừng với context
func CrawlURLWithContext(ctx context.Context, targetURL string) (*models.CrawlResult, error) {
	cdpCtx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	var htmlContent, doctypeStr, pageTitle string
	if err := chromedp.Run(cdpCtx,
		chromedp.Navigate(targetURL),
		chromedp.Evaluate(`document.documentElement.outerHTML`, &htmlContent),
		chromedp.Evaluate(`(function() {
			if (document.doctype) {
				return "<!DOCTYPE "
					+ document.doctype.name
					+ (document.doctype.publicId ? ' PUBLIC "' + document.doctype.publicId + '"' : '')
					+ (document.doctype.systemId ? ' "' + document.doctype.systemId + '"' : '')
					+ ">";
			}
			return "";
		})()`, &doctypeStr),
		chromedp.Title(&pageTitle),
	); err != nil {
		return nil, fmt.Errorf("chromedp failed: %w", err)
	}

	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("crawl canceled")
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	doctype := parseDoctype(doctypeStr)
	headings, err := parseHeadings(ctx, doc)
	if err != nil {
		return nil, err
	}

	internal, external, broken, err := parseLinks(ctx, doc, targetURL)
	if err != nil {
		return nil, err
	}

	hasLogin := detectLoginForm(ctx, doc)

	return &models.CrawlResult{
		URL:           targetURL,
		HTMLVersion:   doctype,
		Title:         pageTitle,
		Headings:      headings,
		InternalLinks: internal,
		ExternalLinks: external,
		BrokenLinks:   broken,
		HasLoginForm:  hasLogin,
	}, nil
}

// parseDoctype extracts the doctype from the string.
func parseDoctype(doctypeStr string) string {
	doctype := "Unknown"
	doctypeRegex := regexp.MustCompile(`(?i)<!DOCTYPE\s+([^>\s]+)`)
	if matches := doctypeRegex.FindStringSubmatch(doctypeStr); len(matches) > 1 {
		doctype = strings.ToUpper(matches[1])
	}
	return doctype
}

// parseHeadings counts heading tags h1-h6.
func parseHeadings(ctx context.Context, doc *goquery.Document) (map[string]int, error) {
	headings := map[string]int{}
	for i := 1; i <= 6; i++ {
		if err := ctx.Err(); err != nil {
			return nil, fmt.Errorf("crawl canceled")
		}
		tag := fmt.Sprintf("h%d", i)
		headings[tag] = doc.Find(tag).Length()
	}
	return headings, nil
}

// parseLinks counts internal/external links and finds broken links.
func parseLinks(ctx context.Context, doc *goquery.Document, targetURL string) (int, int, []models.BrokenLink, error) {
	parsedBase, err := url.Parse(targetURL)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("invalid base URL")
	}
	baseHost := parsedBase.Hostname()
	client := &http.Client{Timeout: 10 * time.Second}

	internal, external := 0, 0
	broken := []models.BrokenLink{}

	forEachLink := func(fn func(link *url.URL)) {
		doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
			if err := ctx.Err(); err != nil {
				return
			}
			href, _ := s.Attr("href")
			link, err := parsedBase.Parse(href)
			if err != nil {
				return
			}
			fn(link)
		})
	}

	classifyLink := func(link *url.URL) string {
		if link.Hostname() == "" || link.Hostname() == baseHost {
			return "internal"
		}
		return "external"
	}

	isBrokenLink := func(link *url.URL) (bool, int) {
		if link.Scheme != "http" && link.Scheme != "https" {
			return false, 0
		}
		req, _ := http.NewRequestWithContext(ctx, http.MethodHead, link.String(), nil)
		resp, err := client.Do(req)
		if err != nil || (resp != nil && resp.StatusCode >= 400) {
			status := 0
			if resp != nil {
				status = resp.StatusCode
				io.Copy(io.Discard, resp.Body)
				resp.Body.Close()
			}
			return true, status
		}
		if resp != nil {
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
		return false, 0
	}

	forEachLink(func(link *url.URL) {
		switch classifyLink(link) {
		case "internal":
			internal++
		case "external":
			external++
		}
		if brokenLink, status := isBrokenLink(link); brokenLink {
			broken = append(broken, models.BrokenLink{
				URL:        link.String(),
				StatusCode: status,
			})
		}
	})

	return internal, external, broken, nil
}

// detectLoginForm checks for login forms or keywords.
func detectLoginForm(ctx context.Context, doc *goquery.Document) bool {
	loginKeywords := []string{"password", "login", "log in", "sign in", "đăng nhập", "anmelden"}
	normalize := func(s string) string {
		s = strings.ToLower(strings.TrimSpace(s))
		s = strings.ReplaceAll(s, "\n", " ")
		return strings.Join(strings.Fields(s), " ")
	}

	hasLogin := false
	doc.Find("input, label").EachWithBreak(func(i int, s *goquery.Selection) bool {
		if err := ctx.Err(); err != nil {
			return false
		}
		if goquery.NodeName(s) == "input" {
			if inputType, _ := s.Attr("type"); strings.ToLower(inputType) == "password" {
				hasLogin = true
				return false
			}
		}
		val, _ := s.Attr("placeholder")
		text := normalize(s.Text() + " " + val)
		for _, keyword := range loginKeywords {
			if strings.Contains(text, keyword) {
				hasLogin = true
				return false
			}
		}
		return true
	})

	if hasLogin {
		return true
	}

	doc.Find("button, a, span, div").EachWithBreak(func(i int, s *goquery.Selection) bool {
		if err := ctx.Err(); err != nil {
			return false
		}
		text := normalize(s.Text())
		for _, keyword := range loginKeywords {
			if strings.Contains(text, keyword) {
				hasLogin = true
				return false
			}
		}
		if goquery.NodeName(s) == "a" {
			if href, exists := s.Attr("href"); exists && strings.Contains(strings.ToLower(href), "login") {
				hasLogin = true
				return false
			}
		}
		return true
	})

	return hasLogin
}
