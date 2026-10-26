// The agent replay: Claude Haiku 5.5 answers each task from the provider calls it made in the original
// run, but can read every byte of every response through read_more. No provider is ever called.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { SYSTEM_PROMPT } from "../src/agent/index.ts";
import { neutralTool } from "../src/agent/tools.ts";
import { gradeAnswer } from "../src/grade/index.ts";
import { TRACK_LIMITS } from "../src/run/config.ts";
import type { ModelClient, Message, Tool } from "../src/model/index.ts";
import type { FieldVerdict, Task, ToolOutcome } from "../src/core/types.ts";
import { paginate, renderOutcome } from "./render.ts";
import { parseAnswer, parsesStrictly } from "./parser.ts";

export const READ_LIMIT_BYTES = 256_000;
export const MAX_TURNS = 12;
export const REPLAY_PROMPT = `${SYSTEM_PROMPT} Long tool results arrive in pages; call read_more to see other pages.`;

const READ_MORE: Tool = {
  type: "function",
  function: {
    name: "read_more",
    description: "Read another page of an earlier tool result. Pages are numbered from 1.",
    parameters: {
      type: "object",
      properties: { call: { type: "integer", minimum: 1 }, page: { type: "integer", minimum: 1 } },
      required: ["call", "page"],
      additionalProperties: false,
    },
  },
};
const readMoreArgs = z.object({ call: z.number().int(), page: z.number().int() });

/** The one model-client method the replay needs, so tests can script the model. */
export type Completer = Pick<ModelClient, "complete">;

/** One stored response the replay may serve, in original call order. */
export type ReplayCall = { readonly outcome: ToolOutcome; readonly args: unknown };

export type ReplayResult = {
  readonly success: boolean;
  readonly fields: readonly FieldVerdict[];
  readonly parse: "answer" | "no-object" | "several-objects";
  readonly strictParse: boolean;
  readonly answer: unknown;
  /** How many stored provider calls the agent asked for and received. */
  readonly callsServed: number;
  /** Requests whose arguments differed from the stored call they were served. */
  readonly argMismatches: number;
  readonly pagesRead: number;
  readonly bytesRead: number;
  readonly hitReadLimit: boolean;
  readonly turns: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly modelUsd: number;
  readonly modelMs: number;
  readonly providerUsd: number;
  readonly providerMs: number;
};

