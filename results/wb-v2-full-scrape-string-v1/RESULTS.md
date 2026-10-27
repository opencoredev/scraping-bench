# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | string | default | agent | 40 | 0.775 | 0.650–0.897 | 4186 | 6168 | 0.011157 |
| scrape | string | default | raw | 40 | 0.950 | 0.850–1.000 | 344 | 570 | 0.000316 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | string | string | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | string | string | 40 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
