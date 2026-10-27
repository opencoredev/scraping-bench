import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstHeading } from './expanded.ts';
import { buildSplits } from './splits.ts';
import { resolve, recipeId } from './resolve.ts';
import type { Task } from '../core/types.ts';
import type { Recipe } from './schema.ts';

test('documentation headings decode entities, inline markup and permalink markers', () => {
  assert.equal(firstHeading('<h1>Fetch <code>A &amp; B</code><a href="#">¶</a></h1>'), 'Fetch A & B');
  assert.throws(() => firstHeading('<h2>No level one</h2>'), /H1/);
});
test('page search and scrape answers inside a docs scope share its map/crawl split', () => {
  const scope = 'https://example.org/docs/';
  const recipes: Recipe[] = [{kind:'site',sitemap:'https://example.org/sitemap.xml',scope,track:'map'}, {kind:'site',sitemap:'https://example.org/sitemap.xml',scope,track:'crawl'}, {kind:'page',url:scope+'a/',track:'search'}, {kind:'page',url:scope+'a/',track:'scrape'}];
  const tasks: Task[] = recipes.map(recipe => ({id:recipeId(recipe),track:recipe.kind==='page'?recipe.track:recipe.kind==='site'?recipe.track:'search',family:recipe.kind==='page'?'docs-heading':'docs-url-set',site:'example.org',input:{track:'search',query:'unused'},instruction:'unused',expected:[{kind:'text',name:'x',accept:['x']}],source:{kind:'authoritative',source:scope,checkedAt:'2026-10-19'}}));
  const splits=buildSplits(tasks,Object.fromEntries(recipes.map(recipe=>[recipeId(recipe),recipe])));
  assert.equal(new Set(Object.values(splits)).size,1);
});

test('heading extraction strips leading and nested permalink elements structurally', () => {
  assert.equal(firstHeading('<h1>Introduction<span class="permalink"><a href="#intro">Copy link</a></span></h1>'), 'Introduction');
  assert.equal(firstHeading('<h1><a class="headerlink" href="#intro" title="Permanent link"><span>Link to this heading</span></a>Introduction</h1>'), 'Introduction');
  assert.equal(firstHeading('<h1>Getting <em>started<a class="hash-link" href="#start"><span>Direct link</span></a></em></h1>'), 'Getting started');
  assert.equal(firstHeading('<h1><a href="#intro" aria-label="Permalink to this heading">🔗</a>Introduction</h1>'), 'Introduction');
});
test('heading extraction removes private-use and format characters without losing text', () => {
  assert.equal(firstHeading('<h1>In\u200btro\u00adduction\ue000 <code>A\u200dPI</code>\u2060</h1>'), 'Introduction API');
  assert.equal(firstHeading('<h1>\ue000\u200b</h1><h1>Visible</h1>'), 'Visible');
});
test('heading extraction preserves literal punctuation and ordinary inline links', () => {
  assert.equal(firstHeading('<h1>Learn <a href="/csharp">C#</a></h1>'), 'Learn C#');
  assert.equal(firstHeading('<h1><a href="#related">Related concepts</a> and C#</h1>'), 'Related concepts and C#');
});
