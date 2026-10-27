// Runs String on the frozen v2 tasks with the same runBenchmark settings scripts/v2-campaign.mjs used for the
// original providers. String joined after the campaign, so it runs alone and never touches selected-runs.json or
// another provider's budget. Usage: node scripts/v2-string.mjs <track> smoke|core|full
// "full" is the frozen test set (results/campaign-v2/test-<track>.json), which contains the core set, the same
// set the campaign gave its full-set providers.
import { execFileSync } from 'node:child_process';
import { z } from 'zod';
import { taskSchema } from '../src/core/schema.ts';
import { runBenchmark } from '../src/run/index.ts';
import { root, read, save, config } from './v2-common.mjs';
process.loadEnvFile(process.env.WEB_BENCH_ENV_FILE ?? '.env');
if (!process.env.ANTHROPIC_AUTH_TOKEN) {
  // Reuse the already configured local model proxy; never persist or log its key.
  process.env.ANTHROPIC_AUTH_TOKEN = execFileSync('python3', ['-c', "import yaml; from pathlib import Path; print(yaml.safe_load(Path('/home/leo/.cli-proxy-api/config.yaml').read_text())['api-keys'][0])"], { encoding: 'utf8' }).trim();
}
const track = z.enum(['scrape', 'search', 'map']).parse(process.argv[2]);
const kind = z.enum(['smoke', 'core', 'full']).parse(process.argv[3]);
// Worst case per call at Starter rates: a browser fetch on a premium proxy; a 100-result search (about 13 Google
// pages); a sitemap job at its budget cap. Each fits the frozen per-task track limit with room for a second call.
const bounds = { scrape: { maxCallUsd: 0.006, apiMaxUsd: 2 }, search: { maxCallUsd: 0.02, apiMaxUsd: 3 }, map: { maxCallUsd: 0.12, apiMaxUsd: 3 } }[track];
const core = z.array(taskSchema).parse(await read(`${root}/core-${track}.json`));
const tasks = kind === 'smoke' ? core.slice(0, 1) : kind === 'core' ? core : z.array(taskSchema).parse(await read(`${root}/test-${track}.json`));
// Core and full runs hold different task lists, so they need different run IDs. The first String scrape run
// (core only) keeps its original ID, so the full scrape run is revision v2.
const rev = process.env.WEB_BENCH_REV ?? (track === 'scrape' && kind === 'full' ? 'v2' : 'v1');
const runId = kind === 'smoke' ? `wb-v2-smoke-${track}-string-${rev}`
  : kind === 'core' ? (track === 'scrape' ? 'wb-v2-full-scrape-string-v1' : `wb-v2-core-${track}-string-${rev}`)
  : `wb-v2-full-${track}-string-${rev}`;
const providerConfig = { string: { concurrency: 1, perSecond: 1, burst: 1, maxUsd: 30, apiMaxUsd: kind === 'smoke' ? 0.25 : bounds.apiMaxUsd, maxCallUsd: bounds.maxCallUsd } };
await save(`${root}/${runId}-config.json`, providerConfig);
process.env.WEB_BENCH_SMOKE = '1';
console.log(JSON.stringify({ runId, provider: 'string', track, tasks: tasks.length, ...providerConfig.string }));
const result = await runBenchmark({ tasks, providers: ['string'], lane: 'default', mode: 'both', client: 'ms-a2', seed: config.seed, concurrency: 1, runId, providerConfig });
console.log(JSON.stringify(result));
