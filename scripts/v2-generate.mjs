import { acquireLock } from '../src/run/storage.ts';
import { unlink } from 'node:fs/promises';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { z } from 'zod';
import { resolve, recipeId } from '../src/tasks/resolve.ts';
import { get, allowed, unescape } from '../src/tasks/io.ts';
import { buildSplits } from '../src/tasks/splits.ts';
import { provenanceSchema } from '../src/tasks/schema.ts';
const root = process.env.WEB_BENCH_CAMPAIGN_DIR ?? 'results/campaign-v2';
await mkdir(root,{recursive:true});
const mutationLock=await acquireLock(`${root}/.campaign.lock`);
try {
const bankRoot = `${root}/banks`; await mkdir(bankRoot,{recursive:true});
try { await readFile(`${root}/sample-provenance.json`); throw Error('Already frozen'); } catch(e) { if(e.code!=='ENOENT')throw e; }
const tasks = [], recipes = {}, exclusions = [];
async function add(recipe) {
 const id = recipeId(recipe); if(recipes[id])return;
 try { const task = await resolve(recipe); tasks.push(task); recipes[id]=recipe; console.log(`ADDED ${id}`); }
 catch(e) { exclusions.push({id,recipe,reason:e.message}); console.log(`EXCLUDED ${id}: ${e.message}`); }
}
const old = provenanceSchema.parse(JSON.parse(await readFile('tasks/archive/v1-20261017/provenance.json','utf8')));
// Preserve the preregistered old real-web recipe population, refreshing every key.
for(const recipe of Object.values(old.recipes))if(recipe.kind!=='site'&&!(recipe.kind==='package'&&recipe.track==='scrape'))await add(recipe);
const catalogs={
 rubygems:'rails rack rake bundler rspec rubocop sinatra puma sidekiq devise activerecord activesupport nokogiri faraday redis sequel thor minitest capybara zeitwerk',
 go:'github.com/gin-gonic/gin github.com/labstack/echo/v4 github.com/go-chi/chi/v5 github.com/spf13/cobra github.com/spf13/viper github.com/stretchr/testify go.uber.org/zap golang.org/x/net golang.org/x/text golang.org/x/crypto',
 hex:'phoenix ecto plug jason decimal telemetry finch mint oban tesla livebook bandit castore absinthe ex_doc',
 pub:'http dio intl collection provider riverpod bloc path uuid freezed json_annotation url_launcher shared_preferences equatable logger',
 homebrew:'jq ripgrep fd bat fzf curl wget git neovim tmux yq just hyperfine delta starship',
 nuget:'Newtonsoft.Json Dapper Serilog Polly FluentValidation AutoMapper NodaTime MediatR Microsoft.EntityFrameworkCore RestSharp NUnit xunit CsvHelper Humanizer Bogus',
 packagist:'symfony/console symfony/http-foundation symfony/routing symfony/yaml guzzlehttp/guzzle monolog/monolog nesbot/carbon doctrine/orm twig/twig phpunit/phpunit laravel/framework league/flysystem',
 metacpan:'Mojolicious Dancer2 Moose Moo DBI Try-Tiny Path-Tiny URI HTTP-Tiny JSON-MaybeXS',
};
for(const [ecosystem,names]of Object.entries(catalogs))for(const name of names.split(' '))await add({kind:'registry',ecosystem,name});
const sitemaps=[
 'https://docs.astral.sh/uv/sitemap.xml','https://docs.astral.sh/ruff/sitemap.xml','https://www.python-httpx.org/sitemap.xml','https://www.starlette.io/sitemap.xml',
 'https://www.mkdocs.org/sitemap.xml','https://typer.tiangolo.com/sitemap.xml','https://fastapi.tiangolo.com/sitemap.xml','https://sqlmodel.tiangolo.com/sitemap.xml',
 'https://docs.pydantic.dev/latest/sitemap.xml','https://docs.pytest.org/en/stable/sitemap.xml','https://click.palletsprojects.com/en/stable/sitemap.xml','https://flask.palletsprojects.com/en/stable/sitemap.xml',
 'https://werkzeug.palletsprojects.com/en/stable/sitemap.xml','https://jinja.palletsprojects.com/en/stable/sitemap.xml','https://docs.celeryq.dev/en/stable/sitemap.xml','https://docs.python-requests.org/en/latest/sitemap.xml',
 'https://rich.readthedocs.io/en/stable/sitemap.xml','https://docs.aiohttp.org/en/stable/sitemap.xml','https://docs.scrapy.org/en/latest/sitemap.xml','https://www.sphinx-doc.org/en/master/sitemap.xml',
 'https://docs.ansible.com/sitemap.xml','https://docs.docker.com/sitemap.xml','https://docs.astro.build/sitemap-0.xml','https://docs.deno.com/sitemap.xml',
 'https://vite.dev/sitemap.xml','https://vitest.dev/sitemap.xml','https://docs.railway.com/sitemap.xml','https://docs.render.com/sitemap.xml',
 'https://docs.firecrawl.dev/sitemap.xml','https://docs.linkup.so/sitemap.xml','https://docs.browserbase.com/sitemap.xml','https://docs.tinyfish.ai/sitemap.xml',
 'https://docs.context.dev/sitemap.xml','https://www.uvicorn.org/sitemap.xml','https://docs.litestar.dev/2/sitemap.xml','https://docs.pola.rs/sitemap.xml',
];
async function site(sitemap) {
 try {
  await allowed(sitemap); const response=await get(sitemap); if(!response.body.includes('<urlset'))throw Error('Not a leaf sitemap');
  const all=[...new Set([...response.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>unescape(m[1]).trim()))].filter(u=>new URL(u).hostname===new URL(sitemap).hostname&&!/\/(?:zh|ja|ko|de|fr|es|ru|pt|uk|tr|zh-cn)\//.test(new URL(u).pathname));
  // Pages selected by URL alone, before any provider outcome. One host remains one cluster.
  for(const url of all.slice(0,30))for(const track of ['search','scrape'])await add({kind:'page',url,track});
  const proposals=all.filter(u=>u.endsWith('/')&&all.filter(v=>v.startsWith(u)).length>=3&&all.filter(v=>v.startsWith(u)).length<=12);
  const chosen=[];
  for(const scope of proposals.sort((a,b)=>a.length-b.length||a.localeCompare(b)))if(!chosen.some(p=>scope.startsWith(p)))chosen.push(scope);
  for(const scope of chosen.slice(0,12))for(const track of ['map','crawl'])await add({kind:'site',sitemap,scope,track});
 } catch(e){ exclusions.push({id:sitemap,reason:e.message});console.log(`SITE EXCLUDED ${sitemap}: ${e.message}`); }
}
let index=0;
await Promise.all(Array.from({length:4},async()=>{for(;;){const sitemap=sitemaps[index++];if(!sitemap)break;await site(sitemap);}}));
const splits=buildSplits(tasks,recipes);
for(const track of ['search','scrape','map','crawl'])await writeFile(`${bankRoot}/${track==='search'?'search':track+'-web'}.json`,JSON.stringify(tasks.filter(t=>t.track===track).sort((a,b)=>a.id.localeCompare(b.id)),null,2)+'\n');
await writeFile(`${bankRoot}/provenance.json`,JSON.stringify({formatVersion:1,recipes},null,2)+'\n');
await writeFile(`${bankRoot}/splits.json`,JSON.stringify(splits,null,2)+'\n');
await writeFile(`${bankRoot}/exclusions.json`,JSON.stringify(exclusions,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(['search','scrape','map','crawl'].map(track=>[track,{all:tasks.filter(t=>t.track===track).length,test:tasks.filter(t=>t.track===track&&splits[t.id]==='test').length,sites:new Set(tasks.filter(t=>t.track===track&&splits[t.id]==='test').map(t=>t.site)).size}]))));

} finally {await mutationLock.close();await unlink(`${root}/.campaign.lock`);}
