import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { bearer, operation, queryUrl, secret, text } from './http.ts';
import { pricing } from './pricing.ts';
export const brightdata: Adapter = {
  id: 'brightdata', displayName: 'Bright Data', cohort: 'scraping-infra', apiVersion: 'Web Unlocker / SERP HTTP; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const response = await s.response('https://api.brightdata.com/request', { headers: bearer('BRIGHTDATA_API_KEY'), body: { zone: secret('BRIGHTDATA_UNLOCKER_ZONE'), url, format: 'raw', data_format: 'markdown' } });
    const markdown = await response.text(); s.estimate(pricing.brightdata.scrape);
    return { track: 'scrape', markdown, finalUrl: null };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const url = queryUrl('https://www.google.com/search', { q: query, num: limit, brd_json: 1 });
    const d = await s.json('https://api.brightdata.com/request', z.object({ organic: z.array(z.object({ link: z.string(), title: text, description: text })) }), { headers: bearer('BRIGHTDATA_API_KEY'), body: { zone: secret('BRIGHTDATA_SERP_ZONE'), url, format: 'raw' } });
    s.estimate(pricing.brightdata.search);
    return { track: 'search', hits: d.organic.slice(0, limit).map(r => ({ url: r.link, title: r.title, snippet: r.description, content: null, publishedAt: null })) };
  }),
};
