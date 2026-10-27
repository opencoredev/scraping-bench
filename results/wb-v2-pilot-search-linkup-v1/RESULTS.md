# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | linkup | default | agent | 3 | 0.667 | 0.000–1.000 | 7000 | 8296 | 0.046414 |
| search | linkup | default | raw | 3 | 0.667 | 0.000–1.000 | 1294 | 1597 | 0.007500 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | linkup | linkup | 3 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | linkup | linkup | 3 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
