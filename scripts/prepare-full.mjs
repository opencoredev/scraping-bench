import { readFile,writeFile,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { taskSchema } from '../src/core/schema.ts';
import { generateFixtureTasks } from '../src/tasks/fixture-tasks.ts';
import { random,shuffle } from '../src/run/limits.ts';
const root='results/campaign-20261017';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const save=async(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const splits=await read('tasks/splits.json');
const verification=await readFile(`${root}/task-verification.log`,'utf8');
const verified=new Set([...verification.matchAll(/^PASS (.+)$/gm)].map(m=>m[1]));
const seed='test-20261017-fresh-c';
const fixture=generateFixtureTasks({seed,baseUrl:'https://northstar-instruments.leoisadev.workers.dev'}).filter(t=>t.family!=='freshness-version');
function balanced(tasks,n){const groups=new Map();for(const t of shuffle(tasks,random(1702))){const g=groups.get(t.family)??[];g.push(t);groups.set(t.family,g);}const out=[];while(out.length<n){let added=false;for(const g of groups.values()){const t=g.shift();if(t&&out.length<n){out.push(t);added=true;}}if(!added)break;}return out;}
const caps={firecrawl:6.445,contextdev:28.8508,jina:.472183055,scrapfly:.14085};
const spend={};
for(const name of await readdir('results'))if(name.startsWith('wb-20261017-')){
 try { const text=await readFile(`results/${name}/calls.jsonl`,'utf8');for(const e of text.slice(0,text.lastIndexOf('\n')+1).split('\n').filter(Boolean).map(JSON.parse))if(['provider','provider-dispatch'].includes(e.kind))spend[e.provider]=(spend[e.provider]??0)+e.billedUsd; }catch(e){if(e.code!=='ENOENT')throw e;}
}
const searchCalls=(await readFile('results/wb-20261017-pilot-search-v1/calls.jsonl','utf8')).trim().split('\n').map(JSON.parse);
const scrapeCalls=(await readFile('results/wb-20261017-pilot-scrape-v1/calls.jsonl','utf8')).trim().split('\n').map(JSON.parse);
const jinaSearchPerTask=searchCalls.filter(e=>e.provider==='jina'&&['provider','provider-dispatch'].includes(e.kind)).reduce((s,e)=>s+e.billedUsd,0)/10;
const jinaScrapePerTask=scrapeCalls.filter(e=>e.provider==='jina'&&['provider','provider-dispatch'].includes(e.kind)).reduce((s,e)=>s+e.billedUsd,0)/10;
const scrapeSize=60;
const searchSize=Math.min(100,Math.max(1,Math.floor((caps.jina-(spend.jina??0)-scrapeSize*jinaScrapePerTask-.03)/jinaSearchPerTask)));
const provenance={fixtureSeed:seed,split:'test',runnerSeed:17017,client:'ms-a2',sizes:{search:searchSize,scrape:scrapeSize,map:15,crawl:10},pilotApiSpend:spend,budgetCaps:caps,sizing:{jinaSearchPerTask,jinaScrapePerTask,reservedJinaNextCallUsd:.03,reason:'Jina is the tightest search budget after the pilot; reserve estimated scrape cost and one maximum search call. All providers use the same frozen task IDs per track.'},excluded:[{taskId:'scrape-pypi-tenacity',reason:'Live verification: current page does not expose the keyed version'},{family:'freshness-version',reason:'No unique origin-version integration; never grade a stale clock snapshot'},{families:['category-inventory','blog-all','blog-2026','install-commands','sitemap-only-orphans'],track:'crawl',reason:'Thirty-page crawl budget and bounded output; use smaller independently checkable scopes in this run'}],hashes:{}};
for(const track of ['search','scrape','map','crawl']){
 const web=z.array(taskSchema).parse(await read(`tasks/${track==='search'?'search':track+'-web'}.json`)).filter(t=>splits[t.id]==='test'&&verified.has(t.id));
 const ft=fixture.filter(t=>t.track===track);
 let selected=track==='search'?balanced(web,searchSize):track==='scrape'?[...balanced(web,10),...balanced(ft,scrapeSize-10)]:track==='map'?[...web,...balanced(ft,15-web.length)]:[...balanced(web,3),...ft.filter(t=>['section-commands','migration-steps','pricing-tiers'].includes(t.family))];
 selected=selected.map(t=>t.input.track==='crawl'?{...t,input:{...t.input,maxPages:30}}:t);
 const text=JSON.stringify(selected,null,2)+'\n';
 const path=`${root}/test-${track}.json`;
 // Never overwrite a sample that has already been frozen.
 try{const old=await readFile(path,'utf8');if(old!==text)throw Error(`Frozen sample differs: ${path}`);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(path,text);}
 provenance.hashes[track]=createHash('sha256').update(text).digest('hex');
 console.log(track,selected.length,'tasks',new Set(selected.map(t=>t.site)).size,'site clusters');
}
await save(`${root}/sample-provenance.json`,provenance);
