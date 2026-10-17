# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| crawl | none | default | agent | 10 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| map | none | default | agent | 15 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| scrape | none | default | agent | 60 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| scrape | oracle | default | agent | 60 | 1.000 | 1.000–1.000 | 2783 | 4228 | 0.003843 |
| search | none | default | agent | 60 | 0.233 | 0.000–0.500 | 2240 | 2937 | 0.010735 |
| crawl | scrapfly | default | agent | 10 | 0.700 | 0.000–0.955 | 14469 | 19805 | 0.028825 |
| crawl | scrapfly | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | firecrawl | default | agent | 10 | 0.500 | 0.000–0.682 | 60401 | 179901 | 0.142152 |
| crawl | firecrawl | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | contextdev | default | agent | 10 | 0.600 | 0.000–0.818 | 18317 | 19074 | 0.075843 |
| crawl | contextdev | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| map | contextdev | default | agent | 15 | 0.467 | 0.111–1.000 | 6051 | 10226 | 0.018417 |
| map | contextdev | default | raw | 15 | 0.200 | 0.036–0.833 | 1550 | 5854 | 0.011000 |
| map | firecrawl | default | agent | 15 | 0.400 | 0.107–1.000 | 10923 | 14711 | 0.033462 |
| map | firecrawl | default | raw | 15 | 0.200 | 0.036–0.833 | 7520 | 12173 | 0.025000 |
| scrape | browserbase | default | agent | 60 | 0.817 | 0.780–1.000 | 3268 | 4275 | 0.011198 |
| scrape | browserbase | default | raw | 55 | 0.673 | 0.600–1.000 | 530 | 644 | 0.006486 |
| scrape | linkup | default | agent | 60 | 0.900 | 0.900–0.900 | 3391 | 4238 | 0.005960 |
| scrape | linkup | default | raw | 55 | 0.909 | 0.900–0.911 | 532 | 1058 | 0.001200 |
| scrape | contextdev | default | agent | 60 | 0.917 | 0.900–1.000 | 3749 | 4817 | 0.007233 |
| scrape | contextdev | default | raw | 55 | 0.927 | 0.911–1.000 | 1168 | 1411 | 0.002588 |
| scrape | firecrawl | default | agent | 60 | 0.900 | 0.900–0.900 | 3254 | 4196 | 0.012155 |
| scrape | firecrawl | default | raw | 55 | 0.927 | 0.900–0.933 | 643 | 1360 | 0.008039 |
| scrape | scrapfly | default | agent | 60 | 0.883 | 0.800–0.900 | 4983 | 6618 | 0.006068 |
| scrape | scrapfly | default | raw | 55 | 0.782 | 0.700–0.800 | 2071 | 2995 | 0.000209 |
| scrape | jina | default | agent | 60 | 0.867 | 0.600–0.920 | 3824 | 5462 | 0.005697 |
| scrape | jina | default | raw | 55 | 0.927 | 0.900–0.933 | 1053 | 2342 | 0.000117 |
| scrape | spider | default | agent | 60 | 0.200 | 0.040–1.000 | 4555 | 5215 | 0.024752 |
| scrape | spider | default | raw | 55 | 0.182 | 0.000–1.000 | 1428 | 2107 | 0.000420 |
| scrape | tinyfish | default | agent | 60 | 0.900 | 0.800–0.920 | 3540 | 4859 | 0.004337 |
| scrape | tinyfish | default | raw | 55 | 0.909 | 0.800–0.933 | 717 | 1512 | 0.000000 |
| search | contextdev | default | agent | 60 | 0.750 | 0.517–0.963 | 5208 | 11012 | 0.018179 |
| search | contextdev | default | raw | 53 | 0.547 | 0.231–0.838 | 790 | 1171 | 0.004552 |
| search | firecrawl | default | agent | 60 | 0.850 | 0.690–1.000 | 10980 | 27407 | 0.030412 |
| search | firecrawl | default | raw | 53 | 0.472 | 0.197–0.817 | 901 | 2154 | 0.024000 |
| search | tinyfish | default | agent | 60 | 0.733 | 0.471–0.960 | 5330 | 10752 | 0.013119 |
| search | tinyfish | default | raw | 53 | 0.472 | 0.183–0.860 | 1129 | 2516 | 0.000000 |
| search | browserbase | default | agent | 60 | 0.383 | 0.210–0.588 | 11820 | 19275 | 0.059705 |
| search | browserbase | default | raw | 53 | 0.019 | 0.000–0.050 | 4543 | 4543 | 0.300000 |
| search | linkup | default | agent | 60 | 0.833 | 0.654–0.971 | 5269 | 9834 | 0.025515 |
| search | linkup | default | raw | 53 | 0.679 | 0.279–0.967 | 1236 | 1599 | 0.008333 |
| scrape | contextdev | tuned | agent | 60 | 0.917 | 0.900–1.000 | 3524 | 5664 | 0.006874 |
| scrape | contextdev | tuned | raw | 55 | 0.927 | 0.911–1.000 | 949 | 1301 | 0.002588 |
| scrape | firecrawl | tuned | agent | 60 | 0.817 | 0.800–0.900 | 3556 | 7300 | 0.022397 |
| scrape | firecrawl | tuned | raw | 55 | 0.836 | 0.822–0.900 | 762 | 4691 | 0.018478 |
| scrape | linkup | tuned | agent | 60 | 0.900 | 0.900–0.900 | 3484 | 4806 | 0.010393 |
| scrape | linkup | tuned | raw | 55 | 0.909 | 0.900–0.911 | 752 | 1152 | 0.006000 |
| scrape | jina | tuned | agent | 60 | 0.867 | 0.600–0.920 | 3882 | 5346 | 0.005863 |
| scrape | jina | tuned | raw | 55 | 0.945 | 0.933–1.000 | 975 | 2204 | 0.000117 |
| scrape | scrapfly | tuned | agent | 60 | 0.917 | 0.900–1.000 | 8726 | 12639 | 0.006206 |
| scrape | scrapfly | tuned | raw | 55 | 0.782 | 0.700–0.800 | 6216 | 9712 | 0.001169 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| crawl | default | agent | scrapfly | scrapfly | 10 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | scrapfly | scrapfly | 0 | n/a | n/a–n/a | insufficient data |
| crawl | default | agent | firecrawl | contextdev | 10 | -0.100 | -0.136–0.000 | unresolved |
| crawl | default | raw | firecrawl | contextdev | 0 | n/a | n/a–n/a | insufficient data |
| crawl | default | agent | contextdev | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | contextdev | contextdev | 0 | n/a | n/a–n/a | insufficient data |
| map | default | agent | contextdev | contextdev | 15 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | contextdev | contextdev | 15 | 0.000 | 0.000–0.000 | unresolved |
| map | default | agent | firecrawl | contextdev | 15 | -0.067 | -0.250–0.000 | unresolved |
| map | default | raw | firecrawl | contextdev | 15 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | browserbase | browserbase | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | browserbase | browserbase | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | linkup | contextdev | 60 | -0.017 | -0.100–0.000 | unresolved |
| scrape | default | raw | linkup | contextdev | 55 | -0.018 | -0.100–0.000 | unresolved |
| scrape | default | agent | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | contextdev | contextdev | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | firecrawl | contextdev | 60 | -0.017 | -0.100–0.000 | unresolved |
| scrape | default | raw | firecrawl | contextdev | 55 | 0.000 | -0.100–0.022 | unresolved |
| scrape | default | agent | scrapfly | scrapfly | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | scrapfly | scrapfly | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | jina | contextdev | 60 | -0.050 | -0.400–0.020 | unresolved |
| scrape | default | raw | jina | contextdev | 55 | 0.000 | -0.100–0.022 | unresolved |
| scrape | default | agent | spider | contextdev | 60 | -0.717 | -0.860–0.000 | unresolved |
| scrape | default | raw | spider | contextdev | 55 | -0.745 | -0.911–0.000 | unresolved |
| scrape | default | agent | tinyfish | contextdev | 60 | -0.017 | -0.200–0.020 | unresolved |
| scrape | default | raw | tinyfish | contextdev | 55 | -0.018 | -0.200–0.022 | unresolved |
| search | default | agent | contextdev | firecrawl | 60 | -0.100 | -0.231–0.038 | unresolved |
| search | default | raw | contextdev | linkup | 53 | -0.132 | -0.344–0.133 | unresolved |
| search | default | agent | firecrawl | firecrawl | 60 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | firecrawl | linkup | 53 | -0.208 | -0.600–0.135 | unresolved |
| search | default | agent | tinyfish | firecrawl | 60 | -0.117 | -0.258–0.040 | unresolved |
| search | default | raw | tinyfish | linkup | 53 | -0.208 | -0.585–0.149 | unresolved |
| search | default | agent | browserbase | browserbase | 60 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 53 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | linkup | firecrawl | 60 | -0.017 | -0.136–0.042 | unresolved |
| search | default | raw | linkup | linkup | 53 | 0.000 | 0.000–0.000 | unresolved |
| scrape | tuned | agent | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | tuned | raw | contextdev | jina | 55 | -0.018 | -0.022–0.000 | unresolved |
| scrape | tuned | agent | firecrawl | contextdev | 60 | -0.100 | -0.100–-0.100 | difference detected |
| scrape | tuned | raw | firecrawl | jina | 55 | -0.109 | -0.111–-0.100 | difference detected |
| scrape | tuned | agent | linkup | contextdev | 60 | -0.017 | -0.100–0.000 | unresolved |
| scrape | tuned | raw | linkup | jina | 55 | -0.036 | -0.100–-0.022 | difference detected |
| scrape | tuned | agent | jina | contextdev | 60 | -0.050 | -0.400–0.020 | unresolved |
| scrape | tuned | raw | jina | jina | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | tuned | agent | scrapfly | scrapfly | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | tuned | raw | scrapfly | scrapfly | 55 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.

