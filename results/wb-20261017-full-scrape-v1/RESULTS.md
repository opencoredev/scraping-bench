# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | browserbase | default | agent | 60 | 0.817 | 0.780–1.000 | 3268 | 4275 | 0.011198 |
| scrape | browserbase | default | raw | 55 | 0.673 | 0.600–1.000 | 530 | 644 | 0.006486 |
| scrape | linkup | default | agent | 60 | 0.900 | 0.900–0.900 | 3391 | 4238 | 0.005960 |
| scrape | linkup | default | raw | 55 | 0.909 | 0.900–0.911 | 532 | 1058 | 0.001200 |
| scrape | contextdev | default | agent | 60 | 0.917 | 0.900–1.000 | 3749 | 4817 | 0.007233 |
| scrape | contextdev | default | raw | 55 | 0.927 | 0.911–1.000 | 1168 | 1411 | 0.002588 |
| scrape | firecrawl | default | agent | 60 | 0.900 | 0.900–0.900 | 3254 | 4196 | 0.012155 |
| scrape | firecrawl | default | raw | 55 | 0.927 | 0.900–0.933 | 643 | 1360 | 0.008039 |
| scrape | scrapfly | default | agent | 60 | 0.883 | 0.800–0.900 | 4983 | 6618 | 0.006068 |
| scrape | scrapfly | default | raw | 55 | 0.782 | 0.700–0.800 | 2071 | 2995 | 0.000209 |
| scrape | jina | default | agent | 60 | 0.867 | 0.600–0.920 | 3824 | 5462 | 0.005697 |
| scrape | jina | default | raw | 55 | 0.927 | 0.900–0.933 | 1053 | 2342 | 0.000117 |
| scrape | spider | default | agent | 60 | 0.200 | 0.040–1.000 | 4555 | 5215 | 0.024752 |
| scrape | spider | default | raw | 55 | 0.182 | 0.000–1.000 | 1428 | 2107 | 0.000420 |
| scrape | tinyfish | default | agent | 60 | 0.900 | 0.800–0.920 | 3540 | 4859 | 0.004337 |
| scrape | tinyfish | default | raw | 55 | 0.909 | 0.800–0.933 | 717 | 1512 | 0.000000 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | default | agent | browserbase | browserbase | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | browserbase | browserbase | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | linkup | contextdev | 60 | -0.017 | -0.100–0.000 | unresolved |
| scrape | default | raw | linkup | contextdev | 55 | -0.018 | -0.100–0.000 | unresolved |
| scrape | default | agent | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | contextdev | contextdev | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | firecrawl | contextdev | 60 | -0.017 | -0.100–0.000 | unresolved |
| scrape | default | raw | firecrawl | contextdev | 55 | 0.000 | -0.100–0.022 | unresolved |
| scrape | default | agent | scrapfly | scrapfly | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | scrapfly | scrapfly | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | jina | contextdev | 60 | -0.050 | -0.400–0.020 | unresolved |
| scrape | default | raw | jina | contextdev | 55 | 0.000 | -0.100–0.022 | unresolved |
| scrape | default | agent | spider | contextdev | 60 | -0.717 | -0.860–0.000 | unresolved |
| scrape | default | raw | spider | contextdev | 55 | -0.745 | -0.911–0.000 | unresolved |
| scrape | default | agent | tinyfish | contextdev | 60 | -0.017 | -0.200–0.020 | unresolved |
| scrape | default | raw | tinyfish | contextdev | 55 | -0.018 | -0.200–0.022 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
