# Corrected analysis (post-run, disclosed)

Two harness faults changed the interpretation of campaign v2. Scrape answer keys kept link symbols and invisible characters that the task told the model to omit. Crawl evidence was cut after 48 KB of full page bodies, hiding later URLs and titles from the model. This post-run analysis corrects those faults and keeps the original preregistered scores and rows intact. Search and map headline scores are unchanged.

Scrape was regraded from the same stored model answers. Exactly 25 frozen heading keys changed: nine Scrapy, eight MkDocs and eight Vite, including three core tasks. No pages or model answers were fetched again for scrape. Heading generation now removes permalink elements and Unicode private-use (Co) and format (Cf) characters; text grading removes Co/Cf too. The correct-page control rises from 37/40 to 40/40 core and from 273/298 to 298/298 retained full. All 25 original full-control failures were caused by the answer-key fault.

Crawl was replayed using the same stored provider responses for every task each provider originally ran: Firecrawl 12, Context.dev 40, Scrapfly 12. Every returned URL and native title now comes before bounded page excerpts, within the same 48,000-byte cap, using the same packaging for every provider. We reused each original planning turn and reran only the final answer turn with Claude Haiku 5.5, temperature 0, the same system/user prompt, tools, 4,096 answer-token limit, one crawl tool call, and original cost/time limits. The strict JSON parser is unchanged. This is a disclosed model replay, not a fresh crawl or a repeat of the preregistered experiment. A single replay does not measure model variability, even at temperature zero.

The replay allowed only the existing model-proxy endpoint and refused provider dispatch and redirects. Its ledger records **0 provider calls**, **64 model-proxy calls**, **0 blocked network attempts**, and unchanged original provider ledgers. Model-only list-price estimate: $1.705214. Replay time and model-only cost do not estimate a fresh end-to-end crawl.

[Original preregistered scores](../wb-v2-final/RESULTS.md) · [Original summary](../wb-v2-final/summary.json) · [Corrected summary](../wb-v2-corrected/summary.json) · [Derived rows](../wb-v2-corrected/results.jsonl) · [Replay proof](../wb-v2-crawl-replay/proof.json) · [Key corrections](../wb-v2-corrected/key-corrections.json). Original frozen tasks, result rows and provider ledgers remain unchanged.

## Identical-core scores, before and after

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

## Correct-page and no-tool controls

| Track | Control | Original core | Corrected core | Original retained full | Corrected retained full |
|---|---|---:|---:|---:|---:|
| search | Model alone | 5/30 | 5/30 | 44/298 | 44/298 |
| scrape | Correct page given | 37/40 | 40/40 | 273/298 | 298/298 |
| scrape | Model alone | 0/40 | 0/40 | 1/298 | 1/298 |
| map | Model alone | 0/15 | 0/15 | 0/60 | 0/60 |
| crawl | Model alone | 0/12 | 0/12 | 0/40 | 0/40 |

## Crawl: coverage and title fidelity

| Provider | Core stored responses with every expected URL | Core stored responses with every expected URL/title record | Replay exact URL sets | Replay exact URL/title records | Replay whole-task passes |
|---|---:|---:|---:|---:|---:|
| Firecrawl | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 |
| Context.dev | 11/12 | 7/12 | 10/12 | 6/12 | 6/12 |
| Scrapfly | 12/12 | 12/12 | 12/12 | 11/12 | 11/12 |

Stored title fidelity asks whether all expected URL/title pairs were present before truncation, ignoring additional out-of-scope pages. Replay columns grade the model's exact output. Context.dev's full stored sample contains every expected URL on 36/40 tasks and all expected titles on 23/40; its full replay passes 22/40.

## JSON-plus-commentary sensitivity, separate from headline scores

The original strict parser still rejects commentary around JSON. This diagnostic finds a unique valid JSON object with exactly the requested fields inside a rejected final response. Counts include objects with wrong answers; the last column separately shows how many would pass the corrected field checks. It does not forgive rate limits or task limits. These results are never added to headline scores. Samples differ for providers that ran only the core.

| Track | Provider/control | Retained original tasks | Original failures | JSON plus commentary, original sample (core) | Of these, corrected fields would pass |
|---|---|---:|---:|---:|---:|
| search | Linkup | 298 | 50 | 1 (0) | 1 |
| search | Context.dev | 298 | 83 | 13 (1) | 9 |
| search | Firecrawl | 30 | 4 | 0 (0) | 0 |
| search | TinyFish | 298 | 88 | 15 (1) | 9 |
| search | Browserbase | 30 | 14 | 3 (3) | 2 |
| search | You.com | 298 | 105 | 16 (2) | 9 |
| scrape | Firecrawl | 40 | 10 | 2 (2) | 0 |
| scrape | Spider | 40 | 5 | 0 (0) | 0 |
| scrape | Context.dev | 298 | 59 | 5 (0) | 1 |
| scrape | TinyFish | 40 | 12 | 2 (2) | 0 |
| scrape | Linkup | 298 | 124 | 11 (1) | 4 |
| scrape | Scrapfly | 40 | 9 | 3 (3) | 2 |
| scrape | Browserbase | 40 | 14 | 3 (3) | 0 |
| scrape | You.com | 298 | 85 | 13 (1) | 0 |
| scrape | Jina Reader under a 5,000-token rejecting budget | 40 | 35 | 7 (7) | 0 |
| map | Context.dev | 60 | 17 | 1 (0) | 1 |
| map | Firecrawl | 15 | 2 | 0 (0) | 0 |
| crawl | Scrapfly | 12 | 8 | 8 (8) | 2 |
| crawl | Firecrawl | 12 | 9 | 8 (8) | 1 |
| crawl | Context.dev | 40 | 38 | 33 (9) | 0 |
| search | Model alone | 298 | 254 | 14 (3) | 9 |
| scrape | Correct page given | 298 | 25 | 0 (0) | 0 |
| scrape | Model alone | 298 | 297 | 13 (2) | 2 |
| map | Model alone | 60 | 60 | 0 (0) | 0 |
| crawl | Model alone | 40 | 40 | 0 (0) | 0 |

