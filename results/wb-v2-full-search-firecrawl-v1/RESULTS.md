# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | firecrawl | default | agent | 30 | 0.867 | 0.727–0.969 | 8461 | 14645 | 0.027248 |
| search | firecrawl | default | raw | 27 | 0.667 | 0.448–0.913 | 1737 | 3004 | 0.016667 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | firecrawl | firecrawl | 30 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | firecrawl | firecrawl | 27 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
