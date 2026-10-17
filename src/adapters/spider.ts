import { z } from 'zod';
import { pricing } from './pricing.ts';
import type { Adapter } from '../core/types.ts';
import { ApiError, assertPageStatus, bearer, first, nullableText, operation, pageFailure, scopeRegex, text, type Session } from './http.ts';
const page = z.object({ url: z.string(), content: text, title: text, description: text, status: z.number().nullish(), error: nullableText,
  metadata: z.object({ title: text, description: text }).nullish(), costs: z.object({ total_cost: z.number() }).optional(), links: z.array(z.string()).optional() });
const pages = z.array(page);
const searchResponse = z.union([pages, z.object({ content: pages, costs: z.object({ total_cost: z.number() }).optional() })]);
function bill(s: Session, rows: z.infer<typeof pages>): void {
  if (rows.length > 0 && rows.every(p => p.costs !== undefined)) s.reportedUsd(rows.reduce((sum, p) => sum + (p.costs?.total_cost ?? 0), 0));
}
const settings = (lane: string) => ({ return_format: 'markdown', ...(lane === 'tuned' ? { request: 'browser', readability: true, filter_output_main_only: true, cache: false } : {}) });
export const spider: Adapter = {
  id: 'spider', displayName: 'Spider', cohort: 'content-api', apiVersion: 'HTTP; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const keyless = process.env.SPIDER_AUTH_MODE === 'keyless';
    const headers = keyless ? {} : bearer('SPIDER_API_KEY');
    const metered = !keyless && process.env.SPIDER_METER_BALANCE === '1';
    const readCredits = async () => (await s.json('https://api.spider.cloud/data/credits', z.object({ data: z.object({ credits: z.coerce.number().nonnegative() }) }), { headers })).data.credits;
    const before = metered ? await readCredits() : null;
    if (before !== null && before < 324) throw new ApiError('other', 'Spider budget exhausted: retain 124 credits and reserve 200 for a single-page request');
    try {
      const d = await s.json('https://api.spider.cloud/scrape', pages, { headers, body: { url, ...settings(ctx.lane), limit: 1 } });
      bill(s, d); if (keyless) s.estimate(0); const p = first(d); assertPageStatus(p.status, p.error ?? '');
      return { track: 'scrape', markdown: p.content, finalUrl: p.url };
    } finally {
      if (before !== null) { const after = await readCredits(); s.reported(Math.max(0, before - after), pricing.spider.credit); }
    }
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.spider.cloud/search', searchResponse, { headers: bearer('SPIDER_API_KEY'), body: { search: query, search_limit: limit, ...settings(ctx.lane), ...(ctx.lane === 'tuned' ? { fetch_page_content: true } : {}) } });
    const rows = Array.isArray(d) ? d : d.content;
    bill(s, rows); if (!Array.isArray(d) && d.costs) s.reportedUsd(d.costs.total_cost);
    return { track: 'search', hits: rows.slice(0, limit).map(p => ({ url: p.url, title: p.metadata?.title || p.title, snippet: p.metadata?.description || p.description, content: p.content || null, publishedAt: null })) };
  }),
  map: ({ site, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.spider.cloud/links', z.union([pages, z.object({ links: z.array(z.string()) })]), { headers: bearer('SPIDER_API_KEY'), body: { url: site, limit } });
    if (Array.isArray(d)) { bill(s, d); for (const p of d) assertPageStatus(p.status, p.error ?? ''); return { track: 'map', urls: [...new Set(d.flatMap(p => p.links ?? [p.url]))].slice(0, limit) }; }
    return { track: 'map', urls: d.links.slice(0, limit) };
  }),
  crawl: ({ site, scope, maxPages }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.spider.cloud/crawl', pages, { headers: bearer('SPIDER_API_KEY'), body: { url: site, limit: maxPages, whitelist: [scopeRegex(scope)], ...settings(ctx.lane) } });
    bill(s, d);
    const usable = d.filter(p => !pageFailure(p.status, p.error ?? '') && p.content.trim());
    if (!usable.length) { const failure = d.map(p => pageFailure(p.status, p.error ?? '')).find(Boolean); if (failure) throw failure; }
    return { track: 'crawl', pages: usable.map(p => ({ url: p.url, markdown: p.content })) };
  }),
};
