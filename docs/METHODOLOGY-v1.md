# How web-bench grades

Every task is pass or fail, and a script decides it. Claude Haiku 5.5 only does the task; no model grades anything.

## One task

1. The model gets the task, one tool and the same prompt for every provider. The tool is `search(query)`, `scrape(url)`, `map(site)` or `crawl(site, scope)`, and the provider behind it is the only thing that changes.
2. It may call the tool a fixed number of times, within a time and dollar limit per task: search 3 calls, 60 s, $0.10; scrape 2 calls, 60 s, $0.10; map 2 calls, 2 min, $0.25; crawl 1 call, 10 min, $2.
3. It answers in JSON with the named fields the task asks for.
4. A script compares each field with the answer key. The task passes only if every field matches, the run stayed inside its limits and nothing errored.

## What counts as a match

Formatting is forgiven; values are not. The rules are in [`src/grade/index.ts`](../src/grade/index.ts), with tests beside it.

| Field | Rule |
|---|---|
| Text | Case, punctuation and spacing are ignored; the words must equal an accepted answer |
| Number | `$168.28` and `168.28 USD` parse the same; must fall within the key's tolerance |
| Version | `v0.143.3` equals `0.143.3` |
| Date | `Oct 17, 2026` equals `2026-10-17` |
| Missing answer | Some pages leave the answer out on purpose; the right reply is null or empty |
| URL list (map) | URLs are normalised (`www.`, trailing slash, tracking parameters). Our test site needs every page and nothing extra; real docs sites need 90% recall and 90% precision |
| Records (crawl) | Every record present, nothing extra |

## Where the answer keys come from

- **Our test site.** Most scrape, map and crawl tasks run on a site generated for this run, at a fresh path nobody could have indexed. The key is the data the site was built from. Before the run a script fetched every scrape page and confirmed each answer is on it, that answers meant to need JavaScript are absent from the plain HTML, and that pages meant to have no answer have none. See [FIXTURES.md](FIXTURES.md).
- **The real web.** Search keys come from PyPI, npm, crates.io, GitHub releases, Wikidata and SEC filings. Real docs scopes come from each site's own sitemap and pages. Every key records its source and fetch time. See [TASKS.md](TASKS.md).

## How we know the keys are right

- Before the run, every real-web key was fetched again and compared exactly: 287 of 288 matched, and the one that drifted was dropped.
- With the correct page handed to it, the model passed 60 of 60 scrape tasks, so the keys agree with the pages and the grader accepts right answers as models write them.
- After the run, [`scripts/recheck-final-keys.ts`](../scripts/recheck-final-keys.ts) fetched all 80 real-web keys again. None had changed during the run.
- Every failed answer in the final run was read by hand. Nearly all are a provider returning an older release than the source had.

Five of the 60 search tasks have two defensible answers: three founding years where Wikidata differs from the year most sources give (Lonely Planet, WWE, Airbus), and two release dates just after midnight UTC, which providers gave as the US date. They stay as frozen. Dropping them, or accepting both answers, moves Firecrawl from 85% to 92% at most and changes no provider's place.

## Controls

- **Model alone**: no tool. Shows what the model already knows.
- **Correct page given**: the right page, fetched independently, is handed to the model. The ceiling for scrape.

## Numbers

- **Tasks done**: the share of tasks that passed.
- **Cost per finished task**: all API and model spend, failures included, divided by tasks done. Model cost is a list-price estimate.
- **Time**: the median over tasks that passed.
- **Raw output**: no model. Does the API's own output contain every answer?

## When a gap counts

Tasks from the same site are not independent, so each provider is compared with its track's leader on the same tasks, with a 95% interval from a bootstrap that resamples whole sites 10,000 times. A gap counts only when its interval excludes zero. One does: on search, Browserbase finished 47 points fewer tasks than Firecrawl. Everything else could be chance on this many sites.

## What was left out

Exa, Tavily, Bright Data and Perplexity were not tested. Parallel was tested on search, but its customer terms require written consent to publish benchmark results, so its results are withheld from this repo and the site.

## Limits

One client location. Free plans, so rate limits show up in time and errors. Scrape has only two site clusters. The model and its settings are part of what is measured, so these are not pure vendor scores. The full list is in [FINDINGS.md](FINDINGS.md).
