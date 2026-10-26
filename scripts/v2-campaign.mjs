import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { taskSchema } from '../src/core/schema.ts';
import { runBenchmark } from '../src/run/index.ts';
import { acquireLock } from '../src/run/storage.ts';
import { Gate } from '../src/run/limits.ts';
import { selectDiverse } from '../src/tasks/core.ts';
import { root, read, save, config, prefix, ledger, verifyHashes, verifyReport } from './v2-common.mjs';
process.loadEnvFile('.env');
if (!process.env.ANTHROPIC_AUTH_TOKEN) {
  // Reuse the already configured local model proxy; never persist or log its key.
  process.env.ANTHROPIC_AUTH_TOKEN = execFileSync('python3', ['-c', "import yaml; from pathlib import Path; print(yaml.safe_load(Path('/home/leo/.cli-proxy-api/config.yaml').read_text())['api-keys'][0])"], { encoding: 'utf8' }).trim();
}
const [phase,track]=process.argv.slice(2);
if(!['pilot','full','controls'].includes(phase)||!['search','scrape','map','crawl'].includes(track))throw Error('phase/track required');
if(phase==='pilot'&&process.env.WEB_BENCH_AUDIT_NATIVE==='1'){
 const nativeFetch=globalThis.fetch;await mkdir('results/raw-private/campaign-v2/native-dev',{recursive:true,mode:0o700});
 globalThis.fetch=async(...args)=>{const response=await nativeFetch(...args);const url=new URL(String(args[0]));if(!['localhost','127.0.0.1'].includes(url.hostname)){const body=await response.clone().text();await writeFile(`results/raw-private/campaign-v2/native-dev/${randomUUID()}.json`,JSON.stringify({host:url.hostname,path:url.pathname,status:response.status,body}),{mode:0o600});}return response;};
}
const frozenDesign=phase==='pilot'?null:await read(`${root}/sample-provenance.json`);
if(frozenDesign&&!frozenDesign.tracks[track]?.eligible){console.log(JSON.stringify({track,phase,status:'not run',reason:frozenDesign.tracks[track]?.reason}));process.exit(0);}
const lock=await acquireLock(`${root}/.campaign.lock`);
try {
 const all=z.array(taskSchema).parse(await read(`${root}/banks/${track==='search'?'search':track+'-web'}.json`));
 const splits=await read(`${root}/banks/splits.json`);
 const only=process.env.WEB_BENCH_ONLY?.split(',');
 let providers=phase==='controls'?(track==='scrape'?['none','oracle']:['none']):config.providerSets[track];
 if(only)providers=providers.filter(p=>only.includes(p));
 if(!providers.length)throw Error('No selected providers');
 let full,core;
 if(phase==='pilot') {
  full=selectDiverse(all.filter(t=>splits[t.id]==='dev'),track==='crawl'?2:3,1);
  if(!full.length)throw Error('No dev tasks'); core=full;
  await save(`${root}/dev-${track}.json`,full);
 } else {
  await verifyHashes();
  // The committed preregistration and budget worksheet are mandatory before test dispatch.
  for(const path of ['docs/PREREGISTRATION-v2.md',`${root}/budget-worksheet.md`]) {
   const committed=execFileSync('git',['show',`HEAD:${path}`]);
   if(!committed.equals(await readFile(path)))throw Error(`Prerequisite not committed: ${path}`);
  }
  await verifyReport('before');
  full=z.array(taskSchema).parse(await read(`${root}/test-${track}.json`));
  core=z.array(taskSchema).parse(await read(`${root}/core-${track}.json`));
 }
 const exclusions=[];
 const registryPath=`${root}/selected-runs.json`;let registry={};if(phase!=='pilot')try{registry=await read(registryPath);}catch(e){if(e.code!=='ENOENT')throw e;}
 let registryWrites=Promise.resolve();
 const providerGate=new Gate(config.concurrency,1e6,config.concurrency);
 const runProvider=async provider=>{
  let quotaRemaining;
  const tasks=phase==='controls'||config.fullProviders.includes(provider)||provider==='tinyfish'&&track==='search'?full:core;
  const runId=`${prefix}${phase}-${track}-${provider}-${process.env.WEB_BENCH_REV??'v1'}`;
  const events=await ledger();
  const spent=events.filter(e=>e.runId.startsWith(config.ledgerPrefix??'wb-v2-')&&e.provider===provider&&['provider-dispatch','provider'].includes(e.kind)).reduce((s,e)=>s+(e.billedUsd??0),0);
  const own=events.filter(e=>e.runId===runId&&e.provider===provider&&['provider-dispatch','provider'].includes(e.kind)).reduce((s,e)=>s+(e.billedUsd??0),0);
  if(['tinyfish','browserbase'].includes(provider)) {
   // Count all history for Browserbase. Counting all TinyFish history is stricter than daily reset.
   let count=events.filter(e=>e.kind==='provider-dispatch'&&e.provider===provider&&e.track===track).length;
   try{count+=(await readFile('providers/smoke.jsonl','utf8')).split('\n').filter(Boolean).map(JSON.parse).filter(e=>e.provider===provider&&e.track===track).length;}catch(e){if(e.code!=='ENOENT')throw e;}
   const limit=provider==='tinyfish'&&track==='search'?11400:950;
   quotaRemaining=limit-count;
   let completedRows=[];try{completedRows=(await readFile(`results/${runId}/results.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code!=='ENOENT')throw e;}
   const completedIds=new Set(tasks.filter(t=>['agent','raw'].every(mode=>completedRows.some(r=>r.taskId===t.id&&r.provider===provider&&r.mode===mode))).map(t=>t.id));
   if(count+tasks.filter(t=>!completedIds.has(t.id)).length*(track==='search'?4:3)>limit){exclusions.push({provider,track,phase,reason:`Worst-case physical requests ${count}+${tasks.length*(track==='search'?4:3)} exceed retained quota ${limit}`});return;}
  }
  const allowance=Math.max(0,config.caps[provider]-spent+own);
  const bound=phase==='controls'?0:config.bounds[track][provider];
  if(bound===undefined)throw Error(`No safe bound ${provider}/${track}`);
  if(phase!=='controls'&&allowance+1e-10<bound){exclusions.push({provider,track,phase,reason:'Remaining cross-track allowance cannot fund next bounded call'});return;}
  const ownCalls=events.filter(e=>e.runId===runId&&e.kind==='provider-dispatch').length;
  let providerConfig={[provider]:{...(quotaRemaining===undefined?{}:{maxPhysicalCalls:quotaRemaining+ownCalls}),concurrency:1,perSecond:1/(config.pacing[provider]?.[track]??1),burst:1,maxUsd:30,apiMaxUsd:allowance,maxCallUsd:bound}};
  const path=`${root}/${runId}-config.json`;
  try{const frozen=await read(path);if(frozen[provider].apiMaxUsd>allowance+1e-8||quotaRemaining!==undefined&&frozen[provider].maxPhysicalCalls>quotaRemaining+ownCalls){exclusions.push({provider,track,phase,reason:'Saved run allowance exceeds remaining cross-track API or physical-request allowance after intervening usage'});return;}providerConfig=frozen;}catch(e){if(e.code!=='ENOENT')throw e;await save(path,providerConfig);}
  process.env.SPIDER_AUTH_MODE='key';process.env.SPIDER_METER_BALANCE='1';process.env.WEB_BENCH_SMOKE='1';
  if(phase!=='pilot'){
   const key=`${phase}/${track}/${provider}`;if(registry[key]&&registry[key]!==runId)throw Error('Selected run revision already registered');registry[key]=runId;registryWrites=registryWrites.then(()=>save(registryPath,registry));await registryWrites;
  }
  console.log(JSON.stringify({runId,provider,phase,track,tasks:tasks.length,allowance,bound}));
  const result=await runBenchmark({tasks,providers:[provider],lane:'default',mode:phase==='controls'?'agent':'both',client:'ms-a2',seed:config.seed,concurrency:1,runId,providerConfig,oraclePages:provider==='oracle'?await read(`results/raw-private/campaign-v2/oracle-pages.json`):undefined});
  console.log(JSON.stringify(result));
 };
 const outcomes=await Promise.allSettled(providers.map(provider=>providerGate.run(()=>runProvider(provider))));
 await registryWrites;
 await save(`${root}/${phase}-${track}-exclusions.json`,exclusions);
 const rejected=outcomes.find(o=>o.status==='rejected');if(rejected)throw rejected.reason;
} finally { await lock.close();await unlink(`${root}/.campaign.lock`); }
