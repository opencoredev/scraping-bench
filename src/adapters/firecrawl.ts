import { z } from 'zod';
import type { Adapter } from '../core/types.ts';
import { ApiError, assertPageStatus, bearer, first, nullableText, operation, pageFailure, scopeRegex, text } from './http.ts';
import { pricing } from './pricing.ts';
const base = 'https://api.firecrawl.dev/v2';
const metadata = z.object({ sourceURL: nullableText, url: nullableText, statusCode: z.number().nullish(), error: nullableText, title: text }).default({ sourceURL: null, url: null, error: null, title: '' });
const page = z.object({ markdown: text, metadata });
const scrape = z.object({ success: z.boolean(), data: page, creditsUsed: z.number().optional() });
const job = z.object({ status: z.string(), creditsUsed: z.number().optional(), next: nullableText, data: z.array(page) });
const options = (lane: string) => ({ formats: ['markdown'], ...(lane === 'tuned' ? { maxAge: 0, onlyMainContent: true } : {}) });
export const firecrawl: Adapter = {
  id: 'firecrawl', displayName: 'Firecrawl', cohort: 'content-api', apiVersion: 'v2; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json(`${base}/scrape`, scrape, { headers: bearer('FIRECRAWL_API_KEY'), body: { url, ...options(ctx.lane) } });
    s.estimate(pricing.firecrawl.credit); if (d.creditsUsed !== undefined) s.reported(d.creditsUsed, pricing.firecrawl.credit);
    assertPageStatus(d.data.metadata.statusCode, d.data.metadata.error ?? '');
    if (!d.success) throw new ApiError('other', 'Scrape unsuccessful');
    return { track: 'scrape', markdown: d.data.markdown, finalUrl: d.data.metadata.url ?? d.data.metadata.sourceURL };
  }),
  search: ({ query, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json(`${base}/search`, z.object({ success: z.boolean(), creditsUsed: z.number().optional(), data: z.object({ web: z.array(z.object({ url: z.string(), title: text, description: text, markdown: nullableText })).default([]) }) }), { headers: bearer('FIRECRAWL_API_KEY'), body: { query, limit, ...(ctx.lane === 'tuned' ? { scrapeOptions: options(ctx.lane) } : {}) } });
    s.estimate(pricing.firecrawl.credit * (Math.ceil(limit / 10) * 2 + (ctx.lane === 'tuned' ? d.data.web.length : 0)));
    if (d.creditsUsed !== undefined) s.reported(d.creditsUsed, pricing.firecrawl.credit);
    if (!d.success) throw new ApiError('other', 'Search unsuccessful');
    return { track: 'search', hits: d.data.web.slice(0, limit).map(r => ({ url: r.url, title: r.title, snippet: r.description, content: r.markdown, publishedAt: null })) };
  }),
  map: ({ site, limit }, ctx) => operation(ctx, async s => {
    const d = await s.json(`${base}/map`, z.object({ success: z.boolean(), links: z.array(z.object({ url: z.string() })), creditsUsed: z.number().optional() }), { headers: bearer('FIRECRAWL_API_KEY'), body: { url: site, limit, ...(ctx.lane === 'tuned' ? { ignoreCache: true } : {}) } });
    s.estimate(pricing.firecrawl.credit); if (d.creditsUsed !== undefined) s.reported(d.creditsUsed, pricing.firecrawl.credit);
    if (!d.success) throw new ApiError('other', 'Map unsuccessful');
    return { track: 'map', urls: d.links.map(r => r.url).slice(0, limit) };
  }),
  crawl: ({ site, scope, maxPages }, ctx) => operation(ctx, async s => {
    const headers = bearer('FIRECRAWL_API_KEY');
    const submitted = await s.json(`${base}/crawl`, z.object({ success: z.boolean(), id: z.string() }), { headers, body: { url: site, limit: maxPages, includePaths: [scopeRegex(scope)], scrapeOptions: options(ctx.lane) } });
    if (!submitted.success) throw new ApiError('other', 'Crawl submission unsuccessful');
    const root = `${base}/crawl/${encodeURIComponent(submitted.id)}`;
    let next = root;
    const pages = new Map<string, { url: string; markdown: string }>();
    const completedPages = new Set<string>();
    let failedPage: ApiError | null = null;
    let totalCredits: number | undefined;
    for (;;) {
      await s.poll();
      const d = await s.json(next, job, { headers });
      if (d.creditsUsed !== undefined) { totalCredits = Math.max(totalCredits ?? 0, d.creditsUsed); s.reported(totalCredits, pricing.firecrawl.credit); }
      for (const p of d.data) { const failure = pageFailure(p.metadata.statusCode, p.metadata.error ?? ''); if (failure) { failedPage ??= failure; continue; } const url = p.metadata.url ?? p.metadata.sourceURL; if (url) pages.set(url, { url, markdown: p.metadata.title ? `HTML document title: ${p.metadata.title}\n\n${p.markdown}` : p.markdown }); }
      if (d.status === 'failed' || d.status === 'cancelled') throw new ApiError('other', `Crawl ${d.status}`, s.status);
      if (d.next) {
        const candidate = s.next(d.next, base);
        if (d.status === 'completed') {
          if (completedPages.has(candidate)) throw new ApiError('other', 'Cyclic crawl pagination');
          completedPages.add(candidate);
        }
        next = candidate; continue;
      }
      if (d.status === 'completed') break;
      next = root;
    }
    if (!pages.size && failedPage) throw failedPage;
    if (totalCredits === undefined) s.estimate(pages.size * pricing.firecrawl.credit);
    return { track: 'crawl', pages: [...pages.values()].slice(0, maxPages) };
  }),
};
