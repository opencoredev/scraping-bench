import {readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {taskSchema} from '../src/core/schema.ts';
import {resolve} from '../src/tasks/resolve.ts';
import {random,shuffle} from '../src/run/limits.ts';
if(!process.argv.includes('--refresh'))throw Error('Fresh source checks required');
const root='results/campaign-20261017-search60';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const split=await read('tasks/splits.json'),recipes=(await read('tasks/provenance.json')).recipes;
const all=z.array(taskSchema).parse(await read('tasks/search.json')).filter(t=>split[t.id]==='test');
const old=z.array(taskSchema).parse(await read('results/campaign-20261017/test-search.json'));
const verified=new Set([...((await readFile('/tmp/web-bench-search60-verify.log','utf8')).matchAll(/^PASS (.+)$/gm))].map(m=>m[1]));
const rejected=[],selected=[],checked=[];
async function eligible(t){
 try{if(!verified.has(t.id)){const now=await resolve(recipes[t.id]);if(!isDeepStrictEqual(now.expected,t.expected)||!isDeepStrictEqual(now.input,t.input)||now.family!==t.family)throw Error('live answer-key drift');}checked.push({taskId:t.id,checkedAt:new Date().toISOString(),source:verified.has(t.id)?'tasks:verify --refresh':'resolve --refresh'});return true;}
 catch(e){rejected.push({taskId:t.id,reason:e instanceof Error?e.message:String(e)});return false;}
}
// Include the original seven IDs before drawing additional tasks, solely to permit
// a zero-credit historical Jina comparison. Selection never consults grades.
for(const t of old)if(await eligible(t))selected.push(t);
const families=['latest-version','company-financials','entity-facts','fresh','not-found'];
const groups=Object.fromEntries(families.map(f=>[f,shuffle(all.filter(t=>t.family===f&&!old.some(x=>x.id===t.id)),random(17018))]));
while(selected.length<60){
 const available=families.filter(f=>groups[f].length).sort((a,b)=>selected.filter(t=>t.family===a).length-selected.filter(t=>t.family===b).length||families.indexOf(a)-families.indexOf(b));
 const family=available[0];if(!family)throw Error('Fewer than sixty verified test tasks');
 const t=groups[family].shift();if(t&&await eligible(t))selected.push(t);
}
const body=JSON.stringify(selected,null,2)+'\n';
try{const prior=await readFile(`${root}/test-search.json`,'utf8');if(prior!==body)throw Error('Refusing to overwrite frozen sample');}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(`${root}/test-search.json`,body);}
await writeFile(`${root}/sample-provenance.json`,JSON.stringify({split:'test',client:'ms-a2',runnerSeed:17018,tasks:60,siteClusters:new Set(selected.map(t=>t.site)).size,families:Object.fromEntries(families.map(f=>[f,selected.filter(t=>t.family===f).length])),sha256:createHash('sha256').update(body).digest('hex'),historicalJinaIds:old.filter(t=>selected.some(x=>x.id===t.id)).map(t=>t.id),selection:'Original seven task IDs retained without consulting outcomes, then deterministic family-balanced filling. Only seven negative tasks exist in held-out split; no dev tasks borrowed.',checked,rejected},null,2)+'\n');
console.log('Frozen',selected.length,'verified held-out tasks');
