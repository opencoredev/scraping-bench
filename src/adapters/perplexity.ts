import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { bearer, nullableText, operation, text } from './http.ts';
import { pricing } from './pricing.ts';
export const perplexity: Adapter = {
  id: 'perplexity', displayName: 'Perplexity Search', cohort: 'search-index', apiVersion: 'Search HTTP 1.0.0; docs 2026-10-17',
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.perplexity.ai/search', z.object({ results: z.array(z.object({ url: z.string(), title: text, snippet: text, date: nullableText })) }), { headers: bearer('PERPLEXITY_API_KEY'), body: { query, max_results: Math.min(20, limit) } });
    s.estimate(pricing.perplexity.search);
    return { track: 'search', hits: d.results.map(r => ({ url: r.url, title: r.title, snippet: r.snippet, content: null, publishedAt: r.date })) };
  }),
};
