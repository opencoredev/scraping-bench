// `npm run measure [-- --stage reference|replay|report]`: one pipeline from the stored v2 responses to
// every published number. Network is used only by the reference stage (public pages) and the replay
// stage (the local model proxy); the report stage is fully offline and byte-identical on rerun.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { canonicalUrl, normalizeText } from "../src/grade/index.ts";
import { ModelClient } from "../src/model/index.ts";
import { installReplayNetworkGuard } from "../src/run/replay.ts";
import type { Task, ToolOutcome, Track } from "../src/core/types.ts";
import { loadDataset, RESULTS_ROOT, TRACKS, type Attempt, type Dataset } from "./inputs.ts";
import { gradeRetrieval } from "./retrieval.ts";
import { ModelCache, replayableCalls, replayTask, type ReplayCall, type ReplayResult } from "./agent.ts";
import { coverage, probes, reference, sentences, type Reference } from "./coverage.ts";
import { renderOutcome, splitNativeTitle } from "./render.ts";
import { clusteredInterval, pairedGap, type Interval } from "./stats.ts";
import { writeReport } from "./report.ts";
import { writeSiteData } from "./site.ts";

const PRIVATE = join(RESULTS_ROOT, "raw-private", "measure-v2");
const OUT = new URL("./out/", import.meta.url).pathname;
const { values } = parseArgs({ options: { stage: { type: "string" } } });
const stage = values.stage ?? "all";

// ---------- Correct-page text for scrape ----------

const ORACLE_LINE = /^HTML document title: (.*)\nFirst HTML h1: (.*)$/m;

type PageText = { readonly kind: "reference"; readonly text: string } | { readonly kind: "fixture"; readonly text: string } | { readonly kind: "changed" | "unavailable" };

/** The reference text, if the page still has the title and H1 the oracle recorded during the run. */
function pageText(task: Task, oracle: ToolOutcome, ref: Reference | null): PageText {
  if (oracle.kind !== "ok" || oracle.data.track !== "scrape") return { kind: "unavailable" };
  if (task.source.kind === "fixture") return { kind: "fixture", text: oracle.data.markdown };
  if (!ref || ref.status !== 200 || !ref.text) return { kind: "unavailable" };
  const recorded = ORACLE_LINE.exec(oracle.data.markdown);
  const same = (a: string | null | undefined, b: string | null | undefined) => normalizeText(a ?? "") === normalizeText(b ?? "");
  if (!recorded || !same(recorded[1], ref.title) || !same(recorded[2], ref.h1)) return { kind: "changed" };
  return { kind: "reference", text: ref.text };
}

/** The correct-page control's single tool response: the oracle's title and H1 lines, then the page text. */
function correctPage(oracle: ToolOutcome, page: PageText): ToolOutcome | null {
  if (oracle.kind !== "ok" || oracle.data.track !== "scrape") return null;
  if (page.kind === "fixture") return oracle;
  if (page.kind !== "reference") return null;
  return { ...oracle, data: { ...oracle.data, markdown: `${oracle.data.markdown}\n\n${page.text}` }, billing: { usd: 0, basis: "list-price", credits: null } };
}

async function references(data: Dataset): Promise<Map<string, Reference | null>> {
  const out = new Map<string, Reference | null>();
  for (const task of data.tracks.scrape.tasks.values()) {
    if (task.input.track !== "scrape" || task.source.kind === "fixture") continue;
    out.set(task.id, await reference({ url: task.input.url, dir: join(PRIVATE, "reference"), fetchMissing: true }));
  }
  return out;
}

// ---------- Per-row measurements ----------

type Row = {
  track: Track;
  provider: string;
  taskId: string;
  site: string;
  family: string;
  core: boolean;
  retrieval: boolean | null;
  firstCallOk: boolean;
  bytes: number;
  answerOffset: number | null;
  coverage: number | null;
  noise: number | null;
  titles: { expected: number; returnedWithTitle: number; returnedNoTitle: number; exact: number; loose: number } | null;
  agent: ReplayResult | null;
};

