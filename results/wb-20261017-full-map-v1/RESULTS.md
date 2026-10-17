# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| map | contextdev | default | agent | 15 | 0.467 | 0.111–1.000 | 6051 | 10226 | 0.018417 |
| map | contextdev | default | raw | 15 | 0.200 | 0.034–0.714 | 1550 | 5854 | 0.011000 |
| map | firecrawl | default | agent | 15 | 0.400 | 0.107–1.000 | 10923 | 14711 | 0.033462 |
| map | firecrawl | default | raw | 15 | 0.200 | 0.036–0.833 | 7520 | 12173 | 0.025000 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| map | default | agent | contextdev | contextdev | 15 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | contextdev | contextdev | 15 | 0.000 | 0.000–0.000 | unresolved |
| map | default | agent | firecrawl | contextdev | 15 | -0.067 | -0.250–0.000 | unresolved |
| map | default | raw | firecrawl | contextdev | 15 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
