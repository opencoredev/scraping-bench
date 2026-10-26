# Corrected analysis (post-run, disclosed)

Two harness faults changed the interpretation of campaign v2. Scrape answer keys kept link symbols and invisible characters that the task told the model to omit. Crawl evidence was cut after 48 KB of full page bodies, hiding later URLs and titles from the model. This post-run analysis corrects those faults and keeps the original preregistered scores and rows intact. Search and map headline scores are unchanged.

Scrape was regraded from the same stored model answers. Exactly 25 frozen heading keys changed: nine Scrapy, eight MkDocs and eight Vite, including three core tasks. No pages or model answers were fetched again for scrape. Heading generation now removes permalink elements and Unicode private-use (Co) and format (Cf) characters; text grading removes Co/Cf too. The correct-page control rises from 37/40 to 40/40 core and from 273/298 to 298/298 retained full. All 25 original full-control failures were caused by the answer-key fault.

Crawl was replayed using the same stored provider responses for every task each provider originally ran: Firecrawl 12, Context.dev 40, Scrapfly 12. Every returned URL and native title now comes before bounded page excerpts, within the same 48,000-byte cap, using the same packaging for every provider. We reused each original planning turn and reran only the final answer turn with Claude Haiku 5.5, temperature 0, the same system/user prompt, tools, 4,096 answer-token limit, one crawl tool call, and original cost/time limits. The strict JSON parser is unchanged. This is a disclosed model replay, not a fresh crawl or a repeat of the preregistered experiment. A single replay does not measure model variability, even at temperature zero.

The replay allowed only the existing model-proxy endpoint and refused provider dispatch and redirects. Its ledger records **0 provider calls**, **64 model-proxy calls**, **0 blocked network attempts**, and unchanged original provider ledgers. Model-only list-price estimate: $1.705214. Replay time and model-only cost do not estimate a fresh end-to-end crawl.

[Complete corrected analysis, intervals and sensitivity counts](../results/wb-v2-corrected/RESULTS.md) · [Original preregistered scores](../results/wb-v2-final/RESULTS.md).

