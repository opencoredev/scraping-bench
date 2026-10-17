# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | contextdev | default | agent | 7 | 0.571 | 0.222–1.000 | 4604 | 7187 | 0.024503 |
| search | firecrawl | default | agent | 7 | 0.571 | 0.222–1.000 | 5642 | 8298 | 0.041147 |
| search | tinyfish | default | agent | 7 | 0.571 | 0.250–1.000 | 4480 | 6860 | 0.014975 |
| search | tinyfish | default | raw | 6 | 0.667 | 0.143–1.000 | 1854 | 1999 | 0.000000 |
| search | contextdev | default | raw | 6 | 0.667 | 0.143–1.000 | 1000 | 1276 | 0.003850 |
| search | firecrawl | default | raw | 6 | 0.500 | 0.000–1.000 | 2412 | 3188 | 0.023333 |
| search | linkup | default | agent | 7 | 0.714 | 0.400–1.000 | 6027 | 10155 | 0.030307 |
| search | linkup | default | raw | 6 | 0.500 | 0.000–1.000 | 855 | 1247 | 0.011667 |
| search | jina | default | agent | 7 | 0.286 | 0.000–0.667 | 38650 | 53362 | 0.136461 |
| search | jina | default | raw | 6 | 1.000 | 1.000–1.000 | 15664 | 20362 | 0.014807 |
| search | browserbase | default | agent | 7 | 0.143 | 0.000–0.500 | 15784 | 15784 | 0.168276 |
| search | browserbase | default | raw | 6 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | contextdev | linkup | 7 | -0.143 | -0.444–0.400 | unresolved |
| search | default | agent | firecrawl | linkup | 7 | -0.143 | -0.444–0.400 | unresolved |
| search | default | agent | tinyfish | linkup | 7 | -0.143 | -0.444–0.400 | unresolved |
| search | default | raw | tinyfish | jina | 6 | -0.333 | -0.857–0.000 | unresolved |
| search | default | raw | contextdev | jina | 6 | -0.333 | -0.857–0.000 | unresolved |
| search | default | raw | firecrawl | jina | 6 | -0.500 | -1.000–0.000 | unresolved |
| search | default | agent | linkup | linkup | 7 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | linkup | jina | 6 | -0.500 | -1.000–0.000 | unresolved |
| search | default | agent | jina | linkup | 7 | -0.429 | -0.668–-0.167 | difference detected |
| search | default | raw | jina | jina | 6 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | browserbase | browserbase | 7 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 6 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
