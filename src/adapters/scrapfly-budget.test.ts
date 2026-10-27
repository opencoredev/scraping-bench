import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { scrapfly } from './scrapfly.ts';
afterEach(()=>mock.restoreAll());
test('Scrapfly crawler sends a hard 28-credit ceiling before submitting a job',async()=>{
 mock.property(process,'env',{...process.env,SCRAPFLY_API_KEY:'test-only-placeholder'});
 mock.method(globalThis,'fetch',async(input:string|URL|Request,init?:RequestInit)=>{
  if(init?.body){assert.equal(JSON.parse(String(init.body)).max_api_credit,28);return Response.json({crawler_uuid:'budget-job'});}
  return String(input).includes('/status')?Response.json({is_finished:true,is_success:true,state:{api_credit_used:1,stop_reason:null}}):Response.json({links:{next:null},contents:{'https://example.org/':{markdown:'Example'}}});
 });
 assert.ok(scrapfly.crawl);const result=await scrapfly.crawl({site:'https://example.org/',scope:'/',maxPages:30},{lane:'default',timeoutMs:8000,signal:new AbortController().signal});
 assert.equal(result.kind,'ok');assert.equal(result.billing.credits,1);
});
test('Scrapfly forwards native HTML document titles alongside Markdown in crawl evidence',async()=>{
 mock.property(process,'env',{...process.env,SCRAPFLY_API_KEY:'test-only-placeholder'});
 mock.method(globalThis,'fetch',async(input:string|URL|Request,init?:RequestInit)=>{
  if(init?.body){assert.deepEqual(JSON.parse(String(init.body)).content_formats,['markdown','html']);return Response.json({crawler_uuid:'title-job'});}
  if(String(input).includes('/status'))return Response.json({is_finished:true,is_success:true,state:{api_credit_used:1,stop_reason:null}});
  assert.equal(new URL(String(input)).searchParams.get('formats'),'markdown,html');
  return Response.json({links:{next:null},contents:{'https://example.org/':{markdown:'# Heading',html:'<html><head><title>Native &amp; exact | Docs</title></head><body><h1>Heading</h1></body></html>'}}});
 });
 assert.ok(scrapfly.crawl);const result=await scrapfly.crawl({site:'https://example.org/',scope:'/',maxPages:3},{lane:'default',timeoutMs:8000,signal:new AbortController().signal});
 assert.equal(result.kind,'ok');if(result.kind==='ok'&&result.data.track==='crawl')assert.equal(result.data.pages[0]?.markdown,'HTML document title: Native & exact | Docs\n\n# Heading');
});
