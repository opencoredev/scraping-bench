# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | firecrawl | default | agent | 10 | 0.900 | 0.625–1.000 | 3821 | 6769 | 0.027935 |
| search | linkup | default | agent | 10 | 0.800 | 0.250–1.000 | 4890 | 10693 | 0.030319 |
| search | firecrawl | default | raw | 8 | 0.625 | 0.500–0.875 | 975 | 1427 | 0.020000 |
| search | linkup | default | raw | 8 | 0.750 | 0.250–1.000 | 1573 | 1809 | 0.008333 |
| search | browserbase | default | agent | 10 | 0.400 | 0.000–0.750 | 7757 | 14409 | 0.049077 |
| search | browserbase | default | raw | 8 | 0.125 | 0.000–0.375 | 3950 | 3950 | 0.050000 |
| search | tinyfish | default | agent | 10 | 0.800 | 0.500–1.000 | 5088 | 8882 | 0.010989 |
| search | tinyfish | default | raw | 8 | 0.500 | 0.000–1.000 | 532 | 811 | 0.000000 |
| search | contextdev | default | agent | 10 | 0.900 | 0.625–1.000 | 4622 | 8964 | 0.011953 |
| search | contextdev | default | raw | 8 | 0.750 | 0.250–1.000 | 758 | 1789 | 0.003667 |
| search | jina | default | agent | 10 | 0.800 | 0.500–1.000 | 23133 | 36865 | 0.038378 |
| search | jina | default | raw | 8 | 0.875 | 0.625–1.000 | 9027 | 14019 | 0.016228 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | firecrawl | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | linkup | contextdev | 10 | -0.100 | -0.375–0.000 | unresolved |
| search | default | raw | firecrawl | jina | 8 | -0.250 | -0.500–0.000 | unresolved |
| search | default | raw | linkup | jina | 8 | -0.125 | -0.375–0.000 | unresolved |
| search | default | agent | browserbase | browserbase | 10 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 8 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | tinyfish | contextdev | 10 | -0.100 | -0.375–0.000 | unresolved |
| search | default | raw | tinyfish | jina | 8 | -0.375 | -0.750–0.000 | unresolved |
| search | default | agent | contextdev | contextdev | 10 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | contextdev | jina | 8 | -0.125 | -0.375–0.000 | unresolved |
| search | default | agent | jina | contextdev | 10 | -0.100 | -0.375–0.000 | unresolved |
| search | default | raw | jina | jina | 8 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
