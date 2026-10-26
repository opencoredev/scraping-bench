import { test } from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { taskSchema } from "../src/core/schema.ts";
import type { Task, ToolOutcome } from "../src/core/types.ts";
import type { Message, Tool } from "../src/model/index.ts";
import { installReplayNetworkGuard } from "../src/run/replay.ts";
import { ModelCache, replayableCalls, replayTask, READ_LIMIT_BYTES, type Completer } from "./agent.ts";
import { paginate, renderOutcome } from "./render.ts";
import { parseAnswer, parsesStrictly } from "./parser.ts";
import { coverage, mainText, probes, sentences } from "./coverage.ts";
import { gradeRetrieval, inScope, isPageUrl } from "./retrieval.ts";
import { clusteredInterval, pairedGap } from "./stats.ts";

const scrapeTask: Task = taskSchema.parse({
  id: "scrape-test",
  track: "scrape",
  family: "docs-heading",
  instruction: "Return JSON with string field \"heading\".",
  input: { track: "scrape", url: "https://example.com/docs/page/" },
  expected: [{ kind: "text", name: "heading", accept: ["Deep Heading"] }],
  source: { kind: "authoritative", source: "test", checkedAt: "2026-10-19T00:00:00.000Z" },
  site: "example.com",
});
const ok = (markdown: string): ToolOutcome => ({ kind: "ok", data: { track: "scrape", markdown, finalUrl: "https://example.com/docs/page/" }, ms: 100, billing: { usd: 0.001, basis: "reported", credits: 1 } });

/** A scripted model: scrape once, read pages until the heading shows up, then answer. */
function scriptedModel(): Completer & { requests: number } {
  const model = {
    requests: 0,
    async complete({ messages }: { messages: readonly Message[]; tools?: readonly Tool[]; signal: AbortSignal; forceAnswer?: boolean }) {
      model.requests++;
      const call = { model: "claude-haiku-5-5" as const, inputTokens: 10, outputTokens: 5, modelUsd: 0.00001, ms: 1, attempt: 0, pricingBasis: "list-price-estimate" as const };
      const tools = messages.filter((m) => m.role === "tool");
      const last = tools.at(-1)?.content ?? "";
      if (!tools.length) return { message: { role: "assistant" as const, content: null, tool_calls: [{ id: "t1", type: "function" as const, function: { name: "scrape", arguments: JSON.stringify({ url: "https://example.com/docs/page/" }) } }] }, call };
      if (last.includes("# Deep Heading")) return { message: { role: "assistant" as const, content: 'Found it: {"heading": "Deep Heading"}', tool_calls: undefined }, call };
      const page = /page (\d+) of (\d+)/.exec(last);
      const next = Number(page?.[1] ?? 0) + 1;
      return { message: { role: "assistant" as const, content: null, tool_calls: [{ id: `r${next}`, type: "function" as const, function: { name: "read_more", arguments: JSON.stringify({ call: 1, page: next }) } }] }, call };
    },
  };
  return model;
}

test("paginate never splits a character and respects the page size", () => {
  const text = "é".repeat(40_000) + "x";
  const pages = paginate(text, 32_000);
  assert.equal(pages.join(""), text);
  for (const p of pages) assert.ok(Buffer.byteLength(p, "utf8") <= 32_000);
});

test("an answer 150,000 bytes into a response is reachable through read_more with one provider call", async () => {
  const markdown = `${"menu link\n".repeat(15_000)}# Deep Heading\nBody.`;
  assert.ok(Buffer.byteLength(markdown) > 150_000);
  const dir = await mkdtemp(join(tmpdir(), "measure-"));
  const cache = new ModelCache({ dir, client: scriptedModel() });
  const result = await replayTask({ task: scrapeTask, calls: [{ outcome: ok(markdown), args: { url: "https://example.com/docs/page/" } }], cache });
  assert.equal(result.success, true);
  assert.equal(result.callsServed, 1);
  assert.equal(result.parse, "answer");
  assert.equal(result.strictParse, false);
  assert.ok(result.pagesRead >= 5);
  assert.ok(result.bytesRead <= READ_LIMIT_BYTES);
  // A second run is served entirely from the cache.
  const again = new ModelCache({ dir, client: null });
  const replayed = await replayTask({ task: scrapeTask, calls: [{ outcome: ok(markdown), args: { url: "https://example.com/docs/page/" } }], cache: again });
  assert.equal(replayed.success, true);
  assert.equal(again.misses, 0);
});

