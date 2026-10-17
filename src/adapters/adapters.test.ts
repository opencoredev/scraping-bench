import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import type { CallContext } from '../core/types.ts';
import { firecrawl } from './firecrawl.ts';
import { spider } from './spider.ts';
import { scrapfly } from './scrapfly.ts';
import { contextdev } from './contextdev.ts';
import { browserbase } from './browserbase.ts';
import { parallel } from './parallel.ts';
const ctx = (timeoutMs = 10000): CallContext => ({ lane: 'default', timeoutMs, signal: new AbortController().signal });
const url = 'https://fixture.invalid/products/one';
afterEach(() => mock.restoreAll());
function transport(responses: readonly Response[]) {
  const queue = [...responses];
  return mock.method(globalThis, 'fetch', async () => {
    const response = queue.shift();
    assert.ok(response, 'Unexpected additional HTTP call');
    return response;
  });
}
function credentials(extra: Record<string, string> = {}) {
  mock.property(process, 'env', { ...process.env, FIRECRAWL_API_KEY: 'test-only-placeholder', SPIDER_API_KEY: 'test-only-placeholder', SCRAPFLY_API_KEY: 'test-only-placeholder', BROWSERBASE_API_KEY: 'test-only-placeholder', CONTEXT_DEV_API_KEY: 'test-only-placeholder', ...extra });
}
test('429 returns rate-limited without retrying', async () => {
  credentials(); const request = transport([Response.json({ message: 'limit' }, { status: 429 })]);
  assert.ok(firecrawl.scrape);
  const result = await firecrawl.scrape({ url }, ctx());
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') { assert.equal(result.error, 'rate-limited'); assert.equal(result.status, 429); }
  assert.equal(request.mock.callCount(), 1);
});
test('embedded malicious-URL 403 is blocked for every Spider page track', async () => {
  credentials();
  transport(Array.from({ length: 3 }, () => Response.json([{ url, content: '', status: 403, error: 'Malicious URL not allowed' }])));
  assert.ok(spider.scrape); assert.ok(spider.map); assert.ok(spider.crawl);
  const results = [await spider.scrape({ url }, ctx()), await spider.map({ site: url, limit: 5 }, ctx()), await spider.crawl({ site: url, scope: '/products/', maxPages: 5 }, ctx())];
  for (const result of results) { assert.equal(result.kind, 'error'); if (result.kind === 'error') { assert.equal(result.error, 'blocked'); assert.equal(result.status, 403); } }
});
test('Spider accepts the documented live object search envelope', async () => {
  credentials(); transport([Response.json({ content: [{ url, title: 'One', description: 'A sensor' }] })]);
  assert.ok(spider.search); const result = await spider.search({ query: 'sensor', limit: 5 }, ctx());
  assert.equal(result.kind, 'ok'); if (result.kind === 'ok') assert.deepEqual(result.data, { track: 'search', hits: [{ url, title: 'One', snippet: 'A sensor', content: null, publishedAt: null }] });
});
test('Firecrawl collects completed pagination and cumulative billing', async () => {
  credentials(); transport([Response.json({ success: true, id: 'job' }), Response.json({ status: 'completed', creditsUsed: 2, next: '/v2/crawl/job?skip=1', data: [{ markdown: 'one', metadata: { sourceURL: url } }] }), Response.json({ status: 'completed', creditsUsed: 2, data: [{ markdown: 'two', metadata: { sourceURL: `${url}/two` } }] })]);
  assert.ok(firecrawl.crawl); const result = await firecrawl.crawl({ site: url, scope: '/products/', maxPages: 5 }, ctx());
  assert.equal(result.kind, 'ok'); if (result.kind === 'ok' && result.data.track === 'crawl') assert.equal(result.data.pages.length, 2);
  assert.equal(result.billing.credits, 2); assert.equal(result.billing.usd, 0.01);
});
test('Firecrawl refuses cross-origin pagination before sending credentials', async () => {
  credentials(); const request = transport([Response.json({ success: true, id: 'job' }), Response.json({ status: 'completed', next: 'https://untrusted.invalid/page', data: [] })]);
  assert.ok(firecrawl.crawl); const result = await firecrawl.crawl({ site: url, scope: '/', maxPages: 5 }, ctx());
  assert.equal(result.kind, 'error'); assert.equal(request.mock.callCount(), 2);
});
test('deadline covers asynchronous job polling without another request', async () => {
  credentials(); const request = transport([Response.json({ success: true, id: 'job' })]);
  assert.ok(firecrawl.crawl); const result = await firecrawl.crawl({ site: url, scope: '/', maxPages: 5 }, ctx(25));
  assert.equal(result.kind, 'error'); if (result.kind === 'error') assert.equal(result.error, 'timeout');
  assert.equal(request.mock.callCount(), 1);
});
test('caller cancellation prevents initial dispatch', async () => {
  credentials(); const request = transport([]); const abort = new AbortController(); abort.abort();
  assert.ok(browserbase.scrape); const result = await browserbase.scrape({ url }, { ...ctx(), signal: abort.signal });
  assert.equal(result.kind, 'error'); assert.equal(request.mock.callCount(), 0);
});
test('Scrapfly submits once, accepts crawler_uuid, and collects all content pages', async () => {
  credentials(); const request = transport([Response.json({ crawler_uuid: 'job' }), Response.json({ is_finished: true, is_success: true, state: { api_credit_used: 5, stop_reason: null } }), Response.json({ links: { next: '/crawl/job/contents?cursor=2' }, contents: { [url]: { markdown: 'one' } } }), Response.json({ links: { next: null }, contents: { [`${url}/two`]: { markdown: 'two' } } })]);
  assert.ok(scrapfly.crawl); const result = await scrapfly.crawl({ site: url, scope: '/products/', maxPages: 5 }, ctx());
  assert.equal(result.kind, 'ok'); if (result.kind === 'ok' && result.data.track === 'crawl') assert.equal(result.data.pages.length, 2);
  assert.equal(result.billing.credits, 5); assert.equal(request.mock.callCount(), 4);
});
test('runner retains a configured reservation when adapter usage is unknown', async () => {
  credentials(); transport([Response.json({ content: [{ url, title: 'One' }] })]);
  const { invoke } = await import('../agent/tools.ts');
  const result = await invoke(spider, 'search', { query: 'sensor', limit: 5 }, ctx(), 0.02);
  assert.equal(result.kind, 'ok'); assert.equal(result.billing.usd, 0.02);
});
test('a failed Firecrawl page does not discard healthy crawl content', async () => {
  credentials(); transport([Response.json({ success: true, id: 'job' }), Response.json({ status: 'completed', creditsUsed: 1, data: [{ markdown: 'healthy', metadata: { sourceURL: url } }, { metadata: { sourceURL: `${url}/missing`, statusCode: 404 } }] })]);
  assert.ok(firecrawl.crawl); const result = await firecrawl.crawl({ site: url, scope: '/', maxPages: 5 }, ctx());
  assert.equal(result.kind, 'ok'); if (result.kind === 'ok' && result.data.track === 'crawl') assert.deepEqual(result.data.pages, [{ url, markdown: 'healthy' }]);
});
test('adapter deadline retains the configured reservation before usage arrives', async () => {
  credentials();
  mock.method(globalThis, 'fetch', async (_url: string | URL | Request, options?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = options?.signal;
      if (!signal) throw new Error('Missing transport abort signal');
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  });
  const { invoke } = await import('../agent/tools.ts');
  const result = await invoke(browserbase, 'scrape', { url }, ctx(20), 0.02);
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') assert.equal(result.error, 'timeout');
  assert.equal(result.billing.usd, 0.02);
});
test('HTTP 503 is normalized without retrying', async () => {
  credentials(); const request = transport([Response.json({ message: 'temporarily unavailable' }, { status: 503 })]);
  assert.ok(firecrawl.scrape); const result = await firecrawl.scrape({ url }, ctx());
  assert.equal(result.kind, 'error'); if (result.kind === 'error') { assert.equal(result.error, 'http-5xx'); assert.equal(result.status, 503); }
  assert.equal(request.mock.callCount(), 1);
});


