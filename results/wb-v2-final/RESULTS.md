# Campaign v2: identical-core results

# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | linkup | default | agent | 30 | 0.967 | 0.900–1.000 | 6231 | 11833 | 0.022372 |
| search | linkup | default | raw | 27 | 0.815 | 0.586–1.000 | 1198 | 1804 | 0.006818 |
| search | contextdev | default | agent | 30 | 0.767 | 0.567–0.938 | 7617 | 13538 | 0.017222 |
| search | contextdev | default | raw | 27 | 0.667 | 0.455–0.880 | 3256 | 5169 | 0.004767 |
| search | firecrawl | default | agent | 30 | 0.867 | 0.727–0.971 | 8461 | 14645 | 0.027248 |
| search | firecrawl | default | raw | 27 | 0.667 | 0.448–0.920 | 1737 | 3004 | 0.016667 |
| search | tinyfish | default | agent | 30 | 0.800 | 0.607–0.944 | 8003 | 10120 | 0.010159 |
| search | tinyfish | default | raw | 27 | 0.630 | 0.428–0.857 | 1196 | 1985 | 0.000000 |
| search | browserbase | default | agent | 30 | 0.533 | 0.313–0.733 | 14064 | 18823 | 0.036380 |
| search | browserbase | default | raw | 27 | 0.259 | 0.097–0.522 | 3638 | 4484 | 0.021429 |
| search | you | default | agent | 30 | 0.700 | 0.500–0.853 | 4959 | 7938 | 0.029755 |
| search | you | default | raw | 27 | 0.556 | 0.333–0.806 | 518 | 687 | 0.010000 |
| search | none | default | agent | 30 | 0.167 | 0.000–0.382 | 2426 | 2855 | 0.013610 |
| scrape | firecrawl | default | agent | 40 | 0.750 | 0.595–0.892 | 6691 | 8928 | 0.015325 |
| scrape | firecrawl | default | raw | 40 | 0.850 | 0.714–0.973 | 1213 | 1805 | 0.005882 |
| scrape | spider | default | agent | 40 | 0.875 | 0.744–0.976 | 4167 | 6136 | 0.007328 |
| scrape | spider | default | raw | 40 | 0.900 | 0.775–1.000 | 1209 | 2115 | 0.000263 |
| scrape | contextdev | default | agent | 40 | 0.800 | 0.658–0.927 | 3847 | 5757 | 0.012979 |
| scrape | contextdev | default | raw | 40 | 0.900 | 0.775–1.000 | 741 | 1651 | 0.002444 |
| scrape | tinyfish | default | agent | 40 | 0.700 | 0.533–0.865 | 3770 | 5274 | 0.007582 |
| scrape | tinyfish | default | raw | 40 | 0.750 | 0.581–0.919 | 751 | 1987 | 0.000000 |
| scrape | linkup | default | agent | 40 | 0.650 | 0.487–0.805 | 3318 | 5399 | 0.013716 |
| scrape | linkup | default | raw | 40 | 0.850 | 0.714–0.956 | 397 | 760 | 0.001176 |
| scrape | scrapfly | default | agent | 40 | 0.775 | 0.634–0.900 | 5674 | 7086 | 0.009798 |
| scrape | scrapfly | default | raw | 40 | 0.850 | 0.721–0.973 | 2263 | 2993 | 0.000172 |
| scrape | browserbase | default | agent | 40 | 0.650 | 0.487–0.804 | 3664 | 5940 | 0.018732 |
| scrape | browserbase | default | raw | 40 | 0.725 | 0.571–0.868 | 453 | 642 | 0.005517 |
| scrape | you | default | agent | 40 | 0.675 | 0.500–0.842 | 3079 | 4006 | 0.010003 |
| scrape | you | default | raw | 40 | 0.775 | 0.605–0.946 | 319 | 558 | 0.001290 |
| scrape | jina | default | agent | 40 | 0.125 | 0.026–0.231 | 5357 | 6214 | 0.049097 |
| scrape | jina | default | raw | 40 | 0.450 | 0.300–0.605 | 2031 | 4414 | 0.000297 |
| scrape | oracle | default | agent | 40 | 0.925 | 0.838–1.000 | 2534 | 3522 | 0.002812 |
| scrape | none | default | agent | 40 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| map | contextdev | default | agent | 15 | 0.800 | 0.600–1.000 | 6203 | 9412 | 0.009385 |
| map | contextdev | default | raw | 15 | 0.200 | 0.000–0.400 | 1309 | 5336 | 0.011000 |
| map | firecrawl | default | agent | 15 | 0.867 | 0.667–1.000 | 12064 | 16220 | 0.014004 |
| map | firecrawl | default | raw | 15 | 0.200 | 0.000–0.400 | 6781 | 7446 | 0.025000 |
| map | none | default | agent | 15 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| crawl | scrapfly | default | agent | 12 | 0.333 | 0.083–0.583 | 12535 | 15640 | 0.080179 |
| crawl | scrapfly | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | firecrawl | default | agent | 12 | 0.250 | 0.000–0.500 | 54855 | 56341 | 0.300852 |
| crawl | firecrawl | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | contextdev | default | agent | 12 | 0.167 | 0.000–0.417 | 17541 | 19258 | 0.311169 |
| crawl | contextdev | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | none | default | agent | 12 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | linkup | linkup | 30 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | linkup | linkup | 27 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | contextdev | linkup | 30 | -0.200 | -0.353–-0.063 | difference detected |
| search | default | raw | contextdev | linkup | 27 | -0.148 | -0.310–0.000 | unresolved |
| search | default | agent | firecrawl | linkup | 30 | -0.100 | -0.250–0.000 | unresolved |
| search | default | raw | firecrawl | linkup | 27 | -0.148 | -0.371–0.053 | unresolved |
| search | default | agent | tinyfish | linkup | 30 | -0.167 | -0.333–-0.050 | difference detected |
| search | default | raw | tinyfish | linkup | 27 | -0.185 | -0.370–0.000 | unresolved |
| search | default | agent | browserbase | browserbase | 30 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | browserbase | browserbase | 27 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | you | you | 30 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | you | you | 27 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | firecrawl | spider | 40 | -0.125 | -0.237–-0.026 | difference detected |
| scrape | default | raw | firecrawl | contextdev | 40 | -0.050 | -0.128–0.000 | unresolved |
| scrape | default | agent | spider | spider | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | spider | contextdev | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | contextdev | spider | 40 | -0.075 | -0.167–0.000 | unresolved |
| scrape | default | raw | contextdev | contextdev | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | tinyfish | spider | 40 | -0.175 | -0.333–-0.027 | difference detected |
| scrape | default | raw | tinyfish | contextdev | 40 | -0.150 | -0.333–0.026 | unresolved |
| scrape | default | agent | linkup | spider | 40 | -0.225 | -0.368–-0.100 | difference detected |
| scrape | default | raw | linkup | contextdev | 40 | -0.050 | -0.128–0.000 | unresolved |
| scrape | default | agent | scrapfly | scrapfly | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | scrapfly | scrapfly | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | browserbase | browserbase | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | browserbase | browserbase | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | you | you | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | you | you | 40 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | jina | spider | 40 | -0.750 | -0.881–-0.609 | difference detected |
| scrape | default | raw | jina | contextdev | 40 | -0.450 | -0.605–-0.300 | difference detected |
| map | default | agent | contextdev | firecrawl | 15 | -0.067 | -0.267–0.133 | unresolved |
| map | default | raw | contextdev | contextdev | 15 | 0.000 | 0.000–0.000 | unresolved |
| map | default | agent | firecrawl | firecrawl | 15 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | firecrawl | contextdev | 15 | 0.000 | -0.200–0.200 | unresolved |
| crawl | default | agent | scrapfly | scrapfly | 12 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | scrapfly | scrapfly | 0 | n/a | n/a–n/a | insufficient data |
| crawl | default | agent | firecrawl | firecrawl | 12 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | firecrawl | contextdev | 0 | n/a | n/a–n/a | insufficient data |
| crawl | default | agent | contextdev | firecrawl | 12 | -0.083 | -0.250–0.000 | unresolved |
| crawl | default | raw | contextdev | contextdev | 0 | n/a | n/a–n/a | insufficient data |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is an unresolved difference.

