# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | firecrawl | default | agent | 10 | 1.000 | 1.000–1.000 | 3967 | 4943 | 0.009691 |
| scrape | firecrawl | default | raw | 10 | 1.000 | 1.000–1.000 | 883 | 1462 | 0.005000 |
| scrape | linkup | default | agent | 10 | 0.800 | 0.667–0.857 | 3441 | 4217 | 0.007076 |
| scrape | linkup | default | raw | 10 | 0.900 | 0.667–1.000 | 536 | 904 | 0.001111 |
| scrape | jina | default | agent | 10 | 0.900 | 0.667–1.000 | 4277 | 7549 | 0.007752 |
| scrape | jina | default | raw | 10 | 1.000 | 1.000–1.000 | 1126 | 4262 | 0.000177 |
| scrape | spider | default | agent | 10 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| scrape | spider | default | raw | 10 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| scrape | tinyfish | default | agent | 10 | 1.000 | 1.000–1.000 | 4009 | 5512 | 0.004498 |
| scrape | tinyfish | default | raw | 10 | 1.000 | 1.000–1.000 | 724 | 1288 | 0.000000 |
| scrape | scrapfly | default | agent | 10 | 0.700 | 0.333–0.857 | 5544 | 7025 | 0.006146 |
| scrape | scrapfly | default | raw | 10 | 0.700 | 0.667–0.714 | 1817 | 3151 | 0.000193 |
| scrape | browserbase | default | agent | 10 | 0.900 | 0.857–1.000 | 3751 | 4962 | 0.010895 |
| scrape | browserbase | default | raw | 10 | 0.800 | 0.714–1.000 | 581 | 697 | 0.005000 |
| scrape | contextdev | default | agent | 10 | 1.000 | 1.000–1.000 | 4168 | 5475 | 0.007382 |
| scrape | contextdev | default | raw | 10 | 1.000 | 1.000–1.000 | 1166 | 1604 | 0.002200 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | firecrawl | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | firecrawl | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | linkup | contextdev | 10 | -0.200 | -0.333–-0.143 | difference detected |
| scrape | default | raw | linkup | contextdev | 10 | -0.100 | -0.333–0.000 | unresolved |
| scrape | default | agent | jina | contextdev | 10 | -0.100 | -0.333–0.000 | unresolved |
| scrape | default | raw | jina | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | spider | contextdev | 10 | -1.000 | -1.000–-1.000 | difference detected |
| scrape | default | raw | spider | contextdev | 10 | -1.000 | -1.000–-1.000 | difference detected |
| scrape | default | agent | tinyfish | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | tinyfish | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | scrapfly | scrapfly | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | scrapfly | scrapfly | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | browserbase | browserbase | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | browserbase | browserbase | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | contextdev | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | contextdev | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
