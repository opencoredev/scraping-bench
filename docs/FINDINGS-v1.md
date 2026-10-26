# What the free-credit benchmark shows

This run measures complete answers from one client, `ms-a2`, using the same held-out tasks for every provider in a track. It is an exploratory comparison. The small number of independent sites prevents a broad claim that one provider is best. See the [full results](../results/wb-20261017-final/RESULTS.md) and [machine-readable summary](../results/wb-20261017-final/summary.json) for intervals, costs, latency, error counts and family rates.

## Track results

Search: Firecrawl scored 51/60 (85.0%). Next, Linkup scored 50/60; the observed gap is 1.7 percentage points, and the paired interval for Linkup minus Firecrawl is -13.6 to +4.2 percentage points (unresolved). Browserbase scored 23/60, 46.7 points behind Firecrawl, with a paired interval of -63.0 to -31.7 (difference detected). All five ranked providers ran the same 60 tasks. Parallel also ran them, but its results are withheld because its customer terms require written consent to publish benchmark results.

Scrape: contextdev scored 55/60 (91.7%). The next provider, firecrawl, scored 54/60; the observed gap is 1.7 percentage points. The paired interval for firecrawl minus contextdev is -10.0 to +0.0 percentage points (unresolved).

Map: contextdev scored 7/15 (46.7%). The next provider, firecrawl, scored 6/15; the observed gap is 6.7 percentage points. The paired interval for firecrawl minus contextdev is -25.0 to +0.0 percentage points (unresolved).

Crawl: scrapfly scored 7/10 (70.0%). The next provider, contextdev, scored 6/10; the observed gap is 10.0 percentage points. The paired interval for contextdev minus scrapfly is -13.6 to +0.0 percentage points (unresolved).

Search now has sixty tasks across six site clusters. The original seven-task run was superseded; its costs remain in the ledger. Only seven held-out not-found tasks exist, so the family counts are 14/13/13/13/7 rather than exactly equal. Scrape has 60 tasks but only two clusters: ten PyPI tasks and fifty tasks on one fresh fixture site. Its apparently narrow intervals should not be read as broad certainty. Map has fifteen tasks across five clusters; crawl has ten across four. Within-cohort comparisons are in the summary; the overall ranking also compares different product types.

Map services returned sparse or empty inventories on newly seeded fixture paths. Three native failures per low-scoring pilot provider were opened after fixing Context.dev’s hostname argument. This supports a cold-site discovery limitation on this domain; it does not establish the same result on mature indexed sites.

Crawl combines retrieval with a demanding relationship extraction task. Native titles now reach the model, but large bodies can still exceed the 48 KB evidence cap or yield incomplete JSON. Firecrawl needed 65-second dispatch spacing after faster free-tier pacing caused 429s. End-to-end latency includes time waiting inside the harness, so its crawl median also reflects that pacing.

## Controls and raw evidence

- crawl / none: 0/10 (0.0%).
- map / none: 0/15 (0.0%).
- scrape / none: 0/60 (0.0%).
- scrape / oracle: 60/60 (100.0%).
- search / none: 14/60 (23.3%).

The scrape oracle uses independently fetched evidence, checked against the frozen keys; it does not receive the answers. Dynamic fixture content, PDF text and the focused long-page procedure were collected explicitly. Any oracle failure is a model, evidence-packaging or checker limitation, rather than a provider retrieval failure. The no-tool control shows how much can pass from prior knowledge or null answers alone.

Jina receives a separate historical comparison on the seven original task IDs, paired with the matching subset of each new provider run. Its earlier agent passed 2/7 and raw passed 6/6 applicable tasks (one raw n/a). No new Jina requests were made. The remaining conservative allowance is 834,751 tokens, but one earlier search call consumed 618,754 tokens and the unchanged task policy permits up to four physical calls. There is no documented enforceable upstream token ceiling, so no new full task can be guaranteed to preserve the floor. These old responses are time-qualified evidence, not a fresh Jina run, and never enter the 60-task leaderboard. Subset scores, intervals and paired differences are in the aggregate summary.

Raw checks test accepted answer presence, not the agent’s ability to choose and serialize it. Relationship tasks are raw n/a; agent and raw denominators can differ.

Identical normalized first calls are reused only after the agent dispatch settles. Standalone raw cost and tool time remain attributed to the raw lane. The campaign ledger charges the physical request once; summing costs across modes would double count shared evidence.

