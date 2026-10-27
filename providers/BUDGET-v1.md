# Adapter smoke budget

Snapshot: 2026-10-17 UTC. This is a capacity estimate for the fixture calls, not authorization to spend the balance. The smoke runner reserves each attempt in [smoke.jsonl](smoke.jsonl) before dispatch and permits at most three attempts per provider/track across lanes. Spider search and Parallel scrape have exhausted that limit. Do not start another Scrapfly crawl to repair old parser failures.

Reported units are measured. Their USD equivalents use official list conversion rates in [pricing.ts](../src/adapters/pricing.ts), checked 2026-10-17. Values marked **list** were not returned as dollars by the service. Unknown usage must not be read as free; old zero placeholders are preserved in the ledger with correction records. The runner retains `maxCallUsd` for unknown bills, including successful responses without usage.

| Provider | Remaining balance / evidence | Default fixture cost per call | Approximate calls affordable, each track considered alone |
| --- | --- | --- | --- |
| Context.dev | 13,805 credits; response `key_metadata.credits_remaining` after final scrape | Scrape/search/map: reported 1 credit ($0.0022); crawl: reported 5 credits ($0.011) | 13,805 one-credit calls or 2,761 five-page crawls; concurrency 1 |
| Firecrawl | 1,357 credits; GET `/v2/team/credit-usage` | Scrape/map: list 1 credit ($0.005); search: reported 2 ($0.010); crawl: reported 5 ($0.025) | 1,357 scrape/map; 678 search; 271 five-page crawls |
| TinyFish | $10 wallet; GET `/v1/wallet`; account Fetch/Search contract rates both zero | Fetch $0/URL and Search $0/query in wallet contract; no per-response charge returned | Daily free grants 1,000 Fetch URLs / 12,000 Search requests, at most 999 / 11,999 left if these were the day's only calls. Recheck contract and allowance before scaling |
| Exa | No key; balance unavailable | Unmeasured; list search $0.007, contents $0.001 | Unknown |
| Tavily | No key; balance unavailable | Unmeasured; list basic search 1 credit ($0.008), basic extract 0.2 per successful URL ($0.0016), map 0.1/page, basic crawl 0.3/page | Unknown |
| Jina | Remaining token balance unavailable; keyed calls succeed despite dashboard showing zero | Reported scrape 161 tokens ($0.00000805); search 42,301 tokens ($0.00211505). Keyless attempts: HTTP 401, no usage reported | Unknown without remaining token grant |
| Spider | 2,480 credits = $0.248; GET `/data/credits` | Search succeeded without costs. Fixture scrape/map/crawl lack usable cost reports. Per-call cost unknown; variable compute/bandwidth pricing | Unknown; do not divide by zero placeholders. Search smoke limit exhausted |
| Linkup | $19.994; GET `/v1/credits/balance` | List scrape $0.001; search $0.005 | 19,994 default scrapes or 3,998 standard searches |
| Perplexity | No key | Unmeasured; list search $0.005 | Unknown |
| Bright Data | No key or zones | Unmeasured; list Unlocker/SERP $0.0015 each | Unknown |
| Scrapfly | 989 of 1,000 credits; GET `/account`, `subscription.usage.scrape` | Reported scrape 1 credit ($0.00015); recovered crawl 5 ($0.00075), with four markdown pages | 989 simple scrapes or 197 equivalent crawls; enabled features can raise cost |
| Browserbase | Remaining free allocation not exposed in responses queried | List Fetch markdown $0.004; default Parallel advanced Search $0.005 | At most 999 of each initial 1,000 free allocation if no other use; actual remaining unknown |

## Accounting qualifications

