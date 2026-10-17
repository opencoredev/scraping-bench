# Perplexity Search adapter configuration

Frozen on 2026-10-17. API: Search HTTP 1.0.0. Supported native tracks: search.

Credentials: `PERPLEXITY_API_KEY`. The adapter reads them at runtime.

## Default lane

POST /search with query and max_results, capped at 20.

Source: https://docs.perplexity.ai/api-reference/search-post

## Tuned lane

No extra tuning: native Search results already target retrieval.

Sources: https://docs.perplexity.ai/api-reference/search-post and https://docs.perplexity.ai/guides/search-quickstart

## Limits, billing and verification

No key: untested. Scrape/map/crawl unsupported. Search-index cohort; no Sonar answer generation. Internal retries are not exposed.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
