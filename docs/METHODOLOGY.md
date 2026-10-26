# Corrected analysis (post-run, disclosed)

Two harness faults changed the interpretation of campaign v2. Scrape answer keys kept link symbols and invisible characters that the task told the model to omit. Crawl evidence was cut after 48 KB of full page bodies, hiding later URLs and titles from the model. This post-run analysis corrects those faults and keeps the original preregistered scores and rows intact. Search and map headline scores are unchanged.

Scrape was regraded from the same stored model answers. Exactly 25 frozen heading keys changed: nine Scrapy, eight MkDocs and eight Vite, including three core tasks. No pages or model answers were fetched again for scrape. Heading generation now removes permalink elements and Unicode private-use (Co) and format (Cf) characters; text grading removes Co/Cf too. The correct-page control rises from 37/40 to 40/40 core and from 273/298 to 298/298 retained full. All 25 original full-control failures were caused by the answer-key fault.

Crawl was replayed using the same stored provider responses for every task each provider originally ran: Firecrawl 12, Context.dev 40, Scrapfly 12. Every returned URL and native title now comes before bounded page excerpts, within the same 48,000-byte cap, using the same packaging for every provider. We reused each original planning turn and reran only the final answer turn with Claude Haiku 5.5, temperature 0, the same system/user prompt, tools, 4,096 answer-token limit, one crawl tool call, and original cost/time limits. The strict JSON parser is unchanged. This is a disclosed model replay, not a fresh crawl or a repeat of the preregistered experiment. A single replay does not measure model variability, even at temperature zero.

The replay allowed only the existing model-proxy endpoint and refused provider dispatch and redirects. Its ledger records **0 provider calls**, **64 model-proxy calls**, **0 blocked network attempts**, and unchanged original provider ledgers. Model-only list-price estimate: $1.705214. Replay time and model-only cost do not estimate a fresh end-to-end crawl.

This correction was made after the preregistered run. It does not revise the preregistration or overwrite its rows. [Corrected scores, uncertainty and sensitivity](../results/wb-v2-corrected/RESULTS.md) · [Original scores](../results/wb-v2-final/RESULTS.md) · [Preregistration](PREREGISTRATION-v2.md).

Scrape measures heading and structure preservation on documentation pages, not general extraction: 275 of the 300 frozen tasks request a docs heading, 21 request package versions and four request JS fields. Two source errors leave 298 retained tasks. Firecrawl's scrape core contains one task on docs.firecrawl.dev; it failed that task in both the original and corrected analysis.

The Jina result is **Jina Reader under a 5,000-token rejecting budget**, not a general scrape score. Its 5/40 core result is unchanged. Nine failed tasks received HTTP 409 on both attempts; the old harness did not retain their native error bodies. A rejecting token limit is a plausible cause, but the retained evidence cannot establish it. The other 26 failed tasks received content; 17 of those responses have no level-one Markdown heading. Content can omit or demote the requested H1. Future runs retain redacted native error bodies in private stored outcomes, including outside smoke mode.

Context.dev full search had two failed tasks affected by rate limiting. Five retained tasks saw a rate-limit error in some attempt; three recovered, including the one core task affected. These are reported separately from other answer/model failures. All failures remain in the denominators.

Context.dev crawl has genuine title differences, including “Textual - Grid” versus “Grid - Textual”. URL coverage and exact-title fidelity are separate measurements below; the whole-task score still requires both fields. Extra returned pages can be outside the requested scope, so “every expected URL present” measures coverage, whereas the model's exact URL set also requires omitting extras. Native-title fidelity uses the preregistered text normalization, not byte equality.

All intervals use the same 10,000 paired site-clustered bootstrap draws, seed 19019, on identical core IDs. Tasks from the same site stay together. A gap is resolved when its paired 95% interval excludes zero. Comparisons are exploratory and unadjusted and use the observed best core score as reference; selecting that reference increases false-positive risk. Different product types, one model, one server, free plans and documentation-heavy tasks limit generalization. Full-set results describe a different population and do not select the reference. Raw checks are original, not corrected/replayed; open the original analysis for those.

## Analysis rules for this correction

The stored model answer fields are regraded for scrape. A parser failure stays a parser failure; no commentary extraction enters the headline. Crawl uses the original stored final-answer request and changes only its tool-evidence text. Source outcome hashes are checked before any model request. The runner refuses provider adapter dispatch and blocks every fetch except the exact local model-proxy POST endpoint. Redirects are refused. It records model calls, reused outcome hashes and network calls separately. Each source provider ledger is hashed before and after replay.

Unicode Co/Cf characters are deleted before whitespace is collapsed. Permalink elements are removed structurally during future heading generation; meaningful C# headings remain intact. Frozen keys are never regenerated from the live web: corrected task copies remove the known Unicode contaminants from the same stored keys.

JSON-plus-commentary sensitivity counts a unique valid answer object with exactly the required fields inside a rejected final response. It reports affected failures per provider and track, core membership and whether the corrected field checks would pass. No repair or lenient parsing is used for headline scores.

Replay time and model-only costs are withheld from the headline site's crawl charts because provider retrieval was reused; full end-to-end cost/time is not measured by replay. Original raw checks remain in the original report.

Reproduce with scripts/replay-crawl-v2.mjs (model-only, provider blocked), scripts/analyze-corrections-v2.mjs (offline), scripts/site-data-v2.mjs results/wb-v2-corrected/summary.json, and scripts/docs-corrections-v2.mjs. The original methods below describe the original experiment; the correction above overrides only the named heading and evidence-packaging rules.

## Original preregistered analysis (unchanged below)

