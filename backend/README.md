## Scrawling Dashboard - Backend

A lightweight web crawler that extracts information from a given URL, including:
- HTML version
- Page title
- Headings count (H1–H6)
- Internal and external links
- Broken links (4xx/5xx)
- Presence of a login form

## Requirements

- Go 1.20+
- Chrome/Chromium installed (for `chromedp`)
- (Optional) Postman or curl to test the API

## Run Backend

From the project root:

```bash
cd backend
go run main.go
```

## Check mysql table

```bash
\connect <username>@<host>:<port>
enter password
\sql
USE scrawling_db;
SHOW TABLES;
SELECT * FROM urls;
```

## Results

![alt text](image.png)