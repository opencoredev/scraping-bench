import {readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {z} from 'zod';
import {taskSchema} from '../src/core/schema.ts';
import {acquireLock} from '../src/run/storage.ts';
import {runBenchmark} from '../src/run/index.ts';
const root='results/campaign-20261017-search60',lock='results/campaign-20261017/.campaign.lock';
const handle=await acquireLock(lock);
try{
 const phase=process.argv[2];if(!['main','controls'].includes(phase))throw Error('main or controls required');
 const tasks=z.array(taskSchema).parse(JSON.parse(await readFile(`${root}/test-search.json`,'utf8')));if(tasks.length!==60)throw Error('Exactly sixty tasks required');
 const runId=`wb-20261017-${phase==='main'?'full':'controls'}-search60-v1`;
 const budget=JSON.parse(await readFile(`${root}/budget-basis.json`,'utf8'));
 const providers=phase==='main'?['contextdev','firecrawl','tinyfish','linkup','browserbase','parallel']:['none'];
 const spent={},own={},counts={};
 for(const name of await readdir('results'))if(name.startsWith('wb-20261017-')){
  let events=[];try{const b=await readFile(`results/${name}/calls.jsonl`,'utf8');events=b.slice(0,b.lastIndexOf('\n')+1).split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code!=='ENOENT')throw e;}
  for(const e of events){
   if(e.kind==='provider-dispatch'&&e.track==='search')counts[e.provider]=(counts[e.provider]??0)+1;
   if(name.includes('-search60-')&&['provider','provider-dispatch'].includes(e.kind)){spent[e.provider]=(spent[e.provider]??0)+e.billedUsd;if(name===runId)own[e.provider]=(own[e.provider]??0)+e.billedUsd;}
  }
 }
 for(const p of ['tinyfish','browserbase'])if(providers.includes(p)&&((counts[p]??0)+240>900))throw Error(`${p} request floor cannot fund worst-case sample`);
 const bounds={contextdev:.022,firecrawl:.01,tinyfish:0,linkup:.005,browserbase:.005,parallel:.005,none:0};
 let config=Object.fromEntries(providers.map(p=>[p,{concurrency:p==='contextdev'?1:2,perSecond:p==='firecrawl'?1/7:1,burst:1,maxUsd:20,apiMaxUsd:Math.max(0,(budget.epochCapsUsd[p]??0)-(spent[p]??0)+(own[p]??0)),maxCallUsd:bounds[p]}]));
 const path=`${root}/${phase}-config.json`;
 try{const frozen=JSON.parse(await readFile(path,'utf8'));for(const p of providers)if(frozen[p].apiMaxUsd>config[p].apiMaxUsd+1e-8)throw Error('Frozen allowance stale');config=frozen;}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(path,JSON.stringify(config,null,2)+'\n');}
 process.env.WEB_BENCH_SMOKE='1';
 console.log(JSON.stringify({runId,phase,tasks:60,providers}));
 console.log(JSON.stringify(await runBenchmark({tasks,providers,lane:'default',mode:phase==='main'?'both':'agent',client:'ms-a2',seed:17018,concurrency:4,runId,providerConfig:config})));
}finally{await handle.close();await unlink(lock);}
