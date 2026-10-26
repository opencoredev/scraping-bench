import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installReplayNetworkGuard } from './replay.ts';
import { invoke } from '../agent/tools.ts';
import { ModelClient } from '../model/index.ts';
import { fakeAdapter } from '../testing/fake.ts';

test('replay blocks provider network and adapter dispatch before either can run', async () => {
  const events: string[] = [];
  const restore = installReplayNetworkGuard(async e => { events.push(e.kind); });
  try {
    await assert.rejects(fetch('https://api.firecrawl.dev/v2/crawl', { method: 'POST' }), /forbidden in replay/);
    await assert.rejects(fetch('http://127.0.0.1:8317/v1/models'), /forbidden in replay/);
    await assert.rejects(invoke(fakeAdapter, 'crawl', {}, { lane: 'default', timeoutMs: 1000, signal: AbortSignal.timeout(1000) }), /forbidden in replay/);
    assert.deepEqual(events, ['blocked-network-dispatch', 'blocked-network-dispatch']);
  } finally { restore(); }
});


test('replay keeps the strict JSON parser and original model request settings', async () => {
  const { parseAgentAnswer, SYSTEM_PROMPT } = await import('../agent/index.ts');
  const { storedModelSchema, replayStoredAnswer } = await import('./replay.ts');
  const task = (await import('../core/schema.ts')).taskSchema.parse({ id: 'crawl-example', track: 'crawl', family: 'records', site: 'example.com', instruction: 'Return urls', input: { track: 'crawl', site: 'https://example.com/', scope: '/', maxPages: 1 }, expected: [{ kind: 'url-set', name: 'urls', urls: ['https://example.com/'], minRecall: 1, minPrecision: 1 }], source: { kind: 'fixture', page: '/' } });
  assert.throws(() => parseAgentAnswer('Here is the answer: {"urls":["https://example.com/"]}', task));
  assert.deepEqual(parseAgentAnswer('```json\n{"urls":["https://example.com/"]}\n```', task), { urls: ['https://example.com/'] });
  const stored = storedModelSchema.parse({ request: { model: 'claude-haiku-5-5', temperature: 0, max_tokens: 4096, tools: [], tool_choice: 'none', parallel_tool_calls: false, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: 'unchanged task input' }, { role: 'tool', content: 'old evidence', tool_call_id: 'original-call' }] } });
  class Client extends ModelClient {
    override async complete(args: Parameters<ModelClient['complete']>[0]) {
      assert.deepEqual(args.messages.slice(0, 2), stored.request.messages.slice(0, 2));
      assert.equal(args.messages[2]?.tool_call_id, 'original-call');
      assert.equal(JSON.parse(args.messages[2]?.content ?? '').data.pages[0].title, 'Native title');
      assert.equal(args.forceAnswer, true);
      return { message: { role: 'assistant', content: 'Here is the answer: {"urls":["https://example.com/"]}', tool_calls: undefined }, call: { model: 'claude-haiku-5-5', inputTokens: 1, outputTokens: 1, modelUsd: .001, ms: 1, attempt: 0, pricingBasis: 'list-price-estimate' } } satisfies Awaited<ReturnType<ModelClient['complete']>>;
    }
  }
  const result = await replayStoredAnswer({ task, stored, priorModelUsd: 0, priorElapsedMs: 0, client: new Client(), outcome: { kind: 'ok', ms: 1, billing: { usd: 0, basis: 'list-price', credits: null }, data: { track: 'crawl', pages: [{ url: 'https://example.com/', markdown: 'HTML document title: Native title\n\nBody' }] } } });
  assert.equal(result.success, false);
  assert.equal(result.answer, null);
});
