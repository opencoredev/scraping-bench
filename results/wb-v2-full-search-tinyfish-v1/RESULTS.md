# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | tinyfish | default | agent | 300 | 0.700 | 0.571–0.787 | 6431 | 11197 | 0.011207 |
| search | tinyfish | default | raw | 279 | 0.659 | 0.548–0.780 | 1142 | 1946 | 0.000000 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | tinyfish | tinyfish | 300 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | tinyfish | tinyfish | 279 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