/** Drops a repeat of an earlier call with identical arguments when the earlier one succeeded. */
export function replayableCalls(calls: readonly ReplayCall[]): ReplayCall[] {
  const kept: ReplayCall[] = [];
  for (const call of calls) {
    const key = stableJson(call.args);
    if (kept.some((k) => stableJson(k.args) === key && k.outcome.kind === "ok")) continue;
    kept.push(call);
  }
  return kept;
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object" && value !== null)
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

/** Model calls are cached by request hash, so a rerun reproduces every answer without calling the proxy. */
export class ModelCache {
  private readonly dir: string;
  private readonly client: Completer | null;
  constructor({ dir, client }: { dir: string; client: Completer | null }) {
    this.dir = dir;
    this.client = client;
  }
  static readonly entry = z.object({
    message: z.object({
      role: z.literal("assistant"),
      content: z.string().nullable(),
      tool_calls: z.array(z.object({ id: z.string(), type: z.literal("function"), function: z.object({ name: z.string(), arguments: z.string() }) })).optional(),
    }),
    call: z.object({ inputTokens: z.number(), outputTokens: z.number(), modelUsd: z.number(), ms: z.number() }),
  });
  hits = 0;
  misses = 0;
  async complete(args: { messages: readonly Message[]; tools: readonly Tool[]; forceAnswer: boolean }) {
    const key = createHash("sha256").update(stableJson({ model: "claude-haiku-5-5", temperature: 0, max_tokens: 4096, ...args })).digest("hex");
    const path = join(this.dir, key.slice(0, 2), `${key}.json`);
    try {
      const cached = ModelCache.entry.parse(JSON.parse(await readFile(path, "utf8")));
      this.hits++;
      return cached;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    if (!this.client) throw new Error("Model cache miss with no client: rerun with the replay stage enabled");
    const response = await this.client.complete({ ...args, signal: AbortSignal.timeout(120_000) });
    this.misses++;
    const entry = ModelCache.entry.parse({
      message: { role: "assistant", content: response.message.content, ...(response.message.tool_calls ? { tool_calls: response.message.tool_calls } : {}) },
      call: response.call,
    });
    await mkdir(join(this.dir, key.slice(0, 2)), { recursive: true, mode: 0o700 });
    await writeFile(path, JSON.stringify(entry), { mode: 0o600 });
    return entry;
  }
}

export async function replayTask({ task, calls, cache }: { task: Task; calls: readonly ReplayCall[]; cache: ModelCache }): Promise<ReplayResult> {
  const providerTool = neutralTool(task.track);
  const pages: string[][] = [];
  const messages: Message[] = [
    { role: "system", content: REPLAY_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        instruction: task.instruction,
        input: task.input,
        fields: task.expected.map((f) => ({ name: f.name, type: f.kind })),
        maxToolCalls: TRACK_LIMITS[task.track].calls,
      }),
    },
  ];
  let served = 0;
  let argMismatches = 0;
  let pagesRead = 0;
  let bytesRead = 0;
  let hitReadLimit = false;
  let inputTokens = 0;
  let outputTokens = 0;
  let modelUsd = 0;
  let modelMs = 0;
  let content = "";
  let turns = 0;

  const deliver = (text: string) => {
    const bytes = Buffer.byteLength(text, "utf8");
    if (bytesRead + bytes > READ_LIMIT_BYTES) {
      hitReadLimit = true;
      return "Reading limit reached. Answer with the evidence you have.";
    }
    bytesRead += bytes;
    pagesRead++;
    return text;
  };
  const header = (call: number, page: number) => {
    const list = pages[call - 1] ?? [];
    const total = Buffer.byteLength(list.join(""), "utf8");
    const more = page < list.length ? ` Call read_more with call=${call} and page=${page + 1} for the next page.` : "";
    return `[call ${call}, page ${page} of ${list.length}, ${total.toLocaleString("en-US")} bytes total.${more}]\n`;
  };

  for (turns = 1; turns <= MAX_TURNS; turns++) {
    const tools = served < calls.length ? [providerTool, READ_MORE] : [READ_MORE];
    const response = await cache.complete({ messages, tools, forceAnswer: turns === MAX_TURNS });
    inputTokens += response.call.inputTokens;
    outputTokens += response.call.outputTokens;
    modelUsd += response.call.modelUsd;
    modelMs += response.call.ms;
    messages.push(response.message);
    const requests = response.message.tool_calls ?? [];
    if (!requests.length) {
      content = response.message.content ?? "";
      break;
    }
    for (const request of requests) {
      let reply: string;
      if (request.function.name === task.track && served < calls.length) {
        const call = calls[served];
        if (!call) throw new Error("Unreachable: served index checked above");
        served++;
        let requested: unknown = null;
        try {
          requested = JSON.parse(request.function.arguments);
        } catch {
          requested = request.function.arguments;
        }
        if (stableJson(requested) !== stableJson(call.args)) argMismatches++;
        pages.push(paginate(renderOutcome(call.outcome)));
        reply = header(served, 1) + (pages[served - 1]?.[0] ?? "");
        reply = deliver(reply);
      } else if (request.function.name === task.track) {
        reply = "No more provider calls are available. Use read_more or answer.";
      } else if (request.function.name === "read_more") {
        const parsed = readMoreArgs.safeParse((() => {
          try {
            return JSON.parse(request.function.arguments);
          } catch {
            return null;
          }
        })());
        const page = parsed.success ? pages[parsed.data.call - 1]?.[parsed.data.page - 1] : undefined;
        reply = parsed.success && page !== undefined ? deliver(header(parsed.data.call, parsed.data.page) + page) : "No such call or page.";
      } else {
        reply = `Unknown tool ${request.function.name}.`;
      }
      messages.push({ role: "tool", tool_call_id: request.id, content: reply });
    }
  }

  const names = task.expected.map((f) => f.name);
  const parsed = parseAnswer(content, names);
  const answer = parsed.kind === "answer" ? parsed.value : null;
  const fields = gradeAnswer(task.expected, answer);
  const used = calls.slice(0, served);
  // Crawl's headline is page discovery; its titles are reported on their own.
  const headline = task.track === "crawl" ? fields.filter((f) => task.expected.some((e) => e.name === f.name && e.kind === "url-set")) : fields;
  return {
    success: parsed.kind === "answer" && headline.length > 0 && headline.every((f) => f.pass),
    fields,
    parse: parsed.kind,
    strictParse: parsesStrictly(content, names),
    answer,
    callsServed: served,
    argMismatches,
    pagesRead,
    bytesRead,
    hitReadLimit,
    turns: Math.min(turns, MAX_TURNS),
    inputTokens,
    outputTokens,
    modelUsd,
    modelMs,
    providerUsd: used.reduce((sum, c) => sum + c.outcome.billing.usd, 0),
    providerMs: used.reduce((sum, c) => sum + c.outcome.ms, 0),
  };
}
