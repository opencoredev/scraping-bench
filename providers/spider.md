# Spider (spider.cloud): provider note

Slug: `spider`
Sources: official docs and pricing pages only. Each section cites its URL.

## 1. Auth

- Base URL: `https://api.spider.cloud` (source: https://spider.cloud/docs/api)
- Header: `Authorization: Bearer <API_KEY>`. The docs also show lowercase `authorization`.
- Response format: set the `Content-Type` request header to choose JSON, XML, CSV, or JSONL output (source: https://spider.cloud/docs/api).
- Required IDs (zones/projects): not found.

## 2. Search

- Endpoint: `POST /search` (source: https://spider.cloud/docs/api)
- Detailed params, response fields, and sync/async behavior: pending (https://spider.cloud/docs/api/search/)

## 3. Scrape (URL to markdown/text)

- Endpoint: `POST /scrape` (source: https://spider.cloud/docs/api)
- Detailed params and response fields: pending (https://spider.cloud/docs/api/scrape/)

## 4. Map (site to URL list)

- Endpoint: `POST /links` (source: https://spider.cloud/docs/api)
- Detailed params and response fields: pending (https://spider.cloud/docs/api/links/)

## 5. Crawl

- Endpoint: `POST /crawl` (source: https://spider.cloud/docs/api)
- Async start/poll/paginate flow: not documented on the overview page. Pending (https://spider.cloud/docs/api/crawl/)

## 6. Pricing, credits, and limits

- Credits: 10,000 credits = $1 (source: https://spider.cloud/docs/api)
- Free tier: keyless playground runs, capped at 25 per day (source: https://spider.cloud/docs/api)
- Concurrency: `concurrency_limit` defaults to unlimited. The Unlimited plan is flat-rate for Scrape, Crawl, and Links, limited by purchased concurrency (source: https://spider.cloud/docs/api)
- `/ai/*` endpoints require an AI plan (source: https://spider.cloud/docs/api)
- `stealth` residential proxies bill at 1.5 to 2 times the flat-rate baseline (source: https://spider.cloud/docs/api)
- No numeric rate limits listed on the overview. Pricing page: https://spider.cloud/pricing/

## 7. npm SDK

- Not found on the overview page. Client libraries are listed as JavaScript, Python, Rust, and CLI in the `spider-clients` GitHub repo (source: https://spider.cloud/docs/api). npm package name: pending.

## 8. Fairness gotchas

- Shared params from the overview (source: https://spider.cloud/docs/api): `limit` (default 0, no cap, excludes scrape), `depth` (default 25, 0 means no limit, excludes scrape), `return_format` (default `raw`), `request` (default `smart`, or `browser`), `request_timeout` (default 60, range 5 to 255 seconds), `cache` (default true), `respect_robots` (default true), `max_credits_allowed` (per-run credit cap), `run_in_background` (default false).
- Live fetch vs. own index: pending.
- Caching: `cache` defaults to true. Details pending.
- Internal retries and async behavior: pending.

## Curl examples

Pending per-endpoint pages.

## Scrape fetch note

- https://spider.cloud/docs/api/scrape/ (fetched): the page gave endpoint `POST /scrape` and output formats only (markdown, html, text). It did not list request params, response fields, or a curl example. Those remain not found on that page.
