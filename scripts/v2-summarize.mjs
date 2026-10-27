import { readFile, readdir, mkdir } from 'node:fs/promises';
import { summarize, markdown, pairedDifference } from '../src/stats/index.ts';
import { root, read, save, config, prefix, ledger, verifyHashes, verifyReport, sha256 } from './v2-common.mjs';
const manifest=await verifyHashes(),drift=await verifyReport('after');
await verifyReport('before');
const excludedIds=new Set(drift.failures.map(e=>e.id));
const all=[],runs=[],exclusions=[...config.excluded],physical=await ledger(),spend={};
for(const e of physical.filter(e=>e.runId.startsWith('wb-v2-'))){const p=spend[e.provider]??={apiUsd:0,modelUsd:0,physicalCalls:0,uncertainSettlements:0};if(['provider','provider-dispatch'].includes(e.kind))p.apiUsd+=e.billedUsd??0;if(e.kind==='provider-dispatch')p.physicalCalls++;if(['model','model-dispatch','model-error','model-transport-error'].includes(e.kind))p.modelUsd+=e.billedUsd??0;if(e.kind==='provider'&&e.billingUncertain)p.uncertainSettlements++;}
const selected=await read(`${root}/selected-runs.json`);
for(const [key,name] of Object.entries(selected)){
 if(!name.startsWith(prefix)||!/^.*-(full|controls)-/.test(name))throw Error('Invalid selected run');
 const [phase,track,provider]=key.split('/');
 const run=await read(`results/${name}/manifest.json`);
 const {hash,...identity}=run;if(hash!==sha256(JSON.stringify(identity)))throw Error(`Run manifest digest mismatch ${name}`);
 const expectedTasks=await read(`${root}/${phase==='controls'||config.fullProviders.includes(provider)||provider==='tinyfish'&&track==='search'?'test':'core'}-${track}.json`);
 if(run.sourceHash!==manifest.implementation.sourceHash||JSON.stringify(run.tasks.map(t=>t.id).sort())!==JSON.stringify(expectedTasks.map(t=>t.id).sort())||run.tasks.some(t=>JSON.stringify(t)!==JSON.stringify(expectedTasks.find(e=>e.id===t.id)))||JSON.stringify(run.providerConfig)!==JSON.stringify(await read(`${root}/${name}-config.json`)))throw Error(`Selected run identity mismatch ${name}`);
 try{const rows=(await readFile(`results/${name}/results.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);all.push(...rows);runs.push({runId:name,rows:rows.length,complete:await readFile(`results/${name}/summary.json`).then(()=>true,()=>false)});}catch(e){if(e.code!=='ENOENT')throw e;}
}
for(const file of await readdir(root))if(/^(full|controls)-.*-exclusions.json$/.test(file))exclusions.push(...await read(`${root}/${file}`));
const rawComplete=(track,provider,ids)=>{const rows=all.filter(r=>r.track===track&&r.provider===provider&&r.mode==='raw'&&ids.has(r.taskId));return rows.length===ids.size&&new Set(rows.map(r=>r.taskId)).size===ids.size&&!rows.some(r=>r.limitReason==='provider-budget-limit');};
const headline=[],unexcludedCore=[],fullRows=[],eligibility={},tracks={};
for(const [track,detail]of Object.entries(manifest.tracks)){
 if(!detail.eligible){tracks[track]=detail;continue;}
 const core=await read(`${root}/core-${track}.json`),full=await read(`${root}/test-${track}.json`),ids=new Set(core.map(t=>t.id)),fullIds=new Set(full.map(t=>t.id));
 const eligible=[];
 for(const provider of [...config.providerSets[track], 'none',...(track==='scrape'?['oracle']:[])]){
  const rows=all.filter(r=>r.track===track&&r.provider===provider&&r.mode==='agent'&&ids.has(r.taskId));
  const complete=rows.length===ids.size&&new Set(rows.map(r=>r.taskId)).size===ids.size&&!rows.some(r=>r.limitReason==='provider-budget-limit');
  eligibility[`${track}/${provider}`]={eligible:complete,completed:rows.length,core:ids.size};
  if(complete)eligible.push(provider);else exclusions.push({track,provider,reason:rows.some(r=>r.limitReason==='provider-budget-limit')?'Could not afford/finish identical core under free-credit guard':`Incomplete core: ${rows.length}/${ids.size}`});
 }
 const retained=core.filter(t=>!excludedIds.has(t.id));
 unexcludedCore.push(...all.filter(r=>r.track===track&&ids.has(r.taskId)&&eligible.includes(r.provider)&&(r.mode==='agent'||rawComplete(track,r.provider,ids))));
 headline.push(...all.filter(r=>r.track===track&&ids.has(r.taskId)&&!excludedIds.has(r.taskId)&&eligible.includes(r.provider)&&(r.mode==='agent'||rawComplete(track,r.provider,ids))));
 const completeFullProviders=[...config.providerSets[track],'none',...(track==='scrape'?['oracle']:[])].filter(provider=>{const rows=all.filter(r=>r.track===track&&r.provider===provider&&r.mode==='agent'&&fullIds.has(r.taskId));return rows.length===fullIds.size&&new Set(rows.map(r=>r.taskId)).size===fullIds.size&&!rows.some(r=>r.limitReason==='provider-budget-limit');});
 fullRows.push(...all.filter(r=>r.track===track&&fullIds.has(r.taskId)&&!excludedIds.has(r.taskId)&&completeFullProviders.includes(r.provider)&&(r.mode==='agent'||rawComplete(track,r.provider,fullIds))));
 tracks[track]={...detail,retainedCore:retained.length,retainedCoreClusters:new Set(retained.map(t=>t.site)).size,retainedFull:full.filter(t=>!excludedIds.has(t.id)).length,retainedFullClusters:new Set(full.filter(t=>!excludedIds.has(t.id)).map(t=>t.site)).size,eligibleProviders:eligible,fullProviders:completeFullProviders};
}
const enrich=rows=>{const summary=summarize(rows,config.seed,10000);summary.groups=summary.groups.map(g=>{const members=rows.filter(r=>r.track===g.track&&r.provider===g.provider&&r.mode===g.mode&&r.lane===g.lane),times=members.map(r=>r.totalMs).sort((a,b)=>a-b);return {...g,allTaskMedianMs:times[Math.floor(times.length*.5)]??null,allTaskP90Ms:times[Math.min(times.length-1,Math.floor(times.length*.9))]??null,limitCounts:Object.fromEntries([...new Set(members.map(r=>r.limitReason).filter(Boolean))].map(reason=>[reason,members.filter(r=>r.limitReason===reason).length])),rateLimitFailures:members.filter(r=>r.errors.includes('rate-limited')).length};});return summary;};
const coreSummary=enrich(headline),fullSummary=enrich(fullRows);
const leaders={};for(const track of Object.keys(tracks)){
 const groups=coreSummary.groups.filter(g=>g.track===track&&g.mode==='agent'&&g.cohort!=='control').sort((a,b)=>b.successRate-a.successRate||a.provider.localeCompare(b.provider));
 const best=groups[0];if(!best)continue;
 leaders[track]={reference:best.provider,groups:groups.map(g=>({...g,pairedVsLeader:pairedDifference(headline.filter(r=>r.track===track&&r.mode==='agent'&&r.provider===g.provider),headline.filter(r=>r.track===track&&r.mode==='agent'&&r.provider===best.provider),config.seed,10000)}))};
}
const report={runId:'wb-v2-final',generatedAt:new Date().toISOString(),tracks,eligibility,exclusions,runs,spend,drift,core:coreSummary,full:fullSummary,leaders,unexcludedCoreSensitivity:summarize(unexcludedCore,config.seed,10000),limitations:['Exploratory unadjusted intervals; observed core leader selection; cross-cohort ordering is descriptive.','One client, free-credit plans. Full results use a different population and are not headline comparisons.','Source errors and confirmed drift are separate exclusion categories; original rows are preserved.','V1 and v2 populations differ; no provider improvement/regression claim.','Scrape oracle uses independently extracted HTML metadata/headings or rendered JS body, not expected-field text.','Scrapfly rendering stays at its default. Native crawl titles are forwarded for Firecrawl, Context.dev and Scrapfly (HTML plus Markdown); no extra fetch is made for title injection.']};
await mkdir('results/wb-v2-final',{recursive:true});await save('results/wb-v2-final/summary.json',report);
let md='# Campaign v2: identical-core results\n\n'+markdown(coreSummary).replaceAll('not a tie','an unresolved difference').replaceAll('tie','unresolved difference')+'\n\n## Scope\n\n'+JSON.stringify(tracks,null,2)+'\n\n## Differences against the observed core leader\n\n';
for(const [track,leader]of Object.entries(leaders)){md+=`\n### ${track}\n\n| Provider | Core success | 95% interval | Paired difference vs ${leader.reference} | Difference interval | Interpretation |\n|---|---:|---|---:|---|---|\n`;for(const g of leader.groups){const d=g.pairedVsLeader;md+=`| ${g.provider} | ${g.successRate.toFixed(4)} | ${g.ci95.map(v=>v?.toFixed(4)).join(' to ')} | ${d.difference?.toFixed(4)} | ${d.ci95.map(v=>v?.toFixed(4)).join(' to ')} | ${d.interpretation==='difference detected'?'resolved difference':'unresolved difference'} |\n`;}}
md+='\n## Full-set results, separate descriptive population\n\n'+markdown(fullSummary).replaceAll('not a tie','an unresolved difference').replaceAll('tie','unresolved difference')+'\n\n## Exclusions and limitations\n\n'+[...exclusions.map(e=>`${e.provider}${e.track?' / '+e.track:''}: ${e.reason}`),...manifest.shortfalls.map(e=>`${e.track}: ${e.reason}`),...report.limitations].map(t=>'- '+t).join('\n')+'\n\n## Spend, including all pilots and interrupted reservations\n\n| Provider | API list USD | Model estimate USD | Physical dispatches |\n|---|---:|---:|---:|\n'+Object.entries(spend).map(([p,s])=>`| ${p} | ${s.apiUsd.toFixed(8)} | ${s.modelUsd.toFixed(6)} | ${s.physicalCalls} |`).join('\n')+'\n';
await (await import('node:fs/promises')).writeFile('results/wb-v2-final/RESULTS.md',md);
console.log(JSON.stringify({runs,tracks,spend,driftExcluded:excludedIds.size},null,2));
