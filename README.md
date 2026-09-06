# ZIMSEC Papers Scraper v3

A Node.js recursive crawler, PDF downloader and responsive web dashboard for publicly available ZIMSEC paper resources.

## Features

- Recursive same-domain crawling
- PDF discovery and automatic downloading
- Deduplication by source URL
- Automatic scan every 6 hours
- Search and filters
- O Level / A Level stats
- Subject, year, session and resource-type filters
- Responsive blue/white dashboard
- Dark mode
- Admin manual scan protected by `SCRAPE_KEY`
- Express API
- Render deployment configuration

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## API

- `GET /api/health`
- `GET /api/stats`
- `GET /api/papers?q=math&level=O%20Level&year=2024`
- `GET /api/papers/:id/download`
- `POST /api/scrape` with `x-scrape-key`

## Deployment

Render can use the included `render.yaml`.

For production, use persistent storage or object storage for downloaded PDFs. The included Render disk keeps the local data/download directory persistent.

## Responsible use

Only crawl resources you are permitted to access. Respect robots.txt, website terms, copyright, rate limits and server capacity. This project does not bypass authentication, paywalls or CAPTCHAs.
