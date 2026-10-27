# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | you | default | agent | 300 | 0.643 | 0.493–0.736 | 5264 | 8760 | 0.031970 |
| search | you | default | raw | 279 | 0.638 | 0.520–0.744 | 534 | 679 | 0.008455 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | you | you | 300 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | you | you | 279 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
