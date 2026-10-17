# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| crawl | scrapfly | default | agent | 10 | 0.700 | 0.000–0.955 | 14469 | 19805 | 0.028825 |
| crawl | scrapfly | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | firecrawl | default | agent | 10 | 0.500 | 0.000–0.682 | 60401 | 179901 | 0.142152 |
| crawl | firecrawl | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | contextdev | default | agent | 10 | 0.600 | 0.000–0.818 | 18317 | 19074 | 0.075843 |
| crawl | contextdev | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| crawl | default | agent | scrapfly | scrapfly | 10 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | scrapfly | scrapfly | 0 | n/a | n/a–n/a | insufficient data |
| crawl | default | agent | firecrawl | contextdev | 10 | -0.100 | -0.136–0.000 | unresolved |
| crawl | default | raw | firecrawl | contextdev | 0 | n/a | n/a–n/a | insufficient data |
| crawl | default | agent | contextdev | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | contextdev | contextdev | 0 | n/a | n/a–n/a | insufficient data |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
