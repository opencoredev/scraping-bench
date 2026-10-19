<p align="center">
  <a href="https://x.com/leodev"><img alt="Follow @leodev on X" src="https://shieldcn.dev/x/follow/leodev.svg?variant=branded&mode=dark" /></a>
</p>

scraping-bench grades eight web data APIs on whether an AI agent actually got the job done with them: Context.dev, Firecrawl, TinyFish, Linkup, Jina, Spider, Scrapfly and Browserbase. There are four tracks: scrape, search, map and crawl. Every provider gets the same tasks, the same model (Claude Haiku 5.5), the same prompt and the same limits. Only the API behind the tool changes. A task counts only when a script confirms every field of the answer against a key we can show is correct.

[See the results](https://www.scrapingbench.com) · [How it was graded](docs/METHODOLOGY.md) · [Every number](results/wb-20261017-final/RESULTS.md)

## Results

Tasks done, with the cost of each finished task (API and model spend, failures included, divided by tasks done):

| Search, 60 tasks | Done | Cost per task |
|---|---:|---:|
| Firecrawl | 85% | 3.04¢ |
| Linkup | 83% | 2.55¢ |
| Context.dev | 75% | 1.82¢ |
| TinyFish | 73% | 1.31¢ |
| Browserbase | 38% | 5.97¢ |

| Scrape, 60 tasks | Done | Cost per task |
|---|---:|---:|
| Context.dev | 92% | 0.72¢ |
| Firecrawl | 90% | 1.22¢ |
| Linkup | 90% | 0.60¢ |
| TinyFish | 90% | 0.43¢ |
| Scrapfly | 88% | 0.61¢ |
| Jina | 87% | 0.57¢ |
| Browserbase | 82% | 1.12¢ |
| Spider | 20% | 2.48¢ |

| Map, 15 tasks | Done | Cost per task |
|---|---:|---:|
| Context.dev | 47% | 1.84¢ |
| Firecrawl | 40% | 3.35¢ |

| Crawl, 10 tasks | Done | Cost per task |
|---|---:|---:|
| Scrapfly | 70% | 2.88¢ |
| Context.dev | 60% | 7.58¢ |
| Firecrawl | 50% | 14.2¢ |

Most of these gaps are too small to call. Tasks from the same site are counted as one group, and the 95% intervals come from resampling sites, so only one gap clears chance: on search, Browserbase finished 47 points fewer tasks than Firecrawl. Spider's low scrape score is because it refused our test site's workers.dev domain; it scraped all 10 PyPI pages correctly.

The model alone, with no tool, passed 23% of search tasks and none of the others. Given the correct page directly, it passed all 60 scrape tasks, so a scrape miss is the API's, not the grader's.

Exa, Tavily, Bright Data and Perplexity were not tested. Parallel was tested on search, but its customer terms require written consent to publish benchmark results, so its results are left out. Everything ran on free plans from one server, so rate limits show up in time and errors. The full list of caveats is in [FINDINGS.md](docs/FINDINGS.md).

## Run it

You need Node 24, keys for the providers you want to test, and an OpenAI-compatible `/v1/chat/completions` endpoint that serves `claude-haiku-5-5` (the client defaults to `http://127.0.0.1:8317`). [.env.example](.env.example) lists the variables.

```sh
cp .env.example .env
npm ci
set -a; . ./.env; set +a
npm test
npm run tasks:verify
npm run bench -- --tasks tasks/search.json --providers firecrawl,linkup --client my-laptop
```

`npm run tasks:verify` fetches every real-web answer key again and fails on any drift, so run it right before a benchmark. [HARNESS.md](docs/HARNESS.md) covers every flag, budgets and resuming.

## License

[MIT](LICENSE). Tasks, grader, harness and every result row are free to reuse.

<p align="center"><sub>Built by <a href="https://x.com/leodev">@leodev</a></sub></p>
