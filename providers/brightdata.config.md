# Bright Data adapter configuration

Frozen on 2026-10-17. API: Web Unlocker / SERP HTTP docs 2026-10-17. Supported native tracks: search, scrape.

Credentials: `BRIGHTDATA_API_KEY, BRIGHTDATA_UNLOCKER_ZONE for scrape, BRIGHTDATA_SERP_ZONE for search`. The adapter reads them at runtime.

## Default lane

POST /request, format=raw. Unlocker requests data_format=markdown. SERP targets Google with brd_json=1 and parses organic results.

Source: https://docs.brightdata.com/scraping-automation/web-unlocker/features

## Tuned lane

Same documented native settings; no unsupported JS flags or local conversion.

Sources: https://docs.brightdata.com/scraping-automation/web-unlocker/features and https://docs.brightdata.com/scraping-automation/serp-api/send-your-first-request

## Limits, billing and verification

No key/zones: untested. Map/crawl unsupported: current Fetch documentation is not a recursive crawl API. Service manages unblock attempts internally and exposes no disable switch. No HTML conversion is needed for the documented markdown endpoint.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