/** Byte offset of the first line containing the key, or null. Used for scrape headings only. */
function answerOffset(rendered: string, task: Task): number | null {
  const keys = task.expected.flatMap((f) => (f.kind === "text" ? f.accept : f.kind === "version" ? [f.value] : []));
  if (!keys.length) return null;
  let offset = 0;
  for (const line of rendered.split("\n")) {
    const hay = ` ${normalizeText(line)} `;
    if (keys.some((k) => hay.includes(` ${normalizeText(k)} `))) return offset;
    offset += Buffer.byteLength(line, "utf8") + 1;
  }
  return null;
}

const SEGMENTS = / \| | - | — /;
function titleFidelity(task: Task, outcome: ToolOutcome): Row["titles"] {
  const records = task.expected.find((f) => f.kind === "text-set");
  if (!records || records.kind !== "text-set") return null;
  const pages = outcome.kind === "ok" && outcome.data.track === "crawl" ? outcome.data.pages : [];
  const returned = new Map(pages.map((p) => [canonicalUrl(p.url), splitNativeTitle(p.markdown).title]));
  const tally = { expected: records.items.length, returnedWithTitle: 0, returnedNoTitle: 0, exact: 0, loose: 0 };
  for (const item of records.items) {
    const split = item.indexOf(" | ");
    const url = canonicalUrl(item.slice(0, split));
    const expected = item.slice(split + 3);
    if (!returned.has(url)) continue;
    const got = returned.get(url) ?? null;
    if (got === null) {
      tally.returnedNoTitle++;
      continue;
    }
    tally.returnedWithTitle++;
    if (normalizeText(got) === normalizeText(expected)) tally.exact++;
    const first = expected.split(SEGMENTS)[0] ?? expected;
    if (` ${normalizeText(got)} `.includes(` ${normalizeText(first)} `)) tally.loose++;
  }
  return tally;
}

async function replayCallsFor(attempt: Attempt): Promise<ReplayCall[]> {
  const calls = await Promise.all(attempt.calls.map(async (c) => ({ outcome: await c.load(), args: c.args })));
  return replayableCalls(calls);
}

async function pool<T, R>(items: readonly T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        const item = items[i];
        if (item !== undefined) results[i] = await run(item);
      }
    }),
  );
  return results;
}