Per-family success and error-class counts are included in summary.json.


## Scope

{
  "search": {
    "eligible": true,
    "full": 300,
    "core": 30,
    "fullClusters": 52,
    "coreClusters": 18,
    "realWebShare": 1,
    "jsShare": 0,
    "families": {
      "docs-heading": 78,
      "registry-version": 77,
      "entity-facts": 28,
      "latest-version": 55,
      "company-financials": 28,
      "fresh": 13,
      "not-found": 21
    },
    "retainedCore": 30,
    "retainedCoreClusters": 18,
    "retainedFull": 298,
    "retainedFullClusters": 52,
    "eligibleProviders": [
      "firecrawl",
      "contextdev",
      "tinyfish",
      "linkup",
      "browserbase",
      "you",
      "none"
    ],
    "fullProviders": [
      "contextdev",
      "tinyfish",
      "linkup",
      "you",
      "none"
    ]
  },
  "scrape": {
    "eligible": true,
    "full": 300,
    "core": 40,
    "fullClusters": 40,
    "coreClusters": 37,
    "realWebShare": 0.9866666666666667,
    "jsShare": 0.013333333333333334,
    "families": {
      "js-rendered-field": 4,
      "docs-heading": 275,
      "package-version": 21
    },
    "retainedCore": 40,
    "retainedCoreClusters": 37,
    "retainedFull": 298,
    "retainedFullClusters": 40,
    "eligibleProviders": [
      "firecrawl",
      "contextdev",
      "tinyfish",
      "spider",
      "linkup",
      "scrapfly",
      "browserbase",
      "you",
      "jina",
      "none",
      "oracle"
    ],
    "fullProviders": [
      "contextdev",
      "linkup",
      "you",
      "none",
      "oracle"
    ]
  },
  "map": {
    "eligible": true,
    "full": 60,
    "core": 15,
    "fullClusters": 15,
    "coreClusters": 15,
    "realWebShare": 1,
    "jsShare": 0,
    "families": {
      "docs-url-set": 60
    },
    "retainedCore": 15,
    "retainedCoreClusters": 15,
    "retainedFull": 60,
    "retainedFullClusters": 15,
    "eligibleProviders": [
      "firecrawl",
      "contextdev",
      "none"
    ],
    "fullProviders": [
      "contextdev",
      "none"
    ]
  },
  "crawl": {
    "eligible": true,
    "full": 40,
    "core": 12,
    "fullClusters": 15,
    "coreClusters": 12,
    "realWebShare": 1,
    "jsShare": 0,
    "families": {
      "docs-page-records": 40
    },
    "retainedCore": 12,
    "retainedCoreClusters": 12,
    "retainedFull": 40,
    "retainedFullClusters": 15,
    "eligibleProviders": [
      "firecrawl",
      "contextdev",
      "scrapfly",
      "none"
    ],
    "fullProviders": [
      "contextdev",
      "none"
    ]
  }
}

