import { acquireLock } from '../src/run/storage.ts';
import { unlink } from 'node:fs/promises';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { taskSchema } from '../src/core/schema.ts';
import { buildSplits } from '../src/tasks/splits.ts';
import { coreDesign, selectDiverse, validateCore } from '../src/tasks/core.ts';
import { root, read, save, sha256, config, implementation, verifyReport } from './v2-common.mjs';
const mutationLock=await acquireLock(`${root}/.campaign.lock`);
try {
const preview=process.argv.includes('--preview');
const artifactPrefix=preview?'candidate-':'';
let screened;try{screened=await read(`${root}/frozen-verification-screen.json`);}catch(e){if(e.code!=='ENOENT')throw e;}
let prior=[];try{prior=await read(`${root}/candidate-exclusions.json`);}catch(e){if(e.code!=='ENOENT')throw e;}
const rejected=new Set([...prior.map(e=>e.id),...(screened?.failures.map(e=>e.id)??[])]);
if(preview)await save(`${root}/candidate-exclusions.json`,[...prior,...(screened?.failures??[])].filter((e,i,all)=>all.findIndex(other=>other.id===e.id)===i));
if(!preview)await verifyReport('screen');
const splits=await read(`${root}/banks/splits.json`), provenance=await read(`${root}/banks/provenance.json`);
const tracks=['search','scrape','map','crawl'];
const banks=(await Promise.all(tracks.map(track=>read(`${root}/banks/${track==='search'?'search':track+'-web'}.json`)))).flat();
const expectedSplits=buildSplits(banks,provenance.recipes);
if(!isDeepStrictEqual(splits,expectedSplits))throw Error('Split isolation not current; regenerate splits before pilots');
try{await readFile(`${root}/sample-provenance.json`);throw Error('Already frozen');}catch(e){if(e.code!=='ENOENT')throw e;}
const jsEvidence=await read(`${root}/js-render-verification.json`);
const targets={search:300,scrape:300,map:60,crawl:40};
const manifest={frozenAt:new Date().toISOString(),seed:19020,runnerSeed:config.seed,hashes:{},tracks:{},shortfalls:[]};
for(const track of tracks){
 const pool=z.array(taskSchema).parse(banks.filter(t=>t.track===track&&splits[t.id]==='test'));
 const feasible=pool.filter(task=>{
  if(rejected.has(task.id))return false;
  const canonical=Object.fromEntries(task.expected.map(f=>[f.name,f.kind==='text'?f.accept[0]:f.kind==='url-set'?f.urls:f.kind==='text-set'?f.items:f.kind==='none'?null:f.value]));
  return Buffer.byteLength(JSON.stringify(canonical))<=4096&&task.instruction.includes('JSON')&&(task.source.kind==='authoritative'||task.source.kind==='fixture'&&track==='scrape')&&(task.input.track!=='crawl'||task.expected.filter(f=>f.kind==='url-set').every(f=>f.urls.length<=task.input.maxPages&&task.input.maxPages<=30));
 });
 const fixtures=track==='scrape'?feasible.filter(task=>task.source.kind==='fixture').slice(0,2):[];
 const web=feasible.filter(task=>task.source.kind==='authoritative');
 const core=[...fixtures,...selectDiverse(web,coreDesign[track].size-fixtures.length,coreDesign[track].maxPerSite)];
 try{validateCore(core,track);}catch(e){manifest.tracks[track]={eligible:false,reason:e.message,available:feasible.length,clusters:new Set(feasible.map(t=>t.site)).size};manifest.shortfalls.push({track,reason:e.message});continue;}
 const coreIds=new Set(core.map(t=>t.id));
 const extraJs=track==='scrape'?feasible.filter(t=>t.family==='js-rendered-field'&&!coreIds.has(t.id)):[];
 if(track==='scrape'&&(fixtures.length!==2||extraJs.length!==2||[...fixtures,...extraJs].some(t=>!jsEvidence.some(e=>e.id===t.id&&e.url===t.input.url&&e.answerVisible&&e.answerAbsentFromPlain))))throw Error('Exact verified JS allocation missing');
 const full=[...core,...extraJs,...selectDiverse(web.filter(t=>!coreIds.has(t.id)),Math.max(0,targets[track]-core.length-extraJs.length),Infinity)];
 const detail={eligible:true,full:full.length,core:core.length,fullClusters:new Set(full.map(t=>t.site)).size,coreClusters:new Set(core.map(t=>t.site)).size,realWebShare:full.filter(t=>t.source.kind==='authoritative').length/full.length,jsShare:full.filter(t=>t.family==='js-rendered-field').length/full.length,families:Object.fromEntries([...new Set(full.map(t=>t.family))].map(f=>[f,full.filter(t=>t.family===f).length]))};
 manifest.tracks[track]=detail;
 if(full.length<targets[track])manifest.shortfalls.push({track,reason:`Only ${full.length} verified feasible held-out candidates for target ${targets[track]}; see generation exclusions`});
 for(const [kind,tasks]of [['test',full],['core',core]]){
  const filename=`${artifactPrefix}${kind}-${track}.json`;const body=JSON.stringify(tasks,null,2)+'\n';await writeFile(`${root}/${filename}`,body);manifest.hashes[filename]=sha256(body);
 }
}

for(const file of ['config.json','js-render-verification.json','banks/splits.json','banks/provenance.json','banks/search.json','banks/scrape-web.json','banks/map-web.json','banks/crawl-web.json'])manifest.hashes[file]=sha256(await readFile(`${root}/${file}`));
manifest.implementation=await implementation();
if(!preview&&(!screened||screened.failures.length))throw Error('Successful candidate screening required before freeze');
if(!preview)for(const track of tracks)if(manifest.tracks[track]?.eligible)for(const kind of ['test','core'])if(sha256(await readFile(`${root}/${kind}-${track}.json`))!==screened.artifactHashes[`candidate-${kind}-${track}.json`])throw Error('Final selection differs from screened candidates');
await save(`${root}/${artifactPrefix}sample-provenance.json`,manifest);
if(!preview)await save(`${root}/frozen-verification-before.json`,{...screened,phase:'before',manifestHash:sha256(await readFile(`${root}/sample-provenance.json`))});
console.log(JSON.stringify(manifest.tracks,null,2));

} finally {await mutationLock.close();await unlink(`${root}/.campaign.lock`);}
