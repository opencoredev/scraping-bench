import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, classify, bearer, nullableText, operation, queryUrl, text } from './http.ts';
import { pricing } from './pricing.ts';
const base = 'https://api.context.dev/v1/web';
const usage = z.object({ credits_consumed: z.number().optional(), credits_remaining: z.number().optional() }).optional();
const page = z.object({ url: nullableText, markdown: z.object({ success: z.boolean().nullable(), data: nullableText, error_code: nullableText, message: nullableText }), key_metadata: usage });
export const contextdev: Adapter = {
  id: 'contextdev', displayName: 'Context.dev', cohort: 'content-api', apiVersion: 'v1; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json(`${base}/scrape`, page, { headers: bearer('CONTEXT_DEV_API_KEY'), body: { url, formats: { markdown: true }, ...(ctx.lane === 'tuned' ? { maxAgeMs: 0, sharedParams: { mainContentOnly: true } } : {}) } });
    if (d.key_metadata?.credits_consumed !== undefined) s.reported(d.key_metadata.credits_consumed, pricing.contextdev.credit);
    if (!d.markdown.success) throw new ApiError(classify(d.markdown.error_code ?? ''), d.markdown.error_code ?? 'Markdown extraction failed', s.status);
    return { track: 'scrape', markdown: d.markdown.data ?? '', finalUrl: d.url };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json(`${base}/search`, z.object({ key_metadata: usage, results: z.array(z.object({ url: z.string(), title: text, description: text, markdown: z.union([z.string(), z.object({ markdown: nullableText, code: z.string() })]).nullish() })) }), { headers: bearer('CONTEXT_DEV_API_KEY'), body: { query, numResults: Math.max(10, Math.min(100, limit)), ...(ctx.lane === 'tuned' ? { markdownOptions: { enabled: true, useMainContentOnly: true, maxAgeMs: 0 } } : {}) } });
    if (d.key_metadata?.credits_consumed !== undefined) s.reported(d.key_metadata.credits_consumed, pricing.contextdev.credit);
    return { track: 'search', hits: d.results.slice(0, limit).map(r => ({ url: r.url, title: r.title, snippet: r.description, content: typeof r.markdown === 'string' ? r.markdown : r.markdown?.code === 'SUCCESS' ? r.markdown.markdown : null, publishedAt: null })) };
  }),
  map: ({ site, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json(queryUrl(`${base}/urls`, { domain: new URL(site).hostname, maxLinks: limit, urlRegex: `^${site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` }), z.object({ key_metadata: usage, urls: z.array(z.object({ url: z.string() })) }), { headers: bearer('CONTEXT_DEV_API_KEY') });
    if (d.key_metadata?.credits_consumed !== undefined) s.reported(d.key_metadata.credits_consumed, pricing.contextdev.credit);
    return { track: 'map', urls: d.urls.map(p => p.url).slice(0, limit) };
  }),
  crawl: ({ site, scope, maxPages }, ctx) => operation(ctx, async s => {
    const regex = `^${new URL(scope, site).href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
    const d = await s.json(`${base}/crawl`, z.object({ key_metadata: usage, results: z.array(z.object({ markdown: text, metadata: z.object({ url: z.string(), success: z.boolean().optional(), title: text }) })) }), { headers: bearer('CONTEXT_DEV_API_KEY'), body: { url: site, maxPages, urlRegex: regex, ...(ctx.lane === 'tuned' ? { maxAgeMs: 0, useMainContentOnly: true } : {}) } });
    if (d.key_metadata?.credits_consumed !== undefined) s.reported(d.key_metadata.credits_consumed, pricing.contextdev.credit);
    return { track: 'crawl', pages: d.results.filter(p => p.metadata.success !== false).map(p => ({ url: p.metadata.url, markdown: p.metadata.title ? `HTML document title: ${p.metadata.title}\n\n${p.markdown}` : p.markdown })) };
  }),
};
