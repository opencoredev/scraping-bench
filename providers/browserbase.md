# Browserbase

Slug: `browserbase`
Sources: https://docs.browserbase.com (fetched 2026-10-16)

## 1. Auth

- Header: `X-BB-API-Key: <api key>`
- Base URL: `https://api.browserbase.com`
- Source: https://docs.browserbase.com/platform/fetch/overview
- Project ID: not found in the Fetch overview. Check the Sessions/Project pages before relying on it.

## 2. Search

- Supported: yes. Search API is a platform product.
- Overview: https://docs.browserbase.com/platform/search/overview
- Endpoint, params, response, sync/async: pending (fetch 4).

## 3. Scrape (URL -> markdown/text)

- Endpoint: `POST https://api.browserbase.com/v1/fetch`
- Source: https://docs.browserbase.com/platform/fetch/overview and https://docs.browserbase.com/reference/api/fetch-a-page
- Request params:
  - `url` (required)
  - `allowRedirects` (bool, default false)
  - `allowInsecureSsl` (bool, default false; skips TLS cert checks)
  - `proxies` (`true` for default exit, or an object with a geolocation)
  - `format` (`raw` default, `markdown`, or `json`)
  - `schema` (JSON Schema; only when `format` is `json`)
- Response fields: `statusCode`, `headers`, `content`, `contentType`, `encoding`, and an `id` per fetch. `content` changes with `format`.
- JS rendering / wait: not supported by Fetch. Fetch does not run JavaScript. Use a browser session for JS-heavy pages.
- Cache bypass / fresh: not found.
- PDF: Fetch cannot convert PDFs to markdown or JSON.
- Timeout: request times out at 60 s (504). Content is capped at 5 MB (502 if over).

curl (from documented params; key is a placeholder):
```bash
curl -X POST https://api.browserbase.com/v1/fetch \
  -H "X-BB-API-Key: $BB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "format": "markdown"}'
```

## 4. Map (site -> URL list)

Pending.

## 5. Crawl

Pending.

## 6. Pricing and limits

Pending (per browser minute; free credits; rate limits/concurrency).

## 7. npm SDK

Pending.

## 8. Fairness gotchas

- Fetch is a live fetch, not an index. Each call hits the target page.
- Fetch does not execute JavaScript.
- Hard limits: 60 s timeout, 5 MB content cap.

## Playwright / CDP (browser sessions)

- Playwright quickstart: https://docs.browserbase.com/welcome/quickstarts/playwright
- Puppeteer uses direct CDP access: https://docs.browserbase.com/welcome/quickstarts/puppeteer
- Sessions API reference: not found on the introduction page. Pending.