## Scope and exclusions

- Single client ms-a2; no six-location speed run.
- Error class other includes agent JSON/field/invalid-tool failures; it is not a provider HTTP failure count.
- Firecrawl tuned scrape hit the native ten-request/minute free quota under the frozen schedule; three responses inspected.
- Jina root balances can be cached; final observed remaining tokens are recorded separately from conservative signed usage.
- Only two scrape site clusters; bootstrap intervals are unstable and may degenerate at boundary rates.
- Search 60 spans six clusters; families 14/13/13/13/7 because only seven held-out not-found tasks exist. Original seven-task search/control runs are superseded; costs retained. Jina is historical seven-task subset only, excluded from the full60 ranking.
- Raw relationship record checks are n/a; raw cost is standalone attributed cost, not additional spend.
- Browserbase HTTP Fetch/Search products; not a full-browser pipeline.
- Crawl evidence capped at 48KB, answers4096 tokens, max30 pages.
- Native spend includes pilots, superseded runs and interrupted dispatch reservations. Model dollars are list estimates through the existing proxy, not purchased credits.

- exa: not tested — no key
- tavily: not tested — no key
- perplexity: not tested — no key
- brightdata: not tested — no key
- parallel: results withheld: its customer terms require written consent to publish benchmark results

## Budget stops