async function measure(data: Dataset, cache: ModelCache, refs: Map<string, Reference | null>, log: (s: string) => void) {
  // Probe sentences for every usable scrape page, with same-site siblings for boilerplate removal.
  const scrape = data.tracks.scrape;
  const pageTexts = new Map<string, PageText>();
  for (const task of scrape.tasks.values()) {
    const oracle = data.oracle.get(task.id);
    if (!oracle) throw new Error(`No oracle for ${task.id}`);
    pageTexts.set(task.id, pageText(task, await oracle.load(), refs.get(task.id) ?? null));
  }
  const sentencesOf = new Map([...pageTexts].map(([id, p]) => [id, p.kind === "reference" || p.kind === "fixture" ? sentences(p.text) : []]));
  const probeList = new Map<string, string[]>();
  for (const task of scrape.tasks.values()) {
    const siblings = [...scrape.tasks.values()].filter((t) => t.site === task.site && t.id !== task.id).map((t) => sentencesOf.get(t.id) ?? []);
    probeList.set(task.id, probes({ taskId: task.id, own: sentencesOf.get(task.id) ?? [], siblings }));
  }

  const rows: Row[] = [];
  const jobs: { track: Track; provider: string; task: Task; attempt: Attempt; core: boolean }[] = [];
  for (const track of TRACKS) {
    const t = data.tracks[track];
    const core = new Set(t.core);
    for (const [provider, attempts] of t.attempts) {
      const ids = t.fullProviders.includes(provider) ? t.full : t.core;
      for (const id of ids) {
        const attempt = attempts.get(id);
        const task = t.tasks.get(id);
        if (!task) throw new Error(`Unknown task ${id}`);
        if (!attempt) {
          if (core.has(id)) throw new Error(`Missing core attempt ${provider} ${id}`);
          continue;
        }
        jobs.push({ track, provider, task, attempt, core: core.has(id) && t.coreProviders.includes(provider) });
      }
    }
  }
  log(`rows: ${jobs.length}; agent replays: ${jobs.filter((j) => j.core).length} provider + ${scrape.core.length} correct-page`);

  const results = await pool(jobs, 4, async ({ track, provider, task, attempt, core }) => {
    const first = attempt.calls[0];
    if (!first) throw new Error(`No first call ${provider} ${task.id}`);
    const outcome = await first.load();
    const rendered = renderOutcome(outcome);
    const calls = await replayCallsFor(attempt);
    const retrieval = gradeRetrieval(task, calls.map((c) => c.outcome));
    const page = pageTexts.get(task.id);
    const usable = page && (page.kind === "reference" || page.kind === "fixture") ? page : null;
    const row: Row = {
      track,
      provider,
      taskId: task.id,
      site: task.site,
      family: task.family,
      core,
      retrieval: retrieval.kind === "graded" ? retrieval.pass : null,
      firstCallOk: outcome.kind === "ok",
      bytes: Buffer.byteLength(rendered, "utf8"),
      answerOffset: track === "scrape" ? answerOffset(rendered, task) : null,
      coverage: track === "scrape" && usable ? coverage(rendered, probeList.get(task.id) ?? []) : null,
      noise: track === "scrape" && usable && usable.text.length ? Buffer.byteLength(rendered, "utf8") / Buffer.byteLength(usable.text, "utf8") : null,
      titles: track === "crawl" ? titleFidelity(task, outcome) : null,
      agent: core ? await replayTask({ task, calls, cache }) : null,
    };
    return row;
  });
  rows.push(...results);

  // Correct-page control, scrape core only.
  const gates: { name: string; pass: boolean; detail: string }[] = [];
  const keyFaults: string[] = [];
  const control = await pool(scrape.core, 4, async (id) => {
    const task = scrape.tasks.get(id);
    const oracle = data.oracle.get(id);
    if (!task || !oracle) throw new Error(`Missing control input ${id}`);
    const outcome = correctPage(await oracle.load(), pageTexts.get(id) ?? { kind: "unavailable" });
    if (!outcome) return { id, site: task.site, result: null };
    const retrieval = gradeRetrieval(task, [outcome]);
    if (retrieval.kind === "graded" && !retrieval.pass) keyFaults.push(id);
    return { id, site: task.site, result: await replayTask({ task, calls: [{ outcome, args: { url: task.input.track === "scrape" ? task.input.url : "" } }], cache }) };
  });
  const controlled = control.filter((c) => c.result !== null);
  const controlRate = controlled.filter((c) => c.result?.success).length / Math.max(1, controlled.length);
  gates.push({ name: "Correct-page control at least 97% on core scrape", pass: controlRate >= 0.97, detail: `${controlled.filter((c) => c.result?.success).length}/${controlled.length} (${control.length - controlled.length} pages without usable reference text)` });
  gates.push({ name: "Every core scrape key is in its own correct-page text", pass: keyFaults.length === 0, detail: keyFaults.length ? keyFaults.join(", ") : `${controlled.length} checked` });
  return { rows, control, gates, pageTexts, probeList };
}

// ---------- Aggregation ----------

type Metric = { successes: number; tasks: number; rate: number | null; ci: Interval };
const metric = (rows: readonly { taskId: string; site: string; value: number }[]): Metric => {
  const successes = rows.reduce((s, r) => s + r.value, 0);
  return { successes, tasks: rows.length, rate: rows.length ? successes / rows.length : null, ci: clusteredInterval(rows) };
};
const meanMetric = (rows: readonly { taskId: string; site: string; value: number }[]) => ({
  pages: rows.length,
  mean: rows.length ? rows.reduce((s, r) => s + r.value, 0) / rows.length : null,
  ci: clusteredInterval(rows),
});
const median = (values: readonly number[]) => {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? null) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