## Differences against the observed core leader


### search

| Provider | Core success | 95% interval | Paired difference vs linkup | Difference interval | Interpretation |
|---|---:|---|---:|---|---|
| linkup | 0.9667 | 0.9000 to 1.0000 | 0.0000 | 0.0000 to 0.0000 | unresolved difference |
| firecrawl | 0.8667 | 0.7271 to 0.9706 | -0.1000 | -0.2500 to 0.0000 | unresolved difference |
| tinyfish | 0.8000 | 0.6071 to 0.9444 | -0.1667 | -0.3333 to -0.0500 | resolved difference |
| contextdev | 0.7667 | 0.5667 to 0.9375 | -0.2000 | -0.3529 to -0.0625 | resolved difference |
| you | 0.7000 | 0.5000 to 0.8529 | -0.2667 | -0.5000 to -0.1176 | resolved difference |
| browserbase | 0.5333 | 0.3125 to 0.7333 | -0.4333 | -0.6250 to -0.2632 | resolved difference |

### scrape

| Provider | Core success | 95% interval | Paired difference vs spider | Difference interval | Interpretation |
|---|---:|---|---:|---|---|
| spider | 0.8750 | 0.7436 to 0.9756 | 0.0000 | 0.0000 to 0.0000 | unresolved difference |
| contextdev | 0.8000 | 0.6579 to 0.9268 | -0.0750 | -0.1667 to 0.0000 | unresolved difference |
| scrapfly | 0.7750 | 0.6341 to 0.9000 | -0.1000 | -0.1951 to -0.0250 | resolved difference |
| firecrawl | 0.7500 | 0.5952 to 0.8919 | -0.1250 | -0.2368 to -0.0263 | resolved difference |
| tinyfish | 0.7000 | 0.5333 to 0.8649 | -0.1750 | -0.3333 to -0.0270 | resolved difference |
| you | 0.6750 | 0.5000 to 0.8421 | -0.2000 | -0.3571 to -0.0526 | resolved difference |
| browserbase | 0.6500 | 0.4872 to 0.8043 | -0.2250 | -0.3684 to -0.1000 | resolved difference |
| linkup | 0.6500 | 0.4872 to 0.8049 | -0.2250 | -0.3684 to -0.1000 | resolved difference |
| jina | 0.1250 | 0.0263 to 0.2308 | -0.7500 | -0.8810 to -0.6087 | resolved difference |

