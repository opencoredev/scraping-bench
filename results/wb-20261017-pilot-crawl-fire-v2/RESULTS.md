# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| crawl | firecrawl | default | agent | 10 | 0.400 | 0.000–0.571 | 56591 | 89509 | 0.211610 |
| crawl | firecrawl | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| crawl | default | agent | firecrawl | firecrawl | 10 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | firecrawl | firecrawl | 0 | n/a | n/a–n/a | insufficient data |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
