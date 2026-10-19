# Run the harness

Use Node 24 or later. Install the pinned dependencies with `npm ci`. Set `ANTHROPIC_AUTH_TOKEN` in your shell to the local model proxy credential, without putting it in a command history or tracked file.

```sh
npm run typecheck
npm test
npm run bench -- --tasks tasks/harness/fake.json --providers fake \
  --lane default --mode both --client ms-a2 --sample 4 --seed 17 \
  --concurrency 4 --run-id harness-example
```

This runs four local fake tasks through agent and raw modes. Agent mode makes real proxy requests. Raw mode makes no model requests. Run the same command again to resume: the eight completed `(task, provider, lane, mode)` rows are skipped. Change `--run-id` when changing tasks, seed, lane, mode, client, provider configuration, prompts, model prices, or adapter versions. The manifest rejects incompatible resumes. A dead process's PID lock is reclaimed; a live run cannot share its output directory. Incomplete trailing JSONL records are discarded on resume; malformed committed records are errors.

`--tasks` accepts comma-separated JSON files containing arrays of the shared `Task` type. `--providers` accepts comma-separated registered provider IDs plus `fake`, `none`, and `oracle`. The task sample and provider order for each task are seeded. `--mode` accepts `agent`, `raw`, or `both`; the default is `both`. Lane defaults to `default`, client to `local`, concurrency to 4, and seed to 1. Without a run ID the CLI creates one from the UTC timestamp.

`none` gives the model no tool. Its raw mode is n/a. `oracle` only applies to scrape tasks. It returns a plain fetch body, or the text file passed with `--oracle-text-file`. Supply independently verified evidence to use it as a ceiling; plain fetch alone does not render JavaScript or promise perfect extraction. Oracle tasks in other tracks are n/a.

## Add provider adapters

Provider adapters implement `src/core/types.ts` and are registered in `src/adapters/index.ts`; `src/run/registry.ts` imports that registry. See [adapter smoke results](../providers/RESULTS.md) and [budget](../providers/BUDGET.md) before paid runs. The programmatic `runBenchmark` entry point also accepts `adapterList`. Fake adapters use an internal contract ID of `exa`, but every persisted fake row is explicitly labeled `fake` and excluded from provider comparisons.

Use `--provider-config path/to/config.json` to set provider limits. The file is a partial object keyed by provider ID:

```json
{
  "exa": {
    "concurrency": 2,
    "perSecond": 1,
    "burst": 1,
    "maxUsd": 10,
    "maxCallUsd": 0.01
  }
}
```

The example price is illustrative. Before registering a real adapter, set `maxCallUsd` to a conservative upper bound for its most expensive permitted call, including all pages or retries inside the vendor service. Real providers require this setting; fake and controls use zero. Context.dev is capped at one concurrent task/call for its free plan. Other defaults are two concurrent tasks/calls, one request per second, burst one, and a $10 provider run budget. Provider calls are never retried by the harness. Adapters must also disable SDK retries and honor `CallContext.signal`.

The runner reserves task budgets and checks the call bound before dispatch. A provider is stopped when no safe call fits its remaining allowance. Models count toward that provider's spend. If an adapter violates its configured price bound, the real charge is recorded; no client-side guard can undo a bill already incurred. A timeout or exception after dispatch retains the upper price estimate rather than claiming the call was free. This estimate is conservative and is not a later billing reconciliation. A vendor request may continue remotely after cancellation.

Dispatch records reserve charges before a request starts. Settlement records use a signed `billedUsd` adjustment to replace the reservation with the reported cost. Sum `billedUsd` across all records, including negative adjustments, for total spend. An interrupted request retains its estimate. Rerunning an incomplete task includes earlier attempts in the result's spend and the headline cost per success. Requests start only after the dispatch append succeeds. A process killed during an append can lose the partial last record; records are not an fsync-backed financial ledger.

## Files and outputs

- `src/model/`: OpenAI chat-completions proxy client, usage, estimated prices, global concurrency/rate gate, and transport retry logging.
- `src/agent/`: fixed prompt, neutral tools, tool validation, output truncation, and answer loop.
- `src/raw/` and `src/grade/`: evidence checks and pure field graders.
- `src/run/`: CLI, adapter registry, configuration, scheduling, ledger, and resume storage.
- `src/stats/`: seeded site-clustered bootstrap intervals and paired comparisons within cohorts.
- `src/testing/` and `tasks/harness/`: fake evidence and end-to-end regression tests.

Each run writes `calls.jsonl`, `results.jsonl`, `summary.json`, `RESULTS.md`, `budget.json`, and `manifest.json` under `results/<runId>/`. Requests containing tool evidence and complete model/provider responses are stored only under gitignored `results/raw-private/<runId>/`, with private directories/files created as 0700/0600. Public call records contain sanitized provider arguments, model settings, usage, status, billing, errors, response hashes, and private-file references. Extracted answer values appear in field verdicts. Do not place credentials in task instructions or free-text queries.

