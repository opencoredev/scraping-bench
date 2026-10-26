// Offline analysis only: reads immutable campaign artifacts; never imports runners.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gradeAnswer, normalizeText, canonicalUrl } from '../src/grade/index.ts';
import { parseAgentAnswer } from '../src/agent/index.ts';
import { crawlNativeTitle, crawlEvidence } from '../src/agent/evidence.ts';
import { summarize, pairedDifference } from '../src/stats/index.ts';
const read = async p => JSON.parse(await readFile(p, 'utf8'));
const lines = async p => (await readFile(p, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
const save = async (p, v) => writeFile(p, JSON.stringify(v, null, 2) + '\n');
const root = 'results/wb-v2-corrected';
await mkdir(`${root}/tasks`, { recursive: true });
const original = await read('results/wb-v2-final/summary.json');
const selected = await read('results/campaign-v2/selected-runs.json');
const tasks = {}, coreIds = {}, fullIds = {};
const changedKeys = [];
for (const track of ['search', 'scrape', 'map', 'crawl']) {
  const full = await read(`results/campaign-v2/retained/test-${track}.json`);
  const core = await read(`results/campaign-v2/core-${track}.json`);
  coreIds[track] = new Set(core.map(t => t.id));
  fullIds[track] = new Set(full.map(t => t.id));
  tasks[track] = new Map(full.map(t => {
    if (track !== 'scrape') return [t.id, t];
    const fixed = { ...t, expected: t.expected.map(f => f.kind === 'text' ? { ...f, accept: f.accept.map(s => s.replace(/[\p{Co}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim()) } : f) };
    if (JSON.stringify(fixed.expected) !== JSON.stringify(t.expected)) changedKeys.push({ taskId: t.id, site: t.site, core: coreIds[track].has(t.id), original: t.expected, corrected: fixed.expected });
    return [t.id, fixed];
  }));
  await save(`${root}/tasks/${track}.json`, [...tasks[track].values()]);
}
if (changedKeys.length !== 25 || changedKeys.filter(t => t.core).length !== 3) throw Error('Unexpected corrected key population');
await save(`${root}/key-corrections.json`, changedKeys);
const originalRows = [], eventsByRun = new Map();
const sourceHashes = {};
for (const runId of Object.values(selected)) {
  const path = `results/${runId}/results.jsonl`;
  sourceHashes[path] = createHash('sha256').update(await readFile(path)).digest('hex');
  sourceHashes[`results/${runId}/calls.jsonl`] = createHash('sha256').update(await readFile(`results/${runId}/calls.jsonl`)).digest('hex');
  const rows = await lines(path);
  originalRows.push(...rows.map(r => ({ ...r, sourceRun: runId })));
  eventsByRun.set(runId, await lines(`results/${runId}/calls.jsonl`));
}
const replayRows = await lines('results/wb-v2-crawl-replay/results.jsonl');
const proof = await read('results/wb-v2-crawl-replay/proof.json');
if (proof.completed !== 64 || proof.providerDispatches !== 0 || !proof.originalProviderLedgersUnchanged) throw Error('Invalid replay proof');
const derived = originalRows.map(row => {
  if (row.track === 'crawl' && row.mode === 'agent' && !['none', 'oracle'].includes(row.provider)) {
    const replay = replayRows.find(r => r.provider === row.provider && r.taskId === row.taskId);
    if (!replay) throw Error('Missing replay result');
    return { ...replay, sourceRun: row.sourceRun, analysis: 'model-answer-replay' };
  }
  if (row.track !== 'scrape' || row.mode !== 'agent') return { ...row, analysis: 'original' };
  const task = tasks.scrape.get(row.taskId);
  if (!task) return { ...row, analysis: 'excluded-original' };
  // Reuse only the fields accepted by the original strict parser. Invalid JSON
  // remains null; no commentary extraction can enter the corrected headline.
  const answer = Object.fromEntries(row.fields.map(f => [f.name, f.got]));
  const fields = gradeAnswer(task.expected, answer);
  return { ...row, fields, success: !row.limitReason && fields.every(f => f.pass) && (row.success || row.fields.some(f => !f.pass)), analysis: 'stored-answer-regrade' };
});
await writeFile(`${root}/results.jsonl`, derived.map(r => JSON.stringify(r)).join('\n') + '\n');
const coreRows = derived.filter(r => coreIds[r.track].has(r.taskId) && fullIds[r.track].has(r.taskId) && original.tracks[r.track].eligibleProviders.includes(r.provider));
const fullRows = derived.filter(r => fullIds[r.track].has(r.taskId) && original.tracks[r.track].fullProviders.includes(r.provider));
const coreSummary = summarize(coreRows, 19019, 10000), fullSummary = summarize(fullRows, 19019, 10000);
const leaders = {};
for (const track of Object.keys(tasks)) {
  const groups = coreSummary.groups.filter(g => g.track === track && g.mode === 'agent' && g.cohort !== 'control').sort((a, b) => b.successRate - a.successRate || a.provider.localeCompare(b.provider));
  const reference = groups[0].provider;
  leaders[track] = { reference, groups: groups.map(g => ({ ...g, pairedVsLeader: pairedDifference(coreRows.filter(r => r.track === track && r.mode === 'agent' && r.provider === g.provider), coreRows.filter(r => r.track === track && r.mode === 'agent' && r.provider === reference), 19019, 10000) })) };
}
// Count valid answer objects surrounded by prose separately. A unique object
// with exactly the requested fields is required; ambiguous/malformed prose is not counted.
function jsonObjects(content) {
  const found = [];
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (start < 0) { if (c === '{') { start = i; depth = 1; } continue; }
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; continue; }
    if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { found.push(content.slice(start, i + 1)); start = -1; }
  }
  return found;
}
const sensitivity = {}, sensitivityDetails = [];
for (const row of originalRows.filter(r => r.mode === 'agent' && fullIds[r.track].has(r.taskId))) {
  const key = `${row.track}/${row.provider}`;
  const count = sensitivity[key] ??= { track: row.track, provider: row.provider, tasks: 0, failures: 0, jsonPlusCommentary: 0, coreJsonPlusCommentary: 0, wouldPassCorrectedFields: 0 };
  count.tasks++; if (row.success) continue; count.failures++;
  const task = tasks[row.track].get(row.taskId);
  const last = eventsByRun.get(row.sourceRun).filter(e => e.kind === 'model' && e.mode === 'agent' && e.taskId === row.taskId).at(-1);
  if (!last) continue;
  const stored = await read(`results/${last.privatePath}`);
  const content = stored.response.choices?.[0]?.message?.content;
  if (typeof content !== 'string') continue;
  try { parseAgentAnswer(content, task); continue; } catch {}
  const candidates = jsonObjects(content).flatMap(s => { try { return [parseAgentAnswer(s, task)]; } catch { return []; } });
  if (candidates.length !== 1) continue;
  count.jsonPlusCommentary++; if (coreIds[row.track].has(row.taskId)) count.coreJsonPlusCommentary++;
  const wouldPass = gradeAnswer(task.expected, candidates[0]).every(f => f.pass);
  if (wouldPass) count.wouldPassCorrectedFields++;
  sensitivityDetails.push({ taskId: row.taskId, provider: row.provider, track: row.track, core: coreIds[row.track].has(row.taskId), wouldPassCorrectedFields: wouldPass });
}
const replaySensitivity = {};
const replayEvents = await lines('results/wb-v2-crawl-replay/calls.jsonl');
for (const row of replayRows) {
  const count = replaySensitivity[row.provider] ??= { tasks: 0, failures: 0, jsonPlusCommentary: 0, coreJsonPlusCommentary: 0, wouldPassCorrectedFields: 0 };
  count.tasks++; if (row.success) continue; count.failures++;
  const last = replayEvents.filter(e => e.kind === 'model' && e.provider === row.provider && e.taskId === row.taskId).at(-1);
  const stored = await read(`results/${last.privatePath}`), content = stored.response.choices[0].message.content ?? '';
  const task = tasks.crawl.get(row.taskId);
  try { parseAgentAnswer(content, task); continue; } catch {}
  const candidates = jsonObjects(content).flatMap(s => { try { return [parseAgentAnswer(s, task)]; } catch { return []; } });
  if (candidates.length === 1) {
    count.jsonPlusCommentary++; if (coreIds.crawl.has(row.taskId)) count.coreJsonPlusCommentary++;
    if (gradeAnswer(task.expected, candidates[0]).every(f => f.pass)) count.wouldPassCorrectedFields++;
  }
}
const crawlEvidenceAudit = [];
for (const provider of ['firecrawl', 'contextdev', 'scrapfly']) {
  const runId = `wb-v2-full-crawl-${provider}-v1`;
  for (const event of eventsByRun.get(runId).filter(e => e.mode === 'agent' && e.kind === 'provider')) {
    const task = tasks.crawl.get(event.taskId), outcome = await read(`results/${event.privatePath}`);
    const pages = outcome.kind === 'ok' && outcome.data.track === 'crawl' ? outcome.data.pages : [];
    const answer = { urls: pages.map(p => p.url), records: pages.map(p => `${p.url} | ${crawlNativeTitle(p.markdown) ?? ''}`) };
    const fields = gradeAnswer(task.expected, answer);
    const oldRequestEvent = eventsByRun.get(runId).filter(e => e.mode === 'agent' && e.kind === 'model' && e.taskId === task.id).at(-1);
    const oldRequest = await read(`results/${oldRequestEvent.privatePath}`);
    const oldEvidence = oldRequest.request.messages.find(m => m.role === 'tool')?.content ?? '';
    crawlEvidenceAudit.push({ taskId: task.id, provider, core: coreIds.crawl.has(task.id), pages: pages.length,
      allUrls: task.expected.find(f => f.kind === 'url-set').urls.every(url => pages.some(p => canonicalUrl(p.url) === canonicalUrl(url))),
      exactUrlSet: fields.find(f => f.name === 'urls').pass,
      exactTitleRecords: task.expected.find(f => f.kind === 'text-set').items.every(record => { const [url, ...titleParts] = record.split(' | '); const title = titleParts.join(' | '); return pages.some(p => canonicalUrl(p.url) === canonicalUrl(url) && normalizeText(crawlNativeTitle(p.markdown) ?? '') === normalizeText(title)); }),
      exactReturnedRecordSet: fields.find(f => f.name === 'records').pass,
      oldEvidenceTruncated: oldEvidence.includes('[OUTPUT TRUNCATED]'), correctedEvidenceBytes: crawlEvidence(outcome).tokenUpperBound });
  }
}
const crawlAuditCounts = Object.fromEntries(['firecrawl', 'contextdev', 'scrapfly'].map(p => {
  const rows = crawlEvidenceAudit.filter(r => r.provider === p);
  const counts = rows => ({ tasks: rows.length, allUrls: rows.filter(r => r.allUrls).length, exactTitleRecords: rows.filter(r => r.exactTitleRecords).length, exactUrlSet: rows.filter(r => r.exactUrlSet).length, oldEvidenceTruncated: rows.filter(r => r.oldEvidenceTruncated).length });
  return [p, { core: counts(rows.filter(r => r.core)), fullOrOriginalSample: counts(rows) }];
}));
const errorFailures = {};
for (const row of originalRows.filter(r => r.mode === 'agent' && fullIds[r.track].has(r.taskId) )) {
  const key = `${row.track}/${row.provider}`;
  const c = errorFailures[key] ??= { rateLimitedTasks: 0, coreRateLimitedTasks: 0, rateLimitedFailedTasks: 0, coreRateLimitedFailedTasks: 0, rateLimitedIds: [], http409BothAttempts: [] };
  if (row.errors.includes('rate-limited')) { c.rateLimitedTasks++; if (!row.success) c.rateLimitedFailedTasks++; if (!row.success && coreIds[row.track].has(row.taskId)) c.coreRateLimitedFailedTasks++; c.rateLimitedIds.push(row.taskId); if (coreIds[row.track].has(row.taskId)) c.coreRateLimitedTasks++; }
  if (row.provider === 'jina') {
    const events = eventsByRun.get(row.sourceRun).filter(e => e.taskId === row.taskId && e.mode === 'agent' && e.kind === 'provider');
    if (events.length === 2 && events.every(e => e.status === 409)) c.http409BothAttempts.push(row.taskId);
  }
}
const replayFieldCounts = Object.fromEntries(['firecrawl', 'contextdev', 'scrapfly'].map(p => { const rows = replayRows.filter(r => r.provider === p && coreIds.crawl.has(r.taskId)); return [p, { tasks: rows.length, exactUrlSet: rows.filter(r => r.fields.find(f => f.name === 'urls').pass).length, exactTitleRecords: rows.filter(r => r.fields.find(f => f.name === 'records').pass).length }]; }));
const jinaContentFailures = [];
for (const row of originalRows.filter(r => r.provider === 'jina' && r.mode === 'agent' && !r.success)) {
  const e = eventsByRun.get(row.sourceRun).filter(e => e.kind === 'provider' && e.mode === 'agent' && e.taskId === row.taskId);
  const outcomes = await Promise.all(e.map(e => read(`results/${e.privatePath}`)));
  const markdown = outcomes.filter(o => o.kind === 'ok').map(o => o.data.markdown).join('\n');
  if (markdown) { const task = tasks.scrape.get(row.taskId); const expected = task.expected.find(f => f.kind === 'text')?.accept[0]; jinaContentFailures.push({ taskId: row.taskId, h1Present: /^# [^#]/m.test(markdown), expectedHeadingPresent: expected ? normalizeText(markdown).includes(normalizeText(expected)) : null }); }
}
const oracleRows = coreRows.filter(r => r.track === 'scrape' && r.provider === 'oracle' && r.mode === 'agent');
const oracleFull = fullRows.filter(r => r.track === 'scrape' && r.provider === 'oracle' && r.mode === 'agent');
const report = { ...original, runId: 'wb-v2-corrected', generatedAt: new Date().toISOString(), core: coreSummary, full: fullSummary, leaders,
  correctedAnalysis: { headingKeys: changedKeys.length, coreHeadingKeys: 3, originalReport: '../wb-v2-final/summary.json', replay: proof,
    replayMethod: 'Stored original final-answer request, with only the tool evidence repackaged. Original planning turn, prompt, model, temperature 0, 4096 answer tokens, 48 KB evidence cap, one crawl tool call and original per-task cost/time limits retained. No provider dispatch. Model replay may vary even at temperature zero; no repeatability estimate.',
    rawScores: 'Raw scores remain original checks, not regraded/replayed. Original provider costs and replay model-only costs are not directly comparable.',
    correctPageControl: { core: { successes: oracleRows.filter(r => r.success).length, tasks: oracleRows.length }, full: { successes: oracleFull.filter(r => r.success).length, tasks: oracleFull.length } },
    sourceHashes, crawlAuditCounts, replayFieldCounts, jinaContentFailures, sensitivity: Object.values(sensitivity), replaySensitivity, errorFailures },
};
await save(`${root}/summary.json`, report);
await save(`${root}/json-commentary-details.json`, sensitivityDetails);
await save(`${root}/crawl-evidence-audit.json`, crawlEvidenceAudit);
console.log(JSON.stringify({ keys: changedKeys.length, control: report.correctedAnalysis.correctPageControl, crawlAuditCounts, sensitivity: Object.values(sensitivity).filter(s => s.jsonPlusCommentary), replaySensitivity, core: Object.fromEntries(Object.entries(leaders).map(([t, l]) => [t, l.groups.map(g => [g.provider, g.successes, g.tasks, g.ci95, g.pairedVsLeader])])) }, null, 2));
