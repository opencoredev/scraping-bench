import { billingUncertain } from '../adapters/http.ts';
import { readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import type { Adapter, Lane, Task, ToolOutcome } from "../core/types.ts";
import { outcomeSchema } from "../core/schema.ts";
import { invoke, initialArgs, argsSchemas } from "../agent/tools.ts";
import { runAgent, SYSTEM_PROMPT } from "../agent/index.ts";
import { ModelClient, MODEL_PRICING, MAX_ANSWER_TOKENS } from "../model/index.ts";
import { gradeRaw, rawApplicable } from "../raw/index.ts";
import { fakeAdapter, oracleAdapter } from "../testing/fake.ts";
import { adapters } from "./registry.ts";
import { Gate, random, shuffle } from "./limits.ts";
import { TRACK_LIMITS, PROVIDER_DEFAULTS, TOOL_OUTPUT_TOKEN_CAP, CRAWL_TOOL_OUTPUT_TOKEN_CAP } from "./config.ts";
import { resultKey, type RunProvider, type RunResult } from "./result.ts";
import { Storage, acquireLock } from "./storage.ts";
import { summarize, markdown } from "../stats/index.ts";
const providerConfigSchema = z.object({
  concurrency: z.number().int().positive().default(2),
  perSecond: z.number().positive().default(1),
  burst: z.number().int().positive().default(1),
  maxUsd: z.number().nonnegative().default(10),
  maxCallUsd: z.number().nonnegative().optional(),
  apiMaxUsd: z.number().nonnegative().optional(),
});
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type RunOptions = {
  tasks: readonly Task[];
  providers: readonly RunProvider[];
  lane: Lane;
  mode: "agent" | "raw" | "both";
  client: string;
  sample?: number;
  seed: number;
  concurrency: number;
  runId: string;
  root?: string;
  providerConfig?: Partial<Record<RunProvider, ProviderConfig>>;
  oracleText?: string;
  oraclePages?: Readonly<Record<string, string>>;
  adapterList?: readonly Adapter[];
  modelBaseUrl?: string;
  modelToken?: string;
};
function safeParams(args: unknown): unknown {
  // Provider request arguments are validated before invocation. Strip URL credentials and common secret query values.
  if (typeof args === "string") {
    try {
      const u = new URL(args);
      u.username = "";
      u.password = "";
      for (const k of [...u.searchParams.keys()])
        if (/key|token|secret|auth|signature/i.test(k))
          u.searchParams.set(k, "[redacted]");
      return u.toString();
    } catch {
      return args;
    }
  }
  if (Array.isArray(args)) return args.map(safeParams);
  if (typeof args === "object" && args !== null)
    return Object.fromEntries(
      Object.entries(args).map(([k, v]) => [
        k,
        /key|token|secret|auth|signature/i.test(k)
          ? "[redacted]"
          : safeParams(v),
      ]),
    );
  return args;
}
export async function runBenchmark(
  options: RunOptions,
): Promise<{ directory: string; completed: number; skipped: number }> {
  if (
    options.mode !== "raw" &&
    !options.modelToken &&
    !process.env.ANTHROPIC_AUTH_TOKEN
  )
    throw new Error("ANTHROPIC_AUTH_TOKEN is required for agent mode");
  const rng = random(options.seed);
  const tasks = shuffle(options.tasks, rng).slice(
    0,
    options.sample ?? options.tasks.length,
  );
  if (new Set(tasks.map((t) => t.id)).size !== tasks.length)
    throw new Error("Duplicate task IDs");
  const installed = options.adapterList ?? adapters;
  for (const provider of options.providers)
    if (
      !["fake", "none", "oracle"].includes(provider) &&
      options.providerConfig?.[provider]?.maxCallUsd === undefined
    )
      throw new Error(
        `Configure maxCallUsd for ${provider} before dispatching billed provider calls`,
      );
  const resolveAdapter = (provider: RunProvider): Adapter | null => {
    if (provider === "none") return null;
    if (provider === "fake") return fakeAdapter;
    if (provider === "oracle") return oracleAdapter(options.oracleText ?? null, options.oraclePages);
    const adapter = installed.find((a) => a.id === provider);
    if (!adapter) throw new Error(`No registered adapter: ${provider}`);
    return adapter;
  };
  const selected = new Map(
    options.providers.map((p) => [p, resolveAdapter(p)]),
  );
  const storage = new Storage(options.root ?? "results", options.runId);
  await storage.init();
  const lockPath = join(storage.directory, ".lock");
  const lock = await acquireLock(lockPath);
  try {
    const sourceHash = createHash("sha256");
    const sourceRoot = new URL("../", import.meta.url);
    for (const path of (await readdir(sourceRoot, { recursive: true })).filter(p => p.endsWith(".ts") && !p.endsWith(".test.ts")).sort()) {
      sourceHash.update(path).update(await readFile(new URL(path, sourceRoot)));
    }
    const manifest = {
      sourceHash: sourceHash.digest("hex"),
      version: 3,
      rawReuse: "first-agent-call-identical-normalized-args",
      authModes: { jina: process.env.JINA_AUTH_MODE ?? "key", spider: process.env.SPIDER_AUTH_MODE ?? "key", spiderBalanceMeter: process.env.SPIDER_METER_BALANCE === "1" },
      tasks,
      providers: options.providers,
      lane: options.lane,
      mode: options.mode,
      client: options.client,
      seed: options.seed,
      providerConfig: options.providerConfig ?? {},
      oracleTextHash:
        options.oracleText === undefined
          ? null
          : createHash("sha256").update(options.oracleText).digest("hex"),
      oraclePagesHash: options.oraclePages ? createHash("sha256").update(JSON.stringify(options.oraclePages)).digest("hex") : null,
      modelPricing: MODEL_PRICING,
      systemPrompt: SYSTEM_PROMPT,
      trackLimits: TRACK_LIMITS,
      outputLimits: { answer: MAX_ANSWER_TOKENS, defaultEvidenceBytes: TOOL_OUTPUT_TOKEN_CAP, crawlEvidenceBytes: CRAWL_TOOL_OUTPUT_TOKEN_CAP },
      adapterVersions: [...selected].map(([id, a]) => [
        id,
        a?.apiVersion ?? "no-tool",
      ]),
    };
    const manifestHash = createHash("sha256")
      .update(JSON.stringify(manifest))
      .digest("hex");
    const manifestPath = join(storage.directory, "manifest.json");
    try {
      const previous = z
        .object({ hash: z.string() })
        .parse(JSON.parse(await readFile(manifestPath, "utf8")));
      if (previous.hash !== manifestHash)
        throw new Error("Run configuration changed; use a new runId");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT")
        await writeFile(
          manifestPath,
          JSON.stringify({ hash: manifestHash, ...manifest }, null, 2),
        );
      else throw error;
    }
    const existing = await storage.rows();
    const completed = new Set(existing.map(resultKey));
    const configs = new Map(
      options.providers.map((p) => [
        p,
        providerConfigSchema.parse(
          { ...(options.providerConfig?.[p] ?? PROVIDER_DEFAULTS), ...(p === "contextdev" ? { concurrency: 1 } : {}) },
        ),
      ]),
    );
    const states = new Map(
      options.providers.map((provider) => {
        const config = configs.get(provider) ?? PROVIDER_DEFAULTS;
        return [
          provider,
          {
            spent: 0,
            apiSpent: 0,
            apiPending: 0,
            apiInFlight: 0,
            reserved: 0,
            taskGate: new Gate(config.concurrency, 1e6, config.concurrency),
            callGate: new Gate(
              config.concurrency,
              config.perSecond,
              config.burst,
            ),
            config,
          },
        ];
      }),
    );
    type Cost = {
      apiUsd: number;
      modelUsd: number;
      toolCalls: number;
      toolMs: number;
    };
    const ledger = new Map<string, Cost>();
    const applyLedger = (
      row: Pick<RunResult, "taskId" | "provider" | "lane" | "mode">,
      kind: string,
      usd: number,
      ms = 0,
    ) => {
      const key = resultKey(row);
      const cost = ledger.get(key) ?? {
        apiUsd: 0,
        modelUsd: 0,
        toolCalls: 0,
        toolMs: 0,
      };
      if (kind.startsWith("provider")) {
        cost.apiUsd += usd;
        if (kind === "provider-dispatch") cost.toolCalls++;
        if (kind === "provider") cost.toolMs += ms;
      } else cost.modelUsd += usd;
      ledger.set(key, cost);
    };
    // Dispatch reservations survive interruption; settlement records reconcile actual charges.
    try {
      const logs = await storage.lines("calls.jsonl");
      const ledgerSchema = z.object({
        taskId: z.string(),
        provider: z.enum([
          "contextdev",
          "firecrawl",
          "tinyfish",
          "exa",
          "tavily",
          "parallel",
          "jina",
          "spider",
          "linkup",
          "perplexity",
          "brightdata",
          "scrapfly",
          "browserbase",
          "fake",
          "none",
          "oracle",
        ]),
        lane: z.enum(["default", "tuned"]),
        mode: z.enum(["agent", "raw"]),
        kind: z.string(),
        ms: z.number().default(0),
        billedUsd: z.number().default(0),
      });
      for (const value of logs) {
        const event = ledgerSchema.parse(value);
        if (event.kind === "provider-reuse") continue;
        for (const [id, state] of states)
          if (id === event.provider) { state.spent += event.billedUsd; if (event.kind.startsWith("provider")) state.apiSpent += event.billedUsd; }
        applyLedger(event, event.kind, event.billedUsd, event.ms);
      }
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      )
        throw error;
    }
    // Cache only the first agent call for this task. Track schemas canonicalize
    // object order and default arguments; no URL/query rewriting is permitted.
    const firstCalls = new Map<string, { args: string; outcome: ToolOutcome; privatePath: string }>();
    const firstDispatches = new Map<string, string>();
    const pairKey = (taskId: string, provider: RunProvider) => JSON.stringify([provider, taskId]);
    const normalizedArgs = (task: Task, args: unknown) => JSON.stringify(argsSchemas[task.track].parse(args));
    const cachedEvent = z.object({ kind: z.string(), mode: z.string(), taskId: z.string(), provider: z.string(), callId: z.string().optional(), request: z.unknown(), privatePath: z.string().optional(), responseHash: z.string().optional() });
    for (const value of await storage.lines("calls.jsonl")) {
      const event = cachedEvent.safeParse(value);
      if (!event.success || event.data.mode !== "agent" || !event.data.callId) continue;
      const task = tasks.find(t => t.id === event.data.taskId);
      const provider = options.providers.find(p => p === event.data.provider);
      if (!task || !provider) continue;
      const key = pairKey(task.id, provider);
      if (event.data.kind === "provider-dispatch" && !firstDispatches.has(key)) firstDispatches.set(key, event.data.callId);
      if (options.mode !== "both" || completed.has(resultKey({ taskId: task.id, provider, lane: options.lane, mode: "raw" }))) continue;
      if (event.data.kind !== "provider" || event.data.callId !== firstDispatches.get(key) || !event.data.privatePath) continue;
      const body = await readFile(join(options.root ?? "results", event.data.privatePath), "utf8");
      if (createHash("sha256").update(body).digest("hex") !== event.data.responseHash) throw new Error("Cached response hash mismatch");
      firstCalls.set(key, {
        args: normalizedArgs(task, event.data.request),
        outcome: outcomeSchema.parse(JSON.parse(body)),
        privatePath: event.data.privatePath,
      });
    }
    const agentJobs = new Map<string, Promise<void>>();
    const globalGate = new Gate(options.concurrency, 1e6, options.concurrency);
    let count = 0;
    let skipped = 0;
    const jobs: { task: Task; provider: RunProvider; mode: "agent" | "raw" }[] =
      [];
    for (const task of tasks)
      for (const provider of shuffle(options.providers, rng))
        for (const mode of options.mode === "both"
          ? (["agent", "raw"] satisfies ("agent" | "raw")[])
          : [options.mode]) {
          if (
            completed.has(
              resultKey({
                taskId: task.id,
                provider,
                lane: options.lane,
                mode,
              }),
            )
          ) {
            skipped++;
            continue;
          }
          jobs.push({ task, provider, mode });
        }
    const rows = [...existing];
    const outcomes = await Promise.allSettled(
      jobs.map((job) => {
        const key = pairKey(job.task.id, job.provider);
        const previousAgent = job.mode === "raw" ? agentJobs.get(key) : undefined;
        const pending = (async () => {
          // Wait outside both gates so a raw task cannot deadlock its agent.
          await previousAgent;
          await globalGate.run(async () => {
          const state = states.get(job.provider);
          if (!state) throw new Error("Missing provider state");
          await state.taskGate.run(async () => {
            const { task, provider, mode } = job;
            const adapter = selected.get(provider) ?? null;
            const limits = TRACK_LIMITS[task.track];
            while (
              state.config.maxUsd - state.spent - state.reserved <= 0 &&
              state.reserved > 0
            )
              await delay(10);
            const previousCost = ledger.get(
              resultKey({
                taskId: task.id,
                provider,
                lane: options.lane,
                mode,
              }),
            );
            const previousTaskUsd =
              (previousCost?.apiUsd ?? 0) + (previousCost?.modelUsd ?? 0);
            const allowance = Math.max(
              0,
              Math.min(
                Math.max(0, limits.usd - previousTaskUsd),
                state.config.maxUsd - state.spent - state.reserved,
              ),
            );
            state.reserved += allowance;
            const startedAt = new Date().toISOString();
            const start = performance.now();
            const signal = AbortSignal.timeout(limits.ms);
            const base = {
              taskId: task.id,
              provider,
              lane: options.lane,
              mode,
              client: options.client,
              startedAt,
              track: task.track,
              family: task.family,
              site: task.site,
              cohort:
                provider === "fake"
                  ? "fake"
                  : provider === "none" || provider === "oracle"
                    ? "control"
                    : (adapter?.cohort ?? "control"),
            };
            let taskSpent = 0;
            let persistenceError: unknown = null;
            const log = async (
              event: { kind: string; ms?: number; [key: string]: unknown },
              billedUsd = 0,
            ) => {
              try {
                await storage.jsonl("calls.jsonl", {
                  ...base,
                  ...event,
                  billedUsd,
                });
              } catch (error) {
                persistenceError = error;
                throw error;
              }
              state.spent += billedUsd;
              if (event.kind.startsWith("provider")) state.apiSpent += billedUsd;
              taskSpent += billedUsd;
              applyLedger(base, event.kind, billedUsd, event.ms);
            };
            const maxCallUsd = ["fake", "none", "oracle"].includes(provider)
              ? 0
              : options.providerConfig?.[provider]?.maxCallUsd;
            if (maxCallUsd === undefined)
              throw new Error(
                `Configure maxCallUsd for ${provider} before dispatching billed provider calls`,
              );
            const callTool = async (
              args: unknown,
              ctx: Parameters<typeof invoke>[3],
            ) =>
              state.callGate.run(async () => {
                const parsedArgs = argsSchemas[task.track].parse(args);
                if ("limit" in parsedArgs && parsedArgs.limit > 10)
                  throw new Error("Search result limit exceeds frozen workload");
                if ("maxPages" in parsedArgs && typeof parsedArgs.maxPages === "number" && task.input.track === "crawl" && parsedArgs.maxPages > task.input.maxPages)
                  throw new Error("Crawl page limit exceeds frozen workload");
                const apiCap = options.providerConfig?.[provider]?.apiMaxUsd ?? Infinity;
                while (state.apiSpent + state.apiPending + maxCallUsd > apiCap + 1e-9) {
                  // In-flight dispatches retain their upper bound until settlement.
                  // Wait when that temporary reservation alone blocks an affordable call.
                  const settledUsd = state.apiSpent + state.apiPending - state.apiInFlight;
                  if (state.apiInFlight <= 1e-9 || settledUsd + maxCallUsd > apiCap + 1e-9)
                    throw new Error("Provider call exceeds remaining budget");
                  await delay(10, undefined, { signal: ctx.signal });
                }
                if (maxCallUsd > allowance - taskSpent)
                  throw new Error("Provider call exceeds remaining budget");
                state.apiPending += maxCallUsd;
                state.apiInFlight += maxCallUsd;
                let dispatchPending = true;
                try {
                const callId = randomUUID();
                const firstKey = pairKey(task.id, provider);
                if (mode === "agent" && !firstDispatches.has(firstKey)) firstDispatches.set(firstKey, callId);
                await log(
                  {
                    kind: "provider-dispatch",
                    callId,
                    request: safeParams(args),
                    status: "pending",
                    billing: {
                      usd: maxCallUsd,
                      basis: "list-price-estimate",
                      uncertain: true,
                    },
                  },
                  maxCallUsd,
                );
                state.apiPending -= maxCallUsd;
                dispatchPending = false;
                const dispatchedOutcome = adapter
                  ? await invoke(adapter, task.track, args, ctx, maxCallUsd)
                  : ({
                      kind: "error",
                      error: "unsupported",
                      message: "No tool control",
                      status: null,
                      ms: 0,
                      billing: { usd: 0, basis: "list-price", credits: null },
                    } satisfies Awaited<ReturnType<typeof invoke>>);
                // A remote crawl can continue after a polling/parser failure.
                // Intermediate usage is not a settled final bill.
                const outcome = task.track === "crawl" && dispatchedOutcome.kind === "error"
                  ? { ...dispatchedOutcome, billing: { ...dispatchedOutcome.billing, usd: Math.max(maxCallUsd, dispatchedOutcome.billing.usd) } }
                  : dispatchedOutcome;
                const stored = await storage.privateBody(outcome);
                const key = pairKey(task.id, provider);
                if (mode === "agent" && firstDispatches.get(key) === callId) firstCalls.set(key, { args: normalizedArgs(task, args), outcome, privatePath: stored.privatePath });
                await log(
                  {
                    kind: "provider",
                    callId,
                    request: safeParams(args),
                    status: outcome.kind === "ok" ? "ok" : outcome.status,
                    ms: outcome.ms,
                    billing: outcome.billing,
                    errorClass: outcome.kind === "error" ? outcome.error : null,
                    ...stored,
                    billingUncertain:
                      billingUncertain(outcome.billing) || (outcome.kind === "error" && outcome.status === null),
                  },
                  outcome.billing.usd - maxCallUsd,
                );
                return outcome;
                } finally {
                  if (dispatchPending) state.apiPending -= maxCallUsd;
                  state.apiInFlight -= maxCallUsd;
                }
              }, ctx.signal);
            const model = new ModelClient({
              baseUrl: options.modelBaseUrl,
              token: options.modelToken,
              telemetry: async (event) => {
                if (event.kind === "model-dispatch") {
                  if (event.estimatedUsd > allowance - taskSpent)
                    throw new Error("Provider call exceeds remaining budget");
                  await log(
                    { ...event, billingUncertain: true },
                    event.estimatedUsd,
                  );
                } else if (event.kind === "model") {
                  const stored = await storage.privateBody({
                    request: event.request,
                    response: event.response,
                  });
                  await log(
                    {
                      kind: "model",
                      callId: event.callId,
                      request: {
                        model: event.call.model,
                        temperature: 0,
                        max_tokens: MAX_ANSWER_TOKENS,
                      },
                      status: "ok",
                      ms: event.call.ms,
                      billing: {
                        usd: event.call.modelUsd,
                        basis: "list-price-estimate",
                      },
                      usage: event.call,
                      errorClass: null,
                      ...stored,
                    },
                    event.call.modelUsd - event.estimatedUsd,
                  );
                } else if (event.kind === "model-error")
                  await log(
                    {
                      ...event,
                      errorClass: signal.aborted ? "timeout" : "other",
                    },
                    event.status !== null &&
                      event.status >= 400 &&
                      event.status < 500
                      ? -event.estimatedUsd
                      : 0,
                  );
                else
                  await log({ ...event, errorClass: "model-proxy-transport" });
              },
            });
            let row: RunResult;
            try {
              if (allowance <= 0)
                row = {
                  ...base,
                  success: false,
                  fields: [],
                  toolCalls: 0,
                  toolMs: 0,
                  totalMs: performance.now() - start,
                  apiUsd: 0,
                  modelUsd: 0,
                  errors: [],
                  modelCalls: [],
                  truncations: [],
                  limitReason: "provider-budget-limit",
                  applicability:
                    mode === "raw" && !rawApplicable(task.expected, task.track)
                      ? "n/a"
                      : "graded",
                };
              else if (
                (provider === "oracle" && task.track !== "scrape") ||
                (provider === "none" && mode === "raw")
              )
                row = {
                  ...base,
                  success: false,
                  fields: [],
                  toolCalls: 0,
                  toolMs: 0,
                  totalMs: performance.now() - start,
                  apiUsd: 0,
                  modelUsd: 0,
                  errors: [],
                  modelCalls: [],
                  truncations: [],
                  limitReason: null,
                  applicability: "n/a",
                };
              else if (mode === "agent") {
                const result = await runAgent({
                  task,
                  adapter,
                  lane: options.lane,
                  client: model,
                  callTool,
                  signal,
                  budgetUsd: allowance,
                });
                // Answers are already represented field by field; the complete response stays private.
                const { answer, ...publicResult } = result;
                void answer;
                row = {
                  ...base,
                  ...publicResult,
                  totalMs: performance.now() - start,
                  applicability: "graded",
                };
              } else {
                const cached = options.mode === "both" ? firstCalls.get(pairKey(task.id, provider)) : undefined;
                const reused = cached?.args === normalizedArgs(task, initialArgs(task.input)) ? cached : undefined;
                const outcome = reused ? reused.outcome : await callTool(initialArgs(task.input), {
                  lane: options.lane,
                  timeoutMs: limits.ms,
                  signal,
                });
                if (reused) await storage.jsonl("calls.jsonl", { ...base, kind: "provider-reuse", billedUsd: 0, request: safeParams(initialArgs(task.input)), privatePath: reused.privatePath, imputedApiUsd: outcome.billing.usd });
                const graded: ReturnType<typeof gradeRaw> =
                  outcome.kind === "ok"
                    ? gradeRaw(task.expected, outcome.data)
                    : {
                        applicability: rawApplicable(task.expected, task.track)
                          ? "graded"
                          : "n/a",
                        fields: [],
                      };
                row = {
                  ...base,
                  ...graded,
                  success:
                    outcome.kind === "ok" &&
                    graded.applicability === "graded" &&
                    graded.fields.every((f) => f.pass) &&
                    outcome.billing.usd <= allowance &&
                    !signal.aborted,
                  toolCalls: 1,
                  toolMs: outcome.ms,
                  totalMs: outcome.ms,
                  apiUsd: outcome.billing.usd,
                  modelUsd: 0,
                  errors: outcome.kind === "error" ? [outcome.error] : [],
                  modelCalls: [],
                  truncations: [],
                  limitReason:
                    outcome.billing.usd > allowance ? "task-cost-limit" : null,
                };
              }
            } catch (error) {
              if (persistenceError) throw persistenceError;
              row = {
                ...base,
                success: false,
                fields: [],
                toolCalls: 0,
                toolMs: 0,
                totalMs: performance.now() - start,
                apiUsd: 0,
                modelUsd: 0,
                errors: [signal.aborted ? "timeout" : "other"],
                modelCalls: [],
                truncations: [],
                limitReason:
                  error instanceof Error &&
                  error.message === "Provider call exceeds remaining budget"
                    ? "provider-budget-limit"
                    : null,
                applicability:
                  mode === "raw" && !rawApplicable(task.expected, task.track)
                    ? "n/a"
                    : "graded",
              };
            } finally {
              state.reserved -= allowance;
            }
            if (persistenceError) throw persistenceError;
            const cost = ledger.get(resultKey(base));
            if (cost)
              row = {
                ...row,
                apiUsd: Math.max(0, cost.apiUsd),
                modelUsd: Math.max(0, cost.modelUsd),
                toolCalls: cost.toolCalls,
                toolMs: cost.toolMs,
              };
            if (row.apiUsd + row.modelUsd > limits.usd)
              row = { ...row, success: false, limitReason: "task-cost-limit" };
            if (row.totalMs > limits.ms)
              row = {
                ...row,
                success: false,
                errors: [...row.errors, "timeout"],
                limitReason: "task-time-limit",
              };
            await storage.jsonl("results.jsonl", row);
            rows.push(row);
            count++;
          });
          });
        })();
        if (job.mode === "agent") agentJobs.set(key, pending);
        return pending;
      }),
    );
    const rejected = outcomes.find((result) => result.status === "rejected");
    if (rejected?.status === "rejected") throw rejected.reason;
    // Account for charged calls left behind by an interrupted attempt in report costs.
    const spend = Object.fromEntries(
      [...states].map(([p, s]) => [
        p,
        {
          usd: s.spent,
          apiUsd: s.apiSpent,
          modelUsd: s.spent - s.apiSpent,
          maxUsd: s.config.maxUsd,
          reached: s.spent >= s.config.maxUsd,
        },
      ]),
    );
    const reportRows = rows.map((row) => {
      const cost = ledger.get(resultKey(row));
      return cost
        ? {
            ...row,
            apiUsd: Math.max(0, cost.apiUsd),
            modelUsd: Math.max(0, cost.modelUsd),
          }
        : row;
    });
    const errorSchema = z.object({
      kind: z.string(),
      errorClass: z.string().nullable().optional(),
    });
    const callErrors: Record<string, number> = {};
    for (const event of await storage.lines("calls.jsonl")) {
      const parsed = errorSchema.parse(event);
      if (parsed.errorClass)
        callErrors[parsed.errorClass] =
          (callErrors[parsed.errorClass] ?? 0) + 1;
    }
    const summary = {
      ...summarize(reportRows, options.seed),
      providerSpend: spend,
      callErrors,
    };
    await writeFile(
      join(storage.directory, "summary.json"),
      JSON.stringify(summary, null, 2) + "\n",
    );
    await writeFile(join(storage.directory, "RESULTS.md"), markdown(summary));
    await writeFile(
      join(storage.directory, "budget.json"),
      JSON.stringify(spend, null, 2) + "\n",
    );
    return { directory: storage.directory, completed: count, skipped };
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
