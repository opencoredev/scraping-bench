# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | contextdev | default | agent | 300 | 0.717 | 0.598–0.791 | 7176 | 14263 | 0.017396 |
| search | contextdev | default | raw | 279 | 0.645 | 0.528–0.762 | 2461 | 4347 | 0.004217 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | contextdev | contextdev | 300 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | contextdev | contextdev | 279 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
