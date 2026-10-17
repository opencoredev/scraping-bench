# TinyFish Fetch/Search adapter configuration

Frozen on 2026-10-17. API: HTTP docs 2026-10-17. Supported native tracks: search, scrape.

Credentials: `TINYFISH_API_KEY`. The adapter reads them at runtime.

## Default lane

POST https://api.fetch.tinyfish.ai with urls and format=markdown. GET https://api.search.tinyfish.ai with query. These are the dedicated products.

Source: https://docs.tinyfish.ai/fetch-api/reference

## Tuned lane

Fetch sets ttl=0. Search has no additional documented agent-oriented settings.

Sources: https://docs.tinyfish.ai/fetch-api/reference and https://docs.tinyfish.ai/search-api/reference

## Limits, billing and verification

Map/crawl unsupported. Account wallet contract rates, frozen in pricing.ts, are $0/url Fetch and $0/query Search on this account/date; this is not a general unlimited free-plan claim. Recheck GET /v1/wallet before using other accounts. Daily allowances: Fetch 1,000 URLs, Search 12,000 requests. Internal retries are not exposed.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
