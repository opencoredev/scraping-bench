import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, assertPageStatus, classify, first, nullableText, operation, queryUrl, secret, text } from './http.ts';
import { pricing } from './pricing.ts';
export const tinyfish: Adapter = {
  id: 'tinyfish', displayName: 'TinyFish Fetch/Search', cohort: 'content-api', apiVersion: 'Fetch/Search HTTP; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.fetch.tinyfish.ai', z.object({ results: z.array(z.object({ final_url: nullableText, text, })), errors: z.array(z.object({ error: z.string(), status_code: z.number().nullish() })).default([]) }), { headers: { 'X-API-Key': secret('TINYFISH_API_KEY') }, body: { urls: [url], format: 'markdown', ...(ctx.lane === 'tuned' ? { ttl: 0 } : {}) } });
    s.estimate(pricing.tinyfish.fetch);
    const error = d.errors[0]; if (error) throw new ApiError(classify(error.error, error.status_code ?? null), error.error, error.status_code ?? null);
    const p = first(d.results);
    return { track: 'scrape', markdown: p.text, finalUrl: p.final_url };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json(queryUrl('https://api.search.tinyfish.ai', { query }), z.object({ results: z.array(z.object({ url: z.string(), title: text, snippet: text, date: nullableText })) }), { headers: { 'X-API-Key': secret('TINYFISH_API_KEY') } });
    s.estimate(pricing.tinyfish.search);
    return { track: 'search', hits: d.results.slice(0, limit).map(r => ({ url: r.url, title: r.title, snippet: r.snippet, content: null, publishedAt: r.date })) };
  }),
};
