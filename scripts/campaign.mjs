import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { z } from 'zod';
import { taskSchema } from '../src/core/schema.ts';
import { generateFixtureTasks } from '../src/tasks/fixture-tasks.ts';
import { acquireLock } from '../src/run/storage.ts';
import { unlink } from 'node:fs/promises';
import { runBenchmark } from '../src/run/index.ts';
import { random, shuffle } from '../src/run/limits.ts';
const root='results/campaign-20261017';
await mkdir(root,{recursive:true});
const lockPath=`${root}/.campaign.lock`;
const campaignLock=await acquireLock(lockPath);
try {
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const save=async(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const [phase,track]=process.argv.slice(2);
const only=process.env.SCRAPING_BENCH_ONLY?.split(',');
if(phase==='tuned'&&track!=='scrape')throw Error('Only scrape tuning is authorized');
if(!['pilot','full','controls','tuned'].includes(phase)||!['search','scrape','map','crawl'].includes(track))throw Error('phase track required');
if(phase==='full'&&track==='crawl'){try{await readFile(`${root}/.hold-crawl`);throw Error('Crawl held for native-title adapter verification');}catch(e){if(e.code!=='ENOENT')throw e;}}
const split=phase==='pilot'?'dev':'test';
const seed=split==='dev'?'dev-20261017-b':'test-20261017-fresh-c';
const splits=await read('tasks/splits.json');
const web=z.array(taskSchema).parse(await read(`tasks/${track==='search'?'search':track+'-web'}.json`)).filter(t=>splits[t.id]===split);
const fixture=generateFixtureTasks({seed,baseUrl:'https://northstar-instruments.leoisadev.workers.dev'}).filter(t=>t.track===track&&t.family!=='freshness-version');
// Pilot keys never use the held-out split. Each track's file is the paired sample.
function balanced(tasks,n){const groups=new Map();for(const t of shuffle(tasks,random(1701))){const g=groups.get(t.family)??[];g.push(t);groups.set(t.family,g);}const out=[];while(out.length<n){let added=false;for(const g of groups.values()){const t=g.shift();if(t&&out.length<n){out.push(t);added=true;}}if(!added)break;}return out;}
const samplePath=`${root}/${split}-${track}.json`;
let tasks;
try{tasks=z.array(taskSchema).parse(await read(samplePath));}catch(e){if(e.code!=='ENOENT')throw e;
 if(phase!=='pilot')throw Error('Freeze full samples after pilot with prepare-full.mjs');
 if(track==='search')tasks=balanced(web,10);
 else if(track==='scrape')tasks=[...balanced(web,3),...balanced(fixture.filter(t=>!['not-found','soft-404'].includes(t.family)),7)];
 else if(track==='map')tasks=[...web,...balanced(fixture,10-web.length)];
 else tasks=[...web,...fixture.filter(t=>['section-commands','migration-steps','pricing-tiers'].includes(t.family))].slice(0,10);
 tasks=tasks.map(t=>t.input.track==='crawl'?{...t,input:{...t.input,maxPages:30}}:t);
 await save(samplePath,tasks);
}
const providerSets={search:['firecrawl','contextdev','tinyfish','jina','linkup','browserbase'],scrape:['firecrawl','contextdev','tinyfish','jina','spider','linkup','scrapfly','browserbase'],map:['firecrawl','contextdev'],crawl:['firecrawl','contextdev','scrapfly']};
let providers=phase==='controls'?(track==='scrape'?['none','oracle']:['none']):providerSets[track];
if(only)providers=providers.filter(p=>only.includes(p));
if(phase==='tuned')providers=providers.filter(p=>!['spider','tinyfish','browserbase'].includes(p));
// Account-wide starting allowances minus 5%, in list-dollar equivalents.
// Provider-credit caps exclude model estimates, which have a separate allowance.
const caps={firecrawl:6.445,contextdev:28.8508,tinyfish:1,jina:.472183055,spider:.2356,linkup:18.9943,scrapfly:.14085,browserbase:1,none:10,oracle:10};
const bounds={search:{firecrawl:.01,contextdev:.022,tinyfish:0,jina:.03,linkup:.005,browserbase:.005},scrape:{firecrawl:.06,contextdev:.0022,tinyfish:0,jina:.005,spider:.02,linkup:.005,scrapfly:.005,browserbase:.004},map:{firecrawl:.005,contextdev:.0022},crawl:{firecrawl:.15,contextdev:.066,scrapfly:.045}};
const spent={};
const ownSpent={};
const runId=`wb-20261017-${phase}-${track}-${process.env.SCRAPING_BENCH_REV??'v1'}`;
for(const name of await readdir('results'))if(name.startsWith('wb-20261017-')){
 try {
  const body=await readFile(`results/${name}/calls.jsonl`,'utf8');
  const end=body.lastIndexOf('\n')+1;
  for(const event of body.slice(0,end).split('\n').filter(Boolean).map(JSON.parse)) if(['provider-dispatch','provider'].includes(event.kind)){
   spent[event.provider]=(spent[event.provider]??0)+event.billedUsd;
   if(name===runId)ownSpent[event.provider]=(ownSpent[event.provider]??0)+event.billedUsd;
  }
 }catch(e){if(e.code!=='ENOENT')throw e;}
}
// Zero-price APIs still need model headroom; Spider measures keyed wallet deltas.
process.env.SPIDER_AUTH_MODE='key';
process.env.SPIDER_METER_BALANCE='1';
process.env.SCRAPING_BENCH_SMOKE='1'; // Private, redacted native bodies for failure audits.
// Existing run's spend belongs to this allowance and is accounted by resume.
let own={};try{own=await read(`results/${runId}/budget.json`);}catch{}
let config=Object.fromEntries(providers.map(p=>[p,{concurrency:['contextdev','spider'].includes(p)?1:p==='scrapfly'?5:2,perSecond:p==='firecrawl'&&track==='crawl'?1/65:1,burst:1,maxUsd:10,apiMaxUsd:Math.max(0,caps[p]-(spent[p]??0)+(ownSpent[p]??0)),maxCallUsd:phase==='controls'?0:bounds[track][p]}]));
// TinyFish <=950 Fetch calls / 11400 Search calls, Browserbase <=950 calls/product.
for(const p of ['tinyfish','browserbase'])if(providers.includes(p)){
 let count=0;for(const name of await readdir('results'))if(name.startsWith('wb-20261017-')){try{const lines=(await readFile(`results/${name}/calls.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);count+=lines.filter(e=>e.provider===p&&e.track===track&&e.kind==='provider-dispatch').length;}catch(e){if(e.code!=='ENOENT')throw e;}}
 if(count+tasks.length*(track==='search'?4:3)>900)throw Error(`${p} free allowance reserve would be crossed`);
}
const configPath=`${root}/${phase}-${track}-${process.env.SCRAPING_BENCH_REV??'v1'}-config.json`;
try { const frozen=await read(configPath); for(const p of providers) if((frozen[p]?.apiMaxUsd??Infinity)>config[p].apiMaxUsd+1e-9) throw Error('Frozen API allowance is stale; reconcile intervening campaign spend before resuming'); config=frozen; } catch(e) { if(e.code!=='ENOENT')throw e; await save(configPath,config); }
console.log(JSON.stringify({phase,track,tasks:tasks.length,providers,runId}));
const result=await runBenchmark({tasks,providers,lane:phase==='tuned'?'tuned':'default',mode:phase==='controls'?'agent':'both',client:'ms-a2',seed:17017,concurrency:4,runId,providerConfig:config,oraclePages:phase==='controls'&&track==='scrape'?await read(`results/raw-private/campaign-20261017/oracle-pages.json`):undefined});
console.log(JSON.stringify(result));
} finally { await campaignLock.close(); await unlink(lockPath); }