test('Context.dev map sends a bare domain and keeps the requested path filter', async () => {
  credentials();
  mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const requested = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    assert.equal(requested.searchParams.get('domain'), 'fixture.invalid');
    assert.ok(requested.searchParams.get('urlRegex')?.includes('/products/one'));
    return Response.json({ urls: [{ url }], key_metadata: { credits_consumed: 1 } });
  });
  assert.ok(contextdev.map);
  const result = await contextdev.map({ site: url, limit: 10 }, ctx());
  assert.equal(result.kind, 'ok');
});
test('Spider meters wallet delta even when the target is blocked', async () => {
  credentials({ SPIDER_AUTH_MODE: 'key', SPIDER_METER_BALANCE: '1' });
  const request = transport([
    Response.json({ data: { credits: 2480 } }),
    Response.json([{ url, content: '', status: 403, error: 'Malicious URL not allowed' }]),
    Response.json({ data: { credits: 2478 } }),
  ]);
  assert.ok(spider.scrape);
  const result = await spider.scrape({ url }, ctx());
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') assert.equal(result.error, 'blocked');
  assert.equal(result.billing.credits, 2);
  assert.equal(result.billing.usd, 0.0002);
  assert.equal(request.mock.callCount(), 3);
});
test('Spider refuses a scrape before dispatch when its native reserve is unavailable', async () => {
  credentials({ SPIDER_AUTH_MODE: 'key', SPIDER_METER_BALANCE: '1' });
  const request = transport([Response.json({ data: { credits: 323 } })]);
  assert.ok(spider.scrape);
  const result = await spider.scrape({ url }, ctx());
  assert.equal(result.kind, 'error');
  assert.equal(request.mock.callCount(), 1);
});
test('crawl evidence preserves native document titles needed by exact-title tasks', async () => {
  credentials();
  transport([
    Response.json({ success: true, id: 'job' }),
    Response.json({ status: 'completed', creditsUsed: 1, data: [{ markdown: '# Overview', metadata: { sourceURL: url, title: 'Overview | Official Docs' } }] }),
    Response.json({ key_metadata: { credits_consumed: 1 }, results: [{ markdown: '# Overview', metadata: { url, success: true, title: 'Overview | Official Docs' } }] }),
  ]);
  assert.ok(firecrawl.crawl); assert.ok(contextdev.crawl);
  for (const result of [await firecrawl.crawl({ site: url, scope: '/', maxPages: 5 }, ctx()), await contextdev.crawl({ site: url, scope: '/', maxPages: 5 }, ctx())]) {
    assert.equal(result.kind, 'ok');
    if (result.kind === 'ok' && result.data.track === 'crawl') assert.equal(result.data.pages[0]?.markdown, 'HTML document title: Overview | Official Docs\n\n# Overview');
  }
});

test('Parallel bounds native search results before dispatch for safe billing', async () => {
  credentials({ PARALLEL_API_KEY: 'test-only-placeholder' });
  mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
    assert.equal(typeof init?.body, 'string');
    const body: unknown = JSON.parse(String(init?.body));
    assert.deepEqual(body, { search_queries: ['sensor'], advanced_settings: { max_results: 5 } });
    return Response.json({ results: [{ url, title: 'One', excerpts: ['A sensor'] }] });
  });
  assert.ok(parallel.search);
  const result = await parallel.search({ query: 'sensor', limit: 5 }, ctx());
  assert.equal(result.kind, 'ok');
});
