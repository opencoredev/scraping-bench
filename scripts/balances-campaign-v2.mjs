import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { Session, secret, bearer, queryUrl } from '../src/adapters/http.ts';
process.loadEnvFile('.env');
const out = [];
async function measure(provider, url, schema, headers, options = {}) {
 const session = new Session(AbortSignal.timeout(20000));
 try { const data = await session.json(url, schema, { headers, ...options }); out.push({ provider, at: new Date().toISOString(), data }); }
 catch { out.push({ provider, at: new Date().toISOString(), status: session.status, error: 'Balance unavailable' }); }
}
await measure('firecrawl','https://api.firecrawl.dev/v2/team/credit-usage',z.object({data:z.object({remainingCredits:z.number()})}),bearer('FIRECRAWL_API_KEY'));
await measure('linkup','https://api.linkup.so/v1/credits/balance',z.object({balance:z.number()}),bearer('LINKUP_API_KEY'));
await measure('tinyfish','https://agent.tinyfish.ai/v1/wallet',z.object({available_balance:z.string(),rates:z.object({meters:z.array(z.object({label:z.string(),unit_amount:z.string(),per:z.string().optional()}))}).nullable()}),{'X-API-Key':secret('TINYFISH_API_KEY')});
await measure('spider','https://api.spider.cloud/data/credits',z.object({data:z.object({credits:z.coerce.number()})}),bearer('SPIDER_API_KEY'));
await measure('scrapfly',queryUrl('https://api.scrapfly.io/account',{key:secret('SCRAPFLY_API_KEY')}),z.object({subscription:z.object({usage:z.object({scrape:z.object({remaining:z.number()})})})}),{});
out.push({provider:'you',at:new Date().toISOString(),error:'Not measured: owner cancelled further You.com API calls after collected campaign rows; no final probe performed.'});
await measure('contextdev','https://api.context.dev/v1/web/scrape',z.object({key_metadata:z.object({credits_consumed:z.number(),credits_remaining:z.number()})}),bearer('CONTEXT_DEV_API_KEY'),{body:{url:'https://example.com',formats:{markdown:true}}});
await measure('jina','https://r.jina.ai/',z.object({data:z.object({balanceLeft:z.number()})}),bearer('JINA_API_KEY'));
const path=process.argv[2]??'results/campaign-v2/starting-balances.json';
try { await readFile(path); throw Error('Refuse to replace balance snapshot'); } catch(e) { if(e.code!=='ENOENT')throw e; }
await writeFile(path,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