| Track | Provider | Original core | Original 95% interval | Corrected core | Corrected 95% interval | Gap vs corrected reference (points) | Paired 95% interval (points) | Result |
|---|---|---:|---|---:|---|---:|---|---|
| search | Linkup | 29/30 (96.7%) | 90.0% to 100.0% | 29/30 (96.7%) | 90.0% to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| search | Firecrawl | 26/30 (86.7%) | 72.7% to 97.1% | 26/30 (86.7%) | 72.7% to 97.1% | -10.0 | -25.0 to 0.0 | unresolved difference |
| search | TinyFish | 24/30 (80.0%) | 60.7% to 94.4% | 24/30 (80.0%) | 60.7% to 94.4% | -16.7 | -33.3 to -5.0 | resolved difference |
| search | Context.dev | 23/30 (76.7%) | 56.7% to 93.8% | 23/30 (76.7%) | 56.7% to 93.8% | -20.0 | -35.3 to -6.3 | resolved difference |
| search | You.com | 21/30 (70.0%) | 50.0% to 85.3% | 21/30 (70.0%) | 50.0% to 85.3% | -26.7 | -50.0 to -11.8 | resolved difference |
| search | Browserbase | 16/30 (53.3%) | 31.3% to 73.3% | 16/30 (53.3%) | 31.3% to 73.3% | -43.3 | -62.5 to -26.3 | resolved difference |
| scrape | Spider | 35/40 (87.5%) | 74.4% to 97.6% | 38/40 (95.0%) | 85.0% to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| scrape | Context.dev | 32/40 (80.0%) | 65.8% to 92.7% | 34/40 (85.0%) | 71.4% to 97.3% | -10.0 | -20.5 to -2.3 | resolved difference |
| scrape | Firecrawl | 30/40 (75.0%) | 59.5% to 89.2% | 33/40 (82.5%) | 68.9% to 94.9% | -12.5 | -23.7 to -2.6 | resolved difference |
| scrape | Scrapfly | 31/40 (77.5%) | 63.4% to 90.0% | 33/40 (82.5%) | 69.0% to 94.6% | -12.5 | -22.7 to -2.7 | resolved difference |
| scrape | TinyFish | 28/40 (70.0%) | 53.3% to 86.5% | 31/40 (77.5%) | 60.5% to 94.6% | -17.5 | -33.3 to -2.7 | resolved difference |
| scrape | You.com | 27/40 (67.5%) | 50.0% to 84.2% | 30/40 (75.0%) | 58.1% to 91.9% | -20.0 | -35.7 to -5.3 | resolved difference |
| scrape | Browserbase | 26/40 (65.0%) | 48.7% to 80.4% | 28/40 (70.0%) | 53.8% to 84.6% | -25.0 | -40.0 to -12.2 | resolved difference |
| scrape | Linkup | 26/40 (65.0%) | 48.7% to 80.5% | 28/40 (70.0%) | 53.8% to 84.6% | -25.0 | -39.5 to -11.9 | resolved difference |
| scrape | Jina Reader under a 5,000-token rejecting budget | 5/40 (12.5%) | 2.6% to 23.1% | 5/40 (12.5%) | 2.6% to 23.1% | -82.5 | -94.6 to -69.2 | resolved difference |
| map | Firecrawl | 13/15 (86.7%) | 66.7% to 100.0% | 13/15 (86.7%) | 66.7% to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| map | Context.dev | 12/15 (80.0%) | 60.0% to 100.0% | 12/15 (80.0%) | 60.0% to 100.0% | -6.7 | -26.7 to 13.3 | unresolved difference |
| crawl | Firecrawl | 3/12 (25.0%) | 0.0% to 50.0% | 12/12 (100.0%) | 100.0% to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| crawl | Scrapfly | 4/12 (33.3%) | 8.3% to 58.3% | 11/12 (91.7%) | 75.0% to 100.0% | -8.3 | -25.0 to 0.0 | unresolved difference |
| crawl | Context.dev | 2/12 (16.7%) | 0.0% to 41.7% | 6/12 (50.0%) | 25.0% to 75.0% | -50.0 | -75.0 to -25.0 | resolved difference |

search: Linkup is the reference. Resolved gaps against TinyFish, Context.dev, You.com, Browserbase. All other differences against that reference remain unresolved.

scrape: Spider is the reference. Resolved gaps against Context.dev, Firecrawl, Scrapfly, TinyFish, You.com, Browserbase, Linkup, Jina Reader under a 5,000-token rejecting budget. All other differences against that reference remain unresolved.

map: Firecrawl is the reference. No gap is resolved. All other differences against that reference remain unresolved.

crawl: Firecrawl is the reference. Resolved gaps against Context.dev. All other differences against that reference remain unresolved.

| Provider | Core stored responses with every expected URL | Core stored responses with every expected URL/title record | Replay exact URL sets | Replay exact URL/title records | Replay whole-task passes |
|---|---:|---:|---:|---:|---:|
| Firecrawl | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 |
| Context.dev | 11/12 | 7/12 | 10/12 | 6/12 | 6/12 |
| Scrapfly | 12/12 | 12/12 | 12/12 | 11/12 | 11/12 |

Scrape measures heading and structure preservation on documentation pages, not general extraction: 275 of the 300 frozen tasks request a docs heading, 21 request package versions and four request JS fields. Two source errors leave 298 retained tasks. Firecrawl's scrape core contains one task on docs.firecrawl.dev; it failed that task in both the original and corrected analysis.

The Jina result is **Jina Reader under a 5,000-token rejecting budget**, not a general scrape score. Its 5/40 core result is unchanged. Nine failed tasks received HTTP 409 on both attempts; the old harness did not retain their native error bodies. A rejecting token limit is a plausible cause, but the retained evidence cannot establish it. The other 26 failed tasks received content; 17 of those responses have no level-one Markdown heading. Content can omit or demote the requested H1. Future runs retain redacted native error bodies in private stored outcomes, including outside smoke mode.

