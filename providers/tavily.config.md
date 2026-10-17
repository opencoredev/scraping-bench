# Tavily adapter configuration

Frozen on 2026-10-17. API: HTTP 1.0.0. Supported native tracks: search, scrape, map, crawl.

Credentials: `TAVILY_API_KEY`. The adapter reads them at runtime.

## Default lane

Search uses basic default. Extract/crawl request markdown. Every endpoint requests include_usage=true. Native map and crawl use limit; crawl uses select_paths for scope.

Source: https://docs.tavily.com/documentation/api-reference/endpoint/search

## Tuned lane

Search sets search_depth=advanced and include_raw_content=markdown. Extract/crawl set extract_depth=advanced. Map has no additional tuning.

Sources: https://docs.tavily.com/documentation/api-reference/endpoint/search and https://docs.tavily.com/documentation/api-reference/endpoint/crawl

## Limits, billing and verification

No key: untested. These endpoints return synchronously. Successful extract URLs are priced in batches of 5; reported usage takes precedence. Server-side retries are not exposed.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
