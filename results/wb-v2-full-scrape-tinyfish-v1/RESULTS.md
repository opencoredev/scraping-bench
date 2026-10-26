# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | tinyfish | default | agent | 40 | 0.700 | 0.535–0.865 | 3770 | 5274 | 0.007582 |
| scrape | tinyfish | default | raw | 40 | 0.750 | 0.581–0.919 | 751 | 1987 | 0.000000 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | tinyfish | tinyfish | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | tinyfish | tinyfish | 40 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
