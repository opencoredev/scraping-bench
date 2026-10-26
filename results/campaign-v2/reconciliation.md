# Campaign v2 budget reconciliation

All figures include dev pilots and interrupted dispatch reservations. Native wallet changes are reported separately from signed list-equivalent accounting. No purchases or upgrades.

| Provider | Unit | Starting | Signed v2 spend | Measured remaining | 5% floor | Ledger / quota guard | Measured wallet floor |
|---|---|---:|---:|---:|---:|---|---|
| firecrawl | credits | 463 | 324 | 139 | 23.15 | PASS | PASS |
| contextdev | credits | 63171 | 1476 | 61809 | 3158.55 | PASS | PASS |
| scrapfly | credits | 309 | 204 | 105 | 15.45 | PASS | PASS |
| spider | credits | 2428.905325 | 109.95684 | 2316.019534 | 121.445266 | PASS | PASS |
| jina | tokens | 1495119 | 160742 | 1424377 | 74755.95 | PASS | NOT CHECKED (cached balance) |
| you | USD | 100 | 3.413 | unavailable | 5 | PASS | NOT CHECKED (measurement unavailable) |
| linkup | USD | 18.904 | 2.982 | 15.927 | 0.9452 | PASS | PASS |
| tinyfish | USD | 10 | 0 | 10 | 0.5 | PASS | PASS |
| browserbase | list USD | unavailable | 0.648 | unavailable | unavailable | PASS | NOT CHECKED (quota guard only) |

Exact wallet/ledger reconciliation: NOT CHECKED. Residuals below are not attributed; cap and wallet-floor checks remain separate.

- firecrawl: Positive residuals can reflect conservative uncertain reservations; original signed events remain intact. Signed spend plus measurement overhead minus measured wallet decrease: 0 credits.
- contextdev: Final measurement costs one credit, added as measurement overhead. Starting basis follows the initial one-credit measurement. Signed spend plus measurement overhead minus measured wallet decrease: 115 credits.
- scrapfly: Positive residuals can reflect conservative uncertain reservations; original signed events remain intact. Signed spend plus measurement overhead minus measured wallet decrease: 0 credits.
- spider: Positive residuals can reflect conservative uncertain reservations; original signed events remain intact. Signed spend plus measurement overhead minus measured wallet decrease: -2.928951 credits.
- jina: Observed root can be cached; signed safe allowance 834751.1 tokens governs, not an inferred wallet delta.
- you: Owner cancelled further You.com calls after completed samples; collected rows retained, final wallet probe skipped.
- linkup: Positive residuals can reflect conservative uncertain reservations; original signed events remain intact. Signed spend plus measurement overhead minus measured wallet decrease: 0.005 USD.
- tinyfish: Wallet contract rates are zero; all historical requests counted, stricter than daily resets. Quotas: search 791/11400; scrape 118/950. Signed spend plus measurement overhead minus measured wallet decrease: 0 USD.
- browserbase: No remaining quota endpoint; all historical physical requests plus smoke attempts counted per product. Frozen dispatch guards conservatively count all smoke rows, a stricter limit than this attempt-only reconciliation. Dollar cost is a list equivalent. Quotas: search 289/950; scrape 131/950.
