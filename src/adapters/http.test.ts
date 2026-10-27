import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, operation, Session, responseEvents } from './http.ts';
import { outcomeSchema } from '../core/schema.ts';
import { jina } from './jina.ts';

afterEach(() => { mock.restoreAll(); responseEvents.length = 0; });

test('Jina HTTP errors retain the redacted native body before JSON capture can run', async () => {
  mock.property(process, 'env', { WEB_BENCH_SMOKE: '1', JINA_AUTH_MODE: 'keyless', TEST_API_KEY: 'synthetic-key-only' });
  const body = JSON.stringify({ code: 422, name: 'AssertionFailureError', message: 'Token budget exceeded: synthetic-key-only', details: { tokens: 5100, authorization: 'Bearer synthetic-bearer-only' } });
  const request = mock.method(globalThis, 'fetch', async () => new Response(body, { status: 422, headers: { 'content-type': 'application/json', 'x-usage-tokens': '5100', 'set-cookie': 'private-cookie-only' } }));
  assert.ok(jina.scrape);
  const outcome = await jina.scrape({ url: 'https://fixture.invalid/page' }, { lane: 'default', timeoutMs: 1000, signal: new AbortController().signal });
  assert.equal(outcome.kind, 'error');
  if (outcome.kind === 'error') {
    assert.equal(outcome.status, 422);
    assert.equal(outcome.error, 'http-4xx');
    assert.equal(outcome.message, 'Provider request failed');
    assert.equal(outcome.message.includes('AssertionFailureError'), false);
  }
  assert.equal(request.mock.callCount(), 1);
  assert.deepEqual(responseEvents, [{
    origin: 'https://r.jina.ai', path: '/https://fixture.invalid/page', status: 422,
    headers: { 'x-usage-tokens': '5100' },
    errorBody: JSON.stringify({ code: 422, name: 'AssertionFailureError', message: 'Token budget exceeded: [REDACTED]', details: { tokens: 5100, authorization: 'Bearer [REDACTED]' } }),
  }]);
  assert.equal(JSON.stringify(responseEvents).includes('synthetic-key-only'), false);
  assert.equal(JSON.stringify(responseEvents).includes('synthetic-bearer-only'), false);
});

test('non-JSON HTTP errors retain redacted text while keeping normalized failure behavior', async () => {
  mock.property(process, 'env', { WEB_BENCH_SMOKE: '1', TEST_TOKEN: 'synthetic-token-only' });
  mock.method(globalThis, 'fetch', async () => new Response('Upstream failed: synthetic-token-only; Bearer synthetic-auth-only', { status: 503 }));
  const session = new Session(new AbortController().signal);
  await assert.rejects(session.response('https://provider.invalid/read?key=synthetic-token-only'), { message: 'Provider request failed', category: 'http-5xx', status: 503 });
  assert.deepEqual(responseEvents, [{ origin: 'https://provider.invalid', path: '/read', status: 503, headers: {}, errorBody: 'Upstream failed: [REDACTED]; Bearer [REDACTED]' }]);
});

test('native error bodies do not enter smoke events outside smoke mode', async () => {
  mock.property(process, 'env', {});
  mock.method(globalThis, 'fetch', async () => Response.json({ message: 'limit', detail: 'native detail' }, { status: 429 }));
  await assert.rejects(new Session(new AbortController().signal).response('https://provider.invalid/'), { message: 'limit', category: 'rate-limited', status: 429 });
  assert.deepEqual(responseEvents, []);
});

test('successful smoke response events keep metadata only', async () => {
  mock.property(process, 'env', { WEB_BENCH_SMOKE: '1' });
  mock.method(globalThis, 'fetch', async () => new Response('successful content'));
  const response = await new Session(new AbortController().signal).response('https://provider.invalid/read');
  assert.equal(await response.text(), 'successful content');
  assert.deepEqual(responseEvents, [{ origin: 'https://provider.invalid', path: '/read', status: 200, headers: {} }]);
});