<!-- original-preregistered-v2 -->
# How campaign v2 grades

Web-bench measures whether Claude Haiku 5.5 completes a task using one web data API. A script grades every answer. Search, scrape, map and crawl are separate tracks; their scores do not form an overall ranking.

Campaign v2 uses a larger, mostly real-web population. The [preregistration](PREREGISTRATION-v2.md) defines sampling, budgets, exclusions and analysis. The [earlier methodology](METHODOLOGY-v1.md) describes the smaller v1 population. The populations differ, so a score change between campaigns does not establish improvement or regression.

## Tasks and evidence

Search asks for registry versions, release facts, entity facts, financial facts, documentation headings and verified absent releases. Scrape asks for page headings, page-checked package versions and a small set of browser-verified JavaScript fields. Map asks for canonical URLs inside a documentation scope. Crawl asks for each scoped URL and its HTML document title.

Official registry JSON APIs, authoritative HTML, SEC XBRL and Wikidata supply answer keys. Each map/crawl scope requires agreement between its sitemap and an independent breadth-first HTML crawl. Scopes contain at most 30 pages. JavaScript answers must be absent from the initial visible HTML and independently visible in a browser. Fixture seeds, source recipes and evidence hashes are recorded.

The existing deterministic 30% dev split isolates pilots from held-out tasks, including related answers across tracks. Candidates can be rejected before freezing. Frozen task bytes, instructions, keys, configuration and benchmark implementation are hashed campaign-wide. No adapter or harness changes are made after held-out calls begin.

Every frozen recipe is resolved immediately before the campaign and again afterward. Independent scrape oracle evidence must contain the answers within the 12,000-byte serialized tool cap. Crawl title evidence must fit 48,000 bytes; canonical answers must fit 4,096 UTF-8 bytes, a conservative upper bound for 4,096 tokens. Full native provider output can still truncate under the same caps, and those truncations remain measured outcomes.

## One task

The model receives the same prompt, neutral tool and requested field names for every provider. Gold values are never supplied. It answers in JSON. A task passes only when all fields match and the run stays within its limits.

| Track | Tool calls | Deadline | Per-task cost limit |
| --- | ---: | ---: | ---: |
| Search | 3 | 60 seconds | $0.10 |
| Scrape | 2 | 60 seconds | $0.10 |
| Map | 2 | 120 seconds | $0.25 |
| Crawl | 1 | 600 seconds | $2.00 |

Text comparison ignores case, punctuation and spacing. Versions ignore a leading v and build metadata. Dates compare calendar days. Numbers use the key's tolerance. Documentation map sets require at least 90% precision and recall; crawl records require the complete keyed set. The [grader](../src/grade/index.ts) and its tests define the exact rules.

Raw checks ask whether the API output contains each answer without a model. They cannot establish a negative or the relationship between pipe-separated crawl records, which are marked not applicable. Agent and raw modes reuse only an identical first call; otherwise raw makes a separately budgeted request.

Native document titles are retained when returned by Firecrawl, Context.dev and Scrapfly. Scrapfly requests HTML alongside Markdown so the adapter can preserve its native title. Rendering stays at each product's default. Jina Reader uses a rejecting 5,000-token request budget to fit its free allowance; this restriction is part of the result.

## Core and full samples

Every eligible provider receives the same preregistered core: 30 search, 40 scrape, 15 map and 12 crawl tasks. Core selection rotates families and then sites, with per-site caps and minimum independent-site counts. Search/scrape permit at most three tasks per site; map/crawl permit two. Minimum cluster counts are 10, 15, 10 and 8. The scrape core includes exactly two independently verified JS tasks.

Affordable providers also run the larger full samples. Headline scores, reference selection and paired comparisons use only identical retained core IDs. Full-set results are separate descriptive results. A provider must complete its original entire core to qualify; retrieval failures count as completed attempts, but native API budget stops do not.

## Controls and drift

No-tool controls cover every full sample. Scrape also has a correct-page control, using independently fetched HTML metadata/headings or rendered browser text. A control failure limits what can be attributed to retrieval.

After the run, changed authoritative answers or inputs are confirmed drift. Failed network, robots or resolver checks are source errors, not evidence of change. Both categories are excluded identically for every provider and control. Original rows remain intact, and the report includes an unexcluded sensitivity analysis.

## Statistics and costs

The success rate is the share of retained tasks that pass. The report gives 95% percentile intervals from 10,000 bootstrap draws that resample whole site clusters. Paired differences preserve task pairs and compare providers against the observed core leader. An interval excluding zero resolves the difference; otherwise it is an unresolved difference. Comparisons are exploratory and unadjusted, and choosing the observed reference introduces selection bias. Ordering different product cohorts is descriptive.

Cost per success includes API and estimated model costs for failed attempts. Signed dispatch and settlement events count physical API charges once, including pilots, interrupted work and uncertain reservations. Model costs are list-price estimates through the existing proxy, not subscription charges. Successful-task median/p90 and all-task timing are reported separately. Rate-limit errors remain distinct from retrieval errors.

Free-credit caps retain at least 5% of measured balances. Browserbase also has a lifetime product-request guard, and TinyFish conservatively counts historical requests against its daily grants. Endpoint pacing is fixed before held-out calls. One worker per provider avoids internal queue contention; at most four independent providers run at once. The [budget worksheet](../results/campaign-v2/budget-worksheet.md) and [budget reconciliation](../providers/BUDGET.md) document the limits.

One server, one model, free plans, a documentation-heavy scrape population and limited core sizes constrain generalization. See [FINDINGS.md](FINDINGS.md) for observed results and specific limitations.
