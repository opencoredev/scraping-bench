# V2 cross-track budget worksheet

Measured 2026-10-19 with allowlisted balance probes. One Context.dev example.com balance probe cost 1 credit, leaving 63,171. It is measurement overhead, separate from campaign dispatches. No purchase, upgrade, or payment details. Values below are free balances, not authorization to exceed guards.

| Provider | Starting balance | Minimum retained | Maximum v2 API spend | Allocation |
|---|---:|---:|---:|---|
| Firecrawl | 463 credits | 23.15 credits | 439.85 credits / $2.19925 list | Core all tracks; pilots count |
| Scrapfly | 309 credits | 15.45 credits | 293.55 credits / $0.0440325 list | Core scrape/crawl; pilots count |
| Context.dev | 63,171 credits after probe | 3,158.55 credits | 60,012.45 credits / $132.02739 list | Full supported tracks |
| Linkup | $18.904 | $0.9452 | $17.9588 | Full search/scrape |
| You.com | 10,000 cents = $100 | $5 | $95 | Full search/scrape; $0.005/search, $0.001/page |
| Spider | 2,428.905325 credits | 121.44526625 credits | 2,307.46005875 credits / $0.230746005875 list | Scrape core only if pilot affordability permits |
| Jina | 1,495,119 tokens observed, possibly cached | 74,755.95 tokens | Signed historical allowance at most 834,751.1 tokens | Search excluded; scrape core only, X-Token-Budget: 5000, $0.00025 bound/call |
| TinyFish | $10 wallet, Fetch/Search contract zero | $0.50 and 5% of daily grants | At most 950 Fetch/day and 11,400 Search/day | Core scrape; full search; count physical calls |
| Browserbase | 1,000 requests/product initial grant; remaining not exposed | 50 requests/product | 950/product including all historical usage | Core search/scrape, only if worst-case guard fits |

Starting projection: Firecrawl 30×3.80 search + 40×1.38 scrape + 15×1.53 map + 12×10.5 crawl = 318.15 credits. Remaining 121.70 credits cover pilots and uncertainty. Scrapfly 40×1.08 + 12×12.2 = 189.60 credits, leaving 103.95 for pilots and uncertainty. These are projections, not per-call guarantees. Crawl reservations use the frozen maximum page ceiling and permitted features; no 300-credit reservation. Default Scrapfly crawl sets the native `max_api_credit: 28` hard ceiling documented at https://scrapfly.io/docs/crawler-api#api_param_max_api_credit, with the frozen page ceiling and no tuned rendering. Its reservation is 28 × $0.00015 = $0.0042. Unknown charges retain the configured reservation. A provider whose remaining cap cannot fund its core is excluded rather than spending beyond the floor.

Worst-case dispatch guards reserve 4 physical search requests/task and 3 scrape requests/task (agent limits plus raw miss). Browserbase history is scanned across all result runs and smoke records, with no daily reset assumption. TinyFish resets daily; UTC date is used conservatively and no new grant is assumed within a run. Requests use frozen pacing: Firecrawl 7 seconds/search, scrape, map; 65 seconds/crawl. All providers concurrency 1. Queue waiting counts against the original task deadlines. Rate-limit failures are reported separately from retrieval failures.

Jina search's previous 618,754-token charge disproved its old bound. The observed root balance does not override the signed ledger. Reader documents `x-token-budget` as a rejecting cost-control header, ignored on Search: https://github.com/jina-ai/reader#headers. Scrape sets 5,000 tokens/call: 40 core tasks × 3 worst-case physical calls × 5,000 = 600,000 tokens, plus 3 pilot tasks × 3 × 5,000 = 45,000. Both fit the signed 834,751.1-token allowance ($0.041737555), retaining the measured 5% floor. Oversized Reader pages become explicit failures. Spider's variable compute pricing also requires a successful metered dev pilot and sufficient headroom; otherwise record not run. No auto top-up is enabled or configured by this work.

## Final dev-pilot checkpoint

Before freezing, the signed v2 ledger records Firecrawl 37 credits ($0.185), leaving 402.85 credits under its retained-balance cap. Scrapfly records 43 credits ($0.00645), leaving 250.55. These exceed the unchanged core projections of 318.15 and 189.60 credits. Jina records 8,420 tokens ($0.000421), leaving 826,331.1 tokens of its stricter signed allowance. Context.dev records 35 credits, You.com $0.064, Linkup $0.039, Browserbase $0.082, Spider $0.0015168125, and TinyFish $0. Full per-provider dispatch counts are in pretest-spend.json. All pilot IDs still belong to the dev split. Guards continue to reserve the maximum before each physical dispatch; projections do not override them.