test('JSON-escaped configured secrets are redacted before native bodies are retained', async () => {
  mock.property(process, 'env', { WEB_BENCH_SMOKE: '1', TEST_SECRET: 'synthetic-"quoted"-only' });
  mock.method(globalThis, 'fetch', async () => Response.json({ message: 'Request failed', detail: 'synthetic-"quoted"-only' }, { status: 400 }));
  await assert.rejects(new Session(new AbortController().signal).response('https://provider.invalid/'), { message: 'Request failed' });
  assert.deepEqual(responseEvents, [{ origin: 'https://provider.invalid', path: '/', status: 400, headers: {}, errorBody: JSON.stringify({ message: 'Request failed', detail: '[REDACTED]' }) }]);
});

for (const fixture of [
  { status: 422, body: JSON.stringify({ code: 422, message: 'synthetic-key-only', detail: 'Bearer synthetic-auth-only', nested: { secret: 'synthetic-"quoted"-only' } }), expected: JSON.stringify({ code: 422, message: '[REDACTED]', detail: 'Bearer [REDACTED]', nested: { secret: '[REDACTED]' } }) },
  { status: 503, body: 'Upstream failed: synthetic-key-only; Bearer synthetic-auth-only', expected: 'Upstream failed: [REDACTED]; Bearer [REDACTED]' },
  { status: 400, body: '', expected: '' },
]) {
  test(`HTTP ${fixture.status} native body survives operation and schema without smoke mode`, async () => {
    mock.property(process, 'env', { TEST_API_KEY: 'synthetic-key-only', TEST_SECRET: 'synthetic-"quoted"-only' });
    const request = mock.method(globalThis, 'fetch', async () => new Response(fixture.body, { status: fixture.status }));
    const outcome = await operation({ lane: 'default', timeoutMs: 1000, signal: new AbortController().signal }, async session => {
      await session.response('https://provider.invalid/read');
      return { track: 'scrape', markdown: 'unreachable', finalUrl: null };
    });
    assert.equal(outcome.kind, 'error');
    assert.ok('nativeErrorBody' in outcome);
    assert.equal(outcome.nativeErrorBody, fixture.expected);
    assert.deepEqual(outcomeSchema.parse(JSON.parse(JSON.stringify(outcome))), outcome);
    assert.equal(JSON.stringify(outcome).includes('synthetic-key-only'), false);
    assert.equal(JSON.stringify(outcome).includes('synthetic-auth-only'), false);
    assert.deepEqual(responseEvents, []);
    assert.equal(request.mock.callCount(), 1);
  });
}

test('outcomeSchema preserves optional nativeErrorBody and accepts historical errors', () => {
  const historical = { kind: 'error', error: 'http-4xx', message: 'Provider request failed', status: 422, ms: 1, billing: { usd: 0, basis: 'list-price', credits: null } };
  const retained = { ...historical, nativeErrorBody: '{"code":422,"detail":"[REDACTED]"}' };
  assert.deepEqual(outcomeSchema.parse(retained), retained);
  assert.deepEqual(outcomeSchema.parse(historical), historical);
  assert.equal(outcomeSchema.safeParse({ ...historical, nativeErrorBody: 422 }).success, false);
});

test('non-HTTP errors and successful operations omit nativeErrorBody', async () => {
  mock.property(process, 'env', {});
  const context = { lane: 'default', timeoutMs: 1000, signal: new AbortController().signal } satisfies Parameters<typeof operation>[0];
  const failed = await operation(context, async () => { throw new ApiError('unsupported', 'Not configured'); });
  assert.equal(failed.kind, 'error');
  assert.equal(Object.hasOwn(failed, 'nativeErrorBody'), false);
  const succeeded = await operation(context, async () => ({ track: 'scrape', markdown: 'content', finalUrl: null }));
  assert.equal(succeeded.kind, 'ok');
  assert.equal(Object.hasOwn(succeeded, 'nativeErrorBody'), false);
  assert.deepEqual(outcomeSchema.parse(failed), failed);
  assert.deepEqual(outcomeSchema.parse(succeeded), succeeded);
});
