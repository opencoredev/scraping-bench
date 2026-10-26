import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const exec = promisify(execFile);
const digest = (body: string) => createHash('sha256').update(body).digest('hex');
test('campaign rejects changed implementation, stale verification and missing frozen ID coverage', async () => {
 const root = await mkdtemp('results/campaign-v2-guard-');
 const config = '{"runPrefix":"wb-v2-guard-"}';
 const body = '[{"id":"frozen-one"}]';
 const sourcePath = `${root}/implementation.mjs`;
 const source = 'export const version=1;';
 const manifest = JSON.stringify({ hashes: { 'config.json': digest(config), 'test-search.json': digest(body) }, implementation: { hashes: { [sourcePath]: digest(source) } }, tracks: { search: { eligible: true } } });
 const report = { manifestHash: digest(manifest), checkedIds: ['frozen-one'], failures: [] };
 const run = () => exec(process.execPath, ['--input-type=module', '-e', "const {verifyReport}=await import('./scripts/v2-common.mjs');await verifyReport('after');"], { env: { ...process.env, WEB_BENCH_CAMPAIGN_DIR: root }, timeout: 10000 });
 try {
  await writeFile(`${root}/config.json`,config);await writeFile(`${root}/test-search.json`,body);await writeFile(sourcePath,source);await writeFile(`${root}/sample-provenance.json`,manifest);
  await writeFile(`${root}/frozen-verification-after.json`,JSON.stringify(report));await run();
  await writeFile(sourcePath,'changed');await assert.rejects(run(),/Frozen implementation mismatch/);await writeFile(sourcePath,source);
  await writeFile(`${root}/frozen-verification-after.json`,JSON.stringify({...report,manifestHash:'stale'}));await assert.rejects(run(),/stale manifest/);
  await writeFile(`${root}/frozen-verification-after.json`,JSON.stringify({...report,checkedIds:[]}));await assert.rejects(run(),/every frozen ID/);
 } finally { await rm(root,{recursive:true,force:true}); }
});