## Tuned scrape

- contextdev: 55/60; change from default +0.0 percentage points, paired interval +0.0 to +0.0 percentage points (unresolved).
- firecrawl: 49/60; change from default -8.3 percentage points, paired interval -10.0 to +0.0 percentage points (unresolved).
- linkup: 54/60; change from default +0.0 percentage points, paired interval +0.0 to +0.0 percentage points (unresolved).
- jina: 52/60; change from default +0.0 percentage points, paired interval +0.0 to +0.0 percentage points (unresolved).
- scrapfly: 55/60; change from default +3.3 percentage points, paired interval +0.0 to +20.0 percentage points (unresolved).

The tuned lane uses the same sixty scrape tasks and frozen provider presets. Spider, TinyFish and Browserbase were omitted from tuning because the account/product setup offered no useful affordable alternate preset for this campaign. There are no tuned runs on other tracks. Firecrawl tuned scrape encountered native HTTP 429s after exceeding its ten-request/minute free quota under this interleaved schedule. Three complete responses were inspected and their messages and hashes are in `tuned-rate-limit-audit.json`. These rows measure free-tier throughput under the frozen schedule; they do not establish tuned retrieval quality at a slower pace. Unknown bills retain their upper reservations, which makes reported cost conservative.

## Provider and budget findings

Spider rejected the workers.dev fixture domain with its malicious-URL filter. Three inspected pilot responses contain that explicit embedded 403. All ten held-out PyPI scrape tasks succeeded. Its total 12/60 also includes two negative fixture tasks that passed by returning null despite blocked retrieval; interpret those two as answer-only passes. This is a domain compatibility finding, not a hidden adapter failure.

Browserbase here means its HTTP Fetch and Search products. It is not a browser session pipeline. The inspected Search responses contained useful URLs and titles but blank snippet/content fields, which limits factual answers.

Exa, Tavily, Perplexity and Bright Data were not tested — no key. Spider was restricted to scrape under its small wallet.

No credits were bought, no plan was upgraded, and nothing was pushed. Final measured balances and conservative dispatch/settlement accounting remain above the 5% floors. Totals include pilots, interrupted dispatches and superseded quality runs. API dollars are list equivalents of credits or conservative reservations; proxy model dollars are estimates, not a cash purchase. Native balance changes can differ from the ledger when a reservation remains uncertain. Jina’s root balance can be stale, so its token ledger is the budget evidence; Browserbase does not expose remaining free quota. See [budget reconciliation](../providers/BUDGET.md#benchmark-campaign-reconciliation).

## Known weaknesses

The real-web scrape set is all PyPI pages; together with the fixture site, scrape has only two site clusters. All requests came from one client location, ms-a2. Free-tier pacing affects measured time and errors, including Firecrawl 429s. Fixtures live on workers.dev, which Spider blocked with its malicious-URL filter. Exa, Tavily, Perplexity and Bright Data remain untested because no keys were available.

## Corrections and limits

The expanded search run also fixes Parallel’s native maximum-result argument; a regression test failed before the fix and passed afterward. The campaign fixed fixture crawl scopes that contained instructions instead of paths, Context.dev map’s domain argument, Spider’s invalid timeout argument, discarded crawl titles, first-call cache/resume mistakes, and budget races across dispatches and settlements. Regression tests failed before the relevant fixes and passed after them. A corrected dev pilot preceded the held-out crawl. Superseded quality rows are marked in [corrections.json](../results/campaign-20261017/corrections.json); their costs remain in totals.

Fixtures use a new content seed, `test-20261017-fresh-c`, separate from the dev seed. Real-web verification passed 287/288 tasks; the drifted PyPI tenacity task was dropped before sampling. Freshness-version tasks were excluded because origin-version matching is not integrated. Large crawl families were excluded to keep scopes under thirty pages and within free grants.

The answer model is Claude Haiku 5.5 with temperature 0, a 4096-token answer cap, 12 KB ordinary evidence and 48 KB crawl evidence. Search allows three tool calls, scrape and map two, and crawl one. These settings are part of the measured system, so results are not pure vendor recall. There is one client location, no regional speed study, no paid-tier comparison, no guarantee that the next run sees unchanged real-web pages, and no adjustment for selecting leaders or multiple comparisons.

All public results contain grades, usage and hashes. Native page bodies stay in the ignored private directory.
