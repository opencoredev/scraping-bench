# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| map | string | default | agent | 1 | 1.000 | 1.000–1.000 | 8261 | 8261 | 0.007873 |
| map | string | default | raw | 1 | 1.000 | 1.000–1.000 | 3546 | 3546 | 0.002700 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| map | default | agent | string | string | 1 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | string | string | 1 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
