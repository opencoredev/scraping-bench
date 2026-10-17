# Spider adapter configuration

Frozen on 2026-10-17. API: HTTP docs 2026-10-17. Supported native tracks: search, scrape, map, crawl.

Credentials: `SPIDER_API_KEY`. The adapter reads them at runtime.

## Default lane

Scrape/crawl/search request return_format=markdown. Search sets search_limit; links and crawl set limit. Crawl uses whitelist path regex.

Source: https://spider.cloud/llms.txt

## Tuned lane

Scrape/crawl/search set request=browser, readability=true, filter_output_main_only=true, cache=false. Search adds fetch_page_content=true. Links has no additional tuning.

Sources: https://spider.cloud/llms.txt and https://spider.cloud/docs/api

## Limits, billing and verification

Synchronous responses. Page status/error are checked even under HTTP 200. Mixed crawl failures retain usable pages. Search object envelope differs from older OpenAPI shapes. The fixture scrape is rejected as malicious. Root-only links output does not establish useful fixture mapping. Prefer costs.total_cost; missing costs remain unknown, and the harness retains maxCallUsd. Internal retry control is not documented.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
