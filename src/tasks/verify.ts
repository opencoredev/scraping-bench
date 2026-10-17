import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { provenanceSchema, taskSchema } from './schema.ts';
import { json } from './io.ts';
import { resolve } from './resolve.ts';
import { buildSplits } from './splits.ts';

if (!process.argv.includes('--refresh')) throw new Error('Verification must use --refresh to bypass disk cache');
const provenance = provenanceSchema.parse(json(await readFile('tasks/provenance.json', 'utf8')));
const tasks = (await Promise.all(['search', 'scrape-web', 'map-web', 'crawl-web'].map(async file => z.array(taskSchema).parse(json(await readFile(`tasks/${file}.json`, 'utf8')))))).flat();
const splits = z.record(z.string(), z.enum(['dev', 'test'])).parse(json(await readFile('tasks/splits.json', 'utf8')));
const ids = new Set(tasks.map(task => task.id));
if (ids.size !== tasks.length || Object.keys(provenance.recipes).length !== tasks.length || Object.keys(splits).length !== tasks.length || Object.keys(splits).some(id => !ids.has(id))) throw new Error('Duplicate IDs or mismatched provenance/splits');
const selected = process.argv.find(arg => arg.startsWith('--task='))?.slice('--task='.length);
const targets = selected ? tasks.filter(task => task.id === selected) : tasks;
if (targets.length === 0) throw new Error(`Unknown task: ${selected}`);
const expectedSplits = buildSplits(tasks, provenance.recipes);
if (Object.entries(splits).some(([id, split]) => expectedSplits[id] !== split)) throw new Error('Split assignments violate deterministic answer-group isolation');
let failures = 0;
for (const task of targets) {
  const recipe = provenance.recipes[task.id];
  if (!recipe || !splits[task.id]) throw new Error(`Missing sidecar entry: ${task.id}`);
  try {
    const current = await resolve(recipe);
    // Compare exact gold numbers, not the grading tolerance. Any drift must be reviewed.
    if (!isDeepStrictEqual(current.expected, task.expected) || !isDeepStrictEqual(current.input, task.input) || current.family !== task.family) throw new Error(`answer key drift: stored=${JSON.stringify(task.expected)} live=${JSON.stringify(current.expected)}`);
    process.stdout.write(`PASS ${task.id}\n`);
  } catch (error) { failures++; process.stderr.write(`FAIL ${task.id}: ${error instanceof Error ? error.message : String(error)}\n`); }
}
process.stdout.write(`Verified ${targets.length - failures}/${targets.length}; drift/errors=${failures}\n`);
process.exitCode = failures ? 1 : 0;
