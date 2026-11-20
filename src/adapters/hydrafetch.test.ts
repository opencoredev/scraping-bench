import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { hydrafetch } from './hydrafetch.ts';
const ctx = (lane: 'default' | 'tuned' = 'default') => ({ lane, timeoutMs: 20000, signal: new AbortController().signal });
const site = 'https://fixture.invalid/docs/guide/';
afterEach(() => mock.restoreAll());
function routes(responses: Response[]) {
  mock.property(process, 'env', { ...process.env, HYDRAFETCH_API_KEY: 'test-only-placeholder' });
  const queue = [...responses];
  return mock.method(globalThis, 'fetch', async () => queue.shift() ?? Response.json({ error: { code: 'UNEXPECTED' } }, { status: 500 }));
}
const call = (request: ReturnType<typeof routes>, index: number) => {
  const [target, init] = request.mock.calls[index]?.arguments ?? [];
  return { target: String(target), headers: new Headers(init?.headers), body: init?.body ? JSON.parse(String(init.body)) : null };
};
const page = (url: string, markdown: string, extra: object = {}) => ({ url, finalUrl: url, status: 200, markdown, metadata: { title: 'Guide' }, ...extra });

test('Hydrafetch scrape asks for fresh markdown in the tuned lane and reports credits', async () => {
  const request = routes([Response.json({ data: page(site, '# Guide', { usage: { creditsUsed: 1 } }) })]);
  assert.ok(hydrafetch.scrape);
  const result = await hydrafetch.scrape({ url: site }, ctx('tuned'));
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') {
    assert.deepEqual(result.data, { track: 'scrape', markdown: '# Guide', finalUrl: site });
    assert.equal(result.billing.basis, 'reported');
  }
  const sent = call(request, 0);
  assert.equal(sent.target, 'https://api.hydrafetch.com/v1/web/scrape');
  assert.equal(sent.headers.get('X-API-Key'), 'test-only-placeholder');
  assert.deepEqual(sent.body, { url: site, formats: ['markdown'], maxAge: 0 });
});

test('Hydrafetch scrape fails a page whose origin answered with an error status', async () => {
  routes([Response.json({ data: page(site, 'Not found', { status: 404 }) })]);
  assert.ok(hydrafetch.scrape);
  const result = await hydrafetch.scrape({ url: site }, ctx());
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') assert.equal(result.status, 404);
});

test('Hydrafetch map scopes the list to the section path, root included', async () => {
  const request = routes([Response.json({ data: { url: site, links: [{ url: 'https://fixture.invalid/docs/guide', lastmod: null }, { url: `${site}setup`, lastmod: null }], count: 2, total: 2, truncated: false } })]);
  assert.ok(hydrafetch.map);
  const result = await hydrafetch.map({ site, limit: 50 }, ctx());
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') assert.deepEqual(result.data, { track: 'map', urls: ['https://fixture.invalid/docs/guide', `${site}setup`] });
  assert.deepEqual(call(request, 0).body, { url: site, limit: 50, search: '/docs/guide' });
});

test('Hydrafetch crawl polls until completed and keeps only pages with content', async () => {
  const request = routes([
    Response.json({ crawlId: 'job', status: 'queued' }),
    Response.json({ data: { status: 'running', creditsUsed: 1, pages: [] } }),
    Response.json({ data: { status: 'completed', creditsUsed: 3, pages: [
      { url: site, status: 'completed', error: null, errorCode: null, data: page(site, '# Guide') },
      { url: `${site}gone`, status: 'completed', error: null, errorCode: null, data: page(`${site}gone`, 'Not found', { status: 404 }) },
      { url: `${site}blank`, status: 'completed', error: null, errorCode: null, data: page(`${site}blank`, '  \n') },
      { url: `${site}broken`, status: 'failed', error: 'Timed out', errorCode: 'TIMEOUT', data: null },
    ] } }),
  ]);
  assert.ok(hydrafetch.crawl);
  const result = await hydrafetch.crawl({ site, scope: '/docs/guide/', maxPages: 10 }, ctx());
  assert.equal(result.kind, 'ok');
  if (result.kind === 'ok') {
    assert.deepEqual(result.data, { track: 'crawl', pages: [{ url: site, markdown: 'HTML document title: Guide\n\n# Guide' }] });
    assert.equal(result.billing.credits, 3);
  }
  assert.deepEqual(call(request, 0).body, { url: site, limit: 10, includePaths: ['^/docs/guide/'], scrapeOptions: { formats: ['markdown'] } });
  assert.equal(call(request, 2).target, 'https://api.hydrafetch.com/v1/web/crawl/job');
});

test('Hydrafetch crawl with no usable page keeps the page error', async () => {
  routes([
    Response.json({ crawlId: 'job', status: 'queued' }),
    Response.json({ data: { status: 'completed', creditsUsed: 0, pages: [{ url: site, status: 'completed', error: null, errorCode: null, data: page(site, 'Forbidden', { status: 403 }) }] } }),
  ]);
  assert.ok(hydrafetch.crawl);
  const result = await hydrafetch.crawl({ site, scope: '/docs/guide/', maxPages: 10 }, ctx());
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') assert.equal(result.status, 403);
});

test('Hydrafetch crawl reports a cancelled job as an error', async () => {
  routes([
    Response.json({ crawlId: 'job', status: 'queued' }),
    Response.json({ data: { status: 'cancelled', creditsUsed: 0, pages: [] } }),
  ]);
  assert.ok(hydrafetch.crawl);
  const result = await hydrafetch.crawl({ site, scope: '/docs/guide/', maxPages: 10 }, ctx());
  assert.equal(result.kind, 'error');
});
