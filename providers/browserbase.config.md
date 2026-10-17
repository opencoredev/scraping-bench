# Browserbase Fetch/Search adapter configuration

Frozen on 2026-10-17. API: v1. Supported native tracks: search, scrape.

Credentials: `BROWSERBASE_API_KEY`. The adapter reads them at runtime.

## Default lane

POST /v1/fetch with format=markdown, X-BB-API-Key. POST /v1/search with numResults capped at 25. No session or project ID required.

Source: https://docs.browserbase.com/platform/fetch/overview

## Tuned lane

Fetch sets allowRedirects=true. Search retains project default provider.

Sources: https://docs.browserbase.com/platform/fetch/overview and https://docs.browserbase.com/platform/search/overview

## Limits, billing and verification

Map/crawl unsupported. Fetch HTTP API has no JS rendering and no PDF markdown. Search pricing assumes default Parallel advanced; project provider overrides change the price. HTTP Fetch avoids a browser pipeline and session-minute billing. Internal retries are not exposed.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
