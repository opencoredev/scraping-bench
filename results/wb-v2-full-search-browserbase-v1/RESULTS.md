# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | browserbase | default | agent | 30 | 0.533 | 0.308–0.733 | 14064 | 18823 | 0.036380 |
| search | browserbase | default | raw | 27 | 0.259 | 0.091–0.478 | 3638 | 4484 | 0.021429 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | browserbase | browserbase | 30 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 27 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
