import { acquireLock } from '../src/run/storage.ts';
import { unlink } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { resolve, recipeId } from '../src/tasks/resolve.ts';
import { buildSplits } from '../src/tasks/splits.ts';
import { root, read, save } from './v2-common.mjs';
const mutationLock=await acquireLock(`${root}/.campaign.lock`);
try {
try{await readFile(`${root}/sample-provenance.json`);throw Error('Already frozen');}catch(e){if(e.code!=='ENOENT')throw e;}
const tracks=['search','scrape','map','crawl'];
const all=(await Promise.all(tracks.map(t=>read(`${root}/banks/${t==='search'?'search':t+'-web'}.json`)))).flat();
const provenance=await read(`${root}/banks/provenance.json`),exclusions=await read(`${root}/banks/exclusions.json`);
const recipes=Object.values((await read('tasks/archive/v1-20261017/provenance.json')).recipes).filter(r=>r.kind==='package'&&r.ecosystem==='npm'&&r.track==='search');
for(const original of recipes){const recipe={kind:'none',name:original.name,version:'9999.0.0'},id=recipeId(recipe);if(provenance.recipes[id])continue;
 try{const task=await resolve(recipe);all.push(task);provenance.recipes[id]=recipe;console.log('ADDED',id);}
 catch(e){exclusions.push({id,recipe,reason:e.message});console.log('EXCLUDED',id,e.message);}
}
for(const track of tracks)await save(`${root}/banks/${track==='search'?'search':track+'-web'}.json`,all.filter(t=>t.track===track));
await save(`${root}/banks/provenance.json`,provenance);await save(`${root}/banks/exclusions.json`,exclusions);await save(`${root}/banks/splits.json`,buildSplits(all,provenance.recipes));

} finally {await mutationLock.close();await unlink(`${root}/.campaign.lock`);}
