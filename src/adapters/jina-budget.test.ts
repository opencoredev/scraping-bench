import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { jina } from './jina.ts';
afterEach(()=>mock.restoreAll());
test('Jina Reader rejects content above a 5000-token budget without changing Search',async()=>{
 mock.property(process,'env',{...process.env,JINA_API_KEY:'test-only-placeholder'});
 mock.method(globalThis,'fetch',async(_url:string|URL|Request,init?:RequestInit)=>{
  assert.equal(new Headers(init?.headers).get('x-token-budget'),'5000');
  return Response.json({code:200,data:{url:'https://example.org/',content:'Answer',usage:{tokens:12}}});
 });
 assert.ok(jina.scrape);const result=await jina.scrape({url:'https://example.org/'},{lane:'default',timeoutMs:1000,signal:new AbortController().signal});
 assert.equal(result.kind,'ok');assert.equal(result.billing.credits,12);
});
