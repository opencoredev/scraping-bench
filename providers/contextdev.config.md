# Context.dev adapter configuration

Frozen on 2026-10-17. API: v1. Supported native tracks: search, scrape, map, crawl.

Credentials: `CONTEXT_DEV_API_KEY`. The adapter reads them at runtime.

## Default lane

Scrape requests formats.markdown=true. Search requests at least 10 results (API minimum), then returns the requested prefix. Map uses domain inventory with a full-URL prefix regex. Crawl uses maxPages and a full-URL scope regex.

Source: https://docs.context.dev/scrape/overview

## Tuned lane

Scrape sets maxAgeMs=0 and sharedParams.mainContentOnly=true. Search enables markdownOptions with useMainContentOnly=true and maxAgeMs=0. Crawl sets maxAgeMs=0 and useMainContentOnly=true. Map has no additional tuning.

Sources: https://docs.context.dev/scrape/overview and https://docs.context.dev/search/page-content

## Limits, billing and verification

Free-plan harness concurrency is clamped to 1. Crawl is synchronous. Native map inventories known domain URLs rather than crawling the fixture; it returned no scoped fixture paths. Read key_metadata or X-Credits-Used. Internal fetching retries have no documented disable switch.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
