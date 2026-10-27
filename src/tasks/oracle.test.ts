import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrapeOracleContains } from './oracle.ts';
import { oracleAdapter } from '../testing/fake.ts';
import { truncateOutput } from '../agent/index.ts';

test('serialized browser oracle retains a dev JS answer between newlines', async () => {
  const outcome = await oracleAdapter('Service reference\n\nCalibration-3859716102\n\nFooter').scrape?.(
    { url: 'https://example.com/dev-js' },
    { lane: 'default', timeoutMs: 1000, signal: AbortSignal.timeout(1000) },
  );
  assert.ok(outcome);
  const packed = truncateOutput(outcome, 12000);
  assert.equal(packed.truncated, false);
  assert.equal(scrapeOracleContains([{ kind: 'text', name: 'reference', accept: ['Calibration-3859716102'] }], packed.text), true);
  assert.equal(scrapeOracleContains([{ kind: 'text', name: 'reference', accept: ['Calibration-absent'] }], packed.text), false);
});
