import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { bearer, operation, text } from './http.ts';
import { pricing } from './pricing.ts';
export const linkup: Adapter = {
  id: 'linkup', displayName: 'Linkup', cohort: 'content-api', apiVersion: 'v1; docs 2026-10-17',
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.linkup.so/v1/search', z.object({ results: z.array(z.object({ url: z.string(), name: text, content: text })) }), { headers: bearer('LINKUP_API_KEY'), body: { q: query, depth: 'standard', outputType: 'searchResults', maxResults: limit } });
    s.estimate(pricing.linkup.search);
    return { track: 'search', hits: d.results.map(r => ({ url: r.url, title: r.name, snippet: r.content, content: null, publishedAt: null })) };
  }),
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.linkup.so/v1/fetch', z.object({ markdown: text }), { headers: bearer('LINKUP_API_KEY'), body: { url, ...(ctx.lane === 'tuned' ? { renderJs: true } : {}) } });
    s.estimate(ctx.lane === 'tuned' ? pricing.linkup.renderedScrape : pricing.linkup.scrape);
    return { track: 'scrape', markdown: d.markdown, finalUrl: null };
  }),
};
