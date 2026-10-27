# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | firecrawl | default | agent | 40 | 0.750 | 0.600–0.887 | 6691 | 8928 | 0.015325 |
| scrape | firecrawl | default | raw | 40 | 0.850 | 0.718–0.973 | 1213 | 1805 | 0.005882 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | firecrawl | firecrawl | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | firecrawl | firecrawl | 40 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
