# Scrapfly

## 1. Auth

- Base URL: `https://api.scrapfly.io`
- API key is passed as the `key` query parameter. Sending it in an HTTP header is not documented. Source: https://scrapfly.io/docs/scrape-api/getting-started.md
- Crawler API also takes `key` as a query parameter and says it must not go in the request body. Source: https://scrapfly.io/docs/crawler-api/getting-started.md
- How to obtain a key, and whether signup includes free credits: not found. Source checked: https://scrapfly.io/docs/onboarding.md

## 2. Search

Not found. No search endpoint appeared in the Scrape, Crawler, or Extraction docs read. Search is not supported natively.

## 3. Scrape (URL to markdown or HTML)

Supported natively. Source: https://scrapfly.io/docs/scrape-api/getting-started.md

- Endpoint: `GET` (also `POST`, `PUT`, `PATCH`, `HEAD`) `https://api.scrapfly.io/scrape`
- Required: `url` (URL-encoded), `key`
- `format`: `raw` (default), `clean_html`, `json`, `markdown`, `text`. Markdown and text accept `no_links`, `no_images`, `only_content`.
- Other options: `render_js` (default `false`), `asp` (legacy name for `unblocker`, default `false`), `country` (ISO alpha-2, supports lists, exclusions like `-gb`, and weights like `us:10,gb:5`), `proxy_pool` (default `public_datacenter_pool`; also `public_residential_pool`).
- Response: JSON. `result.content` holds the scraped content. Large objects return a download URL, with `result.format` set to `blob` or `clob`. Also returns `config` and `context`. `result.status_code` is not found in the page.

Curl (verbatim from docs):
```
curl -X GET https://api.scrapfly.io/scrape?url=https://httpbin.dev/anything?q=I%20want%20to%20Scrape%20this&country=us&render_js=true&key=
```

JavaScript rendering (source: https://scrapfly.io/docs/scrape-api/javascript-rendering.md):
- `render_js=true` runs the page in a cloud browser. Cost: 5 Scrape API credits, a flat amount (no multiplier stated).
- `rendering_wait` (milliseconds, max 25s), `wait_for_selector` (CSS or XPath; `xhr:` prefix waits on a background request), `js` (base64-encoded JavaScript; result in `result.browser_data.javascript_evaluation_result`).
- `js_scenario` appears only in a download example. Full syntax is on a separate page, not read.

Curl (verbatim from docs):
```
curl -G \
--request "GET" \
--url "https://api.scrapfly.io/scrape" \
--data-urlencode "render_js=true" \
--data-urlencode "rendering_wait=5000" \
--data-urlencode "key=__API_KEY__" \
--data-urlencode "url=https://web-scraping.dev/product/1"
```

## 4. Map (list a site's URLs)

Not found as a standalone endpoint. The Crawler API exposes discovered URLs through `GET /crawl/{crawler_uuid}/urls`, but that requires starting a crawl. Source: https://scrapfly.io/docs/crawler-api/getting-started.md

## 5. Crawl

Supported natively. Source: https://scrapfly.io/docs/crawler-api/getting-started.md

Endpoints:
- Start: `POST https://api.scrapfly.io/crawl`
- Status: `GET https://api.scrapfly.io/crawl/{crawler_uuid}/status`
- Contents: `GET .../crawl/{crawler_uuid}/contents`, `POST .../crawl/{crawler_uuid}/contents/batch`
- Artifact (WARC gzip or HAR JSON): `GET .../crawl/{crawler_uuid}/artifact`
- URL list (`text/plain`, one per line): `GET .../crawl/{crawler_uuid}/urls`

Parameters:
- Required: `url` (or `url_list` / `remote_url_list`, which are mutually exclusive alternatives)
- `page_limit` (0 means unlimited, subject to plan)
- `max_depth` (depth 0 is the start URL)
- `include_only_paths` and `exclude_paths` (max 100 each, mutually exclusive)
- Output format: start param is `content_formats` (default `["html"]`). Contents endpoints use a `formats` query param.
- `render_js`: not found. Browser rendering is controlled by `rendering_delay` (`0` disables it).
- `asp`: legacy name for `unblocker`, still accepted.

Responses:
- Start: `{"uuid": "...", "status": "PENDING"}`
- Status: `status` (`PENDING`, `RUNNING`, `DONE`, `CANCELLED`), `is_finished`, `is_success`, and `state` with `urls_visited`, `urls_extracted`, `urls_failed`, `urls_skipped`, `urls_to_crawl`, `api_credit_used`, `duration`, `start_time`, `stop_time`, `stop_reason`.

Curl (verbatim from docs, start a crawl):
```
curl -X POST "https://api.scrapfly.io/crawl?key={{ YOUR_API_KEY }}" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://web-scraping.dev/products",
    "page_limit": 5
  }'
```

## 6. Pricing and limits

- Plans: DISCOVERY, PRO, STARTUP, ENTERPRISE, CUSTOM. Monthly prices and included credits: not found on https://scrapfly.io/docs/billing.md. Per-product credit costs are on separate pages (Web Scraping API, Screenshot API, Extraction API, Crawler API billing), not read.
- Pay-as-you-go is billed in batches of 10,000 credits at the plan rate.
- Payment grace: DISCOVERY, PRO, STARTUP suspended immediately on failed payment. ENTERPRISE 7 days. CUSTOM 30 days.
- Free plan: accounts drop to free when a subscription is cancelled. Free credit amount: not found.
- Concurrency and rate limits per plan: not found. Set per throttler in the dashboard. Source: https://scrapfly.io/docs/throttling.md
- Throttle errors (all HTTP 429): `ERR::THROTTLE::MAX_API_CREDIT_BUDGET_EXCEEDED`, `ERR::THROTTLE::MAX_CONCURRENT_REQUEST_EXCEEDED`, `ERR::THROTTLE::MAX_REQUEST_RATE_EXCEEDED`. Response body example: not found.

## 7. Official SDK packages and versions

Source: https://scrapfly.io/docs/sdk.md. The page lists five SDKs and links to each one's own page. Package names, versions, and install commands are not on this page.
- Python: package name not found on this page. Client takes `key=` argument: `ScrapflyClient(key=...)`.
- TypeScript/JavaScript: not found on this page.
- Go: not found on this page.
- Rust: listed and marked NEW. Not found on this page.
- Scrapy: not found on this page.

Next step: read the per-SDK pages under https://scrapfly.io/docs/sdk/ (not yet read).

## 8. Benchmark-relevant differences

- Native search: not found.
- Native scrape to markdown: yes, `format=markdown` on `/scrape`. JS rendering is a flat 5 credits.
- Native map: not found as a standalone call. Crawl must start first.
- Native crawl: yes, async job with status polling and multiple result formats.
- Structured extraction: separate Extraction API (`POST https://api.scrapfly.io/extraction`), not part of the three benchmark modes above.
  - Required: `body` (content), `content_type` (`text/html`, `text/markdown`, `text/plain`, `text/xml`), and one of `extraction_prompt`, `extraction_model`, or `extraction_template`. `url` is optional.
  - `extraction_model` values: `product`, `article`, `review_list`, `real_estate_listing`.
  - Curl (verbatim from docs):
    ```
    curl -X POST \
    -H "content-type: text/html" \
    "https://api.scrapfly.io/extraction?key=&extraction_prompt=Extract+the+price+and+currency+of+the+product+in+json+format" \
    -d @test.html
    ```
  - Source: https://scrapfly.io/docs/extraction-api/getting-started.md
- Throttling is dashboard-configured, and errors are 429 with named codes.