function aggregate(data: Dataset, measured: Awaited<ReturnType<typeof measure>>) {
  const tracks = TRACKS.map((track) => {
    const t = data.tracks[track];
    const coreRows = measured.rows.filter((r) => r.track === track && r.core);
    const providers = t.coreProviders.map((provider) => {
      const rows = coreRows.filter((r) => r.provider === provider);
      const agentRows = rows.map((r) => ({ taskId: r.taskId, site: r.site, value: r.agent?.success ? 1 : 0 }));
      const retrievalRows = rows.flatMap((r) => (r.retrieval === null ? [] : [{ taskId: r.taskId, site: r.site, value: r.retrieval ? 1 : 0 }]));
      const agents = rows.flatMap((r) => (r.agent ? [r.agent] : []));
      const successes = agents.filter((a) => a.success);
      const spend = agents.reduce((s, a) => s + a.providerUsd + a.modelUsd, 0);
      const cov = rows.flatMap((r) => (r.coverage === null ? [] : [{ taskId: r.taskId, site: r.site, value: r.coverage }]));
      const noise = rows.flatMap((r) => (r.noise === null ? [] : [r.noise]));
      const titles = rows.flatMap((r) => (r.titles ? [r.titles] : []));
      const sum = (k: keyof NonNullable<Row["titles"]>) => titles.reduce((s, x) => s + x[k], 0);
      return {
        provider,
        agent: metric(agentRows),
        agentRows,
        retrieval: metric(retrievalRows),
        costPerSuccessUsd: successes.length ? spend / successes.length : null,
        medianMs: median(successes.map((a) => a.providerMs + a.modelMs)),
        coverage: track === "scrape" ? meanMetric(cov) : null,
        medianNoise: median(noise),
        medianBytes: median(rows.map((r) => r.bytes)),
        answerFound: track === "scrape" ? rows.filter((r) => r.answerOffset !== null).length : null,
        answerPast12k: track === "scrape" ? rows.filter((r) => r.answerOffset !== null && r.answerOffset > 12_000).length : null,
        titles: track === "crawl" ? { expected: sum("expected"), returnedWithTitle: sum("returnedWithTitle"), returnedNoTitle: sum("returnedNoTitle"), exact: sum("exact"), loose: sum("loose") } : null,
        diagnostics: {
          parseFailures: agents.filter((a) => a.parse !== "answer").length,
          strictParseFailures: agents.filter((a) => !a.strictParse).length,
          readLimitHits: agents.filter((a) => a.hitReadLimit).length,
          argMismatches: agents.reduce((s, a) => s + a.argMismatches, 0),
          pagesRead: agents.reduce((s, a) => s + a.pagesRead, 0),
          agentPassRetrievalFail: rows.filter((r) => r.agent?.success && r.retrieval === false).map((r) => r.taskId),
        },
        tokens: { input: agents.reduce((s, a) => s + a.inputTokens, 0), output: agents.reduce((s, a) => s + a.outputTokens, 0), modelUsd: agents.reduce((s, a) => s + a.modelUsd, 0) },
      };
    });
    const ranked = [...providers].sort((a, b) => (b.agent.rate ?? 0) - (a.agent.rate ?? 0) || (a.costPerSuccessUsd ?? Infinity) - (b.costPerSuccessUsd ?? Infinity));
    const leader = ranked[0];
    const gaps = ranked.slice(1).map((p) => ({ provider: p.provider, reference: leader?.provider ?? "", ...pairedGap(p.agentRows, leader?.agentRows ?? []) }));
    const none = t.core.flatMap((id) => {
      const task = t.tasks.get(id);
      const success = t.none.get(id);
      return task && success !== undefined ? [{ taskId: id, site: task.site, value: success ? 1 : 0 }] : [];
    });
    const control = track === "scrape" ? measured.control.flatMap((c) => (c.result ? [{ taskId: c.id, site: c.site, value: c.result.success ? 1 : 0 }] : [])) : [];
    const full = t.fullProviders.map((provider) => {
      const rows = measured.rows.filter((r) => r.track === track && r.provider === provider);
      return {
        provider,
        tasks: rows.length,
        retrieval: metric(rows.flatMap((r) => (r.retrieval === null ? [] : [{ taskId: r.taskId, site: r.site, value: r.retrieval ? 1 : 0 }]))),
        coverage: track === "scrape" ? meanMetric(rows.flatMap((r) => (r.coverage === null ? [] : [{ taskId: r.taskId, site: r.site, value: r.coverage }]))) : null,
      };
    });
    return {
      track,
      coreTasks: t.core.length,
      coreSites: new Set(t.core.map((id) => t.tasks.get(id)?.site)).size,
      fullTasks: t.full.length,
      leader: leader?.provider ?? null,
      providers: providers.map(({ agentRows: _rows, ...p }) => ({
        ...p,
        tier: p.provider === leader?.provider || gaps.some((g) => g.provider === p.provider && !g.resolved) ? "top" : "below",
      })),
      gaps,
      controls: { none: metric(none), correctPage: track === "scrape" ? metric(control) : null },
      full,
    };
  });
  return tracks;
}

