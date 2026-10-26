import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crawlEvidence } from './evidence.ts';
import type { ToolOutcome } from '../core/types.ts';

test('crawl evidence retains every URL and native title before bounded bodies', () => {
  const pages = Array.from({ length: 20 }, (_, i) => ({ url: `https://example.com/${i}`, markdown: `HTML document title: Native ${i}\n\n${'界'.repeat(48000)}` }));
  const outcome: ToolOutcome = { kind: 'ok', data: { track: 'crawl', pages }, ms: 1, billing: { usd: .1, basis: 'reported', credits: 1 } };
  const output = crawlEvidence(outcome, 48000);
  assert.ok(Buffer.byteLength(output.text) <= 48000);
  const parsed = JSON.parse(output.text);
  assert.deepEqual(parsed.data.pages, pages.map((p, i) => ({ url: p.url, title: `Native ${i}` })));
  assert.ok(output.truncated);
  assert.ok(output.text.indexOf('Native 19') < output.text.indexOf('excerpts'));
  assert.equal(output.text.includes('\uFFFD'), false);
  assert.equal(parsed.excerpts.length, 20);
});

test('crawl manifest never invents titles or silently drops oversized manifest rows', () => {
  const outcome: ToolOutcome = { kind: 'ok', data: { track: 'crawl', pages: [{ url: 'https://example.com/', markdown: '# Body heading is not a native title' }] }, ms: 1, billing: { usd: 0, basis: 'list-price', credits: null } };
  assert.equal(JSON.parse(crawlEvidence(outcome).text).data.pages[0].title, null);
  assert.throws(() => crawlEvidence(outcome, 10), /manifest exceeds/);
});
