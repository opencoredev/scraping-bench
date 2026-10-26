# Corrected provider analysis (post-run, disclosed)

Two harness faults changed the interpretation of campaign v2. Scrape answer keys kept link symbols and invisible characters that the task told the model to omit. Crawl evidence was cut after 48 KB of full page bodies, hiding later URLs and titles from the model. This post-run analysis corrects those faults and keeps the original preregistered scores and rows intact. Search and map headline scores are unchanged.

Scrape was regraded from the same stored model answers. Exactly 25 frozen heading keys changed: nine Scrapy, eight MkDocs and eight Vite, including three core tasks. No pages or model answers were fetched again for scrape. Heading generation now removes permalink elements and Unicode private-use (Co) and format (Cf) characters; text grading removes Co/Cf too. The correct-page control rises from 37/40 to 40/40 core and from 273/298 to 298/298 retained full. All 25 original full-control failures were caused by the answer-key fault.

Crawl was replayed using the same stored provider responses for every task each provider originally ran: Firecrawl 12, Context.dev 40, Scrapfly 12. Every returned URL and native title now comes before bounded page excerpts, within the same 48,000-byte cap, using the same packaging for every provider. We reused each original planning turn and reran only the final answer turn with Claude Haiku 5.5, temperature 0, the same system/user prompt, tools, 4,096 answer-token limit, one crawl tool call, and original cost/time limits. The strict JSON parser is unchanged. This is a disclosed model replay, not a fresh crawl or a repeat of the preregistered experiment. A single replay does not measure model variability, even at temperature zero.

The replay allowed only the existing model-proxy endpoint and refused provider dispatch and redirects. Its ledger records **0 provider calls**, **64 model-proxy calls**, **0 blocked network attempts**, and unchanged original provider ledgers. Model-only list-price estimate: $1.705214. Replay time and model-only cost do not estimate a fresh end-to-end crawl.

[Corrected scores and sensitivity counts](../results/wb-v2-corrected/RESULTS.md) · [Original preregistered scores](../results/wb-v2-final/RESULTS.md).

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
# Campaign v2 provider participation

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

All supported, affordable default tracks received a dev pilot before held-out execution. Every ranked provider completed the original identical core without an API-budget stop; retrieval failures still count as attempted tasks. See [v2 findings](../docs/FINDINGS.md) for scores and paired intervals, and [dev audit](../results/campaign-v2/dev-audit.json) for native evidence checks.

You.com uses Search API GET /v1/search and Contents API POST /v1/contents. Live dev pilots verified the contract. The owner cancelled further You.com calls after its search and scrape samples completed; collected rows are retained and the final wallet probe was skipped. Search is $0.005/request and Contents $0.001/page; responses without native usage retain list-price estimates. Balance observations, reservations and unresolved reconciliation residuals are reported in [BUDGET.md](BUDGET.md). It has no map/crawl product in this campaign. Official specifications: https://you.com/docs/llms.txt and https://you.com/docs/openapi.json.

Default rendering is preserved. Native crawl titles are forwarded for all three tested products; Scrapfly retrieves HTML alongside Markdown, with max_api_credit 28. Jina scrape sends X-Token-Budget 5000. Browserbase is its HTTP Fetch/Search API. Exa, Tavily, Perplexity, Bright Data and Parallel have no v2 calls by owner instruction.

[Earlier adapter smoke results](RESULTS-v1.md) · [You adapter tests](../src/adapters/you.test.ts).