test("the reading limit stops further pages", async () => {
  const markdown = `${"x".repeat(400_000)}\n# Deep Heading`;
  const cache = new ModelCache({ dir: await mkdtemp(join(tmpdir(), "measure-")), client: scriptedModel() });
  const result = await replayTask({ task: scrapeTask, calls: [{ outcome: ok(markdown), args: { url: "https://example.com/docs/page/" } }], cache });
  assert.equal(result.hitReadLimit, true);
  assert.ok(result.bytesRead <= READ_LIMIT_BYTES);
});

test("parser accepts a fenced or wrapped object and rejects several or wrong fields", () => {
  assert.deepEqual(parseAnswer('```json\n{"heading": "A"}\n```', ["heading"]), { kind: "answer", value: { heading: "A" } });
  assert.deepEqual(parseAnswer('The answer is {"heading": "A {b}"}.', ["heading"]), { kind: "answer", value: { heading: "A {b}" } });
  assert.equal(parseAnswer('{"heading": "A"} or {"heading": "B"}', ["heading"]).kind, "several-objects");
  assert.equal(parseAnswer('{"heading": "A", "extra": 1}', ["heading"]).kind, "no-object");
  assert.equal(parseAnswer("no json here", ["heading"]).kind, "no-object");
  assert.equal(parsesStrictly('{"heading": "A"}', ["heading"]), true);
  assert.equal(parsesStrictly('Answer: {"heading": "A"}', ["heading"]), false);
});

test("a repeat of a successful call is dropped, a retry after an error is kept", () => {
  const error: ToolOutcome = { kind: "error", error: "timeout", message: "t", status: null, ms: 1, billing: { usd: 0.001, basis: "list-price", credits: null } };
  const args = { url: "https://example.com/" };
  assert.equal(replayableCalls([{ outcome: ok("a"), args }, { outcome: ok("a"), args }]).length, 1);
  assert.equal(replayableCalls([{ outcome: error, args }, { outcome: ok("a"), args }]).length, 2);
  assert.equal(replayableCalls([{ outcome: ok("a"), args }, { outcome: ok("b"), args: { url: "https://example.com/other" } }]).length, 2);
});

test("rendering is plain text, not escaped JSON", () => {
  const text = renderOutcome(ok('He said "hi"\nnext'));
  assert.ok(text.includes('He said "hi"\nnext'));
  assert.ok(!text.includes("\\n"));
});

test("probe sentences are deterministic, spread out, and skip boilerplate", () => {
  const body = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} talks about a distinct topic in detail.`).join(" ");
  const boiler = "This shared footer sentence appears on every single page of the site.";
  const own = [...sentences(`${body} ${boiler}`)];
  const siblings = [[boiler], [boiler]];
  const a = probes({ taskId: "t", own, siblings });
  assert.deepEqual(a, probes({ taskId: "t", own, siblings }));
  assert.equal(a.length, 8);
  assert.ok(!a.includes(boiler));
  assert.equal(coverage(`[${a[0]}](https://x) ${a.slice(1, 4).join(" ")}`, a), 0.5);
  // The pick in each span is fixed by SHA-256 of taskId:span alone.
  const hash = (v: string) => createHash("sha256").update(v).digest("hex");
  const first = own.filter((s) => s !== boiler).slice(0, Math.floor(own.filter((s) => s !== boiler).length / 8));
  assert.equal(a[0], first[Number.parseInt(hash("t:0").slice(0, 8), 16) % first.length]);
});

test("main text drops navigation and keeps the main element", () => {
  const page = mainText("<html><head><title>T | Site</title></head><body><nav>Menu item</nav><main><h1>Head</h1><p>Body text here.</p></main><footer>F</footer></body></html>");
  assert.equal(page.title, "T | Site");
  assert.equal(page.h1, "Head");
  assert.ok(page.text.includes("Body text here."));
  assert.ok(!page.text.includes("Menu item"));
});

