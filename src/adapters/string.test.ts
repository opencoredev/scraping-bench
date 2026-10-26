import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { billingUncertain } from './http.ts';
import { string } from './string.ts';
const ctx = { lane: 'default', timeoutMs: 10000, signal: new AbortController().signal } as const;
const url = 'https://fixture.invalid/docs/page';
afterEach(() => mock.restoreAll());
function respond(response: Response) {
  mock.property(process, 'env', { ...process.env, STRING_API_KEY: 'test-only-placeholder' });
  return mock.method(globalThis, 'fetch', async () => response);
}
const markdown = (body: string, headers: Record<string, string>, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/markdown; charset=utf-8', ...headers } });

test('String returns Markdown and bills by x-billed-request-type', async () => {
  const request = respond(markdown('# Page', { 'x-status-code': '200', 'x-final-url': `${url}/`, 'x-billed-request-type': 'browser_premium' }));
  assert.ok(string.scrape);
  const result = await string.scrape({ url }, ctx);
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') {
    assert.deepEqual(result.data, { track: 'scrape', markdown: '# Page', finalUrl: `${url}/` });
    assert.deepEqual(result.billing, { usd: 0.006, basis: 'reported', credits: null });
  }
  const [target, init] = request.mock.calls[0]?.arguments ?? [];
  assert.equal(target, 'https://request.usestring.ai/v1/fetch');
  assert.deepEqual(JSON.parse(String(init?.body)), { url, format: 'markdown' });
});

test('A destination 404 inside a 200 fails the page but is still billed', async () => {
  respond(markdown('Not found', { 'x-status-code': '404', 'x-billed-request-type': 'request_standard' }));
  assert.ok(string.scrape);
  const result = await string.scrape({ url }, ctx);
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') { assert.equal(result.status, 404); assert.equal(result.billing.usd, 0.0003); }
});

test('A billed 502 keeps its charge; an unbilled 401 costs nothing', async () => {
  respond(Response.json({ error: 'TargetCertificateError' }, { status: 502, headers: { 'x-billed-request-type': 'request_standard' } }));
  assert.ok(string.scrape);
  const billed = await string.scrape({ url }, ctx);
  assert.equal(billed.kind, 'error');
  if (billed.kind === 'error') { assert.equal(billed.error, 'http-5xx'); assert.equal(billed.billing.usd, 0.0003); }
  mock.restoreAll();
  respond(Response.json({ error: 'Invalid API key' }, { status: 401 }));
  const unbilled = await string.scrape({ url }, ctx);
  assert.equal(unbilled.kind, 'error');
  if (unbilled.kind === 'error') { assert.equal(unbilled.error, 'http-4xx'); assert.deepEqual(unbilled.billing, { usd: 0, basis: 'list-price', credits: null }); }
});

test('A transport failure before any response leaves the charge uncertain', async () => {
  mock.property(process, 'env', { ...process.env, STRING_API_KEY: 'test-only-placeholder' });
  mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  assert.ok(string.scrape);
  const result = await string.scrape({ url }, ctx);
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') { assert.equal(result.error, 'network'); assert.ok(billingUncertain(result.billing)); }
});

function routes(handlers: ((url: string, init: RequestInit | undefined) => Response | undefined)[]) {
  mock.property(process, 'env', { ...process.env, STRING_API_KEY: 'test-only-placeholder' });
  const queue = [...handlers];
  return mock.method(globalThis, 'fetch', async (input: string, init?: RequestInit) => {
    const handler = queue.shift();
    assert.ok(handler, `Unexpected request ${init?.method ?? 'GET'} ${input}`);
    const response = handler(input, init);
    assert.ok(response, `Unexpected request ${init?.method ?? 'GET'} ${input}`);
    return response;
  });
}

test('String search returns hits with URLs and bills one search per results page', async () => {
  const request = routes([() => Response.json({ results: [{ url: 'https://a.example/', title: 'A', snippet: 'first' }, { title: 'Redirect only', snippet: 'no url' }], zeroResults: false })]);
  assert.ok(string.search);
  const result = await string.search({ query: 'a thing', limit: 10 }, ctx);
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') {
    assert.deepEqual(result.data, { track: 'search', hits: [{ url: 'https://a.example/', title: 'A', snippet: 'first', content: null, publishedAt: null }] });
    assert.deepEqual(result.billing, { usd: 0.0015, basis: 'reported', credits: null });
  }
  assert.deepEqual(JSON.parse(String(request.mock.calls[0]?.arguments[1]?.body)), { query: 'a thing' });
});

test('A search asking for more than one page sends searchCount and bills every page', async () => {
  const request = routes([() => Response.json({ results: [{ url: 'https://a.example/', title: 'A', snippet: '' }], paging: { pages: 3, complete: true, stoppedBy: 'search_count' } })]);
  assert.ok(string.search);
  const result = await string.search({ query: 'q', limit: 25 }, ctx);
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') assert.ok(Math.abs(result.billing.usd - 0.0045) < 1e-12);
  assert.deepEqual(JSON.parse(String(request.mock.calls[0]?.arguments[1]?.body)), { query: 'q', searchCount: 25 });
});

