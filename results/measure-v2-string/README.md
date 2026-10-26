# String on v2 (SCB-8)

String's runs measured under docs/MEASURE-v2.md, built with `scripts/v2-string-measure-root.mjs`, which adds String
to the frozen v2 selections in a separate results root. The frozen campaign and the committed `measure/out` are
unchanged, and every other provider's numbers in `summary.json` match the committed build.

- Scrape: `wb-v2-full-scrape-string-v1`, the 40 core tasks.
- Search: `wb-v2-core-search-string-v1`, the 30 core tasks.
- Map: `wb-v2-full-map-string-v1`, all 60 tasks, so String also appears in map's full-set table.
- Crawl: not run. String has no endpoint that returns page content across a site.

String ran on 2026-10-24, five days after the keys were frozen and the other providers ran. `drift.json` re-resolves
every key String missed: scrape pydantic-settings and search Bun drifted, and String matched the live key on both.
The frozen-rule scores in `summary.json` are the headline.

`wb-v2-full-scrape-string-v2` and `wb-v2-full-search-string-v1` are full-set runs stopped part way (83 and 63 calls).
They're kept because String billed them. `reconciliation.json` matches the spend to String's dashboard.
