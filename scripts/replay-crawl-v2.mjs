// Model-only replay. Never load .env, provider credentials, or the adapter registry.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { taskSchema, outcomeSchema } from '../src/core/schema.ts';
import { resultSchema } from '../src/run/result.ts';
import { Storage, acquireLock } from '../src/run/storage.ts';
import { ModelClient } from '../src/model/index.ts';
import { storedModelSchema, installReplayNetworkGuard, replayStoredAnswer } from '../src/run/replay.ts';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const lines = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
const digest = body => createHash('sha256').update(body).digest('hex');
const root = 'results/wb-v2-crawl-replay';
const sources = ['firecrawl', 'contextdev', 'scrapfly'];
const jobs = [];
const identities = {};
for (const provider of sources) {
  const runId = `wb-v2-full-crawl-${provider}-v1`;
  const manifestPath = `results/${runId}/manifest.json`;
  const manifestBody = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBody);
  const tasks = z.array(taskSchema).parse(manifest.tasks);
  const originalRows = (await lines(`results/${runId}/results.jsonl`)).map(r => resultSchema.parse(r)).filter(r => r.mode === 'agent');
  const callsPath = `results/${runId}/calls.jsonl`;
  const callsBody = await readFile(callsPath);
  identities[runId] = { manifestHash: digest(manifestBody), callsHash: digest(callsBody), tasks: tasks.length, providerDispatches: (await lines(callsPath)).filter(e => e.kind === 'provider-dispatch').length };
  const events = callsBody.toString().trim().split('\n').map(JSON.parse);
  for (const task of tasks) {
    const original = originalRows.find(r => r.taskId === task.id);
    if (!original) throw Error('Missing original task result');
    const providers = events.filter(e => e.taskId === task.id && e.mode === 'agent' && e.kind === 'provider');
    if (providers.length !== 1) throw Error('Expected one stored provider outcome per crawl task');
    const providerEvent = providers[0];
    const modelEvents = events.filter(e => e.taskId === task.id && e.mode === 'agent' && e.kind === 'model');
    const final = modelEvents.at(-1);
    if (!final) throw Error('Missing final original model turn');
    const loadVerified = async event => {
      if (!event.privatePath.startsWith(`raw-private/${runId}/`) || event.privatePath.includes('..')) throw Error('Invalid private source path');
      const body = await readFile(`results/${event.privatePath}`);
      if (digest(body) !== event.responseHash) throw Error('Stored response hash mismatch');
      return JSON.parse(body);
    };
    const outcome = outcomeSchema.parse(await loadVerified(providerEvent));
    const stored = storedModelSchema.parse(await loadVerified(final));
    const priorModelUsd = modelEvents.slice(0, -1).reduce((sum, e) => sum + e.usage.modelUsd, 0);
    const priorElapsedMs = Math.max(0, original.totalMs - final.usage.ms);
    jobs.push({ task, original, outcome, stored, priorModelUsd, priorElapsedMs, runId, providerEvent, final });
  }
}
if (process.argv.includes('--validate-only')) { console.log(JSON.stringify({ validatedTasks: jobs.length, sourceRuns: identities })); process.exit(0); }
// Same internal authentication helper as the original campaign. No .env is loaded,
// and the credential stays in process memory; it is never logged or persisted.
const modelToken = process.env.ANTHROPIC_AUTH_TOKEN ?? execFileSync('python3', ['-c', "import yaml; from pathlib import Path; print(yaml.safe_load(Path('/home/leo/.cli-proxy-api/config.yaml').read_text())['api-keys'][0])"], { encoding: 'utf8' }).trim();
await mkdir(root, { recursive: true });
const lock = await acquireLock(`${root}/.lock`);
const storage = new Storage('results', 'wb-v2-crawl-replay');
await storage.init();
const identity = { lane: 'post-run-model-answer-replay', sourceRuns: identities, taskCount: jobs.length, model: 'claude-haiku-5-5', temperature: 0, maxAnswerTokens: 4096,
  evidenceCapBytes: 48000, providerCallsAllowed: 0, providerNetwork: 'blocked; only POST http://127.0.0.1:8317/v1/chat/completions permitted, redirects refused',
  planning: 'Original model planning turn and provider tool response reused; only final answer turn rerun with corrected packaging. Original prompt, tools, limits and strict parser retained.' };
