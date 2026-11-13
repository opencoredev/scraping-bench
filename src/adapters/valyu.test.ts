import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { valyu } from './valyu.ts';
import { pricing } from './pricing.ts';
const ctx = (lane: 'default' | 'tuned' = 'default') => ({ lane, timeoutMs: 20000, signal: new AbortController().signal });
const url = 'https://fixture.invalid/docs/guide';
afterEach(() => mock.restoreAll());
function routes(responses: Response[]) {
  mock.property(process, 'env', { ...process.env, VALYU_API_KEY: 'test-only-placeholder' });
  const queue = [...responses];
  return mock.method(globalThis, 'fetch', async () => queue.shift() ?? Response.json({ error: 'unexpected' }, { status: 500 }));
}
const call = (request: ReturnType<typeof routes>, index: number) => {
  const [target, init] = request.mock.calls[index]?.arguments ?? [];
  return { target: String(target), headers: new Headers(init?.headers), body: init?.body ? JSON.parse(String(init.body)) : null };
};

test('Valyu scrape returns the page Markdown and the reported charge', async () => {
  const request = routes([Response.json({ success: true, total_cost_dollars: 0.00125, results: [{ url, title: 'Guide', content: '# Guide\n\nBody', status: 'success' }] })]);
  assert.ok(valyu.scrape);
  const result = await valyu.scrape({ url }, ctx());
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') {
    assert.deepEqual(result.data, { track: 'scrape', markdown: '# Guide\n\nBody', finalUrl: url });
    assert.deepEqual(result.billing, { usd: 0.00125, basis: 'reported', credits: null });
  }
  const sent = call(request, 0);
  assert.equal(sent.target, 'https://api.valyu.ai/v1/contents');
  assert.equal(sent.headers.get('x-api-key'), 'test-only-placeholder');
  assert.deepEqual(sent.body, { urls: [url] });
});

test('Valyu scrape asks for high extraction effort in the tuned lane', async () => {
  const request = routes([Response.json({ success: true, total_cost_dollars: 0.00125, results: [{ url, title: 'Guide', content: '# Guide', status: 'success' }] })]);
  assert.ok(valyu.scrape);
  await valyu.scrape({ url }, ctx('tuned'));
  assert.deepEqual(call(request, 0).body, { urls: [url], extract_effort: 'high' });
});

test('Valyu scrape fails a URL that the API marks as failed', async () => {
  routes([Response.json({ success: false, error: 'Failed to fetch content', total_cost_dollars: 0, results: [{ url, title: '', content: null, status: 'failed' }] })]);
  assert.ok(valyu.scrape);
  const result = await valyu.scrape({ url }, ctx());
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') { assert.match(result.message, /Failed to fetch content/); assert.equal(result.billing.usd, 0); }
});

test('Valyu scrape fails when no result comes back and uses the list price', async () => {
  routes([Response.json({ success: false, error: null, results: [] })]);
  assert.ok(valyu.scrape);
  const result = await valyu.scrape({ url }, ctx());
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') { assert.match(result.message, /No page content/); assert.equal(result.billing.usd, pricing.valyu.contents); }
});

test('Valyu search caps the result count and maps the hits', async () => {
  const request = routes([Response.json({ success: true, total_deduction_dollars: 0.0123, results: [
    { url, title: 'Guide', description: 'How to start', content: 'Full page text', publication_date: '2026-10-01' },
    { url: `${url}/two`, title: 'Two', description: null, content: null, publication_date: null },
  ] })]);
  assert.ok(valyu.search);
  const result = await valyu.search({ query: 'guide', limit: 50 }, ctx());
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') {
    assert.deepEqual(result.data, { track: 'search', hits: [
      { url, title: 'Guide', snippet: 'How to start', content: 'Full page text', publishedAt: '2026-10-01' },
      { url: `${url}/two`, title: 'Two', snippet: '', content: null, publishedAt: null },
    ] });
    assert.deepEqual(result.billing, { usd: 0.0123, basis: 'reported', credits: null });
  }
  const sent = call(request, 0);
  assert.equal(sent.target, 'https://api.valyu.ai/v1/search');
  assert.deepEqual(sent.body, { query: 'guide', max_num_results: 20, max_price: 35, response_length: 4000 });
});

test('Valyu search passes structured content on as JSON text', async () => {
  routes([Response.json({ success: true, total_deduction_dollars: 0.001, results: [{ url, title: 'Data', description: '', content: { rows: [1, 2] }, publication_date: null }] })]);
  assert.ok(valyu.search);
  const result = await valyu.search({ query: 'data', limit: 5 }, ctx());
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok' && result.data.track === 'search') assert.equal(result.data.hits[0]?.content, '{"rows":[1,2]}');
});

test('Valyu returns an HTTP error status as an error', async () => {
  routes([Response.json({ success: false, error: 'Insufficient credits' }, { status: 402 })]);
  assert.ok(valyu.search);
  const result = await valyu.search({ query: 'guide', limit: 5 }, ctx());
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') assert.equal(result.status, 402);
});
