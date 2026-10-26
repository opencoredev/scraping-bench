# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | linkup | default | agent | 300 | 0.587 | 0.447–0.719 | 3556 | 5168 | 0.015415 |
| scrape | linkup | default | raw | 300 | 0.870 | 0.758–0.956 | 439 | 835 | 0.001149 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | linkup | linkup | 300 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | linkup | linkup | 300 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
