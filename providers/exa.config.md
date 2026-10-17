# Exa adapter configuration

Frozen on 2026-10-17. API: HTTP 2.0.0. Supported native tracks: search, scrape.

Credentials: `EXA_API_KEY`. The adapter reads them at runtime.

## Default lane

Search leaves type at documented auto default. Contents requests text=true for one URL. Exa text is returned directly; there is no local HTML conversion.

Source: https://docs.exa.ai/reference/search

## Tuned lane

Search includes contents.text=true and maxAgeHours=0; contents sets maxAgeHours=0.

Sources: https://docs.exa.ai/reference/search and https://docs.exa.ai/reference/get-contents

## Limits, billing and verification

No key: untested. Map/crawl unsupported: Contents subpages are not a recursive crawl API. Prefer costDollars.total over list estimates. Provider fetching retries are not exposed.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
