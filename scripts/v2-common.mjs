import { readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export const root = process.env.WEB_BENCH_CAMPAIGN_DIR ?? 'results/campaign-v2';
if(!root.startsWith('results/campaign-v2') || root.includes('..'))throw Error('V2 campaign directory must be isolated from v1');
export const read = async path => JSON.parse(await readFile(path,'utf8'));
export const save = async(path,value) => {const temp=`${path}.${process.pid}.tmp`;await writeFile(temp,JSON.stringify(value,null,2)+'\n');await rename(temp,path);};
export const sha256 = body => createHash('sha256').update(body).digest('hex');
export const config = await read(`${root}/config.json`);
export const prefix = process.env.WEB_BENCH_RUN_PREFIX ?? config.runPrefix;
if(!prefix.startsWith('wb-v2-') || prefix.includes('/'))throw Error('V2 prefix must be isolated');
export async function ledger() {
 const events=[];
 for(const name of await readdir('results')) {
  if(!name.startsWith('wb-'))continue;
  try { const body=await readFile(`results/${name}/calls.jsonl`,'utf8'); for(const e of body.slice(0,body.lastIndexOf('\n')+1).split('\n').filter(Boolean).map(JSON.parse))events.push({...e,runId:name}); }
  catch(e){if(e.code!=='ENOENT')throw e;}
 }
 return events;
}
export function physicalCount(events,provider,track,day) {
 return events.filter(e=>e.kind==='provider-dispatch'&&e.provider===provider&&e.track===track&&(!day||String(e.at??e.startedAt??e.timestamp??'').startsWith(day))).length;
}
export async function verifyHashes(file = 'sample-provenance.json') {
 const provenance=await read(`${root}/${file}`);
 for(const [file,hash]of Object.entries(provenance.hashes))if(sha256(await readFile(`${root}/${file}`))!==hash)throw Error(`Frozen artifact hash mismatch: ${file}`);
 for(const [file,hash]of Object.entries(provenance.implementation.hashes))if(sha256(await readFile(file))!==hash)throw Error(`Frozen implementation mismatch: ${file}`);
 return provenance;
}
export async function implementation() {
 const paths=(await readdir('src',{recursive:true})).filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort();
 const source=createHash('sha256'), hashes={};
 for(const path of paths){const body=await readFile(`src/${path}`);source.update(path).update(body);hashes[`src/${path}`]=sha256(body);}
 for(const path of (await readdir('scripts')).filter(p=>p.startsWith('v2-')&&p.endsWith('.mjs')).sort())hashes[`scripts/${path}`]=sha256(await readFile(`scripts/${path}`));
 return {sourceHash:source.digest('hex'),hashes};
}
export async function verifyReport(phase) {
 const artifactPrefix=phase==='screen'?'candidate-':'';
 const manifest=await verifyHashes(`${artifactPrefix}sample-provenance.json`), report=await read(`${root}/frozen-verification-${phase}.json`);
 if(report.manifestHash!==sha256(await readFile(`${root}/${artifactPrefix}sample-provenance.json`)))throw Error('Verification report has stale manifest identity');
 const ids=(await Promise.all(Object.entries(manifest.tracks).filter(([,d])=>d.eligible).map(([track])=>read(`${root}/${artifactPrefix}test-${track}.json`)))).flat().map(t=>t.id).sort();
 if(JSON.stringify(report.checkedIds?.slice().sort())!==JSON.stringify(ids))throw Error('Verification report does not cover every frozen ID');
 if(phase!=='after'){
  if(report.failures.length)throw Error('Frozen live verification failed');
  if(report.oracleFileHash!==sha256(await readFile('results/raw-private/campaign-v2/oracle-pages.json')))throw Error('Oracle evidence hash mismatch');
 }
 return report;
}
