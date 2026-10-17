# Linkup adapter configuration

Frozen on 2026-10-17. API: v1. Supported native tracks: search, scrape.

Credentials: `LINKUP_API_KEY`. The adapter reads them at runtime.

## Default lane

POST /v1/search with depth=standard, outputType=searchResults and maxResults. POST /v1/fetch returns native markdown.

Source: https://docs.linkup.so/pages/documentation/endpoints/search/reference

## Tuned lane

Fetch sets renderJs=true; search retains standard depth because searchResults already serves agent retrieval.

Sources: https://docs.linkup.so/pages/documentation/endpoints/search/reference and https://docs.linkup.so/pages/documentation/endpoints/fetch/reference

## Limits, billing and verification

Map/crawl unsupported. The HTTP search endpoint is POST despite older local notes claiming GET. No local converter. Internal retry control is not exposed.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