The balance observations and allowlisted wallet rates are in [balances.json](balances.json). Official balance references: [Context.dev](https://docs.context.dev/account/credits), [Firecrawl](https://docs.firecrawl.dev/api-reference/endpoint/credit-usage), [TinyFish](https://docs.tinyfish.ai/api-reference/wallet/get-wallet), [Linkup](https://docs.linkup.so/pages/documentation/endpoints/account/balance), [Spider](https://spider.cloud/llms.txt), and [Scrapfly](https://scrapfly.io/docs/account).

Two Scrapfly crawl submissions were accepted before the response parser understood `crawler_uuid`. One job was recovered and collected without resubmission. The current usage endpoint shows 11 credits consumed in total. The other accepted job's individual bill and output were not recovered. The recovered job's five-credit bill covers only that job. Neither parser failure is assumed free.

Firecrawl scrape/map responses did not expose usage, so their one-credit charges use list estimates. Firecrawl search/crawl and Context.dev returned credits. Linkup's $0.006 balance change agrees with the two list prices. Spider's current balance is measured, but no precise per-call cost can be inferred without a measured pre-call balance. Failed Jina keyless calls returned no usage; their actual account charge is unknown rather than a measured $0.

The original Jina ledger used an obsolete token conversion. Appended corrections apply the current Reader UI product's $50/1B tokens, confirmed against the [official product catalog](https://dash.jina.ai/api/v1/product). Token counts were not changed. Reported tokens inhabit the shared `credits` field because the contract has no unit field.

A price bound is mandatory for real `bench` providers. [smoke-limits.json](smoke-limits.json) is restricted to the single-page Firecrawl/Context.dev fixture example in [RESULTS.md](RESULTS.md); it is not a safe configuration for arbitrary crawl sizes. This run used two additional scrape calls for CLI integration, one per provider, and no model calls. Each now has two scrape attempts in the ledger.

## Benchmark campaign reconciliation

This section preserves the original campaign snapshot before the search 60 extension. Updated totals follow below.

Campaign `wb-20261017-final` completed the paired held-out runs, controls and tuned scrape from client `ms-a2`. The API ledger includes every pilot, correction and interrupted dispatch. No credits were bought and no plan was upgraded. Raw reuse is charged once. Dollar amounts below are list equivalents or conservative retained reservations, not cash purchases.

| Provider | Native usage / wallet change | API ledger USD | Model estimate USD |
| --- | --- | ---: | ---: |
| browserbase | 121 HTTP requests; remaining free quota not exposed | 0.52700000 | 0.509337 |
| contextdev | 514.000000 credits wallet decrease; 13291.000000 remaining (96.3% retained) | 1.13080000 | 1.517719 |
| firecrawl | 666.000000 credits wallet decrease; 691.000000 remaining (50.9% retained) | 4.42000000 | 1.498174 |
| jina | 8,308,910 reported tokens; ≤8,608,910 tokens including uncertain reservations | 0.43044550 | 0.892645 |
| linkup | 0.560000 USD wallet decrease; 19.434000 remaining (97.2% retained) | 0.56000000 | 0.808730 |
| scrapfly | 680.000000 credits wallet decrease; 309.000000 remaining (31.2% retained) | 0.10200000 | 1.002142 |
| spider | 51.094675 credits wallet decrease; 2428.905325 remaining (97.9% retained) | 0.00510947 | 0.391033 |
| tinyfish | 0.000000 USD wallet decrease; 10.000000 remaining (100.0% retained); 106 Fetch/Search requests at zero wallet contract rates | 0.00000000 | 0.426965 |

No-tool and oracle model estimates total $0.418645. They make no native provider purchase.

Measured native balances retain more than the 5% floor. Jina’s authenticated root previously displayed 9,957,538 tokens but can return a stale value; its campaign cap is $0.472183055 (9,443,661.1 tokens), below 95% of that observation. The signed token ledger, including full reservations for uncertain bills, stays below that cap. The final authenticated root returned 1,724,828 tokens remaining. Root balances can be cached, so the signed ledger remains the budget guard and no exact wallet delta is inferred. Browserbase’s remaining allocation is not exposed; conservative request counts stay below the retained free-product limits. TinyFish’s wallet contract prices Fetch/Search at zero and its requests stay below the daily limits.

Firecrawl 429s in tuned scrape retain the full unknown-bill bound. Measured wallet changes can therefore be lower than the API ledger equivalent. The ledger also retains uncertainty for interrupted or timed-out calls. Do not sum raw and agent row costs to calculate account spend.


Budget stops: none in default or tuned runs.

The frozen starting snapshot, final allowlisted balances, run configurations and audit hashes are in [campaign-20261017](../results/campaign-20261017/). Full usage, failures and cost per successful task are in the [aggregate summary](../results/wb-20261017-final/summary.json).

## Search60 extension reconciliation


| Provider | Extension API USD | Cumulative API USD | Cumulative physical calls |
| --- | ---: | ---: | ---: |
| browserbase | 0.78500000 | 1.31200000 | 278 |
| contextdev | 0.26180000 | 1.39260000 | 367 |
| firecrawl | 1.14000000 | 5.56000000 | 358 |
| jina | 0.00000000 | 0.43044550 | 173 |
| linkup | 0.53000000 | 1.09000000 | 278 |
| scrapfly | 0.00000000 | 0.10200000 | 162 |
| spider | 0.00000000 | 0.00510947 | 87 |
| tinyfish | 0.00000000 | 0.00000000 | 229 |

Jina: zero additional tokens. Its conservative cumulative ledger is 8,608,910 tokens; the 834,751-token safe allowance has no enforceable per-task bound. The seven cached tasks are historical evidence only.

| Provider | Cumulative wallet decrease | Remaining | Unit |
| --- | ---: | ---: | --- |
| contextdev | 633.000000 | 13172.000000 | credits |
| firecrawl | 894.000000 | 463.000000 | credits |
| linkup | 1.090000 | 18.904000 | USD |
| scrapfly | 680.000000 | 309.000000 | credits |
| spider | 51.094675 | 2428.905325 | credits |
| tinyfish | 0.000000 | 10.000000 | USD |

