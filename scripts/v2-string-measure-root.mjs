// Builds a results root for `npm run measure` that adds String's runs to the frozen v2 campaign without changing
// it. Every frozen file is symlinked read-only; only selected-runs.json and the eligibility summary are copied with
// String added (core and full set on every track it ran), and the model cache is copied so new replays never write
// into the frozen cache. Usage:
//   node scripts/v2-string-measure-root.mjs <new-dir>            build the root
//   WEB_BENCH_RESULTS_ROOT=<new-dir> npm run measure
//   node scripts/v2-string-measure-root.mjs --keep <new-dir>     copy String's new model replays back beside its runs
import { cp, mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
const frozen = '/home/leo/web-bench/results';
// One run per track. `full` marks a run of the whole frozen test set, which holds the core set; a core-only run adds
// String to the headline agent scores but not to that track's full-set table.
const runs = {
  scrape: { runId: 'wb-v2-full-scrape-string-v1', full: false },
  search: { runId: 'wb-v2-core-search-string-v1', full: false },
  map: { runId: 'wb-v2-full-map-string-v1', full: true },
};
const local = resolve('results');
const stringCache = join(local, 'raw-private', 'measure-v2-string', 'model');
const keep = process.argv[2] === '--keep';
const out = resolve(process.argv[keep ? 3 : 2] ?? '');
if (!process.argv[keep ? 3 : 2]) throw Error('Pass a directory');

if (keep) {
  // Only entries the frozen cache lacks are String's; copy those back.
  const model = join(out, 'raw-private', 'measure-v2', 'model');
  let copied = 0;
  for (const name of await readdir(model, { recursive: true })) {
    if (!name.endsWith('.json') || existsSync(join(frozen, 'raw-private', 'measure-v2', 'model', name))) continue;
    await mkdir(join(stringCache, name, '..'), { recursive: true });
    await cp(join(model, name), join(stringCache, name), { force: false, errorOnExist: false });
    copied++;
  }
  console.log(JSON.stringify({ kept: copied, into: relative(process.cwd(), stringCache) }));
  process.exit(0);
}

await mkdir(out); // fails if it exists, so a stale root is never reused
const own = { 'campaign-v2': ['selected-runs.json'], 'wb-v2-final': ['summary.json'], 'raw-private': ['measure-v2'] };
const link = async (dir, skip = []) => {
  for (const name of await readdir(join(frozen, dir))) if (!skip.includes(name)) await symlink(join(frozen, dir, name), join(out, dir, name));
};
await link('', Object.keys(own));
for (const [dir, skip] of Object.entries(own)) { await mkdir(join(out, dir)); await link(dir, skip); }
await cp(join(frozen, 'raw-private', 'measure-v2'), join(out, 'raw-private', 'measure-v2'), { recursive: true });
// String's own replays, kept beside its runs so a rebuild is offline and byte-identical.
if (existsSync(stringCache)) await cp(stringCache, join(out, 'raw-private', 'measure-v2', 'model'), { recursive: true, force: false, errorOnExist: false });
const selected = JSON.parse(await readFile(join(frozen, 'campaign-v2', 'selected-runs.json'), 'utf8'));
const summary = JSON.parse(await readFile(join(frozen, 'wb-v2-final', 'summary.json'), 'utf8'));
for (const [track, { runId, full }] of Object.entries(runs)) {
  await symlink(join(local, runId), join(out, runId));
  await symlink(join(local, 'raw-private', runId), join(out, 'raw-private', runId));
  selected[`full/${track}/string`] = runId;
  const lists = [summary.tracks[track].eligibleProviders, ...(full ? [summary.tracks[track].fullProviders] : [])];
  for (const list of lists) list.splice(list.indexOf('none'), 0, 'string');
}
await writeFile(join(out, 'campaign-v2', 'selected-runs.json'), `${JSON.stringify(selected, null, 2)}\n`);
await writeFile(join(out, 'wb-v2-final', 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ root: out, runs }));
