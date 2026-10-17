import { z } from 'zod';
import type { Adapter, ToolData } from '../core/types.ts';
import { ApiError, assertPageStatus, operation, queryUrl, secret, text, type Session } from './http.ts';
import { pricing } from './pricing.ts';
const base = 'https://api.scrapfly.io';
const contentPage = z.object({ links: z.object({ next: z.string().nullable() }), contents: z.record(z.string(), z.object({ markdown: text })) });
export const scrapfly: Adapter = {
  id: 'scrapfly', displayName: 'Scrapfly', cohort: 'scraping-infra', apiVersion: 'Web Scraping/Crawler HTTP; docs 2026-10-17',
  scrape: ({ url }, ctx) => operation(ctx, async s => {
    const d = await s.json(queryUrl(`${base}/scrape`, { key: secret('SCRAPFLY_API_KEY'), url, format: ctx.lane === 'tuned' ? 'markdown:only_content' : 'markdown', retry: false, ...(ctx.lane === 'tuned' ? { render_js: true } : {}) }), z.object({ result: z.object({ content: text, url: z.string().optional(), status_code: z.number().optional(), success: z.boolean().optional() }), context: z.object({ cost: z.object({ total: z.number() }).optional() }).optional() }));
    if (d.context?.cost?.total !== undefined) s.reported(d.context.cost.total, pricing.scrapfly.credit);
    assertPageStatus(d.result.status_code);
    if (d.result.success === false) throw new ApiError('other', 'Scrape unsuccessful', s.status);
    return { track: 'scrape', markdown: d.result.content, finalUrl: d.result.url ?? null };
  }),
  crawl: ({ site, scope, maxPages }, ctx) => operation(ctx, async s => {
    const key = secret('SCRAPFLY_API_KEY');
    const d = await s.json(queryUrl(`${base}/crawl`, { key }), z.union([z.object({ crawler_uuid: z.string() }).transform(d => ({ id: d.crawler_uuid })), z.object({ uuid: z.string() }).transform(d => ({ id: d.uuid }))]), { body: { url: site, page_limit: maxPages, include_only_paths: [`${new URL(scope, site).pathname}*`], content_formats: ['markdown'], max_duration: Math.max(15, Math.min(10800, Math.floor(ctx.timeoutMs / 1000))), ...(ctx.lane === 'tuned' ? { rendering_delay: 2000 } : {}) } });
    return collectScrapflyCrawl(s, d.id, key, maxPages);
  }),
};

export async function collectScrapflyCrawl(s: Session, id: string, key: string, maxPages: number): Promise<Extract<ToolData, { track: 'crawl' }>> {
    const job = `${base}/crawl/${encodeURIComponent(id)}`;
    for (;;) {
      await s.poll();
      const status = await s.json(queryUrl(`${job}/status`, { key }), z.object({ is_finished: z.boolean(), is_success: z.boolean().nullable(), state: z.object({ api_credit_used: z.number(), stop_reason: z.string().nullable() }) }));
      s.reported(status.state.api_credit_used, pricing.scrapfly.credit);
      if (!status.is_finished) continue;
      if (!status.is_success) throw new ApiError('other', `Crawl stopped: ${status.state.stop_reason ?? 'unknown'}`, s.status);
      break;
    }
    let next: string | null = queryUrl(`${job}/contents`, { key, formats: 'markdown', limit: 50 });
    const pages: { url: string; markdown: string }[] = [];
    const seen = new Set<string>();
    while (next) {
      if (seen.has(next)) throw new ApiError('other', 'Repeated pagination cursor'); seen.add(next);
      const d = await s.json(next, contentPage);
      for (const [url, p] of Object.entries(d.contents)) pages.push({ url, markdown: p.markdown });
      if (d.links.next) { const u = new URL(s.next(d.links.next, base)); u.searchParams.set('key', key); u.searchParams.set('formats', 'markdown'); next = u.href; } else next = null;
    }
    return { track: 'crawl', pages: pages.slice(0, maxPages) };
}
