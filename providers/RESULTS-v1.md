# Provider adapter smoke results

Checked 2026-10-17. All 13 providers have adapters and a registry entry. Native tracks without keys are implemented from official documentation but have not been verified against a live account. “OK” means the endpoint passed the bounded smoke check; it does not establish benchmark quality or validate every tuned option.

| Provider | Search | Scrape | Map | Crawl |
| --- | --- | --- | --- | --- |
| Firecrawl | OK | OK | OK | OK, 5 pages |
| Context.dev | OK | OK | Failed: no scoped inventory URLs | OK tuned, 5 pages |
| TinyFish | OK | OK | Unsupported | Unsupported |
| Exa | No key | No key | Unsupported | Unsupported |
| Tavily | No key | No key | No key | No key |
| Jina | OK keyed; keyless 401 | OK keyed; keyless 401 | Unsupported | Unsupported |
| Spider | OK | Failed: malicious-URL 403 | Failed: root only | Failed: blank/blocked |
| Linkup | OK | OK | Unsupported | Unsupported |
| Perplexity | No key | Unsupported | Unsupported | Unsupported |
| Bright Data | No key/zones | No key/zones | Unsupported | Unsupported |
| Scrapfly | Unsupported | OK | Unsupported | Recovered OK, 4 pages; full submit-to-results timing unverified |
| Browserbase | OK | OK | Unsupported | Unsupported |

The product fixture is `/r/adapter-smoke/store/sensors/instrument-1`, with price `319.39 USD` and stock `Out of stock`. Map uses `/r/adapter-smoke/`; discovery must include a child URL. Crawl uses the same scope and `maxPages=5`. Search uses `Node.js official installation latest LTS`, limit 5, and checks that results have HTTP URLs. Search smoke does not grade the answer to a research question.

## Run the checks

Load credentials into your shell without printing them, then select only the providers and tracks you intend to spend on:

```sh
set -a
. /home/leo/web-bench/.env
set +a
npm run smoke -- --providers firecrawl,contextdev --tracks scrape
```

The ledger persists the three-attempt cap across default/tuned and keyed/keyless runs. Unsupported tracks and missing credentials are skipped without requests. Re-running all providers would consume more free credits; consult [BUDGET.md](BUDGET.md) first. `--lane tuned`, `--timeout 120000`, and `--jina-auth keyless` select explicit settings. Failed checks exit nonzero. Billing, safe usage headers, lane, auth mode and timing are logged for every attempted endpoint. Private response capture under gitignored `tmp/responses/` is redacted and created as 0600.

Real harness integration was verified with:

```sh
npm run bench -- --tasks tasks/harness/adapter-smoke.json \
  --providers firecrawl,contextdev --lane default --mode raw \
  --client adapter-smoke --sample 1 --concurrency 1 \
  --run-id harness-adapters-real --provider-config providers/smoke-limits.json
```

Both provider rows passed both price and stock checks, with one tool call each, API costs $0.005 and $0.0022, and $0 model spend. Reusing this run ID resumes without spending again. Generated output stays gitignored; [smoke.jsonl](smoke.jsonl) records the cost and result. The runner imports `src/adapters/index.ts`; Context.dev concurrency is capped at one. Every real provider still requires an explicit conservative `maxCallUsd`.

## Documentation versus live behavior

- Browserbase has HTTP Fetch and Search APIs. Fetch returns native markdown without a browser session or project ID, but does not render JavaScript. No Playwright or HTML converter is needed.
- TinyFish Fetch and Search are separate products from Agent. The wallet contract reports zero unit rates for both on this account/date; daily free quotas differ between Fetch and Search.
- Context.dev map inventories known domain URLs; it did not discover this fixture's paths. Its search API requires at least ten requested results. The initial crawl checker rejected a valid slashless root; the checker now canonicalizes it.
- Spider search returned an object containing `content`, rather than the older array shape. The fixture scrape returned a malicious-URL 403 inside HTTP 200. Search had no cost fields. Root-only links were initially accepted by an overly weak checker; the correction is appended to the ledger.
- Scrapfly crawl submission returned `crawler_uuid`; an older example used `uuid`. Two jobs were submitted before this was corrected. Collection of one accepted job returned four markdown pages and reported five credits. Its collection-only latency cannot be used for end-to-end comparisons.
- Linkup Search is POST. Older local notes claimed GET.
- Jina Reader/Search both rejected keyless requests here with 401. Keyed calls worked despite the dashboard's zero-token display. Current Reader UI token pricing differs from legacy products still present in the public catalog.

## Contract follow-ups

`src/core/types.ts` is unchanged. Add explicit unknown billing, usage units, and a distinction between reported monetary cost and list conversion of reported units. The adapters currently preserve uncertainty in memory so the harness retains the configured cost bound; a direct caller of the shared `Billing` shape cannot recover that distinction after JSON serialization. Historic zero placeholders must not enter public cost rankings.

Also consider partial-page errors and job IDs/cancellation state on crawl outcomes, cancellation separate from timeout, and an explicit scope on map arguments. Those additions would expose vendor failures and interrupted remote work without discarding usable pages or inferring more than the native API promises.

## Held-out benchmark campaign

The completed 17 October campaign contains 2,605 held-out/control/tuned result rows, plus separate dev pilots. Every provider in a track used identical frozen task IDs: search 60 (six providers), scrape 60, map 15, crawl 10. Results are exploratory, with paired site-clustered 95% intervals.

| Track | Highest observed default agent score |
| --- | --- |
| scrape | contextdev: 55/60 (91.7%) |
| map | contextdev: 7/15 (46.7%) |
| crawl | scrapfly: 7/10 (70.0%) |

Score order does not establish a general winner. Read the [plain-language findings](../docs/FINDINGS.md), [complete result tables](../results/wb-20261017-final/RESULTS.md), and [summary JSON](../results/wb-20261017-final/summary.json) for paired differences, intervals, median/p90 latency, errors, family rates, raw applicability, tuning and controls. The scrape oracle passed 60/60; no-tool passed 14/60 search and zero on the other tracks.

Spider’s workers.dev malicious-URL filter rejected the fresh fixture domain. The held-out 12/60 includes ten successful PyPI scrapes and two negative null-answer passes despite blocked retrieval. Firecrawl tuned scrape also encountered its native ten-request/minute free quota; this is disclosed as throughput under the frozen schedule. Raw relationship tasks are n/a, including every crawl task.

All costs from superseded or interrupted pilots are retained. [Budget reconciliation](BUDGET.md#benchmark-campaign-reconciliation) separates measured wallets, reported native credits/tokens, uncertain reservations and proxy model estimates. No purchase, upgrade or push occurred.

Exa, Tavily, Perplexity and Bright Data: not tested — no key. Jina is a separate historical seven-task subset only; no new calls were safely affordable under a guaranteed bound. Browserbase means HTTP Fetch/Search here, not a full browser pipeline. The sample uses one client location and only two scrape site clusters; freshness-version and large crawl families were excluded before the held-out run.

The original seven-task search and no-tool runs are superseded for quality, with costs retained. The expanded sample has family counts 14/13/13/13/7 across six clusters because only seven not-found tasks exist in the held-out split. See the separate historical Jina paired comparison in the aggregate report.
