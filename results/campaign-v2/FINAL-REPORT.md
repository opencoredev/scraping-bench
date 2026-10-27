# Campaign v2 final execution report

The held-out campaign and all preregistered controls completed. Frozen samples and benchmark implementation remained unchanged. No purchase, upgrade, push, public export, signup or post was performed. You.com cancellation arrived after both collected samples completed; no later You.com call or wallet probe was made.

## Population and participation

| Track | Frozen full/core | Retained full/core | Full/core site clusters | Providers that ran |
|---|---:|---:|---:|---|
| search | 300/30 | 298/30 | 52/18 | firecrawl (core), contextdev (full), tinyfish (full), linkup (full), browserbase (core), you (full) |
| scrape | 300/40 | 298/40 | 40/37 | firecrawl (core), contextdev (full), tinyfish (core), spider (core), linkup (full), scrapfly (core), browserbase (core), you (full), jina (core) |
| map | 60/15 | 60/15 | 15/15 | firecrawl (core), contextdev (full) |
| crawl | 40/12 | 40/12 | 15/12 | firecrawl (core), contextdev (full), scrapfly (core) |

Frozen size/site targets passed. Retained search is short by two confirmed version changes; scrape is short by two source errors. Search/map/crawl are 100% real-web. Scrape freezes 296 real-web and four browser-verified JS fixtures; the core has 38 real-web and two JS tasks. Scrape is documentation-heavy (275 headings, 21 package pages, four JS fields).

Not run: Jina search lacks a hard token bound; Spider search/map/crawl lack a defensible bounded multi-page contract within its wallet. Scrapfly search/map, TinyFish/Linkup/Browserbase/You.com map/crawl, and Jina map/crawl are unsupported benchmark products. Exa, Tavily, Perplexity, Bright Data and Parallel were owner-excluded. [Full matrix](../../providers/RESULTS.md).

## Headline core results

Rates and differences use 10,000 paired site-clustered bootstrap draws, seed19019. Comparisons are exploratory, unadjusted and against the observed core leader only. Differences below are provider minus reference, in percentage points. Cross-product ordering is descriptive.

| Track | Provider | Success | 95% rate interval | Difference vs reference | Paired 95% interval | Interpretation |
|---|---|---:|---|---:|---|---|
| search | linkup | 29/30 (96.7%) | 90.0 to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| search | firecrawl | 26/30 (86.7%) | 72.7 to 97.1% | -10.0 | -25.0 to 0.0 | unresolved difference |
| search | tinyfish | 24/30 (80.0%) | 60.7 to 94.4% | -16.7 | -33.3 to -5.0 | resolved difference |
| search | contextdev | 23/30 (76.7%) | 56.7 to 93.8% | -20.0 | -35.3 to -6.2 | resolved difference |
| search | you | 21/30 (70.0%) | 50.0 to 85.3% | -26.7 | -50.0 to -11.8 | resolved difference |
| search | browserbase | 16/30 (53.3%) | 31.2 to 73.3% | -43.3 | -62.5 to -26.3 | resolved difference |
| scrape | spider | 35/40 (87.5%) | 74.4 to 97.6% | 0.0 | 0.0 to 0.0 | reference |
| scrape | contextdev | 32/40 (80.0%) | 65.8 to 92.7% | -7.5 | -16.7 to 0.0 | unresolved difference |
| scrape | scrapfly | 31/40 (77.5%) | 63.4 to 90.0% | -10.0 | -19.5 to -2.5 | resolved difference |
| scrape | firecrawl | 30/40 (75.0%) | 59.5 to 89.2% | -12.5 | -23.7 to -2.6 | resolved difference |
| scrape | tinyfish | 28/40 (70.0%) | 53.3 to 86.5% | -17.5 | -33.3 to -2.7 | resolved difference |
| scrape | you | 27/40 (67.5%) | 50.0 to 84.2% | -20.0 | -35.7 to -5.3 | resolved difference |
| scrape | browserbase | 26/40 (65.0%) | 48.7 to 80.4% | -22.5 | -36.8 to -10.0 | resolved difference |
| scrape | linkup | 26/40 (65.0%) | 48.7 to 80.5% | -22.5 | -36.8 to -10.0 | resolved difference |
| scrape | jina | 5/40 (12.5%) | 2.6 to 23.1% | -75.0 | -88.1 to -60.9 | resolved difference |
| map | firecrawl | 13/15 (86.7%) | 66.7 to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| map | contextdev | 12/15 (80.0%) | 60.0 to 100.0% | -6.7 | -26.7 to 13.3 | unresolved difference |
| crawl | scrapfly | 4/12 (33.3%) | 8.3 to 58.3% | 0.0 | 0.0 to 0.0 | reference |
| crawl | firecrawl | 3/12 (25.0%) | 0.0 to 50.0% | -8.3 | -25.0 to 0.0 | unresolved difference |
| crawl | contextdev | 2/12 (16.7%) | 0.0 to 41.7% | -16.7 | -41.7 to 0.0 | unresolved difference |

