import type { ExpectedField, Task, TaskInput } from '../core/types.ts';
import { categories, freshnessVersion, generateSite, parseSeed, sections } from '../../fixtures/site/src/data.ts';

/** Freshness keys are snapshots. Generate immediately before a run, freeze the clock bucket in the run manifest. */
export function generateFixtureTasks({ seed, baseUrl, now = Date.now() }: { seed: string; baseUrl: string; now?: number }): Task[] {
  parseSeed(seed);
  const base = new URL(baseUrl);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('baseUrl must be an HTTP(S) origin');
  const site = `${base.origin}/r/${seed}`;
  const data = generateSite(seed);
  const tasks: Task[] = [];
  const url = (path: string) => site + path;
  function add(family: string, instruction: string, path: string, expected: Task['expected'], track: Task['track'] = 'scrape', scope = '') {
    const input: TaskInput = track === 'scrape' ? {track, url:url(path)} : track === 'map' ? {track,site:url(path),scope} : track === 'crawl' ? {track,site:url(path),scope,maxPages:400} : {track,query:instruction};
    tasks.push({id:`fixture-${seed}-${track}-${family}-${tasks.length+1}`,track,family,instruction,input,expected,source:{kind:'fixture',page:url(path)},site});
  }
  const text = (name: string, value: string): ExpectedField => ({kind:'text',name,accept:[value]});
  const set = (name: string, items: readonly string[]): ExpectedField => ({kind:'text-set',name,items});
  for (const p of data.products.slice(0,40)) add('price-stock','Read this product page for our purchasing integration. Return JSON with price (include currency), stock, and sku.',p.path,[text('price',p.price),text('stock',p.stock),text('sku',p.sku)]);
  for (const p of data.products.slice(0,20)) add('specs-table-cell','Read the specifications table. Return JSON with weight, accuracy, and voltage, including units.',p.path,[text('weight',p.specs.weight),text('accuracy',p.specs.accuracy),text('voltage',p.specs.voltage)]);
  for (const doc of data.docs.slice(0,10)) for (const command of doc.commands) add('install-command',`I am setting up ${command.platform}. Return JSON with command (the exact install command for ${command.platform}) and version (the documented tools version).`,doc.path,[text('command',command.command),{kind:'version',name:'version',value:doc.version}]);
  for (const post of data.posts.slice(0,10)) add('blog-date-author','Read this journal post for our content index. Return JSON with date (YYYY-MM-DD) and author.',post.path,[{kind:'date',name:'date',value:post.date},text('author',post.author)]);
  add('pricing-tiers','Read every pricing tier. Return JSON with tiers as an array of strings formatted "Name | Price | Devices", preserving price units.','/pricing',[set('tiers',data.tiers.map(t=>`${t.name} | ${t.price} | ${t.devices}`))]);
  const hardCases = [
    {key:'js',family:'js-rendered-field',instruction:'Wait for calibration information to load, then return JSON with reference.',value:data.special.js},
    {key:'lazy',family:'lazy-loaded-field',instruction:'Scroll to the reserve information near the bottom. Return JSON with reference.',value:data.special.lazy},
    {key:'iframe',family:'iframe-field',instruction:'Read the installation permit embedded in the frame. Return JSON with reference.',value:data.special.iframe},
    {key:'shadow',family:'shadow-dom-field',instruction:'Read the device identity component. Return JSON with reference.',value:data.special.shadow},
    {key:'tabs',family:'tabs-field',instruction:'Read the recovery details, opening them if needed. Return JSON with reference (the recovery code).',value:data.special.tabs},
    {key:'long',family:'long-page-deep-fact',instruction:'Find the deep archive reference in procedure 370 of the manual. Return JSON with reference.',value:data.special.long},
    {key:'nonEnglish',family:'non-english-field',instruction:'Read the Spanish service page. Return JSON with reference (the assigned station code, in the original Spanish).',value:data.special.nonEnglish},
    {key:'cookie',family:'cookie-boilerplate',instruction:'Find the dispatch reference in the main content, dismissing the cookie banner if necessary. Return JSON with reference.',value:data.special.cookie},
  ];
  for (const h of hardCases) add(h.family,h.instruction,`/resources/${h.key}`,[text('reference',h.value)]);
  for (const row of data.report.filter(r=>[1,3,6,9,12].includes(r.page))) add('pdf-number',`Read page ${row.page} of this PDF. Return JSON with revenue as a number in USD, using only that page.`, '/resources/report.pdf',[{kind:'number',name:'revenue',value:row.revenue,tolerance:0}]);
  add('freshness-version','Read the current service revision. Return JSON with revision as an integer. Fetch the live page; revisions change at each ten-minute UTC boundary.','/resources/freshness',[{kind:'number',name:'revision',value:freshnessVersion(now),tolerance:0}]);
  for (const p of data.products.slice(0,3)) add('not-found','Find this product’s manufacturer fax number. Return JSON with fax; use null if the page does not publish one.',p.path,[{kind:'none',name:'fax'}]);
  add('redirect','Follow this legacy link through its redirects and read the dispatch reference. Return JSON with reference.','/resources/redirect/1',[text('reference',data.special.cookie)]);
  add('soft-404','Find the price for the retired instrument at this URL. Return JSON with price; use null if the item is unavailable.','/resources/soft-404',[{kind:'none',name:'price'}]);
  function map(family: string, instruction: string, path: string, paths: string[]) {
    add(family,`${instruction} Return JSON with urls as an array of absolute URLs. Include every matching page, exclude index pages, duplicates and robots-disallowed paths.`,path,[{kind:'url-set',name:'urls',urls:paths.map(url),minRecall:1,minPrecision:1}],'map',instruction);
  }
  map('blog-2026','Find all journal post URLs from 2026.','/blog',data.posts.filter(p=>p.date.startsWith('2026')).map(p=>p.path));
  map('docs-guides','Find all documentation articles under /docs/guides.','/docs',data.docs.filter(d=>d.path.startsWith('/docs/guides/')).map(d=>d.path));
  map('products-all','Find all product detail URLs.','/store',data.products.map(p=>p.path));
  for (const category of categories) map('products-category',`Find all product detail URLs in the ${category} category.`,`/store/category/${category}`,data.products.filter(p=>p.category===category).map(p=>p.path));
  for (const section of sections) map('docs-section',`Find all documentation article URLs under /docs/${section}.`,`/docs/${section}`,data.docs.filter(d=>d.section===section).map(d=>d.path));
  for (const tag of categories) map('blog-tag',`Find all journal post URLs tagged ${tag}.`,'/blog',data.posts.filter(p=>p.tags.includes(tag)).map(p=>p.path));
  map('sitemap-only-orphans','Use the run sitemap.xml to find all service bulletin article URLs under /archive. These articles have no incoming HTML links.','/',data.orphans.map(o=>o.path));
  map('blog-2025','Find all journal post URLs from 2025.','/blog',data.posts.filter(p=>p.date.startsWith('2025')).map(p=>p.path));
  map('docs-api','Find all API documentation article URLs under /docs/api.','/docs',data.docs.filter(d=>d.path.startsWith('/docs/api/')).map(d=>d.path));
  map('blog-all','Find all journal post URLs.','/blog',data.posts.map(p=>p.path));
  function crawl(family: string, instruction: string, path: string, items: string[]) { add(family,`${instruction} Return JSON with records as an array of strings in the specified format; include every matching record and remove duplicates. Respect robots.txt.`,path,[set('records',items)],'crawl',new URL(url(path.startsWith('/store/category/') ? '/store' : path)).pathname); }
  crawl('pricing-tiers','Collect every pricing tier, formatted "Name | Price | Devices".','/pricing',data.tiers.map(t=>`${t.name} | ${t.price} | ${t.devices}`));
  crawl('blog-2026','Collect title and date of every 2026 journal post, formatted "Title | YYYY-MM-DD".','/blog',data.posts.filter(p=>p.date.startsWith('2026')).map(p=>`${p.title} | ${p.date}`));
  const commandRecords = (docs: typeof data.docs) => docs.flatMap(d=>d.commands.map(c=>`${d.path} | ${c.platform} | ${c.command}`));
  crawl('install-commands','Collect every install command from articles under /docs/guides, formatted "Run-relative article path | Platform | Command".','/docs',commandRecords(data.docs.filter(d=>d.path.startsWith('/docs/guides/'))));
  for (const section of sections) crawl('section-commands',`Collect every install command under /docs/${section}, formatted "Run-relative article path | Platform | Command".`,`/docs/${section}`,commandRecords(data.docs.filter(d=>d.section===section)));
  for (const category of categories) crawl('category-inventory',`Collect every product in ${category}, formatted "SKU | Price | Stock".`,`/store/category/${category}`,data.products.filter(p=>p.category===category).map(p=>`${p.sku} | ${p.price} | ${p.stock}`));
  crawl('sitemap-only-orphans','Use the run sitemap.xml to collect every /archive bulletin, formatted "Title | Service reference".','/',data.orphans.map(o=>`${o.title} | ${o.code}`));
  crawl('blog-all','Collect every journal post, formatted "Title | YYYY-MM-DD | Author".','/blog',data.posts.map(p=>`${p.title} | ${p.date} | ${p.author}`));
  crawl('migration-steps','Collect every numbered migration step under /docs/guides/migration, formatted "Run-relative article path | Step number | Step text".','/docs/guides/migration',data.docs.filter(d=>d.section==='guides/migration').flatMap(d=>d.migration.map((m,i)=>`${d.path} | ${i+1} | ${m}`)));
  return tasks;
}

/** Resolve freshness after execution from the exact D1 origin record, rather than grading against a stale generation clock. */
export function withFixtureOriginVersion({ task, contentVersion }: { task: Task; contentVersion: string }): Task {
  if (task.source.kind !== 'fixture' || task.family !== 'freshness-version') return task;
  const siteUrl = new URL(task.site);
  const seed = siteUrl.pathname.split('/')[2];
  const match = /^([a-zA-Z0-9_-]{1,64}):(\d+)$/.exec(contentVersion);
  if (!match || match[1] !== seed) throw new Error('Origin version does not match the freshness task seed');
  const revision = Number(match[2]);
  if (!Number.isSafeInteger(revision)) throw new Error('Invalid origin revision');
  return { ...task, expected: [{kind:'number',name:'revision',value:revision,tolerance:0}] };
}
