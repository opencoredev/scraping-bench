# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | linkup | default | agent | 300 | 0.833 | 0.761–0.885 | 5405 | 9852 | 0.022990 |
| search | linkup | default | raw | 279 | 0.771 | 0.655–0.869 | 1254 | 1659 | 0.006977 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | linkup | linkup | 300 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | linkup | linkup | 279 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
