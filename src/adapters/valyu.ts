import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, classify, nullableText, operation, secret, text } from './http.ts';
import { pricing } from './pricing.ts';
const base = 'https://api.valyu.ai/v1';
const key = () => ({ 'x-api-key': secret('VALYU_API_KEY') });
// Search caps the price per 1,000 results in USD. 35 lets the default search use its paid sources, as a caller gets
// by default; the reported total_deduction_dollars is the charge.
const SEARCH_MAX_PRICE = 35;
const MAX_RESULTS = 20;
// Caps the page text per search result. The default is 25,000 characters; 4,000 keeps the answer in nearly every
// task and cuts what the agent reads by about two thirds.
const RESPONSE_LENGTH = 4000;
const contentsResponse = z.object({
  success: z.boolean().nullish(), error: nullableText, total_cost_dollars: z.number().nullish(),
  results: z.array(z.object({ url: text, title: text, content: z.unknown(), status: nullableText })).nullish(),
});
const searchResponse = z.object({
  success: z.boolean().nullish(), error: nullableText, total_deduction_dollars: z.number().nullish(),
  results: z.array(z.object({ url: text, title: text, description: nullableText, content: z.unknown(), publication_date: nullableText })).nullish(),
});
// Content is Markdown text; structured extraction returns an object, which is passed on as JSON.
const asText = (value: unknown): string => typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);
export const valyu: Adapter = {
  id: 'valyu', displayName: 'Valyu', cohort: 'content-api', apiVersion: 'v1 /contents, /search; docs 2026-11-07',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json(`${base}/contents`, contentsResponse, { headers: key(), body: { urls: [url], ...(ctx.lane === 'tuned' ? { extract_effort: 'high' } : {}) } });
    if (typeof d.total_cost_dollars === 'number') s.reportedUsd(d.total_cost_dollars); else s.estimate(pricing.valyu.contents);
    const page = d.results?.[0];
    if (!page || page.status === 'failed') { const message = d.error ?? 'No page content'; throw new ApiError(classify(message, s.status), message, s.status); }
    return { track: 'scrape', markdown: asText(page.content), finalUrl: page.url || null };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const count = Math.min(MAX_RESULTS, limit);
    const d = await s.json(`${base}/search`, searchResponse, { headers: key(), body: { query, max_num_results: count, max_price: SEARCH_MAX_PRICE, response_length: RESPONSE_LENGTH } });
    if (typeof d.total_deduction_dollars === 'number') s.reportedUsd(d.total_deduction_dollars); else s.estimate(pricing.valyu.webResult * count);
    return { track: 'search', hits: (d.results ?? []).map(r => ({ url: r.url, title: r.title, snippet: r.description ?? '', content: asText(r.content) || null, publishedAt: r.publication_date || null })) };
  }),
};
