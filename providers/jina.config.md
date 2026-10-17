# Jina Reader/Search adapter configuration

Frozen on 2026-10-17. API: Reader/Search HTTP docs 2026-10-17. Supported native tracks: search, scrape.

Credentials: `JINA_API_KEY optional`. The adapter reads them at runtime.

## Default lane

GET r.jina.ai/<url> and s.jina.ai/?q= with Accept application/json. Use key when present, otherwise keyless. JINA_AUTH_MODE=keyless explicitly chooses keyless even when a key exists.

Source: https://jina.ai/reader/

## Tuned lane

Set X-No-Cache=true and X-Engine=browser for fresh rendered content.

Sources: https://jina.ai/reader/ and https://s.jina.ai/docs

## Limits, billing and verification

Map/crawl unsupported. No automatic auth fallback. Smoke ledger records key versus keyless. Both keyless endpoints returned 401 here; keyed endpoints succeeded. Bill tokens at current Reader UI catalog price $50/1B; catalog contains cheaper legacy products. Provider retries are not exposed.

All HTTP calls use global fetch, one whole-operation `ctx.timeoutMs` deadline and `ctx.signal`. No client retries or SDKs. Async latency spans submission through the last result; polling is fixed at 2 seconds. Cancelling a request cannot guarantee cancellation of remote work.

Prices, conversion rates, source URLs and date are frozen in [pricing.ts](../src/adapters/pricing.ts). Reported credits or dollars take precedence. Credits converted to USD use the documented list rate, so converted USD is an estimate even when units are reported. Missing usage is not proof of a free call; the runner retains its configured price reservation when billing is unknown.

See [BUDGET.md](BUDGET.md) for measured units, balance evidence and call limits, and [RESULTS.md](RESULTS.md) for smoke status. Default/tuned settings have code coverage only where explicitly recorded; the live smoke ledger records each tested lane.
