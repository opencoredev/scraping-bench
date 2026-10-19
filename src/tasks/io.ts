import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { decodeHTML } from 'entities';
import { z } from 'zod';

const robotsFactory = z.function({ input: [z.string(), z.string()], output: z.unknown() }).parse(createRequire(import.meta.url)('robots-parser'));
const robotMethods = z.object({
  isAllowed: z.function({ input: [z.string(), z.string()], output: z.boolean().optional() }),
  getCrawlDelay: z.function({ input: [z.string()], output: z.number().optional() }),
});
function parseRobots(url: string, body: string): z.infer<typeof robotMethods> {
  const instance = robotsFactory(url, body);
  if (typeof instance !== 'object' || instance === null || !('isAllowed' in instance) || typeof instance.isAllowed !== 'function' || !('getCrawlDelay' in instance) || typeof instance.getCrawlDelay !== 'function') throw new Error('Invalid robots-parser instance');
  // Bind before schema parsing so prototype methods retain their original receiver.
  return robotMethods.parse({ isAllowed: instance.isAllowed.bind(instance), getCrawlDelay: instance.getCrawlDelay.bind(instance) });
}

export const agent = 'scraping-bench research leodoesdev@gmail.com';
const envelope = z.object({ url: z.string().url(), checkedAt: z.string().datetime(), status: z.number(), body: z.string(), finalUrl: z.string().url().optional() });
export type Response = z.infer<typeof envelope>;
const memory = new Map<string, Promise<Response>>();
const lastRequest = new Map<string, number>();
export const refresh = process.argv.includes('--refresh');
export const digest = (value: string): string => createHash('sha256').update(value).digest('hex');
export const json = (value: string): unknown => JSON.parse(value);
export async function save(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
export async function get(url: string, cache = true): Promise<Response> {
  const existing = memory.get(url);
  if (existing) return existing;
  const pending = request(url, cache);
  memory.set(url, pending);
  return pending;
}
async function request(url: string, cache: boolean): Promise<Response> {
  const path = `tasks/cache/${digest(url)}.json.gz`;
  if (cache && !refresh) {
    try { return envelope.parse(json(gunzipSync(await readFile(path)).toString())); }
    catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
  }
  let target = url;
  let response: globalThis.Response;
  for (let redirects = 0; ; redirects++) {
    const host = new URL(target).host;
    const delay = Math.max(0, (lastRequest.get(host) ?? 0) + 1100 - Date.now());
    await new Promise(resolve => setTimeout(resolve, delay));
    lastRequest.set(host, Date.now());
    response = await fetch(target, { redirect: 'manual', headers: { 'User-Agent': agent }, signal: AbortSignal.timeout(target.includes('query.wikidata.org') ? 120000 : 45000) });
    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get('location');
    if (!location || redirects >= 5) throw new Error(`Invalid redirect chain: ${url}`);
    target = new URL(location, target).href;
    if (!cache) await allowed(target);
  }
  const result = { url, finalUrl: target, checkedAt: new Date().toISOString(), status: response.status, body: await response.text() };
  if (!response.ok && response.status !== 404) throw new Error(`HTTP ${response.status}: ${url}`);
  if (cache) { await mkdir('tasks/cache', { recursive: true }); await writeFile(path, gzipSync(JSON.stringify(result))); }
  return result;
}
export async function getJson(url: string): Promise<{ data: unknown; checkedAt: string; status: number }> {
  const response = await get(url);
  return { data: response.status === 404 ? null : json(response.body), checkedAt: response.checkedAt, status: response.status };
}
export async function allowed(url: string): Promise<void> {
  const origin = new URL(url).origin;
  const response = await get(`${origin}/robots.txt`);
  if (response.status === 404) return;
  const robots = parseRobots(`${origin}/robots.txt`, response.body);
  // An unknown result is treated as denied; the parser normally returns true for unlisted paths.
  if (robots.isAllowed(url, agent) !== true) throw new Error(`robots.txt denies ${url}`);
  const delay = robots.getCrawlDelay(agent);
  if (delay && delay > 1.1) throw new Error(`Crawl delay exceeds this generator's rate: ${url}`);
}
export const unescape = (text: string): string => decodeHTML(text);
export function title(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match?.[1]) throw new Error('Page has no title');
  return unescape(match[1]).replace(/\s+/g, ' ').trim();
}
