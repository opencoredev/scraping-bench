# Perplexity Search API

Scope: the ranked web-results Search API at docs.perplexity.ai. The Sonar chat models are out of scope.

## 1. Auth

- Base URL: `https://api.perplexity.ai`
- Header: `Authorization: Bearer <API_KEY>`. Key read from `PERPLEXITY_API_KEY`.
- Required IDs: not found.
- Source: https://docs.perplexity.ai/docs/search/quickstart

## 2. Search

- Endpoint: `POST /search`. The quickstart describes no other endpoint.
- Request params:
  - `query`: string, or array of up to 5 strings for multi-query.
  - `max_results`: integer, 1–20. Default 10.
  - `country`: ISO 3166-1 alpha-2 code (e.g. `US`, `GB`). Default not found.
  - `search_language_filter`: array of ISO 639-1 codes, max 10.
  - `search_domain_filter`: array, max 20 entries. Prefix `-` to denylist. Allowlist and denylist cannot be mixed.
  - `max_tokens`: integer, total webpage content budget, up to 1,000,000.
  - `max_tokens_per_page`: integer, per-result content cap.
  - `search_type`: `"fast"` for lower latency and cost.
  - Freshness/recency filter: not found.
  - Depth modes beyond `search_type`: not found.
- Response fields: top level `results`, `id`, `server_time`. Each result: `title`, `url`, `snippet`, `date`, `last_updated`.
- Sync/async: not stated. Examples show one POST returning results directly.
- Source: https://docs.perplexity.ai/docs/search/quickstart

Curl:

```bash
curl -X POST 'https://api.perplexity.ai/search' \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query": "renewable energy policy", "max_results": 5}'
```

## 3. Scrape

Not found in the quickstart. Verification pending.

## 4. Map

Not found in the quickstart. Verification pending.

## 5. Crawl

Not found in the quickstart. Verification pending.

## 6. Pricing and limits

- Fast Search: $1.00 per 1,000 requests.
- Standard search price: not found on the quickstart. The page links to a pricing page.
- Multi-query: one billing unit per request. Rate limiting counts each query, so five queries use five rate-limit units.
- Free credits: not found.
- Free-tier rate limits and concurrency: not found. The page links to rate-limit docs.
- Source: https://docs.perplexity.ai/docs/search/quickstart

## 7. npm SDK

- Package: `@perplexity-ai/perplexity_ai`
- Source: https://docs.perplexity.ai/docs/search/quickstart

## 8. Fairness gotchas

Pending. Not yet checked: whether results come from a live fetch or a prebuilt index, caching, internal retries, and whether content extraction adds latency.
