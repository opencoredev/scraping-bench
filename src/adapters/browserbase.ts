import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { assertPageStatus, nullableText, operation, secret, text } from './http.ts';
import { pricing } from './pricing.ts';
export const browserbase: Adapter = {
  id: 'browserbase', displayName: 'Browserbase Fetch/Search', cohort: 'browser-infra', apiVersion: 'v1; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.browserbase.com/v1/fetch', z.object({ statusCode: z.number(), content: z.string() }), { headers: { 'X-BB-API-Key': secret('BROWSERBASE_API_KEY') }, body: { url, format: 'markdown', ...(ctx.lane === 'tuned' ? { allowRedirects: true } : {}) } });
    s.estimate(pricing.browserbase.scrape); assertPageStatus(d.statusCode);
    return { track: 'scrape', markdown: d.content, finalUrl: null };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.browserbase.com/v1/search', z.object({ results: z.array(z.object({ url: z.string(), title: text, publishedDate: nullableText })) }), { headers: { 'X-BB-API-Key': secret('BROWSERBASE_API_KEY') }, body: { query, numResults: Math.min(25, limit) } });
    s.estimate(pricing.browserbase.search);
    return { track: 'search', hits: d.results.map(r => ({ url: r.url, title: r.title, snippet: '', content: null, publishedAt: r.publishedDate })) };
  }),
};
