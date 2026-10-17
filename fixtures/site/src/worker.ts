import type { D1Database, ExportedHandler } from '@cloudflare/workers-types';
import { freshnessVersion, generateSite, parseSeed, sitePaths } from './data.ts';
import { escapeHtml, renderPage } from './render.ts';
import { reportPdf } from './pdf.ts';
// Bind the Worker global constructor type without importing a runtime package.
declare const Response: typeof import('@cloudflare/workers-types').Response;
type WorkerResponse = import('@cloudflare/workers-types').Response;
interface Env { LOGS: D1Database; LOG_TOKEN: string }
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    let seed = 'demo';
    let path = url.pathname;
    let root = '/r/demo';
    let response: WorkerResponse;
    let version = 'global';
    try {
      if (parts[1] === 'r') { seed = parseSeed(parts[2] ?? ''); root = `/r/${seed}`; path = '/' + parts.slice(3).join('/'); }
      const data = generateSite(seed);
      const currentVersion = freshnessVersion();
      version = `${seed}:${path === '/resources/freshness' ? currentVersion : '2'}`;
      if (url.pathname === '/__log') {
        if (!env.LOG_TOKEN || request.headers.get('authorization') !== `Bearer ${env.LOG_TOKEN}`) response = new Response('Unauthorized', {status:401});
        else {
          const since = url.searchParams.get('since') ?? '1970-01-01T00:00:00.000Z';
          const after = Number(url.searchParams.get('after') ?? '0');
          if (!Number.isFinite(Date.parse(since)) || !Number.isSafeInteger(after) || after < 0) response = new Response('Invalid since or after', {status:400});
          else { const rows = await env.LOGS.prepare('SELECT * FROM requests WHERE timestamp >= ? AND id > ? ORDER BY id LIMIT 1000').bind(new Date(since).toISOString(), after).all(); response = Response.json({requests:rows.results, pagination:'Use after=<last id> to read the next 1000 rows'}); }
        }
      } else if (url.pathname === '/robots.txt' || path === '/robots.txt') {
        response = new Response(`User-agent: *\nDisallow: /r/*/private/\nDisallow: /private/\nDisallow: /__log\nSitemap: ${url.origin}${root}/sitemap.xml\n`, {headers:{'content-type':'text/plain'}});
      } else if (path === '/sitemap.xml') {
        response = new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitePaths(data).map(p=>`<url><loc>${escapeHtml(url.origin + root + p)}</loc></url>`).join('')}</urlset>`,{headers:{'content-type':'application/xml'}});
      } else if (path.startsWith('/content/')) {
        const key = path.split('/').at(-1);
        const value = key === 'js' ? data.special.js : key === 'lazy' ? data.special.lazy : key === 'shadow' ? data.special.shadow : key === 'iframe' ? data.special.iframe : null;
        response = new Response(value ? `<h2>Service reference</h2><p>${value}</p>` : 'Not found', {status:value ? 200 : 404, headers:{'content-type':'text/html; charset=utf-8'}});
      } else if (path === '/resources/report.pdf') response = new Response(reportPdf(data.report),{headers:{'content-type':'application/pdf'}});
      else if (/^\/resources\/redirect\/[123]$/.test(path)) {
        const step = Number(path.at(-1));
        response = new Response(null,{status:302,headers:{location:root + (step < 3 ? `/resources/redirect/${step+1}` : '/resources/cookie')}});
      } else if (url.pathname === '/') response = new Response(null,{status:302,headers:{location:root+'/'}});
      else {
        const page = Number(url.searchParams.get('page') ?? 1);
        if (!Number.isSafeInteger(page) || page < 1) response = new Response('Invalid page',{status:400});
        else { const rendered = renderPage({data,root,path,page,version:currentVersion}); response = new Response(rendered.html,{status:rendered.status,headers:{'content-type':'text/html; charset=utf-8'}}); }
      }
    } catch { response = new Response('Invalid request',{status:400}); }
    response.headers.set('cache-control','no-store');
    // Await writes: a successful response guarantees its origin record has persisted.
    await env.LOGS.prepare('INSERT INTO requests(timestamp,path,query,user_agent,ip,asn,colo,content_version,status) VALUES(?,?,?,?,?,?,?,?,?)').bind(new Date().toISOString(),url.pathname,url.search,request.headers.get('user-agent') ?? '',request.headers.get('cf-connecting-ip') ?? '',request.cf?.asn ?? null, request.cf?.colo ?? null,version,response.status).run();
    return response;
  },
} satisfies ExportedHandler<Env>;
