import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { taskSchema } from "../core/schema.ts";
import { runBenchmark } from "../run/index.ts";
import { resultSchema } from "../run/result.ts";
import { ModelClient } from "../model/index.ts";
import { Gate, shuffle, random } from "../run/limits.ts";
import { truncateOutput, runAgent } from "../agent/index.ts";
import { fakeAdapter } from "./fake.ts";
import { invoke } from "../agent/tools.ts";
import { clusteredCI, pairedDifference, summarize } from "../stats/index.ts";
const tasks = z
  .array(taskSchema)
  .parse(
    JSON.parse(
      await readFile(
        new URL("../../tasks/harness/fake.json", import.meta.url),
        "utf8",
      ),
    ),
  );
const first = tasks[0];
if (!first) throw new Error("Missing fixture");
const requestSchema = z.object({
  messages: z.array(
    z.object({ role: z.string(), content: z.string().nullable() }),
  ),
});

for (const reuse of [true, false]) test(`pipeline with actual local HTTP model protocol, raw reuse=${reuse}, private log, resume and manifest guard`, async () => {
  let calls = 0;
  const server = createServer(async (req, res) => {
    calls++;
    let body = "";
    for await (const part of req) body += part;
    const request = requestSchema.parse(JSON.parse(body));
    const hasTool = request.messages.some((m) => m.role === "tool");
    const message = hasTool
      ? { role: "assistant", content: '{"price":42}' }
      : {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "t1",
              type: "function",
              function: {
                name: "search",
                arguments: JSON.stringify({ query: reuse ? "Orbit Widget current price" : "Orbit Widget", limit: 10 }),
              },
            },
          ],
        };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message }],
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      }),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No address");
  const root = await mkdtemp(join(tmpdir(), "web-bench-test-"));
  const options = {
    tasks: [first],
    providers: ["fake"],
    lane: "default",
    mode: "both",
    client: "test",
    seed: 7,
    concurrency: 2,
    runId: "run",
    root,
    modelBaseUrl: `http://127.0.0.1:${address.port}`,
    modelToken: "not-secret-test-token",
  } satisfies Parameters<typeof runBenchmark>[0];
  try {
    const run = await runBenchmark(options);
    assert.equal(run.completed, 2);
    const rows = (await readFile(join(run.directory, "results.jsonl"), "utf8"))
      .trim()
      .split("\n")
      .map((l) => resultSchema.parse(JSON.parse(l)));
    assert.equal(
      rows.every((r) => r.success),
      true,
    );
    assert.equal(rows.find((r) => r.mode === "agent")?.toolCalls, 1);
    assert.equal(calls, 2);
    const log = await readFile(join(run.directory, "calls.jsonl"), "utf8");
    assert.equal(log.includes("current price is $42"), false);
    assert.equal(log.includes("not-secret-test-token"), false);
    assert.equal(log.includes("responseHash"), true);
    assert.equal((log.match(/"kind":"provider-dispatch"/g) ?? []).length, reuse ? 1 : 2);
    assert.equal(log.includes("provider-reuse"), reuse);
    for (const file of ["summary.json", "RESULTS.md"])
      assert.ok((await readFile(join(run.directory, file), "utf8")).length > 0);
    const resume = await runBenchmark(options);
    assert.equal(resume.completed, 0);
    assert.equal(resume.skipped, 2);
    assert.equal(calls, 2);
    if (reuse) {
      const events = log.trim().split("\n").map(line => z.object({ kind: z.string(), privatePath: z.string().optional() }).passthrough().parse(JSON.parse(line)));
      const dispatch = events.find(e => e.kind === "provider-dispatch");
      assert.ok(dispatch);
      await writeFile(join(run.directory, "calls.jsonl"), JSON.stringify({ ...dispatch, callId: "earlier-unsettled", request: { query: "different first request", limit: 10 }, billedUsd: 0 }) + "\n" + log);
      await writeFile(join(run.directory, "results.jsonl"), rows.filter(r => r.mode === "agent").map(r => JSON.stringify(r)).join("\n") + "\n");
      assert.equal((await runBenchmark(options)).completed, 1);
      const after = await readFile(join(run.directory, "calls.jsonl"), "utf8");
      assert.equal((after.match(/"kind":"provider-dispatch"/g) ?? []).length, 3, "unsettled first dispatch forbids reuse of a later matching call");
      const stored = events.find(e => e.kind === "provider" && e.privatePath)?.privatePath;
      assert.ok(stored);
      await rm(join(root, stored));
      assert.equal((await runBenchmark(options)).skipped, 2, "completed resume must not require private evidence");
    }
    await assert.rejects(
      runBenchmark({ ...options, seed: 8 }),
      /configuration changed/,
    );
    // Simulate loss of the result row after paid calls: retry must retain prior spend.
    await writeFile(
      join(run.directory, "results.jsonl"),
      rows
        .filter((r) => r.mode === "raw")
        .map((r) => JSON.stringify(r))
        .join("\n") + "\n",
    );
    const retried = await runBenchmark(options);
    assert.equal(retried.completed, 1);
    assert.equal(calls, 4);
    const retryRows = (
      await readFile(join(run.directory, "results.jsonl"), "utf8")
    )
      .trim()
      .split("\n")
      .map((l) => resultSchema.parse(JSON.parse(l)));
    assert.equal(
      retryRows.find((r) => r.mode === "agent")?.modelUsd,
      2 * (rows.find((r) => r.mode === "agent")?.modelUsd ?? 0),
    );
    await import("node:fs/promises").then((fs) =>
      fs.appendFile(join(run.directory, "results.jsonl"), '{"partial":'),
    );
    await import("node:fs/promises").then((fs) =>
      fs.appendFile(join(run.directory, "calls.jsonl"), '{"partial":'),
    );
    assert.equal((await runBenchmark(options)).skipped, 2);
  } finally {
    server.close();
    server.closeAllConnections();
    await rm(root, { recursive: true, force: true });
  }
});
test("model retries transport 503, not authentication or schema failures", async () => {
  let calls = 0;
  let status = 503;
  const server = createServer((req, res) => {
    req.resume();
    calls++;
    if (calls === 1 || status !== 503) {
      res.writeHead(status);
      res.end("{}");
    } else {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          choices: [
            { message: { role: "assistant", content: "{}", tool_calls: null } },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      );
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const a = server.address();
  if (!a || typeof a === "string") throw new Error("address");
  try {
    const events: unknown[] = [];
    const client = new ModelClient({
      baseUrl: `http://127.0.0.1:${a.port}`,
      token: "x",
      gate: new Gate(4, 1000),
      telemetry: async (e) => {
        events.push(e);
      },
    });
    const result = await client.complete({
      messages: [],
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(result.call.attempt, 1);
    assert.equal(calls, 2);
    assert.equal(events.length, 4);
    status = 401;
    await assert.rejects(
      client.complete({ messages: [], signal: AbortSignal.timeout(5000) }),
      /HTTP 401/,
    );
    assert.equal(calls, 3);
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
test("provider exceptions are never retried; deadline bounds adapter that ignores signal", async () => {
  let calls = 0;
  const adapter = {
    ...fakeAdapter,
    search: async () => {
      calls++;
      throw new Error("provider down");
    },
  };
  const outcome = await invoke(
    adapter,
    "search",
    { query: "x", limit: 1 },
    { lane: "default", timeoutMs: 100, signal: AbortSignal.timeout(100) },
  );
  assert.equal(outcome.kind, "error");
  assert.equal(calls, 1);
  const hanging = {
    ...fakeAdapter,
    search: () => new Promise<never>(() => {}),
  };
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    const result = await invoke(
      hanging,
      "search",
      { query: "x", limit: 1 },
      { lane: "default", timeoutMs: 20, signal: AbortSignal.timeout(20) },
    );
    assert.equal(result.kind === "error" && result.error, "timeout");
  } finally {
    clearTimeout(keepAlive);
  }
});
test("tool output cap is identical and valid Unicode; deterministic shuffle", () => {
  const output = truncateOutput("😀".repeat(20000));
  assert.equal(output.truncated, true);
  assert.ok(output.tokenUpperBound <= 12000);
  assert.equal(output.text.includes("\uFFFD"), false);
  assert.deepEqual(
    shuffle([1, 2, 3, 4], random(9)),
    shuffle([1, 2, 3, 4], random(9)),
  );
});
test("provider budget stops calls and n/a is excluded from statistics", async () => {
  const root = await mkdtemp(join(tmpdir(), "web-bench-budget-"));
  try {
    const result = await runBenchmark({
      tasks: [first],
      providers: ["fake"],
      lane: "default",
      mode: "raw",
      client: "test",
      seed: 1,
      concurrency: 1,
      runId: "zero",
      root,
      providerConfig: {
        fake: { concurrency: 2, perSecond: 1, burst: 1, maxUsd: 0 },
      },
    });
    const row = resultSchema.parse(
      JSON.parse(
        (
          await readFile(join(result.directory, "results.jsonl"), "utf8")
        ).trim(),
      ),
    );
    assert.equal(row.limitReason, "provider-budget-limit");
    assert.equal(row.toolCalls, 0);
    const stats = summarize(
      [row, { ...row, taskId: "na", applicability: "n/a" }],
      1,
      50,
    );
    assert.equal(stats.groups[0]?.tasks, 1);
    assert.equal(stats.groups[0]?.na, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("paired site bootstrap retains pairs and shared site outcomes", async () => {
  const root = await mkdtemp(join(tmpdir(), "web-bench-stats-"));
  try {
    const result = await runBenchmark({
      tasks,
      providers: ["fake"],
      lane: "default",
      mode: "raw",
      client: "test",
      seed: 1,
      concurrency: 4,
      runId: "stats",
      root,
      providerConfig: {
        fake: { concurrency: 2, perSecond: 1000, burst: 4, maxUsd: 10 },
      },
    });
    const rows = (
      await readFile(join(result.directory, "results.jsonl"), "utf8")
    )
      .trim()
      .split("\n")
      .map((l) => resultSchema.parse(JSON.parse(l)));
    assert.deepEqual(clusteredCI(rows, 1, 100), [1, 1]);
    const difference = pairedDifference(
      rows,
      rows.map((r) => ({ ...r, success: false })),
      1,
      100,
    );
    assert.equal(difference.difference, 1);
    assert.deepEqual(difference.ci95, [1, 1]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strict answer JSON rejects extra fields and empty paired samples are unresolved", async () => {
  const server = createServer((req, res) => {
    req.resume();
    res.writeHead(200);
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              role: "assistant",
              content: '{"price":42,"extra":true}',
            },
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 10 },
      }),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const a = server.address();
  if (!a || typeof a === "string") throw new Error("address");
  try {
    const result = await runAgent({
      task: first,
      adapter: null,
      lane: "default",
      client: new ModelClient({
        baseUrl: `http://127.0.0.1:${a.port}`,
        token: "x",
      }),
      callTool: async () => {
        throw new Error("No tool expected");
      },
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(result.success, false);
    assert.equal(result.errors.includes("other"), true);
    assert.equal(
      pairedDifference([], [], 1, 100).interpretation,
      "insufficient data",
    );
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
test("preflight cost reservation prevents a second provider call and raw n/a is provider-independent", async () => {
  const root = await mkdtemp(join(tmpdir(), "web-bench-cost-"));
  let calls = 0;
  const adapter = {
    ...fakeAdapter,
    search: async () => {
      calls++;
      const out = await fakeAdapter.search?.(
        { query: "x", limit: 1 },
        { lane: "default", timeoutMs: 1000, signal: AbortSignal.timeout(1000) },
      );
      if (!out) throw new Error("fake");
      return {
        ...out,
        billing: {
          usd: 0.08,
          basis: "reported",
          credits: null,
        } satisfies typeof out.billing,
      };
    },
  };
  const second = { ...first, id: "second" };
  try {
    const opts = {
      tasks: [first, second],
      providers: ["exa"],
      adapterList: [adapter],
      lane: "default",
      mode: "raw",
      client: "test",
      seed: 1,
      concurrency: 2,
      runId: "cost",
      root,
      providerConfig: {
        exa: {
          concurrency: 2,
          perSecond: 1000,
          burst: 2,
          maxUsd: 0.1,
          maxCallUsd: 0.08,
        },
      },
    } satisfies Parameters<typeof runBenchmark>[0];
    const result = await runBenchmark(opts);
    assert.equal(calls, 1);
    const rows = (
      await readFile(join(result.directory, "results.jsonl"), "utf8")
    )
      .trim()
      .split("\n")
      .map((l) => resultSchema.parse(JSON.parse(l)));
    assert.equal(
      rows.reduce((sum, r) => sum + r.apiUsd, 0),
      0.08,
    );
    const naTask = {
      ...first,
      id: "none",
      expected: [{ kind: "none", name: "answer" }],
    } satisfies typeof first;
    const failed = {
      ...adapter,
      search: async () =>
        ({
          kind: "error",
          error: "http-5xx",
          message: "failed",
          status: 503,
          ms: 1,
          billing: { usd: 0, basis: "reported", credits: null },
        }) satisfies Awaited<ReturnType<NonNullable<typeof adapter.search>>>,
    };
    const na = await runBenchmark({
      ...opts,
      tasks: [naTask],
      adapterList: [failed],
      runId: "na",
    });
    const row = resultSchema.parse(
      JSON.parse(
        (await readFile(join(na.directory, "results.jsonl"), "utf8")).trim(),
      ),
    );
    assert.equal(row.applicability, "n/a");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("timed out dispatched provider work retains the configured upper cost estimate", async () => {
  const adapter = {
    ...fakeAdapter,
    search: async () => new Promise<never>(() => {}),
  };
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    const outcome = await invoke(
      adapter,
      "search",
      { query: "x", limit: 1 },
      { lane: "default", timeoutMs: 10, signal: AbortSignal.timeout(10) },
      0.08,
    );
    assert.equal(outcome.kind === "error" && outcome.error, "timeout");
    assert.equal(outcome.billing.usd, 0.08);
    assert.equal(outcome.billing.basis, "list-price");
  } finally {
    clearTimeout(keepAlive);
  }
});

test("all tracks enforce tool caps even if model ignores tool_choice", async () => {
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    const parsed = requestSchema.parse(JSON.parse(body));
    const user = parsed.messages.find((m) => m.role === "user");
    const input = z
      .object({
        input: z.object({
          track: z.enum(["search", "scrape", "map", "crawl"]),
        }),
      })
      .parse(JSON.parse(user?.content ?? "{}")).input;
    const args =
      input.track === "search"
        ? { query: "x", limit: 10 }
        : input.track === "scrape"
          ? { url: "https://fixture.invalid" }
          : input.track === "map"
            ? { site: "https://fixture.invalid" }
            : { site: "https://fixture.invalid", scope: "/", maxPages: 1 };
    res.writeHead(200);
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: `call-${parsed.messages.length}`,
                  type: "function",
                  function: {
                    name: input.track,
                    arguments: JSON.stringify(args),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const a = server.address();
  if (!a || typeof a === "string") throw new Error("address");
  try {
    const caps = { search: 3, scrape: 2, map: 2, crawl: 1 };
    for (const task of tasks) {
      let invoked = 0;
      const result = await runAgent({
        task,
        adapter: fakeAdapter,
        lane: "default",
        client: new ModelClient({
          baseUrl: `http://127.0.0.1:${a.port}`,
          token: "x",
          gate: new Gate(4, 10000, 4),
        }),
        callTool: async (args) => {
          invoked++;
          return invoke(fakeAdapter, task.track, args, {
            lane: "default",
            timeoutMs: 5000,
            signal: AbortSignal.timeout(5000),
          });
        },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(invoked, caps[task.track]);
      assert.equal(result.toolCalls, caps[task.track]);
      assert.equal(result.success, false);
    }
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
test("token bucket controls call spacing and concurrency", async () => {
  const gate = new Gate(2, 50, 1);
  let active = 0;
  let maximum = 0;
  const starts: number[] = [];
  await Promise.all(
    [1, 2, 3, 4].map(() =>
      gate.run(async () => {
        active++;
        maximum = Math.max(maximum, active);
        starts.push(performance.now());
        await new Promise((resolve) => setTimeout(resolve, 35));
        active--;
      }),
    ),
  );
  assert.ok(maximum <= 2);
  for (let i = 1; i < starts.length; i++)
    assert.ok((starts[i] ?? 0) - (starts[i - 1] ?? 0) >= 15);
});
test("plain-fetch oracle retrieves local evidence and stale PID lock resumes", async () => {
  const { oracleAdapter, FAKE_TEXT } = await import("./fake.ts");
  const server = createServer((req, res) => {
    req.resume();
    res.end(FAKE_TEXT);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const a = server.address();
  if (!a || typeof a === "string") throw new Error("address");
  const root = await mkdtemp(join(tmpdir(), "web-bench-lock-"));
  try {
    const outcome = await invoke(
      oracleAdapter(null),
      "scrape",
      { url: `http://127.0.0.1:${a.port}` },
      { lane: "default", timeoutMs: 1000, signal: AbortSignal.timeout(1000) },
    );
    assert.equal(
      outcome.kind === "ok" &&
        outcome.data.track === "scrape" &&
        outcome.data.markdown,
      FAKE_TEXT,
    );
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(root, "lock"));
    await writeFile(
      join(root, "lock", ".lock"),
      JSON.stringify({ pid: 2147483647 }),
    );
    const result = await runBenchmark({
      tasks: [first],
      providers: ["fake"],
      lane: "default",
      mode: "raw",
      client: "test",
      seed: 1,
      concurrency: 1,
      runId: "lock",
      root,
    });
    assert.equal(result.completed, 1);
  } finally {
    server.close();
    server.closeAllConnections();
    await rm(root, { recursive: true, force: true });
  }
});

test("malformed successful proxy JSON terminates without a retry", async () => {
  let calls = 0;
  const server = createServer((req, res) => {
    req.resume();
    calls++;
    res.writeHead(200);
    res.end("{invalid");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const a = server.address();
  if (!a || typeof a === "string") throw new Error("address");
  try {
    await assert.rejects(
      new ModelClient({
        baseUrl: `http://127.0.0.1:${a.port}`,
        token: "x",
      }).complete({ messages: [], signal: AbortSignal.timeout(5000) }),
    );
    assert.equal(calls, 1);
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
test("resume includes prior tuple spend in task dispatch cap", async () => {
  const root = await mkdtemp(join(tmpdir(), "web-bench-task-cap-"));
  let calls = 0;
  const adapter = {
    ...fakeAdapter,
    search: async () => {
      calls++;
      const outcome = await fakeAdapter.search?.(
        { query: "x", limit: 1 },
        { lane: "default", timeoutMs: 1000, signal: AbortSignal.timeout(1000) },
      );
      if (!outcome) throw new Error("fake");
      return {
        ...outcome,
        billing: {
          usd: 0.08,
          basis: "reported",
          credits: null,
        } satisfies typeof outcome.billing,
      };
    },
  };
  const opts = {
    tasks: [first],
    providers: ["exa"],
    adapterList: [adapter],
    lane: "default",
    mode: "raw",
    client: "test",
    seed: 1,
    concurrency: 1,
    runId: "resume",
    root,
    providerConfig: {
      exa: {
        concurrency: 2,
        perSecond: 1000,
        burst: 2,
        maxUsd: 10,
        maxCallUsd: 0.08,
      },
    },
  } satisfies Parameters<typeof runBenchmark>[0];
  try {
    const result = await runBenchmark(opts);
    assert.equal(calls, 1);
    await writeFile(join(result.directory, "results.jsonl"), "");
    await runBenchmark(opts);
    assert.equal(calls, 1);
    const row = resultSchema.parse(
      JSON.parse(
        (
          await readFile(join(result.directory, "results.jsonl"), "utf8")
        ).trim(),
      ),
    );
    assert.equal(row.apiUsd, 0.08);
    assert.equal(row.success, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('concurrent provider dispatches preserve a native API credit reserve independently of model budget', async () => {
  const root = await mkdtemp(join(tmpdir(), 'web-bench-api-reserve-'));
  let dispatched = 0;
  const search = fakeAdapter.search;
  if (!search) throw new Error('Missing fake search');
  const adapter = { ...fakeAdapter, search: async (...args: Parameters<typeof search>) => {
    dispatched++;
    const result = await search(...args);
    return { ...result, billing: { usd: 0.005, basis: 'reported', credits: 1 } satisfies typeof result.billing };
  } };
  try {
    await runBenchmark({ tasks: [first, { ...first, id: 'reserve-second' }], providers: ['exa'], adapterList: [adapter], lane: 'default', mode: 'raw', client: 'test', seed: 1, concurrency: 2, runId: 'reserve', root, providerConfig: { exa: { concurrency: 2, perSecond: 1000, burst: 2, maxUsd: 10, maxCallUsd: .005, apiMaxUsd: .005 } } });
    assert.equal(dispatched, 1);
    const budget = JSON.parse(await readFile(join(root, 'reserve/budget.json'), 'utf8'));
    assert.equal(budget.exa.apiUsd, .005);
    const rows = (await readFile(join(root, 'reserve/results.jsonl'), 'utf8')).trim().split('\n').map(line => resultSchema.parse(JSON.parse(line)));
    assert.equal(rows.filter(r => r.limitReason === 'provider-budget-limit').length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('concurrent calls wait for unsettled native reservations before declaring budget exhaustion', async () => {
  const root = await mkdtemp(join(tmpdir(), 'web-bench-api-settlement-'));
  let dispatched = 0;
  const search = fakeAdapter.search;
  if (!search) throw new Error('Missing fake search');
  const adapter = { ...fakeAdapter, search: async (...args: Parameters<typeof search>) => {
    dispatched++;
    await new Promise(resolve => setTimeout(resolve, 30));
    const result = await search(...args);
    return { ...result, billing: { usd: .001, basis: 'reported', credits: 1 } satisfies typeof result.billing };
  } };
  try {
    await runBenchmark({ tasks: [first, { ...first, id: 'settlement-second' }, { ...first, id: 'settlement-third' }], providers: ['exa'], adapterList: [adapter], lane: 'default', mode: 'raw', client: 'test', seed: 1, concurrency: 3, runId: 'settlement', root, providerConfig: { exa: { concurrency: 3, perSecond: 1000, burst: 3, maxUsd: 10, maxCallUsd: .02, apiMaxUsd: .03 } } });
    assert.equal(dispatched, 3);
    const rows = (await readFile(join(root, 'settlement/results.jsonl'), 'utf8')).trim().split('\n').map(line => resultSchema.parse(JSON.parse(line)));
    assert.equal(rows.filter(r => r.limitReason === 'provider-budget-limit').length, 0);
    const budget = JSON.parse(await readFile(join(root, 'settlement/budget.json'), 'utf8'));
    assert.ok(Math.abs(budget.exa.apiUsd - .003) < 1e-9);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('native API budget stops remain distinct from task cost limits', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'one', type: 'function', function: { name: 'search', arguments: '{"query":"x","limit":1}' } }] } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw Error('No address');
  try {
    const result = await runAgent({ task: first, adapter: fakeAdapter, lane: 'default', client: new ModelClient({ baseUrl: `http://127.0.0.1:${address.port}`, token: 'test' }), signal: AbortSignal.timeout(2000), callTool: async () => { throw Error('Provider API budget exhausted'); } });
    assert.equal(result.limitReason, 'provider-budget-limit');
    assert.equal(result.success, false);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('zero-price physical request quota includes dispatches on resume', async () => {
  const root = await mkdtemp(join(tmpdir(), 'web-bench-quota-'));
  const options = { tasks: [first, { ...first, id: 'quota-second' }], providers: ['exa'], adapterList: [fakeAdapter], lane: 'default', mode: 'raw', client: 'test', seed: 1, concurrency: 1, runId: 'quota', root, providerConfig: { exa: { concurrency: 1, perSecond: 1000, burst: 1, maxUsd: 10, maxCallUsd: 0, maxPhysicalCalls: 1 } } } satisfies Parameters<typeof runBenchmark>[0];
  try {
    await runBenchmark(options);
    const rows = (await readFile(join(root, 'quota/results.jsonl'), 'utf8')).trim().split('\n').map(line => resultSchema.parse(JSON.parse(line)));
    assert.equal(rows.filter(row => row.limitReason === 'provider-budget-limit').length, 1);
    // Simulate lost result rows after an interruption; dispatch reservations still survive.
    await writeFile(join(root, 'quota/results.jsonl'), '');
    await runBenchmark(options);
    const calls = (await readFile(join(root, 'quota/calls.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(calls.filter(event => event.kind === 'provider-dispatch').length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});