No default or tuned provider-budget stop rows.

## Campaign spend including pilots and corrections

| Provider | API list-equivalent USD | Model estimate USD | Physical API calls |
|---|---:|---:|---:|
| none | 0.00000000 | 0.338370 | 0 |
| oracle | 0.00000000 | 0.230570 | 0 |
| firecrawl | 5.56000000 | 2.099169 | 358 |
| contextdev | 1.39260000 | 2.111359 | 367 |
| scrapfly | 0.10200000 | 1.002142 | 162 |
| linkup | 1.09000000 | 1.639498 | 278 |
| browserbase | 1.31200000 | 1.172557 | 278 |
| jina | 0.43044550 | 0.892645 | 173 |
| spider | 0.00510947 | 0.391033 | 87 |
| tinyfish | 0.00000000 | 1.004184 | 229 |

Actual cash purchase: $0. Native units and final wallet evidence are in campaign-20261017. Raw reuse is charged once in this ledger. Per-group costs include standalone raw attribution, so summing group costs double counts reused evidence. Median/P90 in the main table are successful tasks; all-task latency is also in summary.json. Cross-cohort leaderboard comparisons are descriptive only.

## Measured native balance changes

| Provider | Starting | Remaining | Spent | Retained |
|---|---:|---:|---:|---:|
| firecrawl (credits) | 1357 | 463 | 894 | 34.1% |
| spider (credits) | 2480 | 2428.905325 | 51.094674999999825 | 97.9% |
| scrapfly (credits) | 989 | 309 | 680 | 31.2% |
| linkup (USD) | 19.994 | 18.904 | 1.0899999999999999 | 94.5% |
| tinyfish (USD) | 10 | 10 | 0 | 100.0% |
| contextdev (credits) | 13805 | 13172 | 633 | 95.4% |

Wallet changes and ledger estimates use different evidence. Jina root balance may be stale; use the conservative token ledger. Browserbase exposes no remaining free quota. All raw reuse counts include pilots and corrections.

## Errors and per-family success

Error classes count recorded error events; a task can have more than one. Failure breakdown counts failed tasks. Raw n/a rows are excluded from family rates.

<details>
<summary>crawl / none / default / agent</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":10}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| section-commands | 5 | 0.0% |
| docs-page-records | 3 | 0.0% |
| pricing-tiers | 1 | 0.0% |
| migration-steps | 1 | 0.0% |

</details>

<details>
<summary>map / none / default / agent</summary>

Errors: {"other":1}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":1,"answerCheckWithoutRecordedError":14}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| docs-url-set | 7 | 0.0% |
| blog-all | 1 | 0.0% |
| blog-2025 | 1 | 0.0% |
| products-category | 1 | 0.0% |
| docs-api | 1 | 0.0% |
| blog-2026 | 1 | 0.0% |
| blog-tag | 1 | 0.0% |
| sitemap-only-orphans | 1 | 0.0% |
| docs-section | 1 | 0.0% |

</details>

<details>
<summary>scrape / none / default / agent</summary>

Errors: {"other":18}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":18,"answerCheckWithoutRecordedError":42}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 0.0% |
| blog-date-author | 7 | 0.0% |
| price-stock | 8 | 0.0% |
| pdf-number | 5 | 0.0% |
| specs-table-cell | 8 | 0.0% |
| install-command | 8 | 0.0% |
| not-found | 3 | 0.0% |
| pricing-tiers | 1 | 0.0% |
| long-page-deep-fact | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| tabs-field | 1 | 0.0% |
| redirect | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |
| js-rendered-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| cookie-boilerplate | 1 | 0.0% |
| non-english-field | 1 | 0.0% |
| soft-404 | 1 | 0.0% |

</details>

<details>
<summary>scrape / oracle / default / agent</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":0}. Truncated tasks: 7.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| blog-date-author | 7 | 100.0% |
| not-found | 3 | 100.0% |
| install-command | 8 | 100.0% |
| non-english-field | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| price-stock | 8 | 100.0% |
| pricing-tiers | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| iframe-field | 1 | 100.0% |
| long-page-deep-fact | 1 | 100.0% |
| shadow-dom-field | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| lazy-loaded-field | 1 | 100.0% |
| redirect | 1 | 100.0% |
| soft-404 | 1 | 100.0% |
| js-rendered-field | 1 | 100.0% |

</details>

<details>
<summary>search / none / default / agent</summary>

Errors: {"other":5}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":5,"answerCheckWithoutRecordedError":41}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 0.0% |
| company-financials | 13 | 0.0% |
| entity-facts | 13 | 76.9% |
| not-found | 7 | 57.1% |
| fresh | 13 | 0.0% |

