import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import { pricing } from './pricing.ts';
import type { Billing, CallContext, ErrorClass, ToolData, ToolOutcome } from '../core/types.ts';

export const checkedAt = '2026-10-17';
export class ApiError extends Error {
  readonly category: ErrorClass;
  readonly status: number | null;
  constructor(category: ErrorClass, message: string, status: number | null = null) { super(message); this.category = category; this.status = status; }
}
export function classify(message: string, status: number | null = null): ErrorClass {
  if (status === 429) return 'rate-limited';
  if (/bot[_ -]?block|anti.?bot|captcha|challenge|blocked|malicious.url|SCRAPE_ACCES_DENIED/i.test(message)) return 'blocked';
  if (/timeout|timed.out|deadline/i.test(message)) return 'timeout';
  if (/empty[_ -]?content/i.test(message)) return 'empty';
  if (status !== null && status >= 500) return 'http-5xx';
  if (status !== null && status >= 400) return 'http-4xx';
  return 'other';
}
export function secret(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError('unsupported', `Missing ${name}`);
  return value;
}
export function bearer(name: string): Record<string, string> { return { Authorization: `Bearer ${secret(name)}` }; }
export function queryUrl(base: string, query: Record<string, string | number | boolean>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  return url.href;
}
export function scopeRegex(scope: string): string {
  const path = scope.startsWith('http') ? new URL(scope).pathname : scope;
  return `^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
}
export function pageFailure(status: number | null | undefined, code = ''): ApiError | null {
  return ((status !== null && status !== undefined && status >= 400) || code)
    ? new ApiError(classify(code, status ?? null), code || 'Target HTTP error', status ?? null) : null;
}
export function assertPageStatus(status: number | null | undefined, code = ''): void {
  const failure = pageFailure(status, code);
  if (failure) throw failure;
}
export function first<T>(items: readonly T[], message = 'No page content'): T {
  const value = items[0];
  if (value === undefined) throw new ApiError('empty', message);
  return value;
}
const errorEnvelope = z.object({
  code: z.string().optional(), error_code: z.string().optional(), message: z.string().optional(),
  error: z.union([z.string(), z.object({ code: z.string().optional(), message: z.string().optional() })]).optional(),
}).passthrough();
function errorMessage(raw: string): string {
  try {
    const parsed = errorEnvelope.safeParse(JSON.parse(raw));
    if (!parsed.success) return 'Provider request failed';
    const d = parsed.data;
    return [d.code, d.error_code, d.message, typeof d.error === 'string' ? d.error : d.error?.code ?? d.error?.message].filter(Boolean).join(': ') || 'Provider request failed';
  } catch { return 'Provider request failed'; }
}
export function redact(message: string): string {
  let result = message;
  for (const [name, value] of Object.entries(process.env)) {
    if (/KEY|TOKEN|SECRET|PASSWORD/.test(name) && value && value.length > 3) result = result.split(value).join('[REDACTED]');
  }
  return result.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
}
export type ResponseEvent = { readonly origin: string; readonly path: string; readonly status: number; readonly headers: Readonly<Record<string, string>> };
// Used only by smoke tooling; never includes request headers, query strings, or bodies.
export const responseEvents: ResponseEvent[] = [];
const safeHeaders = ['x-credits-used', 'x-credits-remaining', 'x-scrapfly-api-cost', 'x-scrapfly-remaining-api-credit', 'x-request-cost', 'x-usage-tokens', 'x-ratelimit-remaining', 'x-ratelimit-remaining-requests', 'x-free-requests-remaining', 'x-free-allowance-remaining'];

// The shared Billing contract cannot represent unknown cost. Keep the distinction
// in memory so the runner retains its configured reservation instead of refunding it.
const uncertainBillings = new WeakSet<Billing>();
export function billingUncertain(billing: Billing): boolean { return uncertainBillings.has(billing); }
export function reserveUnknownBilling(billing: Billing, upperUsd: number): Billing {
  const estimate: Billing = { ...billing, basis: 'list-price', usd: Math.max(billing.usd, upperUsd) };
  uncertainBillings.add(estimate);
  return estimate;
}
export class Session {
  billing: Billing = reserveUnknownBilling({ usd: 0, basis: 'list-price', credits: null }, 0);
  status: number | null = null;
  headers = new Headers();
  readonly signal: AbortSignal;
  constructor(signal: AbortSignal) { this.signal = signal; }
  estimate(usd: number, credits: number | null = null): void { this.billing = { usd, basis: 'list-price', credits }; }
  reported(credits: number, usdPerCredit: number): void { this.billing = { credits, usd: credits * usdPerCredit, basis: 'reported' }; }
  reportedUsd(usd: number): void { this.billing = { usd, basis: 'reported', credits: null }; }
  async response(url: string, options: { readonly headers?: Record<string, string>; readonly body?: unknown; readonly method?: string } = {}): Promise<Response> {
    this.signal.throwIfAborted();
    const response = await fetch(url, {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: this.signal, redirect: 'error',
    });
    this.status = response.status;
    this.headers = response.headers;
    const headers: Record<string, string> = {};
    for (const name of safeHeaders) { const value = response.headers.get(name); if (value !== null) headers[name] = value; }
    if (process.env.WEB_BENCH_SMOKE === '1') { const u = new URL(url); responseEvents.push({ origin: u.origin, path: u.pathname, status: response.status, headers }); }
    const used = response.headers.get('x-credits-used');
    if (new URL(url).origin === 'https://api.context.dev' && used !== null && Number.isFinite(Number(used))) this.reported(Number(used), pricing.contextdev.credit);
    const scrapfly = response.headers.get('x-scrapfly-api-cost');
    if (new URL(url).origin === 'https://api.scrapfly.io' && scrapfly !== null && Number.isFinite(Number(scrapfly))) this.reported(Number(scrapfly), pricing.scrapfly.credit);
    if (!response.ok) {
      const message = errorMessage(await response.text());
      throw new ApiError(classify(message, response.status), redact(message), response.status);
    }
    return response;
  }
  async json<T>(url: string, schema: z.ZodType<T>, options: Parameters<Session['response']>[1] = {}): Promise<T> {
    const response = await this.response(url, options);
    const raw: unknown = await response.json();
    if (process.env.WEB_BENCH_SMOKE === '1') {
      await mkdir(new URL('../../tmp/responses/', import.meta.url), { recursive: true });
      const name = `${Date.now()}-${new URL(url).hostname}-${new URL(url).pathname.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      await writeFile(new URL(`../../tmp/responses/${name}`, import.meta.url), redact(JSON.stringify(raw)), { mode: 0o600 });
    }
    const result = schema.safeParse(raw);
    if (!result.success) throw new ApiError('other', `Response schema mismatch: ${result.error.issues.map(i => i.path.join('.')).join(', ')}`, response.status);
    return result.data;
  }
  async poll(): Promise<void> { await delay(2000, undefined, { signal: this.signal }); }
  next(url: string, base: string): string {
    const next = new URL(url, base);
    if (next.origin !== new URL(base).origin) throw new ApiError('other', 'Refused cross-origin pagination URL');
    return next.href;
  }
}
function hasContent(data: ToolData): boolean {
  switch (data.track) {
    case 'scrape': return Boolean(data.markdown.trim());
    case 'search': return data.hits.length > 0;
    case 'map': return data.urls.length > 0;
    case 'crawl': return data.pages.some(page => page.markdown.trim());
  }
}
export async function operation(ctx: CallContext, work: (session: Session) => Promise<ToolData>): Promise<ToolOutcome> {
  const start = performance.now();
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(new DOMException('Deadline exceeded', 'TimeoutError')), Math.max(1, ctx.timeoutMs));
  const signal = AbortSignal.any([ctx.signal, deadline.signal]);
  const session = new Session(signal);
  try {
    signal.throwIfAborted();
    const data = await work(session);
    signal.throwIfAborted();
    if (!hasContent(data)) throw new ApiError('empty', 'Provider returned blank content', session.status);
    return { kind: 'ok', data, ms: performance.now() - start, billing: session.billing };
  } catch (error) {
    if (signal.aborted) session.billing = reserveUnknownBilling(session.billing, 0);
    const category = signal.aborted ? 'timeout' : error instanceof ApiError ? error.category : error instanceof TypeError ? 'network' : 'other';
    const message = signal.aborted ? (ctx.signal.aborted ? 'Caller cancelled' : 'Deadline exceeded') : error instanceof Error ? redact(error.message).slice(0, 400) : 'Unknown provider failure';
    return { kind: 'error', error: category, message, status: error instanceof ApiError ? error.status ?? session.status : session.status, ms: performance.now() - start, billing: session.billing };
  } finally { clearTimeout(timer); }
}
export const nullableText = z.string().nullish().transform(value => value ?? null);
export const text = z.string().nullish().transform(value => value ?? '');
export const money = z.number().nonnegative().finite();
