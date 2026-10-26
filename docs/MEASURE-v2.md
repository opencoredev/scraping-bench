# How v2 is measured

Status: frozen rules for re-measuring the v2 campaign, 2026-10-20. Tracked in SCB-7.

The v2 campaign's provider calls are finished and won't be repeated. Every provider response from that run is stored in full under `results/raw-private/`. This document defines one pipeline, `measure/`, that turns those stored responses into every published number. No provider is called again. The only new calls are Claude Haiku 5.5 calls through the local model proxy.

These rules were written before any number in this document's pipeline was computed. They apply to every provider the same way.

## Why the first v2 numbers were wrong

- The agent saw only the first 12,000 bytes of each tool response, JSON-escaped, and couldn't read further. Rankings then depended on how much navigation a provider put before the content. Context.dev's responses were cut on 26 of 40 core scrape tasks, Spider's on 13.
- Crawl was decided by whether titles matched the HTML `<title>` byte for byte after normalization.
- The answer parser failed any reply with text around the JSON.
- Scrape only checked one heading per page and said nothing about how much of the page came through.
- The numbers came from a chain of one-off scripts and a later correction pass, not from one build.

## Inputs

All inputs are read-only, and each is checked against its recorded SHA-256 before use.

- Tasks: `results/wb-v2-corrected/tasks/{search,scrape,map,crawl}.json`. These are the frozen v2 tasks with the 25 cleaned heading keys.
- Core IDs: `results/campaign-v2/core-{track}.json`.
- Post-run exclusions: `results/campaign-v2/*-exclusions.json`.
- Provider runs: the run IDs in `results/campaign-v2/selected-runs.json`. For each, `calls.jsonl` gives every provider and model event, its `privatePath` and its `responseHash`.
- Stored oracle outcomes in `wb-v2-controls-scrape-oracle-v1`, one per scrape page. For 296 pages they hold only the page's HTML title and first H1. For the 4 JavaScript fixture pages they hold the rendered body text.
- Reference page text, fetched once by this pipeline. It's a plain HTTP GET from this server of each of the 296 non-fixture scrape URLs, at most one request per second per host, respecting robots.txt. It isn't a provider call. The text is extracted from the `main` element, or the body if there's no `main`, with `script`, `style`, `nav`, `header`, `footer` and `aside` removed. Each fetch is stored with its time and hash under `results/raw-private/measure-v2/reference/` and is never repeated. A page's reference text is used only if its HTML title and first H1 still match the stored oracle outcome. Otherwise the page changed after the run and is left out of coverage and noise. The 4 fixture pages use their stored rendered text.
- Model-alone control: `wb-v2-controls-*-none-v1`, used as is, because with no tool the cut never applied.

A hash mismatch, a missing stored response, or a core task without a row stops the build.

## Three measurements

Each (task, provider) pair gets three things.

### 1. Retrieval: was the answer in the response?

Graded on the complete stored response of the agent's first provider call, with no model involved. The first call is the first `kind: "provider"` event for the task in `calls.jsonl` file order. `provider-reuse` events are never counted as calls. It measures the API alone.

- `text`: the normalized key appears in the normalized response at token boundaries.
- `version`: a version token in the response normalizes to the key.
- `number`: a number in the response is within the key's tolerance.
- `date`: a date in the response normalizes to the key.
- `url-set` (map and crawl): the canonical returned URLs inside the task's scope meet its `minRecall` and `minPrecision`. Only in-scope URLs count, because the map and crawl adapters were given a site, not a scope, and the agent is asked to filter the same way.
- `url-set` (search): at least one gold URL is among the returned hits.
- `text-set` (crawl titles): not part of retrieval. Titles are reported under crawl.
- `none` (search no-answer tasks): not applicable.

A task passes retrieval when every applicable field passes. Presence can't prove the answer was in the right place, for example the heading as opposed to a menu link. So retrieval is an upper bound, and the agent score is the headline.

### 2. Agent: did Haiku finish the task when it could read everything?

This is a model-only replay, the headline score.