// ---------- Stages ----------

async function main() {
  await mkdir(OUT, { recursive: true });
  const log = (s: string) => process.stderr.write(`${s}\n`);
  const data = await loadDataset();
  log(`inputs verified: ${Object.keys(data.sourceHashes).length} files`);

  if (stage === "reference" || stage === "all") {
    const refs = await references(data);
    log(`reference pages: ${[...refs.values()].filter((r) => r?.status === 200).length}/${refs.size} fetched with HTTP 200`);
    if (stage === "reference") return;
  }

  const networkLog: { kind: string; endpoint: string }[] = [];
  let restore: () => void;
  let client: ModelClient | null = null;
  if (stage === "replay" || stage === "all") {
    restore = installReplayNetworkGuard(async (e) => {
      networkLog.push(e);
    });
    client = new ModelClient();
  } else {
    // Report stage: no network at all.
    const original = globalThis.fetch;
    globalThis.fetch = async (input) => {
      networkLog.push({ kind: "blocked-network-dispatch", endpoint: String(input instanceof Request ? input.url : input) });
      throw new Error("Network forbidden in the report stage");
    };
    restore = () => {
      globalThis.fetch = original;
    };
  }
  try {
    const cache = new ModelCache({ dir: join(PRIVATE, "model"), client });
    const refDir = join(PRIVATE, "reference");
    const refs = new Map<string, Reference | null>();
    for (const task of data.tracks.scrape.tasks.values()) {
      if (task.input.track !== "scrape" || task.source.kind === "fixture") continue;
      refs.set(task.id, await reference({ url: task.input.url, dir: refDir, fetchMissing: false }));
    }
    const measured = await measure(data, cache, refs, log);
    const blocked = networkLog.filter((e) => e.kind === "blocked-network-dispatch");
    measured.gates.push({ name: "No provider or other non-proxy network attempt", pass: blocked.length === 0, detail: `${blocked.length} blocked, ${networkLog.length - blocked.length} model-proxy calls` });
    // A failed gate publishes nothing: no summary, report or site data is written.
    const failed = measured.gates.filter((g) => !g.pass);
    if (failed.length) {
      log(`build failed, nothing written: ${failed.map((g) => `${g.name}: ${g.detail}`).join("; ")}`);
      process.exitCode = 1;
      return;
    }
    const tracks = aggregate(data, measured);
    const summary = {
      version: 3,
      source: "wb-v2 stored responses, re-measured under docs/MEASURE-v2.md",
      model: "claude-haiku-5-5",
      gates: measured.gates,
      referencePages: {
        usable: [...measured.pageTexts.values()].filter((p) => p.kind === "reference" || p.kind === "fixture").length,
        changed: [...measured.pageTexts.values()].filter((p) => p.kind === "changed").length,
        unavailable: [...measured.pageTexts.values()].filter((p) => p.kind === "unavailable").length,
        withProbes: [...measured.probeList.values()].filter((p) => p.length).length,
      },
      sourceHashes: data.sourceHashes,
      tracks,
    };
    await writeFile(join(OUT, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await writeFile(
      join(OUT, "rows.jsonl"),
      measured.rows
        .map((r) => JSON.stringify({ ...r, agent: r.agent ? { ...r.agent, answer: undefined } : null }))
        .join("\n") + "\n",
    );
    await writeReport({ summary, out: OUT });
    await writeSiteData({ summary, previousPath: new URL("../site/src/data/results.json", import.meta.url).pathname, out: OUT });
    log(`cache hits ${cache.hits}, misses ${cache.misses}; gates: ${measured.gates.map((g) => `${g.pass ? "PASS" : "FAIL"} ${g.name}`).join("; ")}`);
  } finally {
    restore();
  }
}

await main();
