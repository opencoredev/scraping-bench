# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | contextdev | default | agent | 3 | 0.667 | 0.000–1.000 | 7587 | 8660 | 0.017363 |
| scrape | contextdev | default | raw | 3 | 0.667 | 0.000–1.000 | 2475 | 3869 | 0.003300 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | contextdev | contextdev | 3 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | contextdev | contextdev | 3 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
