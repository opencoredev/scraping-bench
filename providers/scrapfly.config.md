# Scrapfly adapter configuration

Frozen on 2026-10-17. API: Web Scraping/Crawler HTTP docs 2026-10-17. Supported native tracks: scrape, crawl.

Credentials: `SCRAPFLY_API_KEY`. The adapter reads them at runtime.

## Default lane

GET /scrape with format=markdown and retry=false. POST /crawl with page_limit, include_only_paths, content_formats=[markdown], bounded max_duration.

Source: https://scrapfly.io/docs/scrape-api/getting-started

## Tuned lane

Scrape sets render_js=true and format=markdown:only_content. Crawl sets rendering_delay=2000; this is the documented crawler option.

Sources: https://scrapfly.io/docs/scrape-api/getting-started and https://scrapfly.io/docs/crawler-api/results

## Limits, billing and verification

Search/map unsupported. Crawl accepts crawler_uuid (live) or uuid (older example), polls every 2 seconds, then pages through contents. Crawler server-side per-page retries cannot be disabled with a documented setting. Scrape retries are explicitly off. Recovered smoke job returned four markdown pages and billed five credits. Collection-only recovery timing is not end-to-end crawl timing. Non-string content fields fail schema validation; large artifact downloads are not implemented.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
