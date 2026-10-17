# Firecrawl adapter configuration

Frozen on 2026-10-17. API: v2. Supported native tracks: search, scrape, map, crawl.

Credentials: `FIRECRAWL_API_KEY`. The adapter reads them at runtime.

## Default lane

Scrape/crawl request markdown; main-content and cache age remain provider defaults. Search uses web results without page scraping. Map uses documented defaults.

Source: https://docs.firecrawl.dev/api-reference/endpoint/scrape

## Tuned lane

Scrape/crawl set maxAge=0 and onlyMainContent=true. Search requests markdown with the same scrapeOptions. Map sets ignoreCache=true.

Sources: https://docs.firecrawl.dev/api-reference/endpoint/scrape and https://docs.firecrawl.dev/api-reference/endpoint/crawl

## Limits, billing and verification

Crawl submits once, polls every 2 seconds, follows same-origin next links, deduplicates URLs, and retains healthy pages from mixed results. creditsUsed is cumulative, not summed across polls. Server-side proxy/recovery attempts cannot be disabled through these endpoints.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