### map

| Provider | Core success | 95% interval | Paired difference vs firecrawl | Difference interval | Interpretation |
|---|---:|---|---:|---|---|
| firecrawl | 0.8667 | 0.6667 to 1.0000 | 0.0000 | 0.0000 to 0.0000 | unresolved difference |
| contextdev | 0.8000 | 0.6000 to 1.0000 | -0.0667 | -0.2667 to 0.1333 | unresolved difference |

### crawl

| Provider | Core success | 95% interval | Paired difference vs scrapfly | Difference interval | Interpretation |
|---|---:|---|---:|---|---|
| scrapfly | 0.3333 | 0.0833 to 0.5833 | 0.0000 | 0.0000 to 0.0000 | unresolved difference |
| firecrawl | 0.2500 | 0.0000 to 0.5000 | -0.0833 | -0.2500 to 0.0000 | unresolved difference |
| contextdev | 0.1667 | 0.0000 to 0.4167 | -0.1667 | -0.4167 to 0.0000 | unresolved difference |

## Full-set results, separate descriptive population

# Benchmark results

Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.

| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |
|---|---|---|---|---:|---:|---|---:|---:|---:|
| search | linkup | default | agent | 298 | 0.832 | 0.760–0.883 | 5396 | 9643 | 0.022840 |
| search | linkup | default | raw | 277 | 0.769 | 0.653–0.866 | 1254 | 1662 | 0.006995 |
| search | contextdev | default | agent | 298 | 0.721 | 0.598–0.799 | 7176 | 14263 | 0.017337 |
| search | contextdev | default | raw | 277 | 0.650 | 0.525–0.770 | 2461 | 4347 | 0.004192 |
| search | tinyfish | default | agent | 298 | 0.705 | 0.568–0.792 | 6431 | 11197 | 0.011114 |
| search | tinyfish | default | raw | 277 | 0.664 | 0.543–0.785 | 1142 | 1946 | 0.000000 |
| search | you | default | agent | 298 | 0.648 | 0.502–0.741 | 5264 | 8760 | 0.031849 |
| search | you | default | raw | 277 | 0.643 | 0.530–0.752 | 534 | 679 | 0.008399 |
| search | none | default | agent | 298 | 0.148 | 0.012–0.287 | 2550 | 3974 | 0.015639 |
| scrape | contextdev | default | agent | 298 | 0.802 | 0.677–0.908 | 4174 | 6684 | 0.013500 |
| scrape | contextdev | default | raw | 298 | 0.930 | 0.839–1.000 | 756 | 2286 | 0.002367 |
| scrape | linkup | default | agent | 298 | 0.584 | 0.443–0.715 | 3556 | 5122 | 0.015491 |
| scrape | linkup | default | raw | 298 | 0.869 | 0.764–0.956 | 439 | 831 | 0.001151 |
| scrape | you | default | agent | 298 | 0.715 | 0.586–0.836 | 3365 | 4851 | 0.009499 |
| scrape | you | default | raw | 298 | 0.852 | 0.750–0.936 | 356 | 1397 | 0.001173 |
| scrape | oracle | default | agent | 298 | 0.916 | 0.815–1.000 | 2679 | 3826 | 0.002828 |
| scrape | none | default | agent | 298 | 0.003 | 0.000–0.011 | 3140 | 3140 | 0.544495 |
| map | contextdev | default | agent | 60 | 0.717 | 0.487–0.929 | 6526 | 9793 | 0.010672 |
| map | contextdev | default | raw | 60 | 0.167 | 0.047–0.302 | 1314 | 7475 | 0.013200 |
| map | none | default | agent | 60 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |
| crawl | contextdev | default | agent | 40 | 0.050 | 0.000–0.132 | 17541 | 19258 | 0.964848 |
| crawl | contextdev | default | raw | 0 | n/a | n/a–n/a | n/a | n/a | n/a |
| crawl | none | default | agent | 40 | 0.000 | 0.000–0.000 | n/a | n/a | n/a |

