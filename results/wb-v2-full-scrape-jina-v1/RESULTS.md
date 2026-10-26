# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | jina | default | agent | 40 | 0.125 | 0.026–0.220 | 5357 | 6214 | 0.049097 |
| scrape | jina | default | raw | 40 | 0.450 | 0.309–0.615 | 2031 | 4414 | 0.000297 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | jina | jina | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | jina | jina | 40 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
