# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | browserbase | default | agent | 40 | 0.650 | 0.488–0.805 | 3664 | 5940 | 0.018732 |
| scrape | browserbase | default | raw | 40 | 0.725 | 0.575–0.869 | 453 | 642 | 0.005517 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | browserbase | browserbase | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | browserbase | browserbase | 40 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
