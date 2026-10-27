# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | scrapfly | default | agent | 40 | 0.775 | 0.634–0.900 | 5674 | 7086 | 0.009798 |
| scrape | scrapfly | default | raw | 40 | 0.850 | 0.727–0.952 | 2263 | 2993 | 0.000172 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | scrapfly | scrapfly | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | scrapfly | scrapfly | 40 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
