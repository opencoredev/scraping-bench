# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | browserbase | default | agent | 3 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| search | browserbase | default | raw | 3 | 0.333 | 0.000–1.000 | 5025 | 5025 | 0.015000 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | browserbase | browserbase | 3 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 3 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