## Paired differences from the best in each cohort

| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |
|---|---|---|---|---|---:|---:|---|---|
| search | default | agent | linkup | linkup | 298 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | linkup | linkup | 277 | 0.000 | 0.000–0.000 | unresolved |
| search | default | agent | contextdev | linkup | 298 | -0.111 | -0.208–-0.043 | difference detected |
| search | default | raw | contextdev | linkup | 277 | -0.119 | -0.247–-0.013 | difference detected |
| search | default | agent | tinyfish | linkup | 298 | -0.128 | -0.234–-0.058 | difference detected |
| search | default | raw | tinyfish | linkup | 277 | -0.105 | -0.238–0.004 | unresolved |
| search | default | agent | you | you | 298 | 0.000 | 0.000–0.000 | unresolved |
| search | default | raw | you | you | 277 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | contextdev | contextdev | 298 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | contextdev | contextdev | 298 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | agent | linkup | contextdev | 298 | -0.218 | -0.329–-0.117 | difference detected |
| scrape | default | raw | linkup | contextdev | 298 | -0.060 | -0.128–-0.012 | difference detected |
| scrape | default | agent | you | you | 298 | 0.000 | 0.000–0.000 | unresolved |
| scrape | default | raw | you | you | 298 | 0.000 | 0.000–0.000 | unresolved |
| map | default | agent | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |
| map | default | raw | contextdev | contextdev | 60 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | agent | contextdev | contextdev | 40 | 0.000 | 0.000–0.000 | unresolved |
| crawl | default | raw | contextdev | contextdev | 0 | n/a | n/a–n/a | insufficient data |

Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is an unresolved difference.

Per-family success and error-class counts are included in summary.json.


## Exclusions and limitations

- jina / search: No hard per-call token-charge bound; previous search used 618754 tokens.
- exa: Excluded from v2 by owner.
- tavily: Excluded from v2 by owner.
- perplexity: Excluded from v2 by owner.
- brightdata: Excluded from v2 by owner.
- parallel: Excluded from v2 by owner.
- spider / search: No defensible metered multi-page/search bound within the remaining free wallet; restricted to single-page scrape.
- spider / map: No defensible metered multi-page/search bound within the remaining free wallet; restricted to single-page scrape.
- spider / crawl: No defensible metered multi-page/search bound within the remaining free wallet; restricted to single-page scrape.
- Exploratory unadjusted intervals; observed core leader selection; cross-cohort ordering is descriptive.
- One client, free-credit plans. Full results use a different population and are not headline comparisons.
- Source errors and confirmed drift are separate exclusion categories; original rows are preserved.
- V1 and v2 populations differ; no provider improvement/regression claim.
- Scrape oracle uses independently extracted HTML metadata/headings or rendered JS body, not expected-field text.
- Scrapfly rendering stays at its default. Native crawl titles are forwarded for Firecrawl, Context.dev and Scrapfly (HTML plus Markdown); no extra fetch is made for title injection.

## Spend, including all pilots and interrupted reservations

| Provider | API list USD | Model estimate USD | Physical dispatches |
|---|---:|---:|---:|
| none | 0.00000000 | 1.434086 | 0 |
| oracle | 0.00000000 | 0.777213 | 302 |
| contextdev | 3.24720000 | 6.641256 | 1066 |
| firecrawl | 1.62000000 | 1.066031 | 143 |
| scrapfly | 0.03060000 | 0.713024 | 62 |
| browserbase | 0.64800000 | 0.637582 | 140 |
| jina | 0.00803710 | 0.260075 | 54 |
| linkup | 2.98200000 | 6.221751 | 850 |
| spider | 0.01099568 | 0.267194 | 43 |
| tinyfish | 0.00000000 | 2.656888 | 678 |
| you | 3.41300000 | 5.623621 | 933 |