No map or crawl difference against its reference is resolved. Full-set descriptive rates and unexcluded-core sensitivity remain separate in [the machine report](../wb-v2-final/summary.json). No v1/v2 improvement or regression claim is supported.

## Controls and post-run checks

| Track | Control | Retained core | Retained full |
|---|---|---:|---:|
| search | none | 5/30 | 44/298 |
| scrape | oracle | 37/40 | 273/298 |
| scrape | none | 0/40 | 1/298 |
| map | none | 0/15 | 0/60 |
| crawl | none | 0/12 | 0/40 |

The correct-page control is below100%; failures therefore cannot all be attributed to retrieval. Core rate-limit failures: Context.dev search1, Scrapfly scrape1, Browserbase scrape7. Other failures and task limits are in summary.json.

Original before check: `Verified 700/700; drift/errors=0`. Original after check: `Verified 697/700; drift/errors=3` (exit1). The first derived697 scan found an additional SQLAlchemy source error (696/697), confirmed by a targeted recheck. Union all post-run checks: URI5.39→5.40, Mojolicious9.50→9.51, and unverifiable Loguru and SQLAlchemy pages. All four IDs are excluded symmetrically; no core ID is affected. Original rows and frozen files are preserved, with a derived retained population under retained/.

Retained verification: `Verified 696/696; drift/errors=0`.

## Credits and reconciliation

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

## Commands and evidence

- `timeout 180 npm test`: exit0,112pass,0fail; `/tmp/web-bench-v2-final-tests.log`.
- `timeout 120 npm run typecheck`: exit0.
- `cd site && timeout 300 npx next build`: exit0; `/tmp/web-bench-v2-site-build.log`, routes /,/v1,/export. No site package or lockfile changes.
- Exact before/after `tasks:verify` logs and frozen manifests are in this directory. Retained scan uses `WEB_BENCH_TASK_DIR=results/campaign-v2/banks timeout 1800 npm run tasks:verify -- --frozen-dir=results/campaign-v2/retained`.
- Provider/control phase exits: [execution-status.log](execution-status.log). Search resumed identical IDs after one timeout; no frozen source changes. All later phases exit0.
- Final frozen hash/report checks: exit0; external verification evidence `~/.agents/verify-notes/web-bench/evidence/2026-10-19-v2-final/frozen-final.log`.
- Real site artifact checked with agent-browser at1440desktop/390mobile and320narrow: all tracks, paired/full disclosures, v1 navigation and export. No JS errors or page overflow. Server and Mac Mini HTTP access passed; phone not checked. Temporary server/browser stopped. Screenshots and browser log stay in external verification notes.
- Independent final-data review: no concrete defects; task webbench-v2-final-data-review-1.

## Done when

- PASS: Each track meets its held-out size/site targets or documents the shortfall. Frozen700; retained696 after two confirmed changes and two source errors.
- PASS: Every provider completed its full/core sample or has an explicit not-run reason. All20provider/track runs and5control runs completed.
- NOT CHECKED (combined test/verification/budget item):112tests pass; original before700/700, original after697/700 with preregistered exclusions; retained after PASS. Signed guards and available noncached wallet floors pass, but exact wallet/ledger reconciliation remains unverified.
- PASS: Findings identify resolved and unresolved differences with paired intervals.

## Local commits

```text
9f3d107 Preserve v1 task banks and add You.com adapter and balance probes
d225c16 Preregister v2 sampling, exclusions, analysis and cross-track free budget
5947f65 Add isolated v2 generation, diverse cores, frozen verification and budgeted orchestration
aef124e Enforce native budget bounds and bind v2 execution to frozen artifacts
424523c Screen candidates before freezing and preserve native crawl titles fairly
d37352c Run independent providers within four workers and validate decoded oracle evidence
dcd60c5 Document v2 grading, core comparisons and evidence limits with v1 preserved
c0ab8eb Record expanded v2 banks, browser evidence and dev-only pilot audits
b63ea80 Prepare v2 core presentation, paired intervals and preserved v1 route
9f14404 Record final pilot spend and core affordability before held-out execution
7888652 Freeze 700 verified held-out v2 tasks and diverse identical cores
4173d62 Record passing frozen-file verification before held-out calls
20661df Add auditable native-wallet and signed-ledger reconciliation for v2
f19be4e Document bounded v2 execution, freeze checks and resume semantics
4f8887c Generate v2 findings and provider documentation from final reports
859dfab Separate wallet verification from guards and count smoke attempts in reconciliation
ec89238 Point truncation disclosures to original per-task evidence
d7d98f8 Honor owner cancellation of further You.com calls and final balance probe
c0a4b2f Record completed v2 held-out provider runs and controls
3640e69 Disclose cancelled final wallet measurement in v2 reports
451e7e4 Describe resolved v2 gaps with their actual interval criterion
2304cd1 Present v2 core results, paired intervals and measured budget limitations
```

All listed commits carry the requested coauthor trailer. Final evidence/report commits follow this list in git history. No public action was taken.