- **Same calls.** The replay keeps the provider calls the agent made in the original run: every `kind: "provider"` event, in file order, with its original arguments. Each call's stored response is its tool result. No other provider call is possible: when the stored calls run out, the provider tool is no longer offered.
- **Repeats.** A call whose normalized arguments match an earlier call in the same task, where that earlier call succeeded, is left out of the replay and its cost isn't counted, because the agent can already read the whole earlier response. A repeat after an error is a retry, so it stays in, with its cost.
- **When the agent asks for a call.** When the agent requests a provider call, the next stored call is served, whatever arguments the agent wrote. The arguments it wrote are recorded, and how often they differ from the stored ones is reported per provider.
- **Readable text.** Each response is rendered as plain text, not JSON:
  - scrape: `URL: <finalUrl>` and then the Markdown or text.
  - search: one numbered block per hit, with title, URL, published date if any, and snippet. Empty or null fields are left out. No stored search hit has page content.
  - map: one URL per line.
  - crawl: first a manifest of `URL | native title` lines, then each page as `=== page N: URL ===` followed by its body.
  - errors: `Provider error: <class>: <message>`.
- **Pages, not a cut.** The rendered text is split into pages of 32,000 UTF-8 bytes, never splitting a character. The first page arrives with a header, for example `[call 1, page 1 of 4, 118,402 bytes]`. A `read_more` tool with `call` and `page` returns any other page of any stored call.
- **Reading budget.** The agent may receive at most 256,000 bytes of tool text per task. When a page would go over it, the tool returns `Reading limit reached` and the agent must answer.
- **Model settings.** Claude Haiku 5.5, temperature 0, 4,096 output tokens, at most 12 model turns per task. The system prompt is the original one plus one sentence: "Long tool results arrive in pages; call read_more to see other pages."
- **Answer parsing.** Strip one surrounding code fence. Then find every top-level JSON object in the reply. The answer is the single object whose keys are exactly the requested field names. No such object, or more than one, is a parse failure. The old strict parser's result is recorded as a diagnostic.
- **Grading.** Fields are graded with the rules under Normalization below. For crawl, the headline grades only the `urls` field. Titles are reported separately.
- **Network guard.** The replay process allows only the model proxy endpoint and records every network attempt. A provider endpoint attempt stops the build.
- **Cache.** Model requests and responses are cached under `results/raw-private/measure-v2/`, keyed by the SHA-256 of the request. A rerun reuses the cache and makes no calls.

The correct-page control is replayed in the same way, with the correct-page text described under Build gates as the only tool response.

### 3. Efficiency and content, from the stored responses

- **Bytes returned:** UTF-8 bytes of the rendered response.
- **Bytes before the answer (scrape):** offset of the key's first normalized match in the rendered text, or none.
- **Content coverage (scrape):** how much of the page's real text came through. Built from the reference page text:
  1. Split into sentences at `.`, `!` or `?` followed by whitespace, and at line breaks.
  2. Keep sentences of at least eight words.
  3. Drop any sentence that also appears in the reference text of two or more other pages from the same site, to remove boilerplate.
  4. Split the remaining sentences, in page order, into eight equal spans. In each span, SHA-256 of `taskId:span` picks the sentence: its first 32 bits, read as an unsigned integer, modulo the span's length, give the index.
  5. A page with fewer than eight eligible sentences uses all of them. A page with none is left out of coverage.
  6. A sentence is present when its normalized form is a substring of the normalized response, with Markdown link and emphasis syntax removed.
  7. Coverage is the share present, averaged per page and then across pages.
- **Noise ratio (scrape):** rendered response bytes divided by reference text bytes.
- **Crawl title fidelity:** native titles come from the `HTML document title:` line the adapters put before a page body. A page without that line has no native title. It's counted as "no title returned", and the denominator is shown. For each expected URL the provider returned with a native title, the check is whether that title equals the expected title after normalization (exact). Also whether the expected title's first segment appears in it (loose), where segments are split on ` | `, ` - ` and ` — `.
- **Cost per task:** the original billed provider cost of the replayed calls, plus the replay's model tokens at Haiku list price ($1 per million input, $5 per million output, cached input as billed by the proxy's reported usage).
- **Time:** the original provider call time plus the replay's model time. It's labelled as replay time.