All three crawl replay providers had zero JSON-plus-commentary failures: Firecrawl 0/12, Context.dev 0/40, Scrapfly 0/12. The original crawl counts are retained above. Per-task details: [JSON commentary](../wb-v2-corrected/json-commentary-details.json), [native crawl evidence](../wb-v2-corrected/crawl-evidence-audit.json).

## Full samples, descriptive only

| Track | Provider/control | Original retained full | Corrected retained full | Corrected 95% interval |
|---|---|---:|---:|---|
| search | Linkup | 248/298 | 248/298 | 76.0% to 88.3% |
| search | Context.dev | 215/298 | 215/298 | 59.8% to 79.9% |
| search | TinyFish | 210/298 | 210/298 | 56.8% to 79.2% |
| search | You.com | 193/298 | 193/298 | 50.2% to 74.1% |
| scrape | Context.dev | 239/298 | 261/298 | 78.5% to 94.8% |
| scrape | Linkup | 174/298 | 197/298 | 53.1% to 78.3% |
| scrape | You.com | 213/298 | 238/298 | 68.6% to 90.1% |
| map | Context.dev | 43/60 | 43/60 | 48.7% to 92.9% |
| crawl | Context.dev | 2/40 | 22/40 | 29.5% to 81.1% |
| search | Model alone | 44/298 | 44/298 | 1.2% to 28.7% |
| scrape | Correct page given | 273/298 | 298/298 | 100.0% to 100.0% |
| scrape | Model alone | 1/298 | 1/298 | 0.0% to 1.1% |
| map | Model alone | 0/60 | 0/60 | 0.0% to 0.0% |
| crawl | Model alone | 0/40 | 0/40 | 0.0% to 0.0% |

## What these results do and do not measure

Scrape measures heading and structure preservation on documentation pages, not general extraction: 275 of the 300 frozen tasks request a docs heading, 21 request package versions and four request JS fields. Two source errors leave 298 retained tasks. Firecrawl's scrape core contains one task on docs.firecrawl.dev; it failed that task in both the original and corrected analysis.

The Jina result is **Jina Reader under a 5,000-token rejecting budget**, not a general scrape score. Its 5/40 core result is unchanged. Nine failed tasks received HTTP 409 on both attempts; the old harness did not retain their native error bodies. A rejecting token limit is a plausible cause, but the retained evidence cannot establish it. The other 26 failed tasks received content; 17 of those responses have no level-one Markdown heading. Content can omit or demote the requested H1. Future runs retain redacted native error bodies in private stored outcomes, including outside smoke mode.

Context.dev full search had two failed tasks affected by rate limiting. Five retained tasks saw a rate-limit error in some attempt; three recovered, including the one core task affected. These are reported separately from other answer/model failures. All failures remain in the denominators.

Context.dev crawl has genuine title differences, including “Textual - Grid” versus “Grid - Textual”. URL coverage and exact-title fidelity are separate measurements below; the whole-task score still requires both fields. Extra returned pages can be outside the requested scope, so “every expected URL present” measures coverage, whereas the model's exact URL set also requires omitting extras. Native-title fidelity uses the preregistered text normalization, not byte equality.

All intervals use the same 10,000 paired site-clustered bootstrap draws, seed 19019, on identical core IDs. Tasks from the same site stay together. A gap is resolved when its paired 95% interval excludes zero. Comparisons are exploratory and unadjusted and use the observed best core score as reference; selecting that reference increases false-positive risk. Different product types, one model, one server, free plans and documentation-heavy tasks limit generalization. Full-set results describe a different population and do not select the reference. Raw checks are original, not corrected/replayed; open the original analysis for those.

## Reproduce without provider calls

```sh
timeout 60 node --experimental-strip-types scripts/replay-crawl-v2.mjs --validate-only
# Uses existing model-proxy authentication internally, without loading .env.
# Resumes completed answers; a fresh replay needs a separately named lane.
timeout 1200 node --experimental-strip-types scripts/replay-crawl-v2.mjs
timeout 180 node --experimental-strip-types scripts/analyze-corrections-v2.mjs
node scripts/site-data-v2.mjs results/wb-v2-corrected/summary.json
node scripts/docs-corrections-v2.mjs
```

