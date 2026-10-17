# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| scrape | contextdev | tuned | agent | 60 | 0.917 | 0.900–1.000 | 3524 | 5664 | 0.006874 |
| scrape | contextdev | tuned | raw | 55 | 0.927 | 0.911–1.000 | 949 | 1301 | 0.002588 |
| scrape | firecrawl | tuned | agent | 60 | 0.817 | 0.800–0.900 | 3556 | 7300 | 0.022397 |
| scrape | firecrawl | tuned | raw | 55 | 0.836 | 0.822–0.900 | 762 | 4691 | 0.018478 |
| scrape | linkup | tuned | agent | 60 | 0.900 | 0.900–0.900 | 3484 | 4806 | 0.010393 |
| scrape | linkup | tuned | raw | 55 | 0.909 | 0.900–0.911 | 752 | 1152 | 0.006000 |
| scrape | jina | tuned | agent | 60 | 0.867 | 0.600–0.920 | 3882 | 5346 | 0.005863 |
| scrape | jina | tuned | raw | 55 | 0.945 | 0.933–1.000 | 975 | 2204 | 0.000117 |
| scrape | scrapfly | tuned | agent | 60 | 0.917 | 0.900–1.000 | 8726 | 12639 | 0.006206 |
| scrape | scrapfly | tuned | raw | 55 | 0.782 | 0.700–0.800 | 6216 | 9712 | 0.001169 |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| scrape | tuned | agent | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | tuned | raw | contextdev | jina | 55 | -0.018 | -0.022–0.000 | unresolved |
| scrape | tuned | agent | firecrawl | contextdev | 60 | -0.100 | -0.100–-0.100 | difference detected |
| scrape | tuned | raw | firecrawl | jina | 55 | -0.109 | -0.111–-0.100 | difference detected |
| scrape | tuned | agent | linkup | contextdev | 60 | -0.017 | -0.100–0.000 | unresolved |
| scrape | tuned | raw | linkup | jina | 55 | -0.036 | -0.100–-0.022 | difference detected |
| scrape | tuned | agent | jina | contextdev | 60 | -0.050 | -0.400–0.020 | unresolved |
| scrape | tuned | raw | jina | jina | 55 | 0.000 | 0.000–0.000 | unresolved |
| scrape | tuned | agent | scrapfly | scrapfly | 60 | 0.000 | 0.000–0.000 | unresolved |
| scrape | tuned | raw | scrapfly | scrapfly | 55 | 0.000 | 0.000–0.000 | unresolved |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.

Per-family success and error-class counts are included in summary.json.