## Normalization

Every comparison uses the same function, applied to the key and to the candidate:

- NFKC.
- Remove Unicode format (Cf) and private-use (Co) characters.
- Remove Markdown escapes such as `\_`.
- Lowercase.
- Turn punctuation and symbols into spaces.
- Collapse whitespace.
- Trim.

Types are parsed as follows:

- Versions: an optional `v` prefix, up to three numeric parts with missing parts as 0, and pre-release kept.
- Numbers: unit, currency and scale words parsed, and compared within the task tolerance.
- Dates: parsed to `YYYY-MM-DD`.
- URLs: lowercase scheme and host, default port removed, fragment and trailing slash removed, query kept.

## Revisions after the first diagnostic pass

The first full run listed many rows where the agent passed while retrieval failed. The rules say such rows point at a grader that's too strict, so they were reviewed. Three causes were found, and retrieval was changed for every provider the same way. The agent replay and its scores did not change.

- **Search:** the agent often ran two or three searches, and the answer came back in a later one. Retrieval now grades everything the provider returned to the agent in the task, after dropping repeats under the rule above, not only the first call.
- **Map and crawl:** providers often leave out the scope root, which is the tool's own input. The agent adds it back because the task asks for it. Retrieval now counts the scope root as found.
- **Map and crawl:** URLs with a query string, and files that aren't HTML pages, are removed before grading. Examples are `.md` copies, images and feeds. The task tells the agent to leave these out, and it does. A `#fragment` link still points at its page, so the fragment is stripped and the page counts.

Search tasks that also ask for an install command can still pass in the agent replay and fail retrieval, because the command is often not written in the results and the model writes it from the package name.

## Statistics

- **Headline:** the agent score on core tasks, after exclusions. Every provider in a track has identical core IDs.
- **Uncertainty:** a 95% interval from 10,000 paired, site-clustered bootstrap draws, seed 19019. The paired gap to the observed leader is resolved only when its interval excludes zero.
- **Tiers:** providers whose gap to the leader isn't resolved share the top tier.
- **Retrieval and coverage:** reported with the same intervals.
- **Full sets:** shown descriptively for the providers that ran them, with retrieval and content metrics only and no agent replay.

## Build gates

The build fails, and publishes nothing, if any of these happen:

- A hash mismatch, a missing response, or a core task without a stored first call.
- The correct-page control's agent score is below 97% on retained core scrape tasks: 40 core IDs minus exclusions, failing when the score is below 0.97. The control's tool response is the stored oracle title and H1 lines followed by the reference page text, or the stored rendered text for fixtures.
- A retained scrape key doesn't pass retrieval against its own oracle text. That means a key fault.
- A provider endpoint network attempt during replay.

These are reported but don't fail the build:

- Rows where the agent passes and retrieval fails. They're listed for review, because they point at a grader that's too strict.
- How often the agent hits the reading limit, by provider.
- Parse failures, by provider.

## Known limits

These can't be fixed without new provider calls, and they're stated on the site:

- Reference page text was fetched on 2026-10-20, one day after the run. Pages that changed are left out of coverage.
- Most scrape tasks ask for a docs heading. Content coverage is the broader extraction measure.
- Every provider ran on default settings. Some defaults strip navigation and some don't. Now that the agent can read every page, noise costs tokens and time instead of failing the task.
- Cores are small: 40 scrape, 30 search, 15 map and 12 crawl tasks.
- The replay keeps the original agent's provider calls, which it chose after seeing cut-off output.
- One server, free plans, one agent model.

## Outputs

`npm run measure` runs every stage and writes:

- `measure/out/summary.json`: every metric, interval and gate result.
- `measure/out/REPORT.md`: the readable report.
- `site/src/data/results.json`: the site's data.

Rerunning with a warm cache gives byte-identical output.
