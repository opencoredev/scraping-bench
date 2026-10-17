import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {parse} from 'parse5';
import {z} from 'zod';
import {taskSchema} from '../src/core/schema.ts';
import {checkFixtureTasks} from '../src/tasks/fixture-self-check.ts';
import {gradeRaw} from '../src/raw/index.ts';
const root='results/campaign-20261017';
const privateRoot='results/raw-private/campaign-20261017';
await mkdir(privateRoot,{recursive:true,mode:0o700});
const tasks=z.array(taskSchema).parse(JSON.parse(await readFile(`${root}/test-scrape.json`,'utf8')));
await checkFixtureTasks(tasks.filter(t=>t.source.kind==='fixture'));
function children(n){return 'childNodes' in n?n.childNodes:[];}
function find(n,p){if(p(n))return n;for(const c of children(n)){const x=find(c,p);if(x)return x;}return undefined;}
function text(n){if(n.nodeName==='#text')return n.value;if(['script','style','nav','header','footer','aside'].includes(n.nodeName))return '';return children(n).map(text).join(' ')+'\n';}
const pages={};const proof=[];
for(const task of tasks){
 if(task.input.track!=='scrape')throw Error('Wrong track');
 const url=task.input.url;
 if(pages[url])continue;
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Oracle HTTP ${response.status}: ${url}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 let evidence;
 if(url.endsWith('.pdf')){
  const result=spawnSync('pdftotext',['-layout','-','-'],{input:bytes,encoding:'utf8',timeout:20000});
  if(result.status!==0)throw Error('PDF extraction failed');
  evidence=result.stdout;
 }else{
  const tree=parse(bytes.toString());const main=find(tree,n=>n.nodeName==='main')??tree;
  const procedure=/procedure (\d+)/i.exec(task.instruction)?.[1];
  const selected=procedure?find(main,n=>n.nodeName==='section'&&children(n).some(c=>c.nodeName==='h2'&&text(c).trim()===`Procedure ${procedure}`))??main:main;
  evidence=text(selected).replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
 }
 const rendered=['js-rendered-field','lazy-loaded-field','shadow-dom-field','iframe-field'].includes(task.family);
 if(rendered){const key={'js-rendered-field':'js','lazy-loaded-field':'lazy','shadow-dom-field':'shadow','iframe-field':'iframe'}[task.family];const u=new URL(url);u.pathname=u.pathname.replace(/\/resources\/[^/]+$/,`/content/${key}`);const r=await fetch(u,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Oracle content endpoint failed');evidence+='\n'+text(parse(await r.text())).trim();}
 const graded=gradeRaw(task.expected,{track:'scrape',markdown:evidence,finalUrl:response.url});
 if(graded.applicability==='graded'&&graded.fields.some(f=>!f.pass))throw Error(`Oracle evidence lacks independently keyed fields: ${task.id}`);
 pages[url]=evidence;
 proof.push({url,family:task.family,responseUrl:response.url,sha256:createHash('sha256').update(bytes).digest('hex'),evidenceHash:createHash('sha256').update(evidence).digest('hex'),sourceBytes:bytes.length,evidenceBytes:Buffer.byteLength(evidence),expandedDynamicContent:rendered,focusedProcedure:/procedure \d+/i.test(task.instruction),checkedAt:new Date().toISOString()});
}
await writeFile(`${privateRoot}/oracle-pages.json`,JSON.stringify(pages,null,2)+'\n',{mode:0o600});
await writeFile(`${root}/oracle-provenance.json`,JSON.stringify(proof,null,2)+'\n');
console.log(`Verified independent oracle evidence for ${Object.keys(pages).length} unique pages (${tasks.length} tasks)`);
