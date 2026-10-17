import { z } from 'zod';
import { writeFile } from 'node:fs/promises';
import { bearer, queryUrl, secret, Session } from './http.ts';
const balances: object[] = [];
async function read<T>(provider: string, url: string, schema: z.ZodType<T>, headers: Record<string, string>): Promise<void> {
  const s = new Session(AbortSignal.timeout(15000));
  try { const data = await s.json(url, schema, { headers }); balances.push({ provider, at: new Date().toISOString(), data }); }
  catch { balances.push({ provider, at: new Date().toISOString(), error: 'Balance unavailable', status: s.status }); }
}
if (process.env.FIRECRAWL_API_KEY) await read('firecrawl', 'https://api.firecrawl.dev/v2/team/credit-usage', z.object({ data: z.object({ remainingCredits: z.number(), planCredits: z.number().optional() }) }), bearer('FIRECRAWL_API_KEY'));
if (process.env.LINKUP_API_KEY) await read('linkup', 'https://api.linkup.so/v1/credits/balance', z.object({ balance: z.number() }), bearer('LINKUP_API_KEY'));
if (process.env.TINYFISH_API_KEY) await read('tinyfish', 'https://agent.tinyfish.ai/v1/wallet', z.object({ available_balance: z.string(), rates: z.object({ meters: z.array(z.object({ label: z.string(), unit_amount: z.string(), per: z.string().optional() })) }).nullable() }), { 'X-API-Key': secret('TINYFISH_API_KEY') });
if (process.env.SPIDER_API_KEY) await read('spider', 'https://api.spider.cloud/data/credits', z.object({ data: z.object({ credits: z.coerce.number().finite() }) }), bearer('SPIDER_API_KEY'));
if (process.env.SCRAPFLY_API_KEY) await read('scrapfly', queryUrl('https://api.scrapfly.io/account', { key: secret('SCRAPFLY_API_KEY') }), z.object({ subscription: z.object({ usage: z.object({ scrape: z.object({ current: z.number(), limit: z.number(), remaining: z.number() }) }) }) }), {});
await writeFile(new URL('../../providers/balances.json', import.meta.url), `${JSON.stringify(balances, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(balances)}\n`);