</details>

<details>
<summary>crawl / scrapfly / default / agent</summary>

Errors: {"other":3}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":3,"answerCheckWithoutRecordedError":0}. Truncated tasks: 3.

| Family | Tasks | Success |
|---|---:|---:|
| section-commands | 5 | 100.0% |
| docs-page-records | 3 | 0.0% |
| pricing-tiers | 1 | 100.0% |
| migration-steps | 1 | 100.0% |

</details>

<details>
<summary>crawl / scrapfly / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":0}. Truncated tasks: 0.

No applicable graded family rows.

</details>

<details>
<summary>crawl / firecrawl / default / agent</summary>

Errors: {"other":5}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":5,"answerCheckWithoutRecordedError":0}. Truncated tasks: 3.

| Family | Tasks | Success |
|---|---:|---:|
| section-commands | 5 | 80.0% |
| pricing-tiers | 1 | 100.0% |
| docs-page-records | 3 | 0.0% |
| migration-steps | 1 | 0.0% |

</details>

<details>
<summary>crawl / firecrawl / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":0}. Truncated tasks: 0.

No applicable graded family rows.

</details>

<details>
<summary>crawl / contextdev / default / agent</summary>

Errors: {"other":4}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":4,"answerCheckWithoutRecordedError":0}. Truncated tasks: 3.

| Family | Tasks | Success |
|---|---:|---:|
| section-commands | 5 | 80.0% |
| pricing-tiers | 1 | 100.0% |
| docs-page-records | 3 | 0.0% |
| migration-steps | 1 | 100.0% |

</details>

<details>
<summary>crawl / contextdev / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":0}. Truncated tasks: 0.

No applicable graded family rows.

</details>

<details>
<summary>map / contextdev / default / agent</summary>

Errors: {"empty":16}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":8,"answerCheckWithoutRecordedError":0}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| docs-url-set | 7 | 100.0% |
| blog-2026 | 1 | 0.0% |
| blog-2025 | 1 | 0.0% |
| docs-section | 1 | 0.0% |
| products-category | 1 | 0.0% |
| blog-all | 1 | 0.0% |
| blog-tag | 1 | 0.0% |
| docs-api | 1 | 0.0% |
| sitemap-only-orphans | 1 | 0.0% |

</details>

<details>
<summary>map / contextdev / default / raw</summary>

Errors: {"empty":8}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":8,"answerCheckWithoutRecordedError":4}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| docs-url-set | 7 | 42.9% |
| blog-2026 | 1 | 0.0% |
| blog-2025 | 1 | 0.0% |
| docs-section | 1 | 0.0% |
| products-category | 1 | 0.0% |
| blog-all | 1 | 0.0% |
| blog-tag | 1 | 0.0% |
| docs-api | 1 | 0.0% |
| sitemap-only-orphans | 1 | 0.0% |

</details>

<details>
<summary>map / firecrawl / default / agent</summary>

Errors: {"other":1,"rate-limited":4}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":3,"answerCheckWithoutRecordedError":6}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| docs-url-set | 7 | 85.7% |
| docs-section | 1 | 0.0% |
| docs-api | 1 | 0.0% |
| products-category | 1 | 0.0% |
| blog-2026 | 1 | 0.0% |
| blog-all | 1 | 0.0% |
| blog-2025 | 1 | 0.0% |
| sitemap-only-orphans | 1 | 0.0% |
| blog-tag | 1 | 0.0% |

</details>

<details>
<summary>map / firecrawl / default / raw</summary>

Errors: {"rate-limited":2}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":2,"answerCheckWithoutRecordedError":10}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| docs-url-set | 7 | 42.9% |
| docs-section | 1 | 0.0% |
| docs-api | 1 | 0.0% |
| products-category | 1 | 0.0% |
| blog-2026 | 1 | 0.0% |
| blog-all | 1 | 0.0% |
| blog-2025 | 1 | 0.0% |
| sitemap-only-orphans | 1 | 0.0% |
| blog-tag | 1 | 0.0% |

</details>

<details>
<summary>scrape / browserbase / default / agent</summary>

Errors: {"http-4xx":10,"other":2,"empty":2}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":7,"answerCheckWithoutRecordedError":4}. Truncated tasks: 11.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| price-stock | 8 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| blog-date-author | 7 | 100.0% |
| pdf-number | 5 | 0.0% |
| not-found | 3 | 100.0% |
| soft-404 | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| install-command | 8 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| pricing-tiers | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| non-english-field | 1 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 0.0% |
| redirect | 1 | 0.0% |

</details>

<details>
<summary>scrape / browserbase / default / raw</summary>

Errors: {"http-4xx":5,"empty":1}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":6,"answerCheckWithoutRecordedError":12}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| price-stock | 8 | 100.0% |
| specs-table-cell | 8 | 0.0% |
| blog-date-author | 7 | 100.0% |
| pdf-number | 5 | 0.0% |
| cookie-boilerplate | 1 | 100.0% |
| install-command | 8 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| tabs-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| non-english-field | 1 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 100.0% |
| redirect | 1 | 0.0% |

</details>

<details>
<summary>scrape / linkup / default / agent</summary>

