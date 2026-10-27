import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, bearer, classify, nullableText, operation, queryUrl, text, type Session } from './http.ts';
import { pricing } from './pricing.ts';
const page = z.object({ url: nullableText, title: text, content: text, description: text, usage: z.object({ tokens: z.number() }).optional() });
function headers(lane: string): Record<string, string> {
  return { ...(jinaAuthMode() === 'key' ? bearer('JINA_API_KEY') : {}), ...(lane === 'tuned' ? { 'X-No-Cache': 'true', 'X-Engine': 'browser' } : {}) };
}
export function jinaAuthMode(): 'key' | 'keyless' {
  return process.env.JINA_AUTH_MODE === 'keyless' || !process.env.JINA_API_KEY ? 'keyless' : 'key';
}
function bill(s: Session, tokens: number | undefined): void {
  if (jinaAuthMode() === 'keyless') { s.estimate(0); return; }
  const header = s.headers.get('x-usage-tokens');
  const total = header !== null && Number.isFinite(Number(header)) ? Number(header) : tokens;
  if (total !== undefined) s.reported(total, pricing.jina.token);
}
export const jina: Adapter = {
  id: 'jina', displayName: 'Jina Reader/Search', cohort: 'content-api', apiVersion: 'Reader/Search HTTP; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json(`https://r.jina.ai/${url}`, z.object({ code: z.number(), data: page }), { headers: { ...headers(ctx.lane), 'X-Token-Budget': '5000' } });
    bill(s, d.data.usage?.tokens);
    if (d.code !== 200) throw new ApiError(classify('', d.code), 'Reader failed', d.code);
    return { track: 'scrape', markdown: d.data.content, finalUrl: d.data.url };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json(queryUrl('https://s.jina.ai/', { q: query }), z.object({ code: z.number(), data: z.array(page) }), { headers: headers(ctx.lane) });
    bill(s, d.data.some(p => p.usage !== undefined) ? d.data.reduce((sum, p) => sum + (p.usage?.tokens ?? 0), 0) : undefined);
    if (d.code !== 200) throw new ApiError(classify('', d.code), 'Search failed', d.code);
    if (s.billing.credits === null && jinaAuthMode() === 'key') s.estimate(pricing.jina.searchTokens * pricing.jina.token, pricing.jina.searchTokens);
    return { track: 'search', hits: d.data.slice(0, limit).map(r => ({ url: r.url ?? '', title: r.title, snippet: r.description, content: r.content, publishedAt: null })) };
  }),
};
