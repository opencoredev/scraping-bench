import{readFile,readdir,writeFile}from'node:fs/promises';
const all=[];
for(const n of await readdir('results'))if(n.startsWith('wb-v2-pilot')){
 let rows,events;try{rows=(await readFile(`results/${n}/results.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);events=(await readFile(`results/${n}/calls.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code==='ENOENT')continue;throw e;}
 for(const r of rows.filter(r=>r.mode==='agent')){const calls=events.filter(e=>e.kind==='provider'&&e.taskId===r.taskId),summaries=[];
 for(const c of calls){const outcome=JSON.parse(await readFile(`results/${c.privatePath}`));summaries.push({hash:c.responseHash,kind:outcome.kind,error:outcome.error??null,status:outcome.status??null,message:outcome.kind==='error'?outcome.message:null,bytes:Buffer.byteLength(JSON.stringify(outcome)),credits:outcome.billing.credits,evidenceTitleMarker:outcome.kind==='ok'&&outcome.data.track==='crawl'?outcome.data.pages.map(p=>({url:p.url,hasNativeTitle:p.markdown.startsWith('HTML document title:')})):null});}
 all.push({runId:n,id:r.taskId,provider:r.provider,track:r.track,success:r.success,fields:r.fields,errors:r.errors,truncations:r.truncations,summaries});
 }}
await writeFile('results/campaign-v2/dev-audit.json',JSON.stringify(all,null,2)+'\n');
for(const provider of [...new Set(all.map(r=>r.provider))])for(const track of [...new Set(all.map(r=>r.track))]){const rows=all.filter(r=>r.provider===provider&&r.track===track);if(rows.length)console.log(JSON.stringify({provider,track,successes:rows.filter(r=>r.success).length,tasks:rows.length,errors:rows.flatMap(r=>r.summaries.filter(s=>s.kind==='error').map(s=>({error:s.error,status:s.status,message:s.message}))),truncated:rows.filter(r=>r.truncations.some(Boolean)).length}));}
