import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { you } from './you.ts';
import { invoke } from '../agent/tools.ts';
import type { CallContext } from '../core/types.ts';
const ctx: CallContext = { lane: 'default', timeoutMs: 1000, signal: new AbortController().signal };
afterEach(() => mock.restoreAll());
function key() { mock.property(process, 'env', { ...process.env, YDC_API_KEY: 'test-only-placeholder' }); }
test('You Search uses bounded GET without billable extraction and retains snippets', async () => {
  key();
  mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(input), 'https://ydc-index.io/v1/search?query=example&count=100');
    assert.equal(init?.method, 'GET');
    assert.equal(new Headers(init?.headers).get('X-API-Key'), 'test-only-placeholder');
    return Response.json({ results: { web: [{ url: 'https://example.org/', title: 'Example', description: 'Description', snippets: ['Answer'] }] } });
  });
  assert.ok(you.search);
  const result = await you.search({ query: 'example', limit: 999 }, ctx);
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok' && result.data.track === 'search') assert.equal(result.data.hits[0]?.snippet, 'Description\nAnswer');
  assert.equal(result.billing.usd, 0.005);
});
test('You Contents sends one URL and captures list usage', async () => {
  key();
  mock.method(globalThis, 'fetch', async (_input: string | URL | Request, init?: RequestInit) => {
    assert.deepEqual(JSON.parse(String(init?.body)), { urls: ['https://example.org/'], formats: ['markdown'] });
    return Response.json([{ url: 'https://example.org/', markdown: '# Example' }]);
  });
  assert.ok(you.scrape);
  const result = await you.scrape({ url: 'https://example.org/' }, ctx);
  assert.equal(result.kind, 'ok'); assert.equal(result.billing.usd, 0.001);
});
test('You failures retain reservation and do not retry', async () => {
  key(); const request = mock.method(globalThis, 'fetch', async () => Response.json({ message: 'limit' }, { status: 429 }));
  const result = await invoke(you, 'search', { query: 'example', limit: 5 }, ctx, 0.005);
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') assert.equal(result.error, 'rate-limited');
  assert.equal(result.billing.usd, 0.005); assert.equal(request.mock.callCount(), 1);
});
test('You rejects malformed content without refunding the reservation', async () => {
  key(); mock.method(globalThis, 'fetch', async () => Response.json({ pages: [] }));
  const result = await invoke(you, 'scrape', { url: 'https://example.org/' }, ctx, 0.001);
  assert.equal(result.kind, 'error'); assert.equal(result.billing.usd, 0.001);
});