Context.dev full search had two failed tasks affected by rate limiting. Five retained tasks saw a rate-limit error in some attempt; three recovered, including the one core task affected. These are reported separately from other answer/model failures. All failures remain in the denominators.

Context.dev crawl has genuine title differences, including “Textual - Grid” versus “Grid - Textual”. URL coverage and exact-title fidelity are separate measurements below; the whole-task score still requires both fields. Extra returned pages can be outside the requested scope, so “every expected URL present” measures coverage, whereas the model's exact URL set also requires omitting extras. Native-title fidelity uses the preregistered text normalization, not byte equality.

All intervals use the same 10,000 paired site-clustered bootstrap draws, seed 19019, on identical core IDs. Tasks from the same site stay together. A gap is resolved when its paired 95% interval excludes zero. Comparisons are exploratory and unadjusted and use the observed best core score as reference; selecting that reference increases false-positive risk. Different product types, one model, one server, free plans and documentation-heavy tasks limit generalization. Full-set results describe a different population and do not select the reference. Raw checks are original, not corrected/replayed; open the original analysis for those.


## Original preregistered analysis (unchanged below)

<!-- original-preregistered-v2 -->
# Campaign v2 findings

Campaign v2 measures one Claude Haiku 5.5 agent with one web tool, script-graded, from ms-a2 on free plans. Headline scores use identical core IDs for every eligible provider; larger full-set results are separate. [All metrics and original run links](../results/wb-v2-final/RESULTS.md) · [Machine-readable report](../results/wb-v2-final/summary.json) · [Earlier, smaller v1 findings](FINDINGS-v1.md).

## Population

| Track | Frozen full / core | Full / core clusters | Retained full / core | Retained full / core clusters |
|---|---:|---:|---:|---:|
| search | 300 / 30 | 52 / 18 | 298 / 30 | 52 / 18 |
| scrape | 300 / 40 | 40 / 37 | 298 / 40 | 40 / 37 |
| map | 60 / 15 | 15 / 15 | 60 / 15 | 15 / 15 |
| crawl | 40 / 12 | 15 / 12 | 40 / 12 | 15 / 12 |

Search, map and crawl are entirely real-web. Scrape freezes 296 real-web pages and four independently browser-verified JS fixture pages; the core contains 38 real-web and two JS pages. The scrape population is deliberately disclosed as documentation-heavy: 275 documentation headings, 21 package-version pages and four JS fields. Other registry pages that failed page agreement, robots or source verification were dropped before freezing. Search uses multiple registry ecosystems, release facts, documentation, financial/entity facts, fresh checks and verified absent releases. Site clusters group related tasks instead of treating them as independent observations.

## Identical-core headline results

Intervals use 10,000 paired site-clustered bootstrap draws, seed 19019. Differences compare each provider only with its observed core leader; other provider pairs are not evaluated. A difference is resolved when its interval excludes zero. Intervals are exploratory, unadjusted, and subject to observed-reference selection bias; ordering different product cohorts is descriptive.

### search

Reference: Linkup, selected on the identical retained core.

| Provider | Core success | Rate interval | Difference vs reference (points) | Paired difference interval (points) | Interpretation |
|---|---:|---|---:|---|---|
| Linkup | 29/30 (96.7%) | 90.0% to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| Firecrawl | 26/30 (86.7%) | 72.7% to 97.1% | -10.0 | -25.0 to 0.0 | unresolved difference |
| TinyFish | 24/30 (80.0%) | 60.7% to 94.4% | -16.7 | -33.3 to -5.0 | resolved difference |
| Context.dev | 23/30 (76.7%) | 56.7% to 93.8% | -20.0 | -35.3 to -6.3 | resolved difference |
| You.com | 21/30 (70.0%) | 50.0% to 85.3% | -26.7 | -50.0 to -11.8 | resolved difference |
| Browserbase | 16/30 (53.3%) | 31.3% to 73.3% | -43.3 | -62.5 to -26.3 | resolved difference |

