import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, bearer, classify, first, nullableText, operation, text } from './http.ts';
import { pricing } from './pricing.ts';
const result = z.object({ url: z.string(), title: text, text: nullableText, highlights: z.array(z.string()).optional(), publishedDate: nullableText });
const cost = z.object({ total: z.number() }).optional();
export const exa: Adapter = {
  id: 'exa', displayName: 'Exa', cohort: 'content-api', apiVersion: 'HTTP 2.0.0; docs 2026-10-17',
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.exa.ai/search', z.object({ results: z.array(result), costDollars: cost }), { headers: bearer('EXA_API_KEY'), body: { query, numResults: limit, ...(ctx.lane === 'tuned' ? { contents: { text: true, maxAgeHours: 0 } } : {}) } });
    s.estimate(pricing.exa.search + Math.max(0, d.results.length - 10) * 0.001);
    if (d.costDollars) s.reportedUsd(d.costDollars.total);
    return { track: 'search', hits: d.results.map(r => ({ url: r.url, title: r.title, snippet: r.highlights?.join('\n') ?? '', content: r.text, publishedAt: r.publishedDate })) };
  }),
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json('https://api.exa.ai/contents', z.object({ results: z.array(result), costDollars: cost, statuses: z.array(z.object({ status: z.string(), error: z.object({ tag: z.string(), httpStatusCode: z.number().nullish() }).nullish() })).optional() }), { headers: bearer('EXA_API_KEY'), body: { urls: [url], text: true, ...(ctx.lane === 'tuned' ? { maxAgeHours: 0 } : {}) } });
    s.estimate(pricing.exa.scrape); if (d.costDollars) s.reportedUsd(d.costDollars.total);
    const e = d.statuses?.find(p => p.status === 'error')?.error;
    if (e) throw new ApiError(classify(e.tag, e.httpStatusCode ?? null), e.tag, e.httpStatusCode ?? null);
    const p = first(d.results);
    return { track: 'scrape', markdown: p.text ?? '', finalUrl: p.url };
  }),
};
