import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, classify, first, nullableText, operation, secret, text } from './http.ts';
import { pricing } from './pricing.ts';
const item = z.object({ url: z.string(), title: text, excerpts: z.array(z.string()).default([]), full_content: nullableText, publish_date: nullableText });
const usage = z.array(z.object({ name: z.string(), count: z.number() })).optional();
export const parallel: Adapter = {
  id: 'parallel', displayName: 'Parallel', cohort: 'content-api', apiVersion: 'v1; docs 2026-10-17',
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.parallel.ai/v1/search', z.object({ results: z.array(item), usage }), { headers: { 'x-api-key': secret('PARALLEL_API_KEY') }, body: { search_queries: [query], advanced_settings: { max_results: Math.min(limit, 10) }, ...(ctx.lane === 'tuned' ? { objective: query, mode: 'advanced' } : {}) } });
    s.estimate(pricing.parallel.search + Math.max(0, d.results.length - 10) * pricing.parallel.additionalResult);
    return { track: 'search', hits: d.results.slice(0, limit).map(r => ({ url: r.url, title: r.title, snippet: r.excerpts.join('\n'), content: r.full_content, publishedAt: r.publish_date })) };
  }),
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.parallel.ai/v1/extract', z.object({ results: z.array(item), errors: z.array(z.object({ error_type: z.string(), http_status_code: z.number().nullish() })).default([]), usage }), { headers: { 'x-api-key': secret('PARALLEL_API_KEY') }, body: { urls: [url], ...(ctx.lane === 'tuned' ? { advanced_settings: { full_content: true, fetch_policy: { max_age_seconds: 600, disable_cache_fallback: true } } } : {}) } });
    s.estimate(pricing.parallel.scrape);
    const e = d.errors[0]; if (e) throw new ApiError(classify(e.error_type, e.http_status_code ?? null), e.error_type, e.http_status_code ?? null);
    const p = first(d.results);
    return { track: 'scrape', markdown: p.full_content ?? p.excerpts.join('\n\n'), finalUrl: p.url };
  }),
};
