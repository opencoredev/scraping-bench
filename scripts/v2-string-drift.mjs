// String ran on 2026-10-24, five days after the v2 answer keys were frozen and the other providers ran. A key can
// change in that time (a package ships a release), which counts against String alone. For every String task that
// failed under the frozen rules, this re-resolves the task's recipe from its live source, reports whether the key
// drifted, and if so re-grades String's stored answer and responses against the live key. It never changes a score;
// the frozen-rule numbers stay the headline. Run from an empty directory, since recipe resolution caches under
// ./tasks/cache:
//   cd "$(mktemp -d)" && node --experimental-strip-types <worktree>/scripts/v2-string-drift.mjs <worktree> --refresh
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from '../src/tasks/resolve.ts';
import { gradeAnswer } from '../src/grade/index.ts';
import { gradeRetrieval } from '../measure/retrieval.ts';
import { outcomeSchema } from '../src/core/schema.ts';
const worktree = process.argv[2];
if (!worktree || !process.argv.includes('--refresh')) throw Error('Usage: v2-string-drift.mjs <worktree> --refresh');
const results = join(worktree, 'results');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const readLines = async path => (await readFile(path, 'utf8')).split('\n').filter(Boolean).map(line => JSON.parse(line));
const runs = { scrape: 'wb-v2-full-scrape-string-v1', search: 'wb-v2-core-search-string-v1', map: 'wb-v2-full-map-string-v1' };
const recipes = (await readJson(join(results, 'campaign-v2', 'banks', 'provenance.json'))).recipes;
const rows = (await readLines(join(results, 'measure-v2-string', 'rows.jsonl'))).filter(r => r.provider === 'string');
const report = { at: new Date().toISOString(), keysFrozen: '2026-10-19', checked: 0, drifted: 0, errors: 0, tasks: [] };
for (const [track, runId] of Object.entries(runs)) {
  const frozen = new Map((await readJson(join(results, 'campaign-v2', `test-${track}.json`))).map(t => [t.id, t]));
  const events = (await readLines(join(results, runId, 'calls.jsonl'))).filter(e => e.kind === 'provider' && e.mode === 'agent');
  for (const row of rows.filter(r => r.track === track && (r.retrieval === false || (r.core && r.agent && !r.agent.success)))) {
    const task = frozen.get(row.taskId);
    const entry = { taskId: row.taskId, track, core: row.core, agentPass: row.agent?.success ?? null, retrievalPass: row.retrieval };
    report.checked++;
    try {
      const live = await resolve(recipes[row.taskId]);
      entry.drifted = !isDeepStrictEqual(live.expected, task.expected);
      if (entry.drifted) {
        report.drifted++;
        entry.frozen = task.expected; entry.live = live.expected;
        if (row.agent) entry.agentPassLive = gradeAnswer(live.expected, Object.fromEntries(row.agent.fields.map(f => [f.name, f.got]))).every(f => f.pass);
        const outcomes = await Promise.all(events.filter(e => e.taskId === row.taskId).map(async e => outcomeSchema.parse(JSON.parse(await readFile(join(results, e.privatePath), 'utf8')))));
        const graded = gradeRetrieval({ ...task, expected: live.expected }, outcomes);
        entry.retrievalPassLive = graded.kind === 'graded' ? graded.pass : null;
      }
    } catch (error) { report.errors++; entry.error = error instanceof Error ? error.message.slice(0, 300) : String(error); }
    report.tasks.push(entry);
    process.stderr.write(`${entry.drifted ? 'DRIFT' : entry.error ? 'ERROR' : 'same '} ${row.taskId}\n`);
  }
}
await writeFile(join(results, 'measure-v2-string', 'drift.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checked: report.checked, drifted: report.drifted, errors: report.errors }));
