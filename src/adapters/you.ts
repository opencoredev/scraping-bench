import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { first, operation, queryUrl, secret, text } from './http.ts';
import { pricing } from './pricing.ts';

const hit = z.object({ url: z.string(), title: text, description: text, snippets: z.array(z.string()).optional(), page_age: z.string().nullish() });
// GET is the frozen legacy Search API: no optional extraction or extra charges.
export const you: Adapter = {
  id: 'you', displayName: 'You.com', cohort: 'search-index', apiVersion: 'v1 GET search / POST contents; docs 2026-10-19',
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json(queryUrl('https://ydc-index.io/v1/search', { query, count: Math.max(1, Math.min(100, limit)) }), z.object({ results: z.object({ web: z.array(hit) }) }), { headers: { 'X-API-Key': secret('YDC_API_KEY') } });
    s.estimate(pricing.you.search);
    return { track: 'search', hits: d.results.web.map(r => ({ url: r.url, title: r.title, snippet: [r.description, ...(r.snippets ?? [])].filter(Boolean).join('\n'), content: null, publishedAt: r.page_age ?? null })) };
  }),
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const pages = await s.json('https://ydc-index.io/v1/contents', z.array(z.object({ url: z.string(), markdown: text })), { headers: { 'X-API-Key': secret('YDC_API_KEY') }, body: { urls: [url], formats: ['markdown'] } });
    s.estimate(pricing.you.scrape);
    const page = first(pages);
    return { track: 'scrape', markdown: page.markdown, finalUrl: page.url };
  }),
};
