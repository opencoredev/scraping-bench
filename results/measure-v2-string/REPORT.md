# v2, re-measured

Every number below comes from the stored v2 provider responses under docs/MEASURE-v2.md. No provider was called again.

## Build gates

| Gate | Result | Detail |
|---|---|---|
| Correct-page control at least 97% on core scrape | PASS | 38/38 (2 pages without usable reference text) |
| Every core scrape key is in its own correct-page text | PASS | 38 checked |
| No provider or other non-proxy network attempt | PASS | 0 blocked, 73 model-proxy calls |

Reference pages: 294 usable, 4 changed since the run, 0 unavailable.

## scrape

40 core tasks from 37 sites. Agent = Haiku finished the task reading the full responses. Retrieval = the answer was in what the provider returned to the agent: every successful response in the task, after dropping repeats.

| Provider | Tier | Agent | Retrieval | Gap to leader | Cost / finished task | Median time |
|---|---|---|---|---|---|---|
| contextdev | top | 38/40 95% (85–100) | 38/40 95% (85–100) | leader | 1.36¢ | 4.6 s |
| spider | top | 37/40 93% (81–100) | 38/40 95% (85–100) | -2 (-8–0) | 0.88¢ | 5.7 s |
| scrapfly | top | 36/40 90% (79–100) | 36/40 90% (79–100) | -5 (-12–0) | 1.17¢ | 6.0 s |
| string | top | 35/40 88% (76–97) | 38/40 95% (85–100) | -7 (-16–0) | 1.33¢ | 3.9 s |
| linkup | below | 34/40 85% (71–96) | 37/40 93% (81–100) | -10 (-21–-2) resolved | 1.23¢ | 4.0 s |
| firecrawl | below | 32/40 80% (66–92) | 36/40 90% (78–100) | -15 (-27–-5) resolved | 1.67¢ | 4.8 s |
| tinyfish | below | 31/40 78% (61–92) | 31/40 78% (61–92) | -17 (-33–-5) resolved | 0.71¢ | 4.6 s |
| browserbase | below | 30/40 75% (60–89) | 30/40 75% (60–89) | -20 (-34–-8) resolved | 1.93¢ | 3.6 s |
| you | below | 29/40 73% (56–89) | 31/40 78% (61–95) | -22 (-38–-8) resolved | 1.00¢ | 3.6 s |
| jina | below | 6/40 15% (5–26) | 18/40 45% (31–61) | -80 (-92–-67) resolved | 4.26¢ | 5.4 s |

Controls: model alone 0/40 0% (0–0); correct page given 38/38 100% (100–100).

| Provider | Page coverage | Median response | Median noise ratio | Answer past 12 KB |
|---|---|---|---|---|
| firecrawl | 98% (95–100) over 34 pages | 9.3 KB | 1.5× | 0 |
| contextdev | 99% (96–100) over 34 pages | 14.8 KB | 2.6× | 2 |
| tinyfish | 92% (83–99) over 34 pages | 5.8 KB | 1.1× | 0 |
| spider | 99% (98–100) over 34 pages | 6.8 KB | 1.4× | 0 |
| linkup | 100% (99–100) over 34 pages | 11.5 KB | 2.1× | 2 |
| scrapfly | 93% (85–100) over 34 pages | 14.4 KB | 2.6× | 0 |
| browserbase | 82% (68–94) over 34 pages | 13.5 KB | 2.5× | 2 |
| you | 85% (75–93) over 34 pages | 6.6 KB | 1.1× | 0 |
| jina | 73% (58–86) over 34 pages | 5.1 KB | 1.2× | 0 |
| string | 98% (95–100) over 34 pages | 14.3 KB | 2.4× | 1 |

| Provider | Parse failures | Old strict parser failures | Reading limit hits | Pages read | Arg mismatches | Agent pass, retrieval fail |
|---|---|---|---|---|---|---|
| firecrawl | 0 | 2 | 0 | 41 | 1 | none |
| contextdev | 0 | 2 | 0 | 41 | 1 | none |
| tinyfish | 0 | 1 | 0 | 40 | 1 | none |
| spider | 0 | 0 | 0 | 42 | 1 | none |
| linkup | 0 | 0 | 0 | 40 | 1 | none |
| scrapfly | 0 | 1 | 0 | 42 | 1 | none |
| browserbase | 0 | 1 | 0 | 47 | 1 | none |
| you | 0 | 0 | 0 | 41 | 1 | none |
| jina | 0 | 7 | 0 | 49 | 1 | none |
| string | 0 | 0 | 0 | 43 | 1 | none |

Full sets, descriptive only:

| Provider | Tasks | Retrieval | Page coverage |
|---|---|---|---|
| contextdev | 298 | 294/298 99% (96–100) | 99% |
| linkup | 298 | 284/298 95% (91–99) | 99% |
| you | 298 | 258/298 87% (76–95) | 90% |

## search

30 core tasks from 18 sites. Agent = Haiku finished the task reading the full responses. Retrieval = the answer was in what the provider returned to the agent: every successful response in the task, after dropping repeats.

