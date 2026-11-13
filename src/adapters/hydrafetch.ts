import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, assertPageStatus, nullableText, operation, pageFailure, scopeRegex, secret, text } from './http.ts';
import { pricing } from './pricing.ts';
const base = 'https://api.hydrafetch.com/v1/web';
const key = () => ({ 'X-API-Key': secret('HYDRAFETCH_API_KEY') });
const usage = z.object({ creditsUsed: z.number().optional() }).nullish();
const page = z.object({ url: z.string(), finalUrl: nullableText, status: z.number().nullish(), markdown: text, metadata: z.object({ title: nullableText }).nullish(), usage });
const crawlPage = z.object({ url: z.string(), status: z.string(), error: nullableText, errorCode: nullableText, data: page.nullish() });
const job = z.object({ data: z.object({ status: z.string(), creditsUsed: z.number(), pages: z.array(crawlPage) }) });
const fresh = (lane: string) => (lane === 'tuned' ? { maxAge: 0 } : {});
export const hydrafetch: Adapter = {
  id: 'hydrafetch', displayName: 'Hydrafetch', cohort: 'content-api', apiVersion: 'v1 /web; docs 2026-11-02',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json(`${base}/scrape`, z.object({ data: page }), { headers: key(), body: { url, formats: ['markdown'], ...fresh(ctx.lane) } });
    s.estimate(pricing.hydrafetch.credit);
    if (d.data.usage?.creditsUsed !== undefined) s.reported(d.data.usage.creditsUsed, pricing.hydrafetch.credit);
    assertPageStatus(d.data.status);
    return { track: 'scrape', markdown: d.data.markdown, finalUrl: d.data.finalUrl };
  }),
  map: ({ site, limit }, ctx) => operation(ctx, async s => {
    const section = new URL(site).pathname.replace(/\/+$/, '');
    const d = await s.json(`${base}/map`, z.object({ data: z.object({ links: z.array(z.object({ url: z.string() })) }) }), { headers: key(), body: { url: site, limit, ...(section ? { search: section } : {}) } });
    s.estimate(pricing.hydrafetch.credit);
    return { track: 'map', urls: d.data.links.map(l => l.url).slice(0, limit) };
  }),
  crawl: ({ site, scope, maxPages }, ctx) => operation(ctx, async s => {
    const headers = key();
    const started = await s.json(`${base}/crawl`, z.object({ crawlId: z.string() }), { headers, body: { url: site, limit: maxPages, includePaths: [scopeRegex(scope)], scrapeOptions: { formats: ['markdown'], ...fresh(ctx.lane) } } });
    const status = `${base}/crawl/${encodeURIComponent(started.crawlId)}`;
    let d: z.infer<typeof job>;
    for (;;) {
      await s.poll();
      d = await s.json(status, job, { headers });
      s.reported(d.data.creditsUsed, pricing.hydrafetch.credit);
      if (d.data.status === 'failed' || d.data.status === 'cancelled') throw new ApiError('other', `Crawl ${d.data.status}`, s.status);
      if (d.data.status === 'completed') break;
    }
    const pages: { url: string; markdown: string }[] = [];
    let failedPage: ApiError | null = null;
    for (const p of d.data.pages) {
      const failure = p.status === 'failed' ? pageFailure(null, p.errorCode ?? p.error ?? 'failed') : pageFailure(p.data?.status);
      if (failure) { failedPage ??= failure; continue; }
      if (p.status !== 'completed' || !p.data?.markdown.trim()) continue;
      const title = p.data.metadata?.title;
      pages.push({ url: p.data.finalUrl ?? p.url, markdown: title ? `HTML document title: ${title}\n\n${p.data.markdown}` : p.data.markdown });
    }
    if (!pages.length) throw failedPage ?? new ApiError('empty', 'No pages crawled');
    return { track: 'crawl', pages: pages.slice(0, maxPages) };
  }),
};