The offline analysis reads stored files only. It never invokes provider adapters. Search/map original rows are reused; scrape model fields are regraded; crawl model rows come from the replay. All source result/call hashes are recorded in summary.json. Bootstrap functions and seed are unchanged.

## Implementation and local commits

Heading extraction removes permalink elements before extracting text, then drops Unicode Co/Cf characters. Grader normalization drops the same Unicode categories. Crawl packaging keeps a compact URL/native-title manifest before bounded body excerpts; it refuses to silently omit any manifest row if even the manifest cannot fit. Native titles come from the adapters' existing native-title prefix, including in stored outcomes; body headings are never invented as titles.

The replay imports no provider registry, refuses adapter dispatch, permits only the exact model-proxy POST endpoint and disables redirects. The parser was extracted without changing its logic so live and replay lanes use the same strict rules. Redacted native error bodies now survive the HTTP operation and outcome schema into private stored outcomes for future runs.

The first independent review found a replay deadline bug: a final model call could have received a fresh 600 seconds. Commit 5484a62 subtracts the original elapsed time and rejects aborted replay answers. All 64 already-completed rows also passed the combined-time check; maximum original-plus-replay task time was 106,475.812298 ms, below 600,000 ms. Resume made zero additional model calls and did not change scores. A second independent GPT-6.1 Sol review found no remaining correctness issues and reproduced the bootstrap comparisons.

```text
67877f9 Keep every crawl URL and native title before bounded page excerpts
ee65d64 fix: strip heading permalinks and normalize invisible text
cce8688 fix: retain redacted native HTTP error bodies in smoke events
ac26030 Headline the corrected v2 analysis and keep original scores on /preregistered
650ace2 fix: preserve redacted native HTTP errors in run outcomes
30b0528 Add fail-closed model-only replay from verified stored crawl outcomes
5484a62 Retain original elapsed time when replaying the final model answer
28de0c9 Record corrected scrape regrades and provider-blocked crawl model replay
f787f82 Lead reports and site with disclosed corrections and separate sensitivity counts

```

All commits carry `Co-Authored-By: GPT-6.1 Sol <noreply@openai.com>`. This report is committed separately afterward. No pushes, public export, purchases or posts were made. /home/leo/web-bench-public was untouched.

## Verification produced in this task

`timeout 180 npm test`, exit 0:

```text
tests 130
pass 130
fail 0
duration_ms 12196.528141
```

`timeout 90 npm run typecheck`: exit 0.

`cd site && timeout 300 taskset -c 0-3 npx next build`, exit 0:

```text
Next.js 16.4.2 (Turbopack)
Compiled successfully
Finished TypeScript
Collecting page data using 4 workers
Generating static pages using 4 workers
Routes: /, /_not-found, /export, /preregistered, /v1
(Static) prerendered as static content
```

The existing Next workspace-root warning mentions the already-present root package-lock.json and site/bun.lock. Neither lockfile nor site/package.json changed. next.config.ts caps workers at four.

Browser evidence stays outside the repository at `/home/leo/.agents/verify-notes/web-bench/evidence/2026-10-19-corrected/`: npm-test.log, site-build.log, replay.log, replay-resume.log, analysis.log, browser.log and screenshots. Real static output was opened with agent-browser on every corrected track at desktop 1440 and mobile 390; original-score navigation, v1 navigation, expanded comparison/full/sensitivity disclosures and export cards were checked. Main-page widths 1440, 390 and 320 matched document width, with no horizontal overflow or browser errors. Export cards intentionally remain fixed 1200×675 artifacts; they were checked at desktop size.

Private preview address was resolved from machine.local.toml and matched Tailscale before serving. Server and Mac Mini HTTP access passed. No phone or Windows device was tested. Temporary preview and browser were stopped after verification.

- PASS — 25 affected scrape keys independently verified, including all 25 original control failures; corrected control 40/40 core, 298/298 retained full.
- PASS — all 64 original crawl provider/task pairs replayed; provider dispatch count 0; 64 model-proxy calls; original provider ledgers unchanged.
- PASS — stored core crawl coverage independently verified: Firecrawl 12/12, Scrapfly 12/12, Context.dev 11/12. Exact-title fidelity reported separately.
- PASS — original scores and rows remain intact and visible; original doc bodies preserved byte-for-byte under explicit original labels; original site data on /preregistered; v1 unchanged.
- PASS — corrected paired site-clustered bootstrap uses identical core IDs, seed 19019, 10,000 draws; search/map scores and intervals exactly unchanged.
- PASS — strict parser retained; per-provider/track JSON-plus-commentary sensitivity counts kept separate from headline scores.
- PASS — Jina budget/error-body, documentation-heavy scope, Firecrawl own-domain task and search rate-limit disclosures verified.
- PASS — regression tests, complete npm test, typecheck, site build and real desktop/mobile artifact checks.
- NOT CHECKED — fresh provider retrieval, general extraction performance, live native-error retention and replay repeatability; intentionally outside this model-only/offline correction.
- NOT CHECKED — phone/Windows access; server and Mac Mini access were the tested devices.
