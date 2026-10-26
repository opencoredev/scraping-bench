import { acquireLock } from '../src/run/storage.ts';
import { unlink } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { resolve, recipeId } from '../src/tasks/resolve.ts';
import { get, allowed, unescape } from '../src/tasks/io.ts';
import { buildSplits } from '../src/tasks/splits.ts';
import { root, read, save } from './v2-common.mjs';
const mutationLock=await acquireLock(`${root}/.campaign.lock`);
try {
try{await readFile(`${root}/sample-provenance.json`);throw Error('Already frozen');}catch(e){if(e.code!=='ENOENT')throw e;}
const tracks=['search','scrape','map','crawl'];
const tasks=(await Promise.all(tracks.map(track=>read(`${root}/banks/${track==='search'?'search':track+'-web'}.json`)))).flat();
const provenance=await read(`${root}/banks/provenance.json`),exclusions=await read(`${root}/banks/exclusions.json`);
const sitemaps=process.env.WEB_BENCH_EXTRA_SITES?.split(',')??[
 'https://squidfunk.github.io/mkdocs-material/sitemap.xml','https://facelessuser.github.io/pymdown-extensions/sitemap.xml','https://mkdocstrings.github.io/sitemap.xml',
 'https://docs.pytest.org/sitemap.xml','https://click.palletsprojects.com/sitemap.xml','https://flask.palletsprojects.com/sitemap.xml','https://werkzeug.palletsprojects.com/sitemap.xml','https://jinja.palletsprojects.com/sitemap.xml',
 'https://rich.readthedocs.io/sitemap.xml','https://docs.aiohttp.org/sitemap.xml','https://docs.scrapy.org/sitemap.xml','https://docs.celeryq.dev/sitemap.xml',
 'https://www.encode.io/httpcore/sitemap.xml','https://www.uvicorn.org/sitemap.xml','https://www.attrs.org/sitemap.xml','https://cattrs.readthedocs.io/sitemap.xml',
 'https://docs.sqlalchemy.org/sitemap.xml','https://alembic.sqlalchemy.org/sitemap.xml','https://docs.pola.rs/sitemap.xml','https://docs.litestar.dev/sitemap.xml',
 'https://fastapi.tiangolo.com/sitemap.xml','https://typer.tiangolo.com/sitemap.xml','https://sqlmodel.tiangolo.com/sitemap.xml','https://docs.pydantic.dev/latest/sitemap.xml',
 'https://docs.astral.sh/uv/sitemap.xml','https://docs.astral.sh/ruff/sitemap.xml','https://www.mkdocs.org/sitemap.xml','https://www.starlette.io/sitemap.xml','https://www.python-httpx.org/sitemap.xml',
];
async function add(recipe){const id=recipeId(recipe);if(provenance.recipes[id])return;
 try{const task=await resolve(recipe);tasks.push(task);provenance.recipes[id]=recipe;console.log('ADDED',id);}
 catch(e){exclusions.push({id,recipe,reason:e.message});console.log('EXCLUDED',id,e.message);}
}
async function site(sitemap){try{
 await allowed(sitemap);const response=await get(sitemap);if(!response.body.includes('<urlset'))throw Error('No leaf urlset');
 const urls=[...new Set([...response.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>unescape(m[1]).trim()))].filter(url=>new URL(url).hostname===new URL(sitemap).hostname);
 // Separate language/version populations; use the existing canonical English/stable version when present.
 const english=urls.filter(u=>!/(?:\/ar\/|\/zh\/|\/ja\/|\/ko\/|\/de\/|\/fr\/|\/es\/|\/ru\/|\/pt\/)/.test(u));
 const preferred=english.filter(u=>!u.includes('readthedocs.io')||u.includes('/en/stable/')||u.includes('/en/latest/'));
 const selected=preferred.length?preferred:english;
 for(const url of selected.slice(0,24))for(const track of ['search','scrape'])await add({kind:'page',url,track});
 const dirs=new Set();for(const url of selected){let dir=new URL('.',url).href;for(let i=0;i<5&&dir.length>new URL(url).origin.length+1;i++){dirs.add(dir);dir=new URL('..',dir).href;}}
 const candidates=[...dirs].filter(scope=>{const n=selected.filter(u=>u.startsWith(scope)).length;return n>=3&&n<=10;}).sort((a,b)=>a.length-b.length||a.localeCompare(b));
 const scopes=[];for(const scope of candidates)if(!scopes.some(p=>scope.startsWith(p)))scopes.push(scope);
 for(const scope of scopes.slice(0,15))for(const track of ['map','crawl'])await add({kind:'site',sitemap,scope,track});
 }catch(e){exclusions.push({id:sitemap,reason:e.message});console.log('SITE EXCLUDED',sitemap,e.message);}}
let index=0;await Promise.all(Array.from({length:4},async()=>{for(;;){const next=sitemaps[index++];if(!next)break;await site(next);}}));
for(const track of tracks)await save(`${root}/banks/${track==='search'?'search':track+'-web'}.json`,tasks.filter(t=>t.track===track));
await save(`${root}/banks/provenance.json`,provenance);await save(`${root}/banks/exclusions.json`,exclusions);await save(`${root}/banks/splits.json`,buildSplits(tasks,provenance.recipes));
console.log(JSON.stringify(Object.fromEntries(tracks.map(track=>[track,{all:tasks.filter(t=>t.track===track).length,sites:new Set(tasks.filter(t=>t.track===track).map(t=>t.site)).size}]))));

} finally {await mutationLock.close();await unlink(`${root}/.campaign.lock`);}
