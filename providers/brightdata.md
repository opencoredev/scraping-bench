# Bright Data (slug: brightdata)

Source for all sections: https://docs.brightdata.com (official docs only). Each section cites its page. "not found" means the fetched page did not state it.

## 1. Auth

- Source: https://docs.brightdata.com/scraping-automation/web-unlocker/introduction
- Header: `Authorization: Bearer YOUR_API_KEY`
- Base URL: `https://api.brightdata.com`
- Request endpoint: `POST /request`
- Required ID: a zone name, sent as the `zone` field in the JSON body (`"zone": "YOUR_ZONE_NAME"`).

## 2. Search

- Source: https://docs.brightdata.com/scraping-automation/serp-api/introduction
- Endpoint: `POST https://api.brightdata.com/request`, same auth and body shape as Web Unlocker (`zone` in JSON body). Non-search pages should use Web Unlocker instead.
- Query: passed as the `url` field, set to a Google search URL, e.g. `https://www.google.com/search?q=pizza`.
- Country and language: `gl` and `hl` as URL query parameters. `uule` and `location` are engine-specific.
- Result count/limit: not found.
- Freshness, device, depth modes: not found.
- Output options: `"format": "raw"`, `"data_format": "markdown"`, `"data_format": "parsed_light"`, or `brd_json=1` query parameter for parsed JSON.
- Response (`parsed_light`): an `organic` array. Each item has `link`, `title`, `description` (snippet), `global_rank`, and optional `extensions`. Parsed JSON example has `engine`, `query`, and `results` with `type`, `position`, `title`, `url`.
- Sync or async: the quickstart is a synchronous `/request` call with sub-second responses cited. Async exists for large volumes or slow queries, with a separate guide (not fetched).
- Pricing: "Pay only for successful delivery." Free tier: not found.

## 3. Scrape (URL to markdown/text)

- Source: https://docs.brightdata.com/scraping-automation/web-unlocker/introduction
- Endpoint: `POST https://api.brightdata.com/request`
- Body fields seen so far: `zone`, `url`, `format` (`"raw"` returns unmodified response, `"json"` returns a JSON envelope).
- Markdown or text output: not found on this page. Still to check.
- JS render, wait, cache bypass, PDF, timeout parameters: not found on this page.
- Response: the target page's raw HTML or JSON body, described as "ready to parse, with no post-processing required."

## 4. Map (site to URL list)

- Pending.

## 5. Crawl

- Source: https://docs.brightdata.com/scraping-automation/crawl-api/introduction
- No separate Crawl API found. The page says the Fetch API is "formerly Crawl API."
- Endpoint: `POST /datasets/v3/scrape` (a dataset endpoint, not the zone-based `/request` endpoint). Auth and base URL: not stated on this page.
- Start URL: `input[].url` (required). Optional `input[].country`, two-letter code such as `us`.
- Query parameters: `dataset_id` (must be `gd_m6gjtfmeh43we6cqc`), `notify` (boolean, default `false`), `include_errors` (boolean, default `true`), `custom_output_fields` (pipe-separated, e.g. `url|markdown`).
- Output formats: `markdown`, `html2text` (plain text), `page_html`, `ld_json`.
- Page limit, depth, include/exclude patterns: not found.
- Async start/poll/download flow: not found. The page shows one POST that returns a `200` with an array of records. No job ID or status values documented.
- Response fields per record: `url`, `final_url`, `page_title`, `country`, `markdown`, `html2text`, `page_html`, `ld_json`.
- Pricing for this endpoint: not found.

## 6. Pricing, free credits, rate limits

- Source: https://docs.brightdata.com/scraping-automation/web-unlocker/introduction
- Charged only for successful requests to the target domain. Failed requests are not charged.
- Free tier: not found on this page. Still to check.

## 7. npm SDK package

- Pending.

## 8. Fairness gotchas

- Pending.

## Curl examples

Web Unlocker request (from section 1 and 3):

```bash
curl -X POST https://api.brightdata.com/request \
  -H "Authorization: Bearer $BRIGHTDATA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"zone": "YOUR_ZONE_NAME", "url": "https://example.com", "format": "raw"}'
```