### scrape

Reference: Spider, selected on the identical retained core.

| Provider | Core success | Rate interval | Difference vs reference (points) | Paired difference interval (points) | Interpretation |
|---|---:|---|---:|---|---|
| Spider | 35/40 (87.5%) | 74.4% to 97.6% | 0.0 | 0.0 to 0.0 | reference |
| Context.dev | 32/40 (80.0%) | 65.8% to 92.7% | -7.5 | -16.7 to 0.0 | unresolved difference |
| Scrapfly | 31/40 (77.5%) | 63.4% to 90.0% | -10.0 | -19.5 to -2.5 | resolved difference |
| Firecrawl | 30/40 (75.0%) | 59.5% to 89.2% | -12.5 | -23.7 to -2.6 | resolved difference |
| TinyFish | 28/40 (70.0%) | 53.3% to 86.5% | -17.5 | -33.3 to -2.7 | resolved difference |
| You.com | 27/40 (67.5%) | 50.0% to 84.2% | -20.0 | -35.7 to -5.3 | resolved difference |
| Browserbase | 26/40 (65.0%) | 48.7% to 80.4% | -22.5 | -36.8 to -10.0 | resolved difference |
| Linkup | 26/40 (65.0%) | 48.7% to 80.5% | -22.5 | -36.8 to -10.0 | resolved difference |
| Jina | 5/40 (12.5%) | 2.6% to 23.1% | -75.0 | -88.1 to -60.9 | resolved difference |

### map

Reference: Firecrawl, selected on the identical retained core.

| Provider | Core success | Rate interval | Difference vs reference (points) | Paired difference interval (points) | Interpretation |
|---|---:|---|---:|---|---|
| Firecrawl | 13/15 (86.7%) | 66.7% to 100.0% | 0.0 | 0.0 to 0.0 | reference |
| Context.dev | 12/15 (80.0%) | 60.0% to 100.0% | -6.7 | -26.7 to 13.3 | unresolved difference |

### crawl

Reference: Scrapfly, selected on the identical retained core.

| Provider | Core success | Rate interval | Difference vs reference (points) | Paired difference interval (points) | Interpretation |
|---|---:|---|---:|---|---|
| Scrapfly | 4/12 (33.3%) | 8.3% to 58.3% | 0.0 | 0.0 to 0.0 | reference |
| Firecrawl | 3/12 (25.0%) | 0.0% to 50.0% | -8.3 | -25.0 to 0.0 | unresolved difference |
| Context.dev | 2/12 (16.7%) | 0.0% to 41.7% | -16.7 | -41.7 to 0.0 | unresolved difference |

## Full samples, separate descriptive results

Only providers and controls completing the original full set appear. These scores do not select the headline reference.

| Track | Provider | Success | 95% rate interval |
|---|---|---:|---|
| search | Linkup | 248/298 (83.2%) | 76.0% to 88.3% |
| search | Context.dev | 215/298 (72.1%) | 59.8% to 79.9% |
| search | TinyFish | 210/298 (70.5%) | 56.8% to 79.2% |
| search | You.com | 193/298 (64.8%) | 50.2% to 74.1% |
| search | Model alone | 44/298 (14.8%) | 1.2% to 28.7% |
| scrape | Context.dev | 239/298 (80.2%) | 67.7% to 90.8% |
| scrape | Linkup | 174/298 (58.4%) | 44.3% to 71.5% |
| scrape | You.com | 213/298 (71.5%) | 58.6% to 83.6% |
| scrape | Correct page given | 273/298 (91.6%) | 81.5% to 100.0% |
| scrape | Model alone | 1/298 (0.3%) | 0.0% to 1.1% |
| map | Context.dev | 43/60 (71.7%) | 48.7% to 92.9% |
| map | Model alone | 0/60 (0.0%) | 0.0% to 0.0% |
| crawl | Context.dev | 2/40 (5.0%) | 0.0% to 13.2% |
| crawl | Model alone | 0/40 (0.0%) | 0.0% to 0.0% |