Task limits are 60 seconds/$0.10 for search and scrape, 120 seconds/$0.25 for map, and 600 seconds/$2.00 for crawl. Tool-call limits are 3/2/2/1. Each tool output is limited to a conservative 12,000 UTF-8-byte token upper bound, identically for all providers; this is not a model-specific tokenizer. Truncation is recorded in `results.jsonl`. The prompt includes requested field names and kinds, never gold values. JSON answers must contain exactly those names. Headline success uses the script grader only.

Search raw URL checks require the gold URLs to be present at the requested recall; other retrieved hits do not reduce raw search precision. Map and crawl URL checks retain both set thresholds. Raw checks evaluate every expected field against evidence: hit text/URLs, scrape text, map URL sets, or crawl text/URLs. Raw `none` checks and non-URL map fields are n/a for every provider, including on request failure. Raw mode cannot prove a negative from arbitrary text. Text and numeric presence alone do not establish relationships among records; tasks requiring that richer structure need a future task-level raw applicability flag. Dates use ISO calendar days, US month/day/year for slash dates, and English named months. Numeric units are stripped without dimensional conversion; expected numeric values must use the same unit as the task. Version build metadata is ignored and prereleases remain distinct. Text uses NFKC, case folding, punctuation/symbol boundaries, and collapsed whitespace; accents are preserved. URL sets ignore HTTP/HTTPS, `www`, default ports, trailing slashes, fragments, and common tracking parameters while preserving meaningful queries.

Statistics resample sites with replacement, retaining all tasks from each selected site. Pairwise differences use only common tasks, preserving provider pairs and site clusters. Comparisons select the observed best within track/lane/mode/cohort; intervals are exploratory, unadjusted, and disclose multiplicity and selection bias. A CI crossing zero is unresolved, not a tie. Controls and fake runs are excluded from rankings. Timing quantiles include only successful tasks; costs include failed and interrupted work. `summary.json` contains per-family success and error counts, and the Markdown report displays the main metrics and comparisons. A tiny fake set with one site cannot validate statistical coverage on a real benchmark population.

## Proxy and pricing

The verified API shape is `POST /v1/chat/completions` at the local proxy, with `Authorization: Bearer $ANTHROPIC_AUTH_TOKEN`, `messages`, OpenAI function tools, `temperature: 0`, and `max_tokens`. The pinned answer model is `claude-haiku-5-5`. Usage comes from `usage.prompt_tokens` and `usage.completion_tokens`. `ModelClient.judge` selects `gpt-6.1-sol` for diagnostics; the runner never calls it for headline grading. The client defaults to a shared four-call concurrency cap and four requests per second.

Only proxy network/body-transfer failures and HTTP 408/429/5xx receive up to two retries, with bounded exponential delays and structured logs. Authentication, schema, answer-JSON, and provider errors are not retried. Proxy calls interrupted before usage arrives retain their conservative estimated maximum cost.

`MODEL_PRICING` is an explicit list-price estimate in USD per million tokens: Haiku input/output 1/5, Sol 2.5/15. These rates have not been independently verified against current vendor pricing and must be frozen from verified vendor prices before publishing a paid comparison. Proxy subscription charges are not represented. Input reservations use UTF-8 bytes plus a fixed overhead allowance; completed-call estimates use reported token counts.

As requested, `none` fields accept null, an empty string, or an empty array; missing properties still fail. The shared comment currently says null-only and should be reconciled with that rule.

The shared types remain unchanged. Follow-up contract changes should add control/fake IDs, raw applicability (including a per-task opt-out), token/truncation metadata, and explicit unknown billing. Map's adapter arguments currently have no scope; agent mode can filter returned URLs using the task input, while raw mode grades the full returned set.

## October 2026 campaign

Run `node --experimental-strip-types scripts/campaign.mjs <pilot|full|controls|tuned> <search|scrape|map|crawl>` inside a shell with provider credentials and model-proxy authentication. Wrap each invocation in a timeout. The campaign uses frozen task/config files, a campaign lock and an API-only allowance separate from model cost. `SCRAPING_BENCH_ONLY` selects providers; `SCRAPING_BENCH_REV` identifies a disclosed correction run. See [the preregistration](PREREGISTRATION-20261017.md) for scope, budgets and exclusions.

In `both` mode raw waits for the agent, reusing only its first dispatched call when normalized arguments match. A mismatch triggers a separately budgeted request. Persisted outcomes are hash-checked, and interrupted first calls cannot be replaced by later calls on resume. `provider-reuse` has zero incremental physical charge, while the raw result retains standalone attribution. Sum signed dispatch/settlement events for campaign spend, rather than adding agent and raw row costs.

Native API reservations distinguish settled spend from calls still in flight. A call waits when an outstanding upper-bound reservation temporarily blocks it; it stops when settled spend cannot fit the next bound. Waiting respects the task deadline. This avoids premature budget stops for low-balance concurrent crawls while retaining the 5% floor.

Crawl Markdown retains native HTML document titles when supplied by Firecrawl or Context.dev. The exact-title task checker can therefore use metadata that previously disappeared at the adapter boundary. This changes crawl evidence only; scrape and map representations remain the same.