Errors: {"other":1}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":1,"answerCheckWithoutRecordedError":5}. Truncated tasks: 10.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 90.0% |
| price-stock | 8 | 100.0% |
| blog-date-author | 7 | 100.0% |
| not-found | 3 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| install-command | 8 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 0.0% |
| pricing-tiers | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| non-english-field | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| tabs-field | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| redirect | 1 | 100.0% |
| soft-404 | 1 | 100.0% |

</details>

<details>
<summary>scrape / linkup / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":5}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 90.0% |
| price-stock | 8 | 100.0% |
| blog-date-author | 7 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| install-command | 8 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| non-english-field | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| tabs-field | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| redirect | 1 | 100.0% |

</details>

<details>
<summary>scrape / contextdev / default / agent</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":5}. Truncated tasks: 11.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| install-command | 8 | 100.0% |
| price-stock | 8 | 100.0% |
| iframe-field | 1 | 0.0% |
| blog-date-author | 7 | 100.0% |
| non-english-field | 1 | 100.0% |
| soft-404 | 1 | 100.0% |
| pricing-tiers | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| pdf-number | 5 | 100.0% |
| not-found | 3 | 100.0% |
| tabs-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| cookie-boilerplate | 1 | 100.0% |
| redirect | 1 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |

</details>

<details>
<summary>scrape / contextdev / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":4}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| install-command | 8 | 100.0% |
| price-stock | 8 | 100.0% |
| iframe-field | 1 | 0.0% |
| blog-date-author | 7 | 100.0% |
| non-english-field | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| pdf-number | 5 | 100.0% |
| tabs-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| cookie-boilerplate | 1 | 100.0% |
| redirect | 1 | 100.0% |
| long-page-deep-fact | 1 | 100.0% |

</details>

<details>
<summary>scrape / firecrawl / default / agent</summary>

