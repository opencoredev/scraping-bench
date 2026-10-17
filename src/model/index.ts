import { z } from "zod";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { Gate } from "../run/limits.ts";
export const MAX_ANSWER_TOKENS = 4096;
export const ANSWER_MODEL = "claude-haiku-5-5";
export const JUDGE_MODEL = "gpt-6.1-sol";
// USD per million tokens, list-price estimates, not proxy/subscription charges.
// Freeze/verify these estimates against vendor pricing before a published run.
export const MODEL_PRICING = {
  "claude-haiku-5-5": { input: 1, output: 5, basis: "list-price-estimate" },
  "gpt-6.1-sol": { input: 2.5, output: 15, basis: "list-price-estimate" },
} satisfies Record<string, { input: number; output: number; basis: string }>;
export type ModelId = keyof typeof MODEL_PRICING;
const toolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({ name: z.string(), arguments: z.string() }),
});
const messageSchema = z.object({
  role: z.literal("assistant"),
  content: z.string().nullable().default(null),
  tool_calls: z
    .array(toolCallSchema)
    .nullish()
    .transform((value) => value ?? undefined),
});
const responseSchema = z.object({
  choices: z.array(z.object({ message: messageSchema })).min(1),
  usage: z.object({
    prompt_tokens: z.number().nonnegative(),
    completion_tokens: z.number().nonnegative(),
  }),
});
export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: z.infer<typeof toolCallSchema>[];
};
export type Tool = {
  type: "function";
  function: { name: string; description: string; parameters: object };
};
export type ModelCall = {
  model: ModelId;
  inputTokens: number;
  outputTokens: number;
  modelUsd: number;
  ms: number;
  attempt: number;
  pricingBasis: "list-price-estimate";
};
export type ModelTelemetry = (
  event:
    | {
        kind: "model-dispatch";
        model: ModelId;
        callId: string;
        estimatedUsd: number;
        attempt: number;
      }
    | {
        kind: "model";
        request: object;
        response: unknown;
        call: ModelCall;
        callId: string;
        estimatedUsd: number;
      }
    | {
        kind: "model-error";
        model: ModelId;
        attempt: number;
        status: number | null;
        ms: number;
        callId: string;
        estimatedUsd: number;
      }
    | {
        kind: "model-transport-error";
        model: ModelId;
        attempt: number;
        status: number | null;
        ms: number;
        callId: string;
      },
) => Promise<void>;
const globalGate = new Gate(4, 4, 1);
export class ModelTransportError extends Error {
  readonly status: number | null;
  constructor(status: number | null) {
    super("Model proxy transport error");
    this.status = status;
  }
}
export class ModelClient {
  private readonly gate: Gate;
  private readonly options: {
    baseUrl?: string;
    token?: string;
    gate?: Gate;
    telemetry?: ModelTelemetry;
    retries?: number;
  };
  constructor(
    options: {
      baseUrl?: string;
      token?: string;
      gate?: Gate;
      telemetry?: ModelTelemetry;
      retries?: number;
    } = {},
  ) {
    this.options = options;
    this.gate = options.gate ?? globalGate;
  }
  estimate({
    model = ANSWER_MODEL,
    messages,
    maxTokens = MAX_ANSWER_TOKENS,
    tools = [],
  }: {
    model?: ModelId;
    messages: readonly Message[];
    maxTokens?: number;
    tools?: readonly Tool[];
  }): number {
    return (
      ((Buffer.byteLength(JSON.stringify({ messages, tools })) + 4096) *
        MODEL_PRICING[model].input +
        maxTokens * MODEL_PRICING[model].output) /
      1e6
    );
  }
  async complete(args: {
    messages: readonly Message[];
    tools?: readonly Tool[];
    model?: ModelId;
    maxTokens?: number;
    signal: AbortSignal;
    forceAnswer?: boolean;
  }): Promise<{ message: z.infer<typeof messageSchema>; call: ModelCall }> {
    const model = args.model ?? ANSWER_MODEL;
    const token = this.options.token ?? process.env.ANTHROPIC_AUTH_TOKEN;
    if (!token) throw new Error("ANTHROPIC_AUTH_TOKEN is required");
    const request = {
      model,
      temperature: 0,
      max_tokens: args.maxTokens ?? MAX_ANSWER_TOKENS,
      messages: args.messages,
      ...(args.tools?.length
        ? {
            tools: args.tools,
            tool_choice: args.forceAnswer ? "none" : "auto",
            parallel_tool_calls: false,
          }
        : {}),
    };
    for (let attempt = 0; ; attempt++) {
      const callId = randomUUID();
      const estimatedUsd = this.estimate({
        model,
        messages: args.messages,
        tools: args.tools,
        maxTokens: args.maxTokens,
      });
      const attemptStart = performance.now();
      let responseText: string | null = null;
      try {
        return await this.gate.run(async () => {
          const start = performance.now();
          await this.options.telemetry?.({
            kind: "model-dispatch",
            model,
            callId,
            estimatedUsd,
            attempt,
          });
          let response: Response;
          try {
            response = await fetch(
              `${this.options.baseUrl ?? "http://127.0.0.1:8317"}/v1/chat/completions`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
                signal: args.signal,
              },
            );
          } catch {
            if (args.signal.aborted) throw args.signal.reason;
            throw new ModelTransportError(null);
          }
          try {
            responseText = await response.text();
          } catch {
            if (args.signal.aborted) throw args.signal.reason;
            throw new ModelTransportError(null);
          }
          if (!response.ok) {
            if (
              response.status === 408 ||
              response.status === 429 ||
              response.status >= 500
            )
              throw new ModelTransportError(response.status);
            throw new Error(`Model proxy HTTP ${response.status}`);
          }
          const body: unknown = JSON.parse(responseText);
          const parsed = responseSchema.parse(body);
          const message = parsed.choices[0]?.message;
          if (!message) throw new Error("Missing model message");
          const call: ModelCall = {
            model,
            inputTokens: parsed.usage.prompt_tokens,
            outputTokens: parsed.usage.completion_tokens,
            modelUsd:
              (parsed.usage.prompt_tokens * MODEL_PRICING[model].input +
                parsed.usage.completion_tokens * MODEL_PRICING[model].output) /
              1e6,
            ms: performance.now() - start,
            attempt,
            pricingBasis: "list-price-estimate",
          };
          await this.options.telemetry?.({
            kind: "model",
            request,
            response: body,
            call,
            callId,
            estimatedUsd,
          });
          return { message, call };
        }, args.signal);
      } catch (error) {
        if (!(error instanceof ModelTransportError)) {
          const status =
            error instanceof Error
              ? Number(/Model proxy HTTP (\d+)/.exec(error.message)?.[1]) ||
                null
              : null;
          await this.options.telemetry?.({
            kind: "model-error",
            model,
            attempt,
            status,
            ms: performance.now() - attemptStart,
            callId,
            estimatedUsd,
          });
          throw error;
        }
        await this.options.telemetry?.({
          kind: "model-transport-error",
          model,
          attempt,
          status: error.status,
          ms: performance.now() - attemptStart,
          callId,
        });
        if (attempt >= (this.options.retries ?? 2)) throw error;
        await delay(250 * 2 ** attempt, undefined, { signal: args.signal });
      }
    }
  }
  // Diagnostics only. The agent and headline grader never call this method.
  judge(messages: readonly Message[], signal: AbortSignal) {
    return this.complete({ messages, signal, model: JUDGE_MODEL });
  }
}
