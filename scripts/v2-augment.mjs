import { acquireLock } from '../src/run/storage.ts';
import { unlink } from 'node:fs/promises';
import { mkdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { generateFixtureTasks } from '../src/tasks/fixture-tasks.ts';
import { resolve } from '../src/tasks/resolve.ts';
import { get, digest } from '../src/tasks/io.ts';
import { buildSplits } from '../src/tasks/splits.ts';
import { root, read, save } from './v2-common.mjs';
const mutationLock=await acquireLock(`${root}/.campaign.lock`);
try {
try{await readFile(`${root}/sample-provenance.json`);throw Error('Already frozen');}catch(e){if(e.code!=='ENOENT')throw e;}
const tracks=['search','scrape','map','crawl'];
const all=(await Promise.all(tracks.map(track=>read(`${root}/banks/${track==='search'?'search':track+'-web'}.json`)))).flat();
const provenance=await read(`${root}/banks/provenance.json`), evidence=[];
const browser=args=>execFileSync('timeout',['40','agent-browser','--session','web-bench-v2','--profile','/home/leo/.agent-browser/profiles/web-bench-v2',...args],{encoding:'utf8'});
for(let i=0;i<6;i++){
 const seed=`v2-js-19019-${i}`;
 const original=generateFixtureTasks({seed,baseUrl:'https://northstar-instruments.leoisadev.workers.dev'}).find(t=>t.track==='scrape'&&t.family==='js-rendered-field');
 const recipe={kind:'fixture',seed,id:original.id};
 const task=await resolve(recipe),url=task.input.url,value=task.expected[0].accept[0];
 const plain=await get(url,false);const visible=plain.body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ');
 if(visible.includes(value))throw Error('JS key leaked into plain HTML');
 browser(['open',url]);browser(['wait','--text',value]);const snapshot=browser(['snapshot']);
 if(!snapshot.includes(value))throw Error('Rendered page missing answer');
 evidence.push({id:task.id,url,at:new Date().toISOString(),renderedSnapshotHash:digest(snapshot),plainHash:digest(plain.body),answerVisible:true,answerAbsentFromPlain:true});
 all.push(task);provenance.recipes[task.id]=recipe;
}
browser(['close']);
for(const track of tracks)await save(`${root}/banks/${track==='search'?'search':track+'-web'}.json`,all.filter(t=>t.track===track));
await save(`${root}/banks/provenance.json`,provenance);
await save(`${root}/banks/splits.json`,buildSplits(all,provenance.recipes));
await save(`${root}/js-render-verification.json`,evidence);
console.log(`Browser verified ${evidence.length} independent seeded JS targets; one site cluster`);

} finally {await mutationLock.close();await unlink(`${root}/.campaign.lock`);}
