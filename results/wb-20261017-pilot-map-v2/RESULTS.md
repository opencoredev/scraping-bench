# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| map | firecrawl | default | agent | 10 | 0.300 | 0.000–1.000 | 8532 | 12665 | 0.044390 |
| map | firecrawl | default | raw | 10 | 0.100 | 0.000–0.333 | 421 | 421 | 0.050000 |
| map | contextdev | default | agent | 10 | 0.300 | 0.000–1.000 | 9320 | 12596 | 0.030133 |
| map | contextdev | default | raw | 10 | 0.100 | 0.000–0.333 | 4990 | 4990 | 0.022000 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| map | default | agent | firecrawl | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | firecrawl | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| map | default | agent | contextdev | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | contextdev | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