| Provider | Tier | Agent | Retrieval | Gap to leader | Cost / finished task | Median time |
|---|---|---|---|---|---|---|
| linkup | top | 28/30 93% (85–100) | 23/27 85% (68–100) | leader | 2.19¢ | 6.2 s |
| firecrawl | top | 26/30 87% (71–97) | 22/27 81% (65–100) | -7 (-23–6) | 2.91¢ | 6.9 s |
| tinyfish | top | 26/30 87% (70–100) | 25/27 93% (84–100) | -7 (-21–6) | 0.97¢ | 8.2 s |
| contextdev | top | 25/30 83% (63–100) | 23/27 85% (68–100) | -10 (-27–4) | 1.39¢ | 8.4 s |
| string | below | 23/30 77% (56–96) | 19/27 70% (51–92) | -17 (-31–-4) resolved | 1.32¢ | 6.8 s |
| browserbase | below | 21/30 70% (50–87) | 11/27 41% (23–67) | -23 (-43–-6) resolved | 2.79¢ | 15.4 s |
| you | below | 21/30 70% (50–87) | 16/27 59% (36–84) | -23 (-46–-6) resolved | 2.64¢ | 4.8 s |

Controls: model alone 5/30 17% (0–38).

| Provider | Parse failures | Old strict parser failures | Reading limit hits | Pages read | Arg mismatches | Agent pass, retrieval fail |
|---|---|---|---|---|---|---|
| firecrawl | 0 | 0 | 0 | 46 | 26 | search-fresh-neovim-neovim, search-revenue-0000078003, search-revenue-0000051143, search-crates-rusqlite |
| contextdev | 0 | 2 | 0 | 48 | 26 | search-crates-rusqlite |
| tinyfish | 0 | 1 | 0 | 51 | 30 | search-crates-rusqlite |
| linkup | 0 | 0 | 0 | 38 | 21 | search-fresh-oven-sh-bun, search-crates-rayon, search-crates-rusqlite |
| browserbase | 0 | 4 | 0 | 64 | 44 | search-founding-Q9396, search-pypi-pydantic, search-crates-bytes, search-pypi-typer, search-fresh-oven-sh-bun, search-go-go-uber-org-zap, search-crates-rayon, search-pypi-attrs, search-crates-rusqlite |
| you | 0 | 1 | 0 | 42 | 28 | search-revenue-0001341439, search-fresh-neovim-neovim, search-revenue-0000078003, search-pypi-typer, search-crates-rayon, search-crates-rusqlite |
| string | 0 | 2 | 0 | 45 | 23 | search-crates-bytes, search-revenue-0000078003 |

Full sets, descriptive only:

| Provider | Tasks | Retrieval | Page coverage |
|---|---|---|---|
| contextdev | 298 | 235/277 85% (78–91) | n/a |
| tinyfish | 298 | 225/277 81% (75–88) | n/a |
| linkup | 298 | 248/277 90% (83–95) | n/a |
| you | 298 | 216/277 78% (70–86) | n/a |

## map

15 core tasks from 15 sites. Agent = Haiku finished the task reading the full responses. Retrieval = the answer was in what the provider returned to the agent: every successful response in the task, after dropping repeats.

| Provider | Tier | Agent | Retrieval | Gap to leader | Cost / finished task | Median time |
|---|---|---|---|---|---|---|
| string | top | 14/15 93% (80–100) | 14/15 93% (80–100) | leader | 0.98¢ | 8.4 s |
| firecrawl | top | 13/15 87% (67–100) | 13/15 87% (67–100) | -7 (-27–13) | 1.32¢ | 11.3 s |
| contextdev | top | 12/15 80% (60–100) | 12/15 80% (60–100) | -13 (-40–13) | 0.98¢ | 6.4 s |

Controls: model alone 0/15 0% (0–0).

| Provider | Parse failures | Old strict parser failures | Reading limit hits | Pages read | Arg mismatches | Agent pass, retrieval fail |
|---|---|---|---|---|---|---|
| firecrawl | 0 | 0 | 0 | 19 | 0 | none |
| contextdev | 0 | 0 | 0 | 20 | 0 | none |
| string | 0 | 1 | 0 | 18 | 0 | none |

Full sets, descriptive only:

| Provider | Tasks | Retrieval | Page coverage |
|---|---|---|---|
| contextdev | 60 | 43/60 72% (46–95) | n/a |
| string | 60 | 54/60 90% (73–100) | n/a |

## crawl

12 core tasks from 12 sites. Agent = Haiku finished the task reading the full responses. Retrieval = the answer was in what the provider returned to the agent: every successful response in the task, after dropping repeats.

| Provider | Tier | Agent | Retrieval | Gap to leader | Cost / finished task | Median time |
|---|---|---|---|---|---|---|
| firecrawl | top | 12/12 100% (100–100) | 12/12 100% (100–100) | 0 (0–0) | 8.29¢ | 27.1 s |
| scrapfly | top | 12/12 100% (100–100) | 12/12 100% (100–100) | leader | 3.49¢ | 15.2 s |
| contextdev | top | 11/12 92% (75–100) | 11/12 92% (75–100) | -8 (-25–0) | 5.86¢ | 22.6 s |

Controls: model alone 0/12 0% (0–0).

| Provider | Expected pages | Returned with title | Returned, no title | Exact title | Page-specific part matches |
|---|---|---|---|---|---|
| firecrawl | 91 | 91 | 0 | 91 | 91 |
| contextdev | 91 | 90 | 0 | 42 | 90 |
| scrapfly | 91 | 91 | 0 | 91 | 91 |

| Provider | Parse failures | Old strict parser failures | Reading limit hits | Pages read | Arg mismatches | Agent pass, retrieval fail |
|---|---|---|---|---|---|---|
| firecrawl | 0 | 1 | 0 | 16 | 0 | none |
| contextdev | 0 | 2 | 0 | 15 | 0 | none |
| scrapfly | 0 | 0 | 0 | 18 | 0 | none |

Full sets, descriptive only:

| Provider | Tasks | Retrieval | Page coverage |
|---|---|---|---|
| contextdev | 40 | 36/40 90% (70–100) | n/a |