## Controls

| Track | Control | Retained core | Retained full |
|---|---|---:|---:|
| search | Model alone | 5/30 | 44/298 |
| scrape | Model alone | 0/40 | 1/298 |
| scrape | Correct page given | 37/40 | 273/298 |
| map | Model alone | 0/15 | 0/60 |
| crawl | Model alone | 0/12 | 0/40 |

The correct-page control uses independently extracted HTML titles/headings or rendered JS text, checked within the common tool cap. Its failures limit attribution to retrieval alone. No-tool results measure prior knowledge and answer-only passes. Raw evidence checks, per-family scores, timing, rate-limit errors and task-limit counts are in the machine-readable report. Truncation flags remain in each original per-task result row. Raw cannot establish absent answers or URL/title record relationships; those checks are not applicable.

## Participation

| Provider | Search | Scrape | Map | Crawl |
|---|---|---|---|---|
| Context.dev | full complete | full complete | full complete | full complete |
| Firecrawl | core complete | core complete | core complete | core complete |
| TinyFish | full complete | core complete | Unsupported product track; not run. | Unsupported product track; not run. |
| Linkup | full complete | full complete | Unsupported product track; not run. | Unsupported product track; not run. |
| Jina | No hard per-call token-charge bound; previous search used 618754 tokens. | core complete | Unsupported product track; not run. | Unsupported product track; not run. |
| Spider | No defensible metered multi-page/search bound within the remaining free wallet; restricted to single-page scrape. | core complete | No defensible metered multi-page/search bound within the remaining free wallet; restricted to single-page scrape. | No defensible metered multi-page/search bound within the remaining free wallet; restricted to single-page scrape. |
| Scrapfly | Unsupported product track; not run. | core complete | Unsupported product track; not run. | core complete |
| Browserbase | core complete | core complete | Unsupported product track; not run. | Unsupported product track; not run. |
| You.com | full complete | full complete | Unsupported product track; not run. | Unsupported product track; not run. |

Exa, Tavily, Perplexity, Bright Data and Parallel were excluded by the owner and have no v2 calls. Jina search has no enforceable token ceiling. Spider is restricted to metered single-page scrape; its other tracks have no defensible bound within the small wallet. Browserbase means HTTP Fetch/Search, not a browser-session agent. Its Search contract supplies URLs and titles without excerpts.

## Post-run verification

Confirmed drift: 2; source errors: 2. Every affected ID is excluded identically for providers and controls. Original frozen tasks and result rows remain intact. The report contains an unexcluded-core sensitivity analysis and every exclusion reason. A network or resolver error is not claimed as confirmed change.

## Evidence and limits

Native crawl titles are retained for Context.dev, Firecrawl and Scrapfly when returned. Scrapfly requests HTML alongside Markdown to preserve its native title, under a 28-credit native ceiling. Default rendering remains a product property. Long native pages can exceed the shared 12 KB scrape/search or 48 KB crawl cap, so successful source feasibility does not guarantee that every provider's full response fits. Jina Reader uses a rejecting 5,000-token bound. Spider may reject the fixture domain. These restrictions and truncations are measured, not silently corrected after test calls.

One location, one model, free-plan pacing, modest core sizes, documentation-heavy scrape tasks and selected bounded documentation scopes constrain generalization. Full and core populations differ. V1 and v2 also differ; these results establish no provider improvement or regression over time. There are no tuned v2 lanes.

## Spend

[Native balances and signed ledger reconciliation](../results/campaign-v2/reconciliation.md) include all dev pilots, interrupted calls and retained uncertain reservations. The API dollars are list equivalents; model prices are estimates through an existing proxy. No purchase, upgrade, push or public export was performed. Wallet checks marked NOT CHECKED are disclosed in the reconciliation rather than treated as passed.
