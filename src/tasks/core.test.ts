import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectDiverse, validateCore } from './core.ts';
import type { Task } from '../core/types.ts';
const pool: Task[] = Array.from({length:90},(_,i)=>({id:`search-${i}`,track:'search',family:i%2?'one':'two',site:`site${i%15}.example`,instruction:'Read',input:{track:'search',query:'Read'},expected:[{kind:'text',name:'answer',accept:['ok']}],source:{kind:'authoritative',source:'https://example.org/',checkedAt:'2026-10-19'}}));
test('core selection is seeded, prefers independent sites and enforces the per-site cap',()=>{
 const selected=selectDiverse(pool,30,3); validateCore(selected,'search');
 assert.equal(new Set(selected.map(t=>t.site)).size,15);
 assert.deepEqual(selectDiverse(pool,30,3),selected);
 assert.throws(()=>validateCore(pool.slice(0,29),'search'),/failure/);
});
test('a single registry cannot masquerade as many independent sites',()=>{
 const concentrated=pool.map(task=>({...task,site:'registry.example'}));
 assert.equal(selectDiverse(concentrated,30,3).length,3);
 assert.throws(()=>validateCore(concentrated.slice(0,30),'search'),/failure/);
});
test('family round-robin wins over a larger number of sites in one family',()=>{
 const docs=pool.slice(0,30).map((task,i)=>({...task,id:`docs-${i}`,family:'docs',site:`docs${i}.example`}));
 const registries=pool.slice(0,30).map((task,i)=>({...task,id:`reg-${i}`,family:'registries',site:`reg${i%10}.example`}));
 const selected=selectDiverse([...docs,...registries],30,3);
 assert.equal(selected.filter(task=>task.family==='docs').length,15);
 assert.equal(selected.filter(task=>task.family==='registries').length,15);
});
test('scrape core requires its exact preregistered JS allocation',()=>{
 const web=pool.slice(0,40).map(t=>({...t,track:'scrape',input:{track:'scrape',url:'https://example.org/'}} satisfies Task));
 assert.throws(()=>validateCore(web,'scrape'),/JS allocation/);
});
