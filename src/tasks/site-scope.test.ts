import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from './resolve.ts';
afterEach(()=>mock.restoreAll());
test('a canonical index.html root can verify against a sitemap and independent BFS',async()=>{
 const original=process.cwd(),temp=await mkdtemp(join(tmpdir(),'web-bench-scope-'));process.chdir(temp);
 const origin='https://scope-index-regression.invalid',scope=`${origin}/guide/`;
 mock.method(globalThis,'fetch',async(input:string|URL|Request)=>{
  const url=String(input);
  if(url.endsWith('/robots.txt'))return new Response('',{status:404});
  if(url.endsWith('/sitemap.xml'))return new Response(`<urlset>${['index.html','one.html','two.html'].map(p=>`<url><loc>${scope}${p}</loc></url>`).join('')}</urlset>`);
  if(url===scope)return new Response(null,{status:302,headers:{location:scope+'index.html'}});
  return new Response(`<title>Guide</title>${['index.html','one.html','two.html'].map(p=>`<a href="${scope}${p}">${p}</a>`).join('')}`);
 });
 try {
  const task=await resolve({kind:'site',sitemap:origin+'/sitemap.xml',scope,track:'crawl'});
  assert.equal(task.expected[0].kind,'url-set');
  if(task.expected[0].kind==='url-set')assert.equal(task.expected[0].urls.length,3);
  assert.equal(task.input.track,'crawl');
  if(task.input.track==='crawl')assert.equal(task.input.maxPages,30);
 }finally{process.chdir(original);await rm(temp,{recursive:true,force:true});}
});
