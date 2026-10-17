# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | contextdev | default | agent | 60 | 0.750 | 0.526–0.966 | 5208 | 11012 | 0.018179 |
| search | contextdev | default | raw | 53 | 0.547 | 0.227–0.844 | 790 | 1171 | 0.004552 |
| search | firecrawl | default | agent | 60 | 0.850 | 0.691–1.000 | 10980 | 27407 | 0.030412 |
| search | firecrawl | default | raw | 53 | 0.472 | 0.196–0.817 | 901 | 2154 | 0.024000 |
| search | tinyfish | default | agent | 60 | 0.733 | 0.467–0.962 | 5330 | 10752 | 0.013119 |
| search | tinyfish | default | raw | 53 | 0.472 | 0.176–0.853 | 1129 | 2516 | 0.000000 |
| search | browserbase | default | agent | 60 | 0.383 | 0.200–0.586 | 11820 | 19275 | 0.059705 |
| search | browserbase | default | raw | 53 | 0.019 | 0.000–0.051 | 4543 | 4543 | 0.300000 |
| search | linkup | default | agent | 60 | 0.833 | 0.654–0.971 | 5269 | 9834 | 0.025515 |
| search | linkup | default | raw | 53 | 0.679 | 0.279–0.967 | 1236 | 1599 | 0.008333 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | contextdev | firecrawl | 60 | -0.100 | -0.231–0.038 | unresolved |
| search | default | raw | contextdev | linkup | 53 | -0.132 | -0.345–0.128 | unresolved |
| search | default | agent | firecrawl | firecrawl | 60 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | firecrawl | linkup | 53 | -0.208 | -0.600–0.129 | unresolved |
| search | default | agent | tinyfish | firecrawl | 60 | -0.117 | -0.258–0.040 | unresolved |
| search | default | raw | tinyfish | linkup | 53 | -0.208 | -0.578–0.156 | unresolved |
| search | default | agent | browserbase | browserbase | 60 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 53 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | linkup | firecrawl | 60 | -0.017 | -0.114–0.042 | unresolved |
| search | default | raw | linkup | linkup | 53 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