Errors: {"rate-limited":2,"other":2}. Limits: {"task-cost-limit":2}. Failed-task breakdown: {"limit":2,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":4}. Truncated tasks: 11.

| Family | Tasks | Success |
|---|---:|---:|
| blog-date-author | 7 | 100.0% |
| pdf-number | 5 | 100.0% |
| specs-table-cell | 8 | 87.5% |
| price-stock | 8 | 100.0% |
| package-version | 10 | 90.0% |
| install-command | 8 | 100.0% |
| redirect | 1 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |
| non-english-field | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| iframe-field | 1 | 100.0% |
| pricing-tiers | 1 | 100.0% |
| not-found | 3 | 66.7% |
| cookie-boilerplate | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| shadow-dom-field | 1 | 100.0% |
| soft-404 | 1 | 100.0% |

</details>

<details>
<summary>scrape / firecrawl / default / raw</summary>

Errors: {"rate-limited":2}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":2,"answerCheckWithoutRecordedError":3}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| blog-date-author | 7 | 100.0% |
| pdf-number | 5 | 100.0% |
| specs-table-cell | 8 | 87.5% |
| price-stock | 8 | 100.0% |
| package-version | 10 | 90.0% |
| install-command | 8 | 100.0% |
| redirect | 1 | 100.0% |
| long-page-deep-fact | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| iframe-field | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| shadow-dom-field | 1 | 100.0% |

</details>

<details>
<summary>scrape / scrapfly / default / agent</summary>

Errors: {"other":1}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":1,"answerCheckWithoutRecordedError":6}. Truncated tasks: 10.

| Family | Tasks | Success |
|---|---:|---:|
| iframe-field | 1 | 0.0% |
| package-version | 10 | 80.0% |
| lazy-loaded-field | 1 | 0.0% |
| not-found | 3 | 100.0% |
| blog-date-author | 7 | 100.0% |
| price-stock | 8 | 100.0% |
| install-command | 8 | 100.0% |
| pricing-tiers | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| non-english-field | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |
| redirect | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| soft-404 | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |

</details>

<details>
<summary>scrape / scrapfly / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":12}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| iframe-field | 1 | 0.0% |
| package-version | 10 | 70.0% |
| lazy-loaded-field | 1 | 0.0% |
| blog-date-author | 7 | 100.0% |
| price-stock | 8 | 100.0% |
| install-command | 8 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| non-english-field | 1 | 100.0% |
| pdf-number | 5 | 0.0% |
| long-page-deep-fact | 1 | 100.0% |
| redirect | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |

</details>

<details>
<summary>scrape / jina / default / agent</summary>

Errors: {"other":1}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":1,"answerCheckWithoutRecordedError":7}. Truncated tasks: 8.

| Family | Tasks | Success |
|---|---:|---:|
| price-stock | 8 | 100.0% |
| install-command | 8 | 100.0% |
| blog-date-author | 7 | 100.0% |
| lazy-loaded-field | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| pdf-number | 5 | 100.0% |
| package-version | 10 | 60.0% |
| specs-table-cell | 8 | 100.0% |
| redirect | 1 | 100.0% |
| not-found | 3 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| soft-404 | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| tabs-field | 1 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| pricing-tiers | 1 | 100.0% |

</details>

<details>
<summary>scrape / jina / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":4}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| price-stock | 8 | 100.0% |
| install-command | 8 | 100.0% |
| blog-date-author | 7 | 100.0% |
| lazy-loaded-field | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| pdf-number | 5 | 100.0% |
| package-version | 10 | 90.0% |
| specs-table-cell | 8 | 100.0% |
| redirect | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| tabs-field | 1 | 100.0% |
| long-page-deep-fact | 1 | 100.0% |
| iframe-field | 1 | 0.0% |

</details>

<details>
<summary>scrape / spider / default / agent</summary>

Errors: {"blocked":51,"other":11}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":48,"answerCheckWithoutRecordedError":0}. Truncated tasks: 10.

| Family | Tasks | Success |
|---|---:|---:|
| specs-table-cell | 8 | 0.0% |
| package-version | 10 | 100.0% |
| blog-date-author | 7 | 0.0% |
| pdf-number | 5 | 0.0% |
| install-command | 8 | 0.0% |
| price-stock | 8 | 0.0% |
| not-found | 3 | 33.3% |
| pricing-tiers | 1 | 0.0% |
| cookie-boilerplate | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |
| non-english-field | 1 | 0.0% |
| redirect | 1 | 0.0% |
| soft-404 | 1 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| js-rendered-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| tabs-field | 1 | 0.0% |

</details>

<details>
<summary>scrape / spider / default / raw</summary>

Errors: {"blocked":50}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":50,"answerCheckWithoutRecordedError":0}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| specs-table-cell | 8 | 0.0% |
| package-version | 10 | 100.0% |
| blog-date-author | 7 | 0.0% |
| pdf-number | 5 | 0.0% |
| install-command | 8 | 0.0% |
| price-stock | 8 | 0.0% |
| cookie-boilerplate | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |
| non-english-field | 1 | 0.0% |
| redirect | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| js-rendered-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| tabs-field | 1 | 0.0% |

</details>

<details>
<summary>scrape / tinyfish / default / agent</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":6}. Truncated tasks: 8.

| Family | Tasks | Success |
|---|---:|---:|
| blog-date-author | 7 | 100.0% |
| install-command | 8 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| package-version | 10 | 80.0% |
| shadow-dom-field | 1 | 0.0% |
| not-found | 3 | 100.0% |
| price-stock | 8 | 100.0% |
| pdf-number | 5 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |
| redirect | 1 | 100.0% |
| pricing-tiers | 1 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| iframe-field | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| soft-404 | 1 | 100.0% |

</details>

<details>
<summary>scrape / tinyfish / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":5}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| blog-date-author | 7 | 100.0% |
| install-command | 8 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| package-version | 10 | 80.0% |
| shadow-dom-field | 1 | 0.0% |
| price-stock | 8 | 100.0% |
| pdf-number | 5 | 100.0% |
| long-page-deep-fact | 1 | 100.0% |
| redirect | 1 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| iframe-field | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |

</details>

<details>
<summary>search / contextdev / default / agent</summary>

Errors: {"other":4}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":4,"answerCheckWithoutRecordedError":11}. Truncated tasks: 6.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 100.0% |
| entity-facts | 13 | 84.6% |
| company-financials | 13 | 69.2% |
| not-found | 7 | 100.0% |
| fresh | 13 | 30.8% |

</details>

<details>
<summary>search / contextdev / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":24}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 64.3% |
| entity-facts | 13 | 92.3% |
| company-financials | 13 | 53.8% |
| fresh | 13 | 7.7% |

</details>

<details>
<summary>search / firecrawl / default / agent</summary>

Errors: {"other":3}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":3,"answerCheckWithoutRecordedError":6}. Truncated tasks: 4.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 100.0% |
| entity-facts | 13 | 76.9% |
| fresh | 13 | 53.8% |
| company-financials | 13 | 100.0% |
| not-found | 7 | 100.0% |

</details>

<details>
<summary>search / firecrawl / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":28}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 50.0% |
| entity-facts | 13 | 100.0% |
| fresh | 13 | 23.1% |
| company-financials | 13 | 15.4% |

</details>

<details>
<summary>search / tinyfish / default / agent</summary>

Errors: {"other":5,"empty":1}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":5,"answerCheckWithoutRecordedError":11}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 100.0% |
| fresh | 13 | 23.1% |
| company-financials | 13 | 69.2% |
| entity-facts | 13 | 84.6% |
| not-found | 7 | 100.0% |

</details>

<details>
<summary>search / tinyfish / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":28}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 71.4% |
| fresh | 13 | 7.7% |
| company-financials | 13 | 15.4% |
| entity-facts | 13 | 92.3% |

</details>

<details>
<summary>search / browserbase / default / agent</summary>

Errors: {"other":11}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":11,"answerCheckWithoutRecordedError":26}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 42.9% |
| fresh | 13 | 7.7% |
| company-financials | 13 | 23.1% |
| not-found | 7 | 100.0% |
| entity-facts | 13 | 46.2% |

</details>

<details>
<summary>search / browserbase / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":52}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| latest-version | 14 | 0.0% |
| fresh | 13 | 0.0% |
| company-financials | 13 | 7.7% |
| entity-facts | 13 | 0.0% |

</details>

<details>
<summary>search / linkup / default / agent</summary>

Errors: {"other":1}. Limits: {"task-cost-limit":4}. Failed-task breakdown: {"limit":4,"errorWithoutLimit":1,"answerCheckWithoutRecordedError":5}. Truncated tasks: 42.

| Family | Tasks | Success |
|---|---:|---:|
| entity-facts | 13 | 84.6% |
| company-financials | 13 | 100.0% |
| fresh | 13 | 53.8% |
| not-found | 7 | 100.0% |
| latest-version | 14 | 85.7% |

</details>

<details>
<summary>search / linkup / default / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":17}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| entity-facts | 13 | 100.0% |
| company-financials | 13 | 100.0% |
| fresh | 13 | 7.7% |
| latest-version | 14 | 64.3% |

</details>

<details>
<summary>scrape / contextdev / tuned / agent</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":5}. Truncated tasks: 11.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| price-stock | 8 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| blog-date-author | 7 | 100.0% |
| not-found | 3 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| install-command | 8 | 100.0% |
| pdf-number | 5 | 100.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| redirect | 1 | 100.0% |
| iframe-field | 1 | 0.0% |
| pricing-tiers | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |
| soft-404 | 1 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |

</details>

<details>
<summary>scrape / contextdev / tuned / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":4}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| price-stock | 8 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| blog-date-author | 7 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| install-command | 8 | 100.0% |
| pdf-number | 5 | 100.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| redirect | 1 | 100.0% |
| iframe-field | 1 | 0.0% |
| js-rendered-field | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 100.0% |

</details>

<details>
<summary>scrape / firecrawl / tuned / agent</summary>

Errors: {"rate-limited":10,"other":10}. Limits: {"task-cost-limit":10}. Failed-task breakdown: {"limit":10,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":1}. Truncated tasks: 10.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 90.0% |
| blog-date-author | 7 | 85.7% |
| specs-table-cell | 8 | 75.0% |
| install-command | 8 | 100.0% |
| pdf-number | 5 | 80.0% |
| not-found | 3 | 66.7% |
| shadow-dom-field | 1 | 100.0% |
| redirect | 1 | 100.0% |
| cookie-boilerplate | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| price-stock | 8 | 87.5% |
| long-page-deep-fact | 1 | 0.0% |
| pricing-tiers | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| soft-404 | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| iframe-field | 1 | 100.0% |

</details>

<details>
<summary>scrape / firecrawl / tuned / raw</summary>

Errors: {"rate-limited":10}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":10,"answerCheckWithoutRecordedError":0}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 90.0% |
| blog-date-author | 7 | 85.7% |
| specs-table-cell | 8 | 75.0% |
| install-command | 8 | 100.0% |
| pdf-number | 5 | 80.0% |
| shadow-dom-field | 1 | 100.0% |
| redirect | 1 | 100.0% |
| cookie-boilerplate | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| price-stock | 8 | 87.5% |
| long-page-deep-fact | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| iframe-field | 1 | 100.0% |

</details>

<details>
<summary>scrape / linkup / tuned / agent</summary>

Errors: {"other":1}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":1,"answerCheckWithoutRecordedError":5}. Truncated tasks: 10.

| Family | Tasks | Success |
|---|---:|---:|
| install-command | 8 | 100.0% |
| package-version | 10 | 90.0% |
| blog-date-author | 7 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| non-english-field | 1 | 100.0% |
| redirect | 1 | 100.0% |
| price-stock | 8 | 100.0% |
| not-found | 3 | 100.0% |
| pricing-tiers | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| tabs-field | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| js-rendered-field | 1 | 0.0% |
| soft-404 | 1 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |
| lazy-loaded-field | 1 | 0.0% |
| cookie-boilerplate | 1 | 100.0% |

</details>

<details>
<summary>scrape / linkup / tuned / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":5}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| install-command | 8 | 100.0% |
| package-version | 10 | 90.0% |
| blog-date-author | 7 | 100.0% |
| specs-table-cell | 8 | 100.0% |
| non-english-field | 1 | 100.0% |
| redirect | 1 | 100.0% |
| price-stock | 8 | 100.0% |
| pdf-number | 5 | 100.0% |
| tabs-field | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| iframe-field | 1 | 0.0% |
| js-rendered-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| cookie-boilerplate | 1 | 100.0% |

</details>

<details>
<summary>scrape / jina / tuned / agent</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":8}. Truncated tasks: 8.

| Family | Tasks | Success |
|---|---:|---:|
| specs-table-cell | 8 | 100.0% |
| redirect | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| long-page-deep-fact | 1 | 0.0% |
| install-command | 8 | 100.0% |
| blog-date-author | 7 | 100.0% |
| package-version | 10 | 60.0% |
| price-stock | 8 | 100.0% |
| tabs-field | 1 | 100.0% |
| not-found | 3 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| pricing-tiers | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| iframe-field | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| soft-404 | 1 | 100.0% |

</details>

<details>
<summary>scrape / jina / tuned / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":3}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| specs-table-cell | 8 | 100.0% |
| redirect | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| long-page-deep-fact | 1 | 100.0% |
| install-command | 8 | 100.0% |
| blog-date-author | 7 | 100.0% |
| package-version | 10 | 100.0% |
| price-stock | 8 | 100.0% |
| tabs-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |
| non-english-field | 1 | 100.0% |
| iframe-field | 1 | 0.0% |
| shadow-dom-field | 1 | 0.0% |
| lazy-loaded-field | 1 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |

</details>

<details>
<summary>scrape / scrapfly / tuned / agent</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":5}. Truncated tasks: 11.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 100.0% |
| install-command | 8 | 100.0% |
| price-stock | 8 | 100.0% |
| iframe-field | 1 | 0.0% |
| soft-404 | 1 | 100.0% |
| not-found | 3 | 100.0% |
| blog-date-author | 7 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 0.0% |
| pricing-tiers | 1 | 100.0% |
| pdf-number | 5 | 100.0% |
| redirect | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| specs-table-cell | 8 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |

</details>

<details>
<summary>scrape / scrapfly / tuned / raw</summary>

Errors: {}. Limits: {}. Failed-task breakdown: {"limit":0,"errorWithoutLimit":0,"answerCheckWithoutRecordedError":12}. Truncated tasks: 0.

| Family | Tasks | Success |
|---|---:|---:|
| package-version | 10 | 70.0% |
| install-command | 8 | 100.0% |
| price-stock | 8 | 100.0% |
| iframe-field | 1 | 0.0% |
| blog-date-author | 7 | 100.0% |
| lazy-loaded-field | 1 | 0.0% |
| long-page-deep-fact | 1 | 100.0% |
| pdf-number | 5 | 0.0% |
| redirect | 1 | 100.0% |
| shadow-dom-field | 1 | 0.0% |
| specs-table-cell | 8 | 100.0% |
| cookie-boilerplate | 1 | 100.0% |
| tabs-field | 1 | 100.0% |
| non-english-field | 1 | 100.0% |
| js-rendered-field | 1 | 0.0% |

</details>

## Expanded search and historical Jina subset

Search uses 60 held-out tasks (families14/13/13/13/7; six clusters). Superseded quality runs: wb-20261017-full-search-v1, wb-20261017-controls-search-v1. Their spend remains included. Firecrawl epoch starts691credits with68 retained.

Jina evidence is from the earlier run; other providers and no-tool were rerun. This is a historical, time-qualified paired comparison, not a fresh Jina run. Old .03/call bound disproven; no documented enforceable upstream token ceiling. Unchanged policy permits3agent calls plus1raw miss. Largest guaranteed affordable new full-task subset is zero. Retain cached historical seven only as a separate time-qualified paired subset; no new Jina charges.

# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | jina | default | agent | 7 | 0.286 | 0.000–0.625 | 38650 | 53362 | 0.136461 |
| search | jina | default | raw | 6 | 1.000 | 1.000–1.000 | 15664 | 20362 | 0.014807 |
| search | none | default | agent | 7 | 0.143 | 0.000–0.375 | 1737 | 1737 | 0.016092 |
| search | browserbase | default | agent | 7 | 0.143 | 0.000–0.500 | 18321 | 18321 | 0.193162 |
| search | browserbase | default | raw | 6 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| search | tinyfish | default | agent | 7 | 0.571 | 0.222–1.000 | 4744 | 5276 | 0.013516 |
| search | tinyfish | default | raw | 6 | 0.500 | 0.000–1.000 | 995 | 1159 | 0.000000 |
| search | linkup | default | agent | 7 | 0.714 | 0.375–1.000 | 4920 | 7938 | 0.033907 |
| search | linkup | default | raw | 6 | 0.500 | 0.000–1.000 | 872 | 1075 | 0.011667 |
| search | firecrawl | default | agent | 7 | 0.571 | 0.222–1.000 | 10347 | 24092 | 0.036773 |
| search | firecrawl | default | raw | 6 | 0.500 | 0.000–1.000 | 330 | 787 | 0.023333 |
| search | contextdev | default | agent | 7 | 0.571 | 0.222–1.000 | 4097 | 5825 | 0.022188 |
| search | contextdev | default | raw | 6 | 0.667 | 0.143–1.000 | 974 | 1298 | 0.003850 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | jina | linkup | 7 | -0.429 | -0.667–-0.167 | difference detected |
| search | default | raw | jina | jina | 6 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | browserbase | browserbase | 7 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 6 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | tinyfish | linkup | 7 | -0.143 | -0.444–0.400 | unresolved |
| search | default | raw | tinyfish | jina | 6 | -0.500 | -1.000–0.000 | unresolved |
| search | default | agent | linkup | linkup | 7 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | linkup | jina | 6 | -0.500 | -1.000–0.000 | unresolved |
| search | default | agent | firecrawl | linkup | 7 | -0.143 | -0.444–0.400 | unresolved |
| search | default | raw | firecrawl | jina | 6 | -0.500 | -1.000–0.000 | unresolved |
| search | default | agent | contextdev | linkup | 7 | -0.143 | -0.444–0.400 | unresolved |
| search | default | raw | contextdev | jina | 6 | -0.333 | -0.857–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.

### Matched seven-task differences versus historical Jina

| Provider | Paired tasks | Difference | 95% CI | Interpretation |
|---|---:|---:|---|---|
| none | 7 | -0.143 | -0.500–0.000 | unresolved |
| browserbase | 7 | -0.143 | -0.375–0.000 | unresolved |
| tinyfish | 7 | 0.286 | 0.000–0.800 | unresolved |
| linkup | 7 | 0.429 | 0.167–0.667 | difference detected |
| firecrawl | 7 | 0.286 | 0.000–0.800 | unresolved |
| contextdev | 7 | 0.286 | 0.000–0.800 | unresolved |