const jobBase = 'https://request.usestring.ai/v1/sitemap/job-1';
test('String map scopes the sitemap job, drops sitemap files and bills the reported cost', async () => {
  const request = routes([
    (u) => u === 'https://request.usestring.ai/v1/sitemap' ? Response.json({ jobId: 'job-1', status: 'awaiting_approval', estimatedCostUsd: '5.3' }, { status: 202 }) : undefined,
    (u, init) => u === `${jobBase}/approve` && init?.method === 'POST' ? Response.json({ jobId: 'job-1', status: 'running' }, { status: 202 }) : undefined,
    (u) => u === jobBase ? Response.json({ jobId: 'job-1', status: 'completed', pagesProcessed: 3, costUsd: '0.0009000000' }) : undefined,
    (u) => u === `${jobBase}/urls?limit=5000&offset=0` ? Response.json({ jobId: 'job-1', total: 3, urls: [{ url: 'https://docs.example/guide/' }, { url: 'https://docs.example/sitemap.xml', isSitemap: true }, { url: 'https://docs.example/guide/a' }] }) : undefined,
  ]);
  assert.ok(string.map);
  const result = await string.map({ site: 'https://docs.example/guide/', limit: 1000 }, ctx);
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') {
    assert.deepEqual(result.data, { track: 'map', urls: ['https://docs.example/guide/', 'https://docs.example/guide/a'] });
    assert.deepEqual(result.billing, { usd: 0.0009, basis: 'reported', credits: null });
  }
  assert.deepEqual(JSON.parse(String(request.mock.calls[0]?.arguments[1]?.body)), { url: 'https://docs.example/guide/', maxPages: 1000, budgetUsd: 0.12, pathPrefix: '/guide/' });
});

test('A map job still running near the deadline is cancelled and its URLs so far are kept', async () => {
  routes([
    () => Response.json({ jobId: 'job-1', status: 'awaiting_approval' }, { status: 202 }),
    () => Response.json({ jobId: 'job-1', status: 'running' }, { status: 202 }),
    (u) => u === jobBase ? Response.json({ jobId: 'job-1', status: 'running', pending: 4, processed: 2 }) : undefined,
    (u, init) => u === jobBase && init?.method === 'DELETE' ? Response.json({ jobId: 'job-1', status: 'canceled' }) : undefined,
    (u) => u === jobBase ? Response.json({ jobId: 'job-1', status: 'canceled', pending: 0, processed: 2, costUsd: '0.0006' }) : undefined,
    () => Response.json({ jobId: 'job-1', total: 1, urls: [{ url: 'https://docs.example/' }] }),
  ]);
  assert.ok(string.map);
  // A 10s budget equals the stop margin, so the adapter stops after the first status check.
  const result = await string.map({ site: 'https://docs.example/', limit: 1000 }, { ...ctx, timeoutMs: 10_000 });
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') { assert.deepEqual(result.data, { track: 'map', urls: ['https://docs.example/'] }); assert.equal(result.billing.usd, 0.0006); }
});

test('A failed sitemap job is an error that keeps its reported cost', async () => {
  routes([
    () => Response.json({ jobId: 'job-1', status: 'awaiting_approval' }, { status: 202 }),
    () => Response.json({ jobId: 'job-1', status: 'running' }, { status: 202 }),
    () => Response.json({ jobId: 'job-1', status: 'failed', errorMessage: 'seed unreachable', costUsd: '0.0003' }),
  ]);
  assert.ok(string.map);
  const result = await string.map({ site: 'https://docs.example/', limit: 1000 }, ctx);
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') { assert.match(result.message, /failed: seed unreachable/); assert.equal(result.billing.usd, 0.0003); }
});

test('A map job that finishes as it is cancelled keeps its URLs and cost', async () => {
  routes([
    () => Response.json({ jobId: 'job-1', status: 'awaiting_approval' }, { status: 202 }),
    () => Response.json({ jobId: 'job-1', status: 'running' }, { status: 202 }),
    (u) => u === jobBase ? Response.json({ jobId: 'job-1', status: 'running', pending: 1, processed: 3 }) : undefined,
    (u, init) => u === jobBase && init?.method === 'DELETE' ? Response.json({ jobId: 'job-1', status: 'completed' }, { status: 409 }) : undefined,
    (u) => u === jobBase ? Response.json({ jobId: 'job-1', status: 'completed', pagesProcessed: 4, costUsd: '0.0012' }) : undefined,
    () => Response.json({ jobId: 'job-1', total: 1, urls: [{ url: 'https://docs.example/' }] }),
  ]);
  assert.ok(string.map);
  const result = await string.map({ site: 'https://docs.example/', limit: 1000 }, { ...ctx, timeoutMs: 10_000 });
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') { assert.deepEqual(result.data, { track: 'map', urls: ['https://docs.example/'] }); assert.equal(result.billing.usd, 0.0012); }
});

test('A map job whose status check fails is cancelled and its charge stays uncertain', async () => {
  const request = routes([
    () => Response.json({ jobId: 'job-1', status: 'awaiting_approval' }, { status: 202 }),
    () => Response.json({ jobId: 'job-1', status: 'running' }, { status: 202 }),
    () => Response.json({ error: 'Internal error' }, { status: 500 }),
    (u, init) => u === jobBase && init?.method === 'DELETE' ? Response.json({ jobId: 'job-1', status: 'canceled' }) : undefined,
  ]);
  assert.ok(string.map);
  const result = await string.map({ site: 'https://docs.example/', limit: 1000 }, ctx);
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') assert.ok(billingUncertain(result.billing));
  assert.equal(request.mock.callCount(), 4);
});

test('An unreadable 200 search keeps its charge uncertain; an error status costs nothing', async () => {
  routes([() => Response.json({ unexpected: true })]);
  assert.ok(string.search);
  const unreadable = await string.search({ query: 'q', limit: 10 }, ctx);
  assert.equal(unreadable.kind, 'error');
  if (unreadable.kind === 'error') assert.ok(billingUncertain(unreadable.billing));
  mock.restoreAll();
  routes([() => Response.json({ error: 'The search engine refused the request' }, { status: 403 })]);
  const refused = await string.search({ query: 'q', limit: 10 }, ctx);
  assert.equal(refused.kind, 'error');
  if (refused.kind === 'error') assert.deepEqual(refused.billing, { usd: 0, basis: 'list-price', credits: null });
});
