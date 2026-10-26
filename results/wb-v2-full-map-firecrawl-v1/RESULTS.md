# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| map | firecrawl | default | agent | 15 | 0.867 | 0.667–1.000 | 12064 | 16220 | 0.014004 |
| map | firecrawl | default | raw | 15 | 0.200 | 0.000–0.400 | 6781 | 7446 | 0.025000 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| map | default | agent | firecrawl | firecrawl | 15 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | firecrawl | firecrawl | 15 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
