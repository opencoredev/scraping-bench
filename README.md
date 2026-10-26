# scraping-bench

scraping-bench grades web data APIs on whether an AI agent got the job done with them. Each provider becomes the only tool of the same agent (Claude Haiku 5.5, same prompt, same limits), which has to return specific facts: a page's first heading, a package version, every URL in a docs section. A script checks every answer against a key from an official source. No model grades anything.

This is campaign v2: four tracks (scrape, search, map and crawl) on the real web, mostly documentation sites, scored under the rules in [docs/MEASURE-v2.md](docs/MEASURE-v2.md). Ten providers were tested: Browserbase, Context.dev, Firecrawl, Jina Reader, Linkup, Scrapfly, Spider, String, TinyFish and You.com.

[Results site](https://www.scrapingbench.com) · [Full report](results/measure-v2-string/REPORT.md) · [How it's measured](docs/MEASURE-v2.md) · [Every row](results/measure-v2-string/rows.jsonl)

## Results

The agent score is the headline: the share of core tasks where every answer field was right. Intervals are 95% from 10,000 paired bootstrap draws that resample whole sites. A provider is in the top tier when its gap to the leader could be chance. "Answer in response" checks the provider's own output with no model involved, so it's an upper bound. Cost per finished task is all provider and model spend divided by tasks passed.

### Scrape, 40 core tasks from 37 sites

| Provider | Agent score | 95% interval | Answer in response | Page coverage | Cost per finished task | Tier |
|---|---:|---|---:|---:|---:|---|
| Context.dev | 38/40 (95.0%) | 85.0% to 100.0% | 38/40 | 98.5% | 1.36¢ | top |
| Spider | 37/40 (92.5%) | 81.0% to 100.0% | 38/40 | 99.3% | 0.88¢ | top |
| Scrapfly | 36/40 (90.0%) | 78.6% to 100.0% | 36/40 | 93.4% | 1.17¢ | top |
| String | 35/40 (87.5%) | 75.6% to 97.4% | 38/40 | 98.2% | 1.33¢ | top |
| Linkup | 34/40 (85.0%) | 71.4% to 95.7% | 37/40 | 99.6% | 1.23¢ | below |
| Firecrawl | 32/40 (80.0%) | 65.8% to 92.3% | 36/40 | 97.8% | 1.67¢ | below |
| TinyFish | 31/40 (77.5%) | 61.0% to 92.1% | 31/40 | 92.3% | 0.71¢ | below |
| Browserbase | 30/40 (75.0%) | 59.5% to 89.2% | 30/40 | 82.0% | 1.93¢ | below |
| You.com | 29/40 (72.5%) | 56.1% to 89.2% | 31/40 | 84.9% | 1.00¢ | below |
| Jina Reader | 6/40 (15.0%) | 5.1% to 25.6% | 18/40 | 72.8% | 4.26¢ | below |

Model alone, no tool: 0/40. Correct page given: 38/38.

### Search, 30 core tasks from 18 sites

| Provider | Agent score | 95% interval | Answer in response | Cost per finished task | Tier |
|---|---:|---|---:|---:|---|
| Linkup | 28/30 (93.3%) | 85.3% to 100.0% | 23/27 | 2.19¢ | top |
| TinyFish | 26/30 (86.7%) | 70.0% to 100.0% | 25/27 | 0.97¢ | top |
| Firecrawl | 26/30 (86.7%) | 71.4% to 97.1% | 22/27 | 2.91¢ | top |
| Context.dev | 25/30 (83.3%) | 62.5% to 100.0% | 23/27 | 1.39¢ | top |
| String | 23/30 (76.7%) | 55.9% to 96.2% | 19/27 | 1.32¢ | below |
| You.com | 21/30 (70.0%) | 50.0% to 86.7% | 16/27 | 2.64¢ | below |
| Browserbase | 21/30 (70.0%) | 50.0% to 86.7% | 11/27 | 2.79¢ | below |

Model alone, no tool: 5/30.

### Map, 15 core tasks from 15 sites

| Provider | Agent score | 95% interval | Answer in response | Cost per finished task | Tier |
|---|---:|---|---:|---:|---|
| String | 14/15 (93.3%) | 80.0% to 100.0% | 14/15 | 0.98¢ | top |
| Firecrawl | 13/15 (86.7%) | 66.7% to 100.0% | 13/15 | 1.32¢ | top |
| Context.dev | 12/15 (80.0%) | 60.0% to 100.0% | 12/15 | 0.98¢ | top |

Model alone, no tool: 0/15.

### Crawl, 12 core tasks from 12 sites

| Provider | Agent score | 95% interval | Answer in response | Cost per finished task | Tier |
|---|---:|---|---:|---:|---|
| Scrapfly | 12/12 (100.0%) | 100.0% to 100.0% | 12/12 | 3.49¢ | top |
| Firecrawl | 12/12 (100.0%) | 100.0% to 100.0% | 12/12 | 8.29¢ | top |
| Context.dev | 11/12 (91.7%) | 75.0% to 100.0% | 11/12 | 5.86¢ | top |

Model alone, no tool: 0/12.

Spider ran scrape only. Map and crawl only include providers with a native endpoint for that job. Not tested in v2: Exa, Tavily, Bright Data, Perplexity and Parallel. Jina's search was left out because it has no hard cap on tokens per call.

## String

[String](https://usestring.ai/) was added after the campaign. It ran on 2026-10-24, five days after the other providers, on the same frozen tasks and harness, and was measured in the same build as everyone else. No other provider was called again, and no other provider's number changed. String has no endpoint that returns page content across a site, so it isn't in crawl.

On scrape, String's own output held the answer on 38 of 40 tasks; the agent finished 35. The three tasks in between:

- `pydantic-settings`: the frozen key is 2.16.0, but 2.16.1 shipped on 2026-10-20. String returned the live page and the agent answered 2.16.1. Counted against the live key, String scores 36/40.
- Typer's contributing page and Context.dev's "Retrieve a batch" page: String's Markdown puts the HTML `<title>` as a `# ` heading above the page's real H1, and the agent answered with the title.

[results/measure-v2-string/drift.json](results/measure-v2-string/drift.json) re-checks every key String missed against its live source. The frozen-key scores above are the headline. [results/measure-v2-string/reconciliation.json](results/measure-v2-string/reconciliation.json) matches String's spend ($0.4341) and request counts to its dashboard.

## What's here

| Path | What it holds |
|---|---|
| `src/` | The harness: tasks, provider adapters (`src/adapters/`), agent, runner and grader |
| `measure/` | The MEASURE-v2 pipeline: answer-in-response check, agent replay, page coverage, statistics |
| `results/campaign-v2/` | The frozen v2 tasks, core sets, run configs and campaign logs |
| `results/wb-v2-*/` | One folder per run: `calls.jsonl` (every provider and model call, with response hashes), `results.jsonl`, `manifest.json`, `summary.json` |
| `results/measure-v2-string/` | The measured build with String: `summary.json`, `rows.jsonl`, `REPORT.md`, `drift.json`, `reconciliation.json` |
| `measure/out/` | The same build for the nine original providers, before String joined |
| `site/` | The results site |

Stored provider responses and the model replay cache aren't in this repository. They hold full copies of third-party pages, so they stay private. `calls.jsonl` records each response's SHA-256, so the rows can be tied to them. Without them, `npm run measure` can't be rerun from this tree; everything it produced is here.

## Run it

You need Node 24, keys for the providers you want to test (see [.env.example](.env.example)), and an OpenAI-compatible `/v1/chat/completions` endpoint that serves `claude-haiku-5-5` (the client defaults to `http://127.0.0.1:8317` and reads its key from `ANTHROPIC_AUTH_TOKEN`).

```sh
npm ci
npm test
node --experimental-strip-types scripts/v2-string.mjs scrape core   # one provider on the frozen scrape core
WEB_BENCH_RESULTS_ROOT=<results dir> npm run measure              # needs the stored responses
```

## Earlier editions

- [Corrected v2 analysis](results/wb-v2-corrected/RESULTS.md) and [original preregistered v2 scores](results/wb-v2-final/RESULTS.md), both from before the MEASURE-v2 rebuild. They cut each tool response at 12,000 bytes, which [docs/MEASURE-v2.md](docs/MEASURE-v2.md) explains and replaces.
- [v1](results/wb-20261017-final/RESULTS.md), a smaller run on different tasks. It can't be compared with v2.

## License

[MIT](LICENSE). Tasks, grader, harness and result rows are free to reuse.
