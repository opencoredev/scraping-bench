# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| crawl | scrapfly | default | agent | 2 | 0.500 | 0.000–1.000 | 12413 | 12413 | 0.047790 |
| crawl | scrapfly | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| crawl | default | agent | scrapfly | scrapfly | 2 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | scrapfly | scrapfly | 0 | n/a | n/a–n/a | insufficient data |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
