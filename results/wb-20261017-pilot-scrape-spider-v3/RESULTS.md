# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | spider | default | agent | 10 | 0.300 | 0.000–1.000 | 4964 | 5553 | 0.018003 |
| scrape | spider | default | raw | 10 | 0.300 | 0.000–1.000 | 1912 | 2057 | 0.000302 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | spider | spider | 10 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | spider | spider | 10 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
