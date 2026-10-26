import { execFileSync } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from '../src/tasks/resolve.ts';
import { get, title } from '../src/tasks/io.ts';
import { scrapeOracleContains } from '../src/tasks/oracle.ts';
import { truncateOutput } from '../src/agent/index.ts';
import { oracleAdapter } from '../src/testing/fake.ts';
import { firstHeading } from '../src/tasks/expanded.ts';
import { root, read, save, sha256, verifyHashes } from './v2-common.mjs';
const phase=process.argv[2];if(!['screen','before','after'].includes(phase)||!process.argv.includes('--refresh'))throw Error('screen|before|after --refresh required');
const artifactPrefix=phase==='screen'?'candidate-':'';
const manifest=await verifyHashes(`${artifactPrefix}sample-provenance.json`);
const recipes=(await read(`${root}/banks/provenance.json`)).recipes;
const tasks=(await Promise.all(Object.entries(manifest.tracks).filter(([,d])=>d.eligible).map(([track])=>read(`${root}/${artifactPrefix}test-${track}.json`)))).flat();
const report={phase,at:new Date().toISOString(),checked:0,checkedIds:[],manifestHash:sha256(await readFile(`${root}/${artifactPrefix}sample-provenance.json`)),failures:[],artifactHashes:manifest.hashes,evidence:{}};
const oracle={};
for(const task of tasks){
 report.checkedIds.push(task.id);
 try {
  const recipe=recipes[task.id];if(!recipe)throw Error('Missing recipe');
  const current=await resolve(recipe);
  if(!isDeepStrictEqual(current.expected,task.expected)||!isDeepStrictEqual(current.input,task.input)||current.instruction!==task.instruction||current.family!==task.family) {
   report.failures.push({id:task.id,kind:'confirmed-drift',reason:'Live authoritative input, answer, family or instruction differs',live:current.expected});console.log(`DRIFT ${task.id}`);continue;
  }
  if(task.input.track==='crawl'){
   const urls=task.expected.find(f=>f.kind==='url-set')?.urls??[];
   const records=task.expected.find(f=>f.kind==='text-set')?.items??[];
   const pages=[];for(const url of urls){const response=await get(url,false);pages.push({url,markdown:`HTML document title: ${title(response.body)}`});}
   const outcome={kind:'ok',data:{track:'crawl',pages},ms:0,billing:{usd:0,basis:'list-price',credits:null}};
   const packed=truncateOutput(outcome,48000);
   if(packed.truncated||records.some(record=>!JSON.parse(packed.text).data.pages.some(p=>p.url===record.split(' | ')[0]&&p.markdown===`HTML document title: ${record.split(' | ').slice(1).join(' | ')}`)))throw Error('Crawl keyed titles do not survive serialized evidence package');
   report.evidence[task.id]={sha256:sha256(packed.text),bytes:Buffer.byteLength(packed.text),source:task.source.url,kind:'independent-title-package'};
   if(urls.length>task.input.maxPages||task.input.maxPages>30||Buffer.byteLength(JSON.stringify({urls,records}))>4096)throw Error('Page or answer-output bound exceeded');
  }
  if(task.input.track==='scrape'){
   const response=await get(task.input.url,false);
   // Independent HTML or browser extraction, never fabricated from expected fields.
   let evidence;
   if(recipe.kind==='fixture'){
    const browser=args=>execFileSync('timeout',['40','agent-browser','--session','web-bench-v2','--profile','/home/leo/.agent-browser/profiles/web-bench-v2',...args],{encoding:'utf8'});
    const field=task.expected[0];if(field.kind!=='text')throw Error('Invalid JS key');
    const visible=response.body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ');
    if(visible.includes(field.accept[0]))throw Error('JS answer leaked into initial HTML');
    browser(['open',task.input.url]);browser(['wait','--text',field.accept[0]]);evidence=browser(['get','text','body']);browser(['close']);
   }else evidence=`HTML document title: ${title(response.body)}\nFirst HTML h1: ${firstHeading(response.body)}`;
   const packed=truncateOutput(await oracleAdapter(evidence).scrape({url:task.input.url},{lane:'default',timeoutMs:1000,signal:AbortSignal.timeout(1000)}),12000);
   if(packed.truncated)throw Error('Serialized oracle evidence exceeds tool cap');
   if(!scrapeOracleContains(task.expected,packed.text))throw Error('Oracle evidence omits keyed answer');
   oracle[task.input.url]=evidence;report.evidence[task.id]={sha256:sha256(evidence),bytes:Buffer.byteLength(evidence),source:task.input.url};
  }
  report.checked++;console.log(`PASS ${task.id}`);
 }catch(e){report.failures.push({id:task.id,kind:'source-error',reason:e.message});console.log(`SOURCE ERROR ${task.id}: ${e.message}`);}
}
await mkdir('results/raw-private/campaign-v2',{recursive:true,mode:0o700});
if(phase!=='after'){await save('results/raw-private/campaign-v2/oracle-pages.json',oracle);report.oracleFileHash=sha256(await readFile('results/raw-private/campaign-v2/oracle-pages.json'));}
await save(`${root}/frozen-verification-${phase}.json`,report);
console.log(JSON.stringify({checked:report.checked,total:tasks.length,failures:report.failures.length}));
if(phase!=='after'&&report.failures.length)process.exitCode=1;
