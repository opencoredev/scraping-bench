import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, bearer, first, nullableText, operation, scopeRegex, text, type Session } from './http.ts';
import { pricing } from './pricing.ts';
const usage = z.object({ credits: z.number() }).optional();
const page = z.object({ url: z.string(), raw_content: text });
function bill(s: Session, reported: z.infer<typeof usage>, estimate: number): void {
  if (reported) s.reported(reported.credits, pricing.tavily.credit); else s.estimate(estimate * pricing.tavily.credit, estimate);
}
export const tavily: Adapter = {
  id: 'tavily', displayName: 'Tavily', cohort: 'content-api', apiVersion: 'HTTP 1.0.0; docs 2026-10-17',
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.tavily.com/search', z.object({ usage, results: z.array(z.object({ url: z.string(), title: text, content: text, raw_content: nullableText, published_date: nullableText })) }), { headers: bearer('TAVILY_API_KEY'), body: { query, max_results: Math.min(20, limit), include_usage: true, ...(ctx.lane === 'tuned' ? { search_depth: 'advanced', include_raw_content: 'markdown' } : {}) } });
    bill(s, d.usage, ctx.lane === 'tuned' ? 2 : 1);
    return { track: 'search', hits: d.results.map(r => ({ url: r.url, title: r.title, snippet: r.content, content: r.raw_content, publishedAt: r.published_date })) };
  }),
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.tavily.com/extract', z.object({ results: z.array(page), failed_results: z.array(z.object({ error: z.string() })).default([]), usage }), { headers: bearer('TAVILY_API_KEY'), body: { urls: [url], format: 'markdown', include_usage: true, ...(ctx.lane === 'tuned' ? { extract_depth: 'advanced' } : {}) } });
    bill(s, d.usage, d.results.length * (ctx.lane === 'tuned' ? 0.4 : 0.2));
    if (d.results.length === 0 && d.failed_results.length) throw new ApiError('other', first(d.failed_results).error, s.status);
    const p = first(d.results); return { track: 'scrape', markdown: p.raw_content, finalUrl: p.url };
  }),
  map: ({ site, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.tavily.com/map', z.object({ results: z.array(z.string()), usage }), { headers: bearer('TAVILY_API_KEY'), body: { url: site, limit, include_usage: true } });
    bill(s, d.usage, d.results.length / 10);
    return { track: 'map', urls: d.results };
  }),
  crawl: ({ site, scope, maxPages }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.tavily.com/crawl', z.object({ results: z.array(page), usage }), { headers: bearer('TAVILY_API_KEY'), body: { url: site, limit: maxPages, select_paths: [scopeRegex(scope)], format: 'markdown', include_usage: true, ...(ctx.lane === 'tuned' ? { extract_depth: 'advanced' } : {}) } });
    bill(s, d.usage, d.results.length * (ctx.lane === 'tuned' ? 0.5 : 0.3));
    return { track: 'crawl', pages: d.results.map(p => ({ url: p.url, markdown: p.raw_content })) };
  }),
};
