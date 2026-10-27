import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, assertPageStatus, bearer, nullableText, operation, queryUrl, text, type Session } from './http.ts';
import { pricing } from './pricing.ts';
const base = 'https://request.usestring.ai/v1';
const billedType = z.enum(['request_standard', 'request_premium', 'browser_standard', 'browser_premium', 'search']);
// String bills a request only when it carries x-billed-request-type (a 502 can, per its pricing docs). An HTTP
// response without the header was not billed; with no response at all the charge is unknown, so the reservation stays.
function bill(s: Session): void {
  if (s.status === null) return;
  const header = s.headers.get('x-billed-request-type');
  if (header === null) { s.estimate(0); return; }
  const type = billedType.safeParse(header);
  if (!type.success) throw new ApiError('other', `Unknown billed request type: ${header}`, s.status);
  s.reportedUsd(pricing.string[type.data]);
}
// One Google results page holds about ten results and is billed as one search; searchCount pages further.
const GOOGLE_PAGE = 10;
const searchResponse = z.object({
  results: z.array(z.object({ url: z.string().optional(), title: text, snippet: text })),
  paging: z.object({ pages: z.number().int().nonnegative() }).optional(),
});
// Sitemap jobs are capped at the quote's worst-case page rate (about $0.0053), so this cap allows ~22 pages per job,
// well above the largest map section (12 URLs), while the actual charge is the job's reported costUsd.
export const STRING_MAP_BUDGET_USD = 0.12;
const MAP_STOP_MARGIN_MS = 10_000;
const job = z.object({ jobId: z.string(), status: z.string(), costUsd: z.coerce.number().nonnegative().optional(), errorMessage: nullableText.optional() });
const urlPage = z.object({ total: z.number().int().nonnegative(), urls: z.array(z.object({ url: z.string(), isSitemap: z.boolean().optional() })) });
const MAP_DONE = new Set(['completed', 'token_cap_exceeded']);
async function collectUrls(s: Session, jobUrl: string, headers: Record<string, string>, limit: number): Promise<string[]> {
  const urls: string[] = [];
  for (let offset = 0; ; ) {
    const page = await s.json(queryUrl(`${jobUrl}/urls`, { limit: 5000, offset }), urlPage, { headers });
    for (const entry of page.urls) if (!entry.isSitemap) urls.push(entry.url);
    offset += page.urls.length;
    if (!page.urls.length || offset >= page.total || urls.length >= limit) break;
  }
  return [...new Set(urls)].slice(0, limit);
}
// Cancels with its own short timeout, so it still runs after the call's deadline has aborted the session. Best effort:
// the call's billing stays uncertain unless a final cost was read.
async function cancelJob(jobUrl: string, headers: Record<string, string>): Promise<void> {
  try { await fetch(jobUrl, { method: 'DELETE', headers, signal: AbortSignal.timeout(5_000) }); } catch { /* the cost reservation already covers a job we could not stop */ }
}
export const string: Adapter = {
  id: 'string', displayName: 'String', cohort: 'scraping-infra', apiVersion: 'Web Access v1 /fetch, /search, /sitemap; docs 2026-10-24',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    let response: Response;
    try {
      response = await s.response(`${base}/fetch`, { headers: { ...bearer('STRING_API_KEY'), Accept: 'text/markdown' }, body: { url, format: 'markdown', ...(ctx.lane === 'tuned' ? { mainContentOnly: true, executeJS: true } : {}) } });
    } finally { bill(s); }
    const markdown = await response.text();
    const status = response.headers.get('x-status-code');
    assertPageStatus(status === null ? null : Number(status));
    return { track: 'scrape', markdown, finalUrl: response.headers.get('x-final-url') };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    let d: z.infer<typeof searchResponse>;
    try {
      d = await s.json(`${base}/search`, searchResponse, { headers: bearer('STRING_API_KEY'), body: { query, ...(limit > GOOGLE_PAGE ? { searchCount: limit } : {}) } });
    } catch (error) {
      // An error status is not billed, per String's search reference. A 200 we could not read may have been billed,
      // and no response at all leaves the charge unknown, so both keep the reservation.
      if (s.status !== null && s.status >= 400) s.estimate(0);
      throw error;
    }
    s.reportedUsd((d.paging?.pages ?? 1) * pricing.string.search);
    return { track: 'search', hits: d.results.flatMap(r => r.url ? [{ url: r.url, title: r.title, snippet: r.snippet, content: null, publishedAt: null }] : []).slice(0, limit) };
  }),
  map: ({ site, limit }, ctx) => operation(ctx, async s => {
    const stopAt = performance.now() + ctx.timeoutMs - MAP_STOP_MARGIN_MS;
    const headers = bearer('STRING_API_KEY');
    // Scope the crawl to the section the task names, as the Context.dev adapter scopes its URL list to the site prefix.
    const path = new URL(site).pathname;
    const quote = await s.json(`${base}/sitemap`, job, { headers, body: { url: site, maxPages: limit, budgetUsd: STRING_MAP_BUDGET_USD, ...(path === '/' ? {} : { pathPrefix: path }) } });
    const jobUrl = `${base}/sitemap/${encodeURIComponent(quote.jobId)}`;
    // From approval until a terminal status is read, the job may be spending: any exit on that path cancels it.
    let open = true;
    try {
      await s.json(`${jobUrl}/approve`, job, { headers, method: 'POST' });
      let state = await s.json(jobUrl, job, { headers });
      while (state.status === 'running' && performance.now() < stopAt) { await s.poll(); state = await s.json(jobUrl, job, { headers }); }
      if (state.status === 'running') {
        // Out of time: stop the job so it charges nothing further, then read the final state. A job that finished in
        // the meantime answers the cancel with 409 and is read as finished.
        await cancelJob(jobUrl, headers);
        state = await s.json(jobUrl, job, { headers });
      }
      open = state.status === 'running';
      if (state.costUsd !== undefined) s.reportedUsd(state.costUsd);
      if (!MAP_DONE.has(state.status) && state.status !== 'canceled') throw new ApiError('other', `Sitemap job ${state.status}: ${state.errorMessage ?? 'no message'}`, s.status);
      return { track: 'map', urls: await collectUrls(s, jobUrl, headers, limit) };
    } finally {
      if (open) await cancelJob(jobUrl, headers);
    }
  }),
};
