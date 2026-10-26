import { z } from 'zod';
import { parseAgentAnswer, SYSTEM_PROMPT } from '../agent/index.ts';
import { crawlEvidence } from '../agent/evidence.ts';
import { gradeAnswer } from '../grade/index.ts';
import { ModelClient, ANSWER_MODEL, MAX_ANSWER_TOKENS, type Message } from '../model/index.ts';
import type { Task, ToolOutcome } from '../core/types.ts';
import { TRACK_LIMITS } from './config.ts';

const tool = z.object({ type: z.literal('function'), function: z.object({ name: z.string(), description: z.string(), parameters: z.record(z.string(), z.unknown()) }) });
const message = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']), content: z.string().nullable(), tool_call_id: z.string().optional(),
  tool_calls: z.array(z.object({ id: z.string(), type: z.literal('function'), function: z.object({ name: z.string(), arguments: z.string() }) })).optional(),
});
export const storedModelSchema = z.object({ request: z.object({
  model: z.literal(ANSWER_MODEL), temperature: z.literal(0), max_tokens: z.literal(MAX_ANSWER_TOKENS),
  messages: z.array(message), tools: z.array(tool), tool_choice: z.literal('none'), parallel_tool_calls: z.literal(false),
}) });

// Fail closed before fetch: replay has no provider credentials or adapter registry.
// Checking the full endpoint also prevents another loopback service being used.
export function installReplayNetworkGuard(onEvent: (event: { kind: string; endpoint: string }) => Promise<void>) {
  const original = globalThis.fetch;
  const previous = process.env.WEB_BENCH_REPLAY_ONLY;
  process.env.WEB_BENCH_REPLAY_ONLY = '1';
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.href !== 'http://127.0.0.1:8317/v1/chat/completions' || init?.method !== 'POST') {
      await onEvent({ kind: 'blocked-network-dispatch', endpoint: url.origin + url.pathname });
      throw new Error('Network provider dispatch forbidden in replay');
    }
    await onEvent({ kind: 'model-proxy-network-dispatch', endpoint: url.href });
    return original(input, { ...init, redirect: 'error' });
  };
  return () => {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.WEB_BENCH_REPLAY_ONLY;
    else process.env.WEB_BENCH_REPLAY_ONLY = previous;
  };
}

export async function replayStoredAnswer({ task, outcome, stored, client, priorModelUsd, priorElapsedMs }: {
  task: Task; outcome: ToolOutcome; stored: z.infer<typeof storedModelSchema>;
  client: ModelClient; priorModelUsd: number; priorElapsedMs: number;
}) {
  if (task.track !== 'crawl') throw new Error('Only crawl is eligible for this replay');
  const request = stored.request;
  if (request.messages[0]?.content !== SYSTEM_PROMPT) throw new Error('Stored prompt differs');
  const toolMessages = request.messages.filter(m => m.role === 'tool');
  if (toolMessages.length !== 1) throw new Error('Expected exactly one original crawl tool response');
  const output = crawlEvidence(outcome);
  const messages: Message[] = request.messages.map(m => m.role === 'tool' ? { ...m, content: output.text } : m);
  const limits = TRACK_LIMITS.crawl;
  if (priorElapsedMs >= limits.ms) throw new Error('Original task time allowance exhausted');
  const signal = AbortSignal.timeout(Math.max(1, Math.floor(limits.ms - priorElapsedMs))); 
  if (outcome.billing.usd + priorModelUsd + client.estimate({ messages, tools: request.tools }) > limits.usd)
    throw new Error('Replay exceeds original task allowance');
  const response = await client.complete({ messages, tools: request.tools, signal, forceAnswer: true });
  let answer: unknown = null;
  let parserFailure = false;
  try { answer = parseAgentAnswer(response.message.content ?? '', task); }
  catch { parserFailure = true; }
  const fields = gradeAnswer(task.expected, answer);
  const limitReason = outcome.billing.usd + priorModelUsd + response.call.modelUsd > limits.usd ? 'task-cost-limit' : null;
  return { success: !parserFailure && !limitReason && !signal.aborted && fields.every(f => f.pass), fields, answer, modelCalls: [response.call], modelUsd: response.call.modelUsd,
    errors: parserFailure ? ['other'] : [], truncations: [output.truncated], limitReason, evidenceBytes: output.tokenUpperBound };
}
