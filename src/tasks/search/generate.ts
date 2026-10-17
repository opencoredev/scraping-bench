import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { Task } from '../../core/types.ts';
import { provenanceSchema, taskSchema, type Recipe } from '../schema.ts';
import { getJson, save, json } from '../io.ts';
import { resolve, recipeId, sparqlUrl, entityResults } from '../resolve.ts';
import { buildSplits } from '../splits.ts';
import { npmPackages, pythonPackages, crates, companies, releaseRepos, scopes } from './catalog.ts';

const tasks: Task[] = [];
const recipes: Record<string, Recipe> = {};
const exclusions: { id: string; reason: string }[] = [];
async function add(recipe: Recipe): Promise<boolean> {
  try {
    const task = await resolve(recipe);
    if (recipes[task.id]) throw new Error(`Duplicate task ID: ${task.id}`);
    tasks.push(task); recipes[task.id] = recipe;
    process.stdout.write(`ADDED ${task.id}\n`);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    exclusions.push({ id: recipeId(recipe), reason });
    process.stderr.write(`EXCLUDED ${recipeId(recipe)}: ${reason}\n`);
    return false;
  }
}
if (process.argv.includes('--sites-only')) {
  const saved = provenanceSchema.parse(json(await readFile('tasks/provenance.json', 'utf8')));
  for (const file of ['search', 'scrape-web']) {
    const existing = z.array(taskSchema).parse(json(await readFile(`tasks/${file}.json`, 'utf8')));
    for (const task of existing) {
      const recipe = saved.recipes[task.id];
      if (!recipe) throw new Error(`Missing saved recipe: ${task.id}`);
      tasks.push(task); recipes[task.id] = recipe;
    }
  }
  const rejected = z.array(z.object({ id: z.string(), reason: z.string() })).parse(json(await readFile('tasks/exclusions.json', 'utf8')));
  exclusions.push(...rejected.filter(row => !row.id.startsWith('map-') && !row.id.startsWith('crawl-')));
} else {
  for (const name of npmPackages) await add({ kind: 'package', ecosystem: 'npm', name, track: 'search' });
  for (const name of pythonPackages.slice(0, 30)) await add({ kind: 'package', ecosystem: 'pypi', name, track: 'search' });
  for (const name of crates) await add({ kind: 'package', ecosystem: 'crates', name, track: 'search' });
  let finances = 0;
  for (const [cik, company] of companies) {
    if (finances >= 40) break;
    if (await add({ kind: 'finance', cik, company })) finances++;
  }
  const discoveryQuery = 'SELECT ?item ?itemLabel (MIN(?date) AS ?founded) WHERE { ?item wdt:P31 wd:Q4830453; wdt:P571 ?date; wikibase:sitelinks ?n . FILTER(?n > 35 && ?n < 100) SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } GROUP BY ?item ?itemLabel HAVING(COUNT(DISTINCT ?date) = 1) LIMIT 45';
  const discovery = await getJson(sparqlUrl(discoveryQuery));
  let entities = 0;
  for (const row of entityResults.parse(discovery.data).results.bindings) {
    if (entities >= 40) break;
    if (!row.item || !row.itemLabel) continue;
    const qid = z.string().regex(/^Q\d+$/).parse(row.item.value.split('/').at(-1));
    if (await add({ kind: 'entity', qid, label: row.itemLabel.value })) entities++;
  }
  let fresh = 0;
  for (const repo of releaseRepos) {
    if (fresh >= 30) break;
    if (await add({ kind: 'release', repo })) fresh++;
  }
  for (const name of npmPackages.slice(0, 10)) await add({ kind: 'none', name, version: '99.99.99' });
  let scrapes = 0;
  for (const name of pythonPackages) {
    if (scrapes >= 80) break;
    if (await add({ kind: 'package', ecosystem: 'pypi', name, track: 'scrape' })) scrapes++;
  }
}
for (const [sitemap, scope] of scopes) {
  await add({ kind: 'site', sitemap, scope, track: 'map' });
  await add({ kind: 'site', sitemap, scope, track: 'crawl' });
}
const splits = buildSplits(tasks, recipes);
const groups = new Map<string, Task[]>();
for (const task of tasks) {
  const key = `${task.track}/${task.family}`;
  const group = groups.get(key) ?? [];
  group.push(task); groups.set(key, group);
}
for (const track of ['search', 'scrape', 'map', 'crawl']) await save(`tasks/${track === 'search' ? 'search' : `${track}-web`}.json`, tasks.filter(task => task.track === track).sort((a, b) => a.id.localeCompare(b.id)));
await save('tasks/provenance.json', { formatVersion: 1, recipes });
await save('tasks/splits.json', splits);
await save('tasks/exclusions.json', exclusions);
process.stdout.write(`${JSON.stringify(Object.fromEntries([...groups].map(([key, value]) => [key, value.length])))}\n`);
if (tasks.filter(t => t.track === 'search').length < 180 || tasks.filter(t => t.track === 'scrape').length < 75 || tasks.filter(t => t.track === 'map').length < 10) {
  process.stderr.write('Coverage below target; inspect tasks/exclusions.json.\n');
  process.exitCode = 1;
}