test("map retrieval only counts URLs inside the requested scope", () => {
  assert.equal(inScope("https://www.docs.example.com/a/b/", "https://docs.example.com/a/"), true);
  assert.equal(inScope("https://docs.example.com/ab", "https://docs.example.com/a/"), false);
  const task = taskSchema.parse({
    id: "map-test", track: "map", family: "docs-url-set", instruction: "x",
    input: { track: "map", site: "https://d.example.com/a/", scope: "/a/" },
    expected: [{ kind: "url-set", name: "urls", urls: ["https://d.example.com/a/", "https://d.example.com/a/b/"], minRecall: 0.9, minPrecision: 0.8 }],
    source: { kind: "authoritative", source: "t", checkedAt: "2026-10-19T00:00:00.000Z" }, site: "d.example.com",
  });
  const outcome: ToolOutcome = { kind: "ok", data: { track: "map", urls: ["https://d.example.com/a/", "https://d.example.com/a/b", ...Array.from({ length: 50 }, (_, i) => `https://d.example.com/other/${i}`)] }, ms: 1, billing: { usd: 0, basis: "reported", credits: null } };
  assert.deepEqual(gradeRetrieval(task, [outcome]), { kind: "graded", pass: true });
  // The scope root is the tool's input, so a provider that leaves it out still has it counted.
  const withoutRoot: ToolOutcome = { kind: "ok", data: { track: "map", urls: ["https://d.example.com/a/b/", "https://d.example.com/a/b.md", "https://d.example.com/a/b?q="] }, ms: 1, billing: { usd: 0, basis: "reported", credits: null } };
  assert.deepEqual(gradeRetrieval(task, [withoutRoot]), { kind: "graded", pass: true });
  assert.equal(isPageUrl("https://d.example.com/a/b.md"), false);
  assert.equal(isPageUrl("https://d.example.com/a/b.html"), true);
  assert.equal(isPageUrl("https://d.example.com/a/b/#section"), true);
});

test("the bootstrap reproduces the published v2 intervals", async () => {
  // The site's intervals and gaps must come out of the measured rows, recomputed here from the committed build.
  const measured = new URL("../results/measure-v2-string/", import.meta.url);
  const site = z.object({ tracks: z.array(z.object({ id: z.string(), providers: z.array(z.object({ id: z.string(), agent: z.object({ ci: z.tuple([z.number(), z.number()]) }).nullable() })) })) })
    .parse(JSON.parse(await readFile(new URL("../site/src/data/results.json", import.meta.url), "utf8")));
  const rows = (await readFile(new URL("rows.jsonl", measured), "utf8")).split("\n").filter(Boolean)
    .map((l) => z.object({ track: z.string(), provider: z.string(), taskId: z.string(), site: z.string(), core: z.boolean(), agent: z.object({ success: z.boolean() }).nullable() }).parse(JSON.parse(l)));
  const pick = (provider: string) => rows.filter((r) => r.track === "scrape" && r.core && r.provider === provider).map((r) => ({ taskId: r.taskId, site: r.site, value: r.agent?.success ? 1 : 0 }));
  for (const provider of ["contextdev", "spider", "string", "jina"]) {
    const published = site.tracks.find((t) => t.id === "scrape")?.providers.find((p) => p.id === provider)?.agent?.ci;
    assert.deepEqual(clusteredInterval(pick(provider)), published);
  }
  const gap = pairedGap(pick("string"), pick("contextdev"));
  assert.equal(gap.difference, -0.075);
  assert.equal(gap.resolved, false);
});

test("the replay network guard blocks anything but the model proxy", async () => {
  const events: string[] = [];
  const restore = installReplayNetworkGuard(async (e) => {
    events.push(e.kind);
  });
  try {
    await assert.rejects(fetch("https://api.firecrawl.dev/v1/scrape", { method: "POST" }));
  } finally {
    restore();
  }
  assert.deepEqual(events, ["blocked-network-dispatch"]);
});
