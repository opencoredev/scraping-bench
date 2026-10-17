import {readFile,writeFile,readdir} from 'node:fs/promises';
const root='results/campaign-20261017';
const rows=[];const events=[];
const titleCorrected=(await readdir('results')).includes('wb-20261017-pilot-crawl-title-v3');
for(const name of await readdir('results'))if(name.startsWith('wb-20261017-pilot-')){
 if(['wb-20261017-pilot-map-v1','wb-20261017-pilot-scrape-spider-v2'].includes(name))continue;
 const r=(await readFile(`results/${name}/results.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
 const calls=(await readFile(`results/${name}/calls.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
 rows.push(...r.filter(x=>!(name==='wb-20261017-pilot-scrape-v1'&&x.provider==='spider')&&!(name==='wb-20261017-pilot-crawl-v1'&&(x.provider==='firecrawl'||titleCorrected&&x.provider==='contextdev'))&&!(titleCorrected&&name==='wb-20261017-pilot-crawl-fire-v2'&&x.provider==='firecrawl')).map(x=>({...x,run:name})));events.push(...calls.map(x=>({...x,run:name})));
}
const audit=[];
for(const track of ['search','scrape','map','crawl'])for(const provider of [...new Set(rows.filter(r=>r.track===track).map(r=>r.provider))]){
 const members=rows.filter(r=>r.track===track&&r.provider===provider&&r.mode==='agent');
 if(!members.length||members.filter(r=>r.success).length/members.length>=.5)continue;
 const failed=new Set(members.filter(r=>!r.success).map(r=>r.taskId));
 const calls=events.filter(e=>e.kind==='provider'&&e.track===track&&e.provider===provider&&failed.has(e.taskId));
 const unique=[];for(const c of calls)if(!unique.some(x=>x.taskId===c.taskId))unique.push(c);
 const inspections=[];
 for(const c of unique.slice(0,3)){
  const x=JSON.parse(await readFile(`results/${c.privatePath}`,'utf8'));
  const text=x.kind==='ok'?JSON.stringify(x.data):x.message;
  inspections.push({taskId:c.taskId,privatePath:c.privatePath,responseHash:c.responseHash,kind:x.kind,error:x.kind==='error'?x.error:null,message:x.kind==='error'?x.message:null,bytes:Buffer.byteLength(text),excerpt:text.slice(0,1000),comment:'REVIEW REQUIRED'});
 }
 audit.push({track,provider,successes:members.filter(r=>r.success).length,tasks:members.length,inspections});
}
// Excerpts stay private; public audit stores verdicts and hashes after review.
await writeFile('results/raw-private/pilot-audit.json',JSON.stringify(audit,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify(audit,null,2));
