import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import type { Adapter, CallContext, ProviderId, ToolData, ToolOutcome, Track } from '../core/types.ts';
import { generateSite } from '../../fixtures/site/src/data.ts';
import { adapters, missingEnv } from './index.ts';
import { billingUncertain, first, responseEvents } from './http.ts';
import { jinaAuthMode } from './jina.ts';

const { values } = parseArgs({ options: { providers: { type: 'string' }, tracks: { type: 'string' }, lane: { type: 'string', default: 'default' }, timeout: { type: 'string', default: '120000' }, 'jina-auth': { type: 'string' } } });
const lane = z.enum(['default', 'tuned']).parse(values.lane);
const timeoutMs = z.coerce.number().int().min(1).max(300000).parse(values.timeout);
if (values['jina-auth']) process.env.JINA_AUTH_MODE = z.enum(['key', 'keyless']).parse(values['jina-auth']);
const trackSchema = z.enum(['search', 'scrape', 'map', 'crawl']);
const tracks = values.tracks ? values.tracks.split(',').map(t => trackSchema.parse(t)) : trackSchema.options;
const selected = values.providers ? values.providers.split(',') : Object.keys(adapters);
const providers = selected.map(id => { const match = Object.values(adapters).find(a => a.id === id); if (!match) throw new Error(`Unknown provider: ${id}`); return match; });
const site = 'https://northstar-instruments.leoisadev.workers.dev/r/adapter-smoke/';
const product = first(generateSite('adapter-smoke').products);
const url = `${site}${product.path.slice(1)}`;
const ledgerPath = new URL('../../providers/smoke.jsonl', import.meta.url);
const attemptSchema = z.object({ kind: z.literal('attempt'), provider: z.string(), track: trackSchema });
let prior: unknown[] = [];
try { prior = (await readFile(ledgerPath, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); }
catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
process.env.SCRAPING_BENCH_SMOKE = '1';
await mkdir(new URL('../../providers/', import.meta.url), { recursive: true });
const counts = new Map<string, number>();
for (const raw of prior) { const parsed = attemptSchema.safeParse(raw); if (parsed.success) { const k = `${parsed.data.provider}:${parsed.data.track}`; counts.set(k, (counts.get(k) ?? 0) + 1); } }
async function record(value: object): Promise<void> {
  const line = JSON.stringify(value);
  await appendFile(ledgerPath, `${line}\n`);
  process.stdout.write(`${line}\n`);
}
function inScope(url: string): boolean {
  const u = new URL(url); const root = new URL(site);
  return u.origin === root.origin && (u.pathname === root.pathname.slice(0, -1) || u.pathname.startsWith(root.pathname));
}
function summary(data: ToolData): object {
  switch (data.track) {
    case 'scrape': return { chars: data.markdown.length, finalUrl: data.finalUrl };
    case 'search': return { hits: data.hits.length };
    case 'map': return { urls: data.urls.length, inScope: data.urls.filter(u => inScope(u)).length };
    case 'crawl': return { pages: data.pages.length, urls: data.pages.map(p => ({ url: p.url, chars: p.markdown.length })), chars: data.pages.reduce((n, p) => n + p.markdown.length, 0) };
  }
}
function verify(data: ToolData): string | null {
  switch (data.track) {
    case 'scrape': { const plain = data.markdown.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1').replace(/\s+/g, ' '); return plain.includes(product.price) && plain.includes(product.stock) ? null : `Missing fixture price or stock (${product.price}; ${product.stock})`; }
    case 'search': return data.hits.length > 0 && data.hits.every(h => /^https?:\/\//.test(h.url)) ? null : 'No valid search URLs';
    case 'map': return data.urls.some(u => inScope(u) && new URL(u).pathname.replace(/\/$/, '') !== new URL(site).pathname.replace(/\/$/, '')) ? null : 'No discovered child URLs in fixture scope';
    case 'crawl': return data.pages.length > 0 && data.pages.length <= 5 && data.pages.every(p => inScope(p.url) && p.markdown.trim()) ? null : 'Empty, over-limit, blank, or out-of-scope crawl';
  }
}
async function call(adapter: Adapter, track: Track, ctx: CallContext): Promise<ToolOutcome | undefined> {
  switch (track) {
    case 'search': return adapter.search?.({ query: 'Node.js official installation latest LTS', limit: 5 }, ctx);
    case 'scrape': return adapter.scrape?.({ url }, ctx);
    case 'map': return adapter.map?.({ site, limit: 20 }, ctx);
    case 'crawl': return adapter.crawl?.({ site, scope: '/r/adapter-smoke/', maxPages: 5 }, ctx);
  }
}
let failures = 0;
for (const adapter of providers) {
  for (const track of tracks) {
    const common = { provider: adapter.id, track, lane, auth: adapter.id === 'jina' ? jinaAuthMode() : 'key', at: new Date().toISOString() };
    if (!adapter[track]) { await record({ ...common, kind: 'skip', reason: 'unsupported' }); continue; }
    const missing = [...missingEnv(adapter.id)];
    if (adapter.id === 'brightdata') { const zone = track === 'search' ? 'BRIGHTDATA_SERP_ZONE' : 'BRIGHTDATA_UNLOCKER_ZONE'; if (!process.env[zone]) missing.push(zone); }
    if (missing.length) { await record({ ...common, kind: 'skip', reason: 'no key/config', missing }); continue; }
    const k = `${adapter.id}:${track}`;
    if ((counts.get(k) ?? 0) >= 3) { await record({ ...common, kind: 'skip', reason: '3-call smoke budget exhausted' }); continue; }
    // Reserve before submitting so interrupted runs cannot silently spend again.
    await record({ ...common, kind: 'attempt' }); counts.set(k, (counts.get(k) ?? 0) + 1);
    responseEvents.length = 0;
    const outcome = await call(adapter, track, { lane, timeoutMs, signal: new AbortController().signal });
    if (!outcome) throw new Error('Supported method disappeared');
    const problem = outcome.kind === 'ok' ? verify(outcome.data) : outcome.message;
    if (problem) failures++;
    await record({ ...common, kind: 'result', status: problem ? 'failed' : 'ok', billing: outcome.billing, billingUncertain: billingUncertain(outcome.billing), ms: Math.round(outcome.ms), ...(outcome.kind === 'ok' ? { summary: summary(outcome.data) } : { error: outcome.error, httpStatus: outcome.status }), ...(problem ? { reason: problem } : {}), requests: [...responseEvents] });
  }
}
process.exitCode = failures ? 1 : 0;