const manifestPath = `${root}/manifest.json`;
try { const previous = await read(manifestPath); if (JSON.stringify(previous) !== JSON.stringify(identity)) throw Error('Replay identity changed'); }
catch (e) { if (e.code === 'ENOENT') await writeFile(manifestPath, JSON.stringify(identity, null, 2) + '\n'); else throw e; }
const restore = installReplayNetworkGuard(async e => storage.jsonl('network.jsonl', { ...e, at: new Date().toISOString() }));
try {
  const existing = await storage.rows();
  const done = new Set(existing.map(r => `${r.provider}/${r.taskId}`));
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      if (done.has(`${job.original.provider}/${job.task.id}`)) continue;
      const start = performance.now();
      const startedAt = new Date().toISOString();
      const client = new ModelClient({ token: modelToken, telemetry: async e => {
        const stored = e.kind === 'model' ? await storage.privateBody({ request: e.request, response: e.response }) : {};
        const { request, response, ...event } = e;
        await storage.jsonl('calls.jsonl', { taskId: job.task.id, provider: job.original.provider, ...event, ...stored });
      } });
      const replay = await replayStoredAnswer({ ...job, client });
      const { answer, evidenceBytes, ...result } = replay;
      await storage.jsonl('results.jsonl', { ...job.original, ...result, startedAt, client: 'ms-a2-model-only-replay', apiUsd: 0, toolMs: 0, totalMs: performance.now() - start });
      await storage.jsonl('reuse.jsonl', { taskId: job.task.id, provider: job.original.provider, sourceRun: job.runId,
        storedOutcomePath: job.providerEvent.privatePath, storedOutcomeHash: job.providerEvent.responseHash,
        storedModelPath: job.final.privatePath, storedModelHash: job.final.responseHash,
        originalApiUsdForLimit: job.outcome.billing.usd, priorModelUsdForLimit: job.priorModelUsd, originalElapsedBeforeAnswerMs: job.priorElapsedMs, evidenceBytes, providerDispatches: 0 });
      console.log(JSON.stringify({ provider: job.original.provider, taskId: job.task.id, success: replay.success, evidenceBytes }));
    }
  }));
  const rows = await storage.rows();
  const calls = await storage.lines('calls.jsonl');
  const network = await storage.lines('network.jsonl');
  const after = {};
  for (const runId of Object.keys(identities)) after[runId] = digest(await readFile(`results/${runId}/calls.jsonl`));
  if (Object.entries(after).some(([id, hash]) => hash !== identities[id].callsHash)) throw Error('Original provider ledger changed');
  const timeChecks = rows.map(row => { const job = jobs.find(j => j.task.id === row.taskId && j.original.provider === row.provider); return { taskId: row.taskId, provider: row.provider, priorElapsedMs: job.priorElapsedMs, replayElapsedMs: row.totalMs, combinedMs: job.priorElapsedMs + row.totalMs }; });
  if (timeChecks.some(t => t.combinedMs >= 600000)) throw Error('Replay exceeded original total task time limit');
  await writeFile(`${root}/time-budget-checks.json`, JSON.stringify(timeChecks, null, 2) + '\n');
  const proof = { originalTimeLimitsSatisfied: true, maxCombinedTaskMs: Math.max(...timeChecks.map(t => t.combinedMs)), completed: rows.length, expected: jobs.length, providerDispatches: calls.filter(e => e.kind.startsWith('provider')).length,
    blockedNetworkDispatches: network.filter(e => e.kind === 'blocked-network-dispatch').length,
    modelProxyNetworkDispatches: network.filter(e => e.kind === 'model-proxy-network-dispatch').length,
    modelDispatches: calls.filter(e => e.kind === 'model-dispatch').length, originalProviderLedgersUnchanged: true,
    sourceProviderDispatches: Object.fromEntries(Object.entries(identities).map(([id, v]) => [id, v.providerDispatches])),
    modelUsd: rows.reduce((sum, r) => sum + r.modelUsd, 0) };
  await writeFile(`${root}/proof.json`, JSON.stringify(proof, null, 2) + '\n');
  if (proof.providerDispatches || proof.blockedNetworkDispatches || rows.length !== jobs.length) throw Error('Replay proof failed');
  console.log(JSON.stringify(proof));
} finally {
  restore();
  await lock.close();
  await (await import('node:fs/promises')).unlink(`${root}/.lock`);
}
