# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| map | contextdev | default | agent | 60 | 0.717 | 0.492–0.930 | 6526 | 9793 | 0.010672 |
| map | contextdev | default | raw | 60 | 0.167 | 0.045–0.306 | 1314 | 7475 | 0.013200 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| map | default | agent | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
