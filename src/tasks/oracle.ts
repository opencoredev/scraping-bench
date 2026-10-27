import type { ExpectedField } from '../core/types.ts';
import { outcomeSchema } from '../core/schema.ts';
import { containsValue } from '../raw/index.ts';

export function scrapeOracleContains(fields: readonly ExpectedField[], packed: string): boolean {
  const outcome = outcomeSchema.parse(JSON.parse(packed));
  if (outcome.kind !== 'ok' || outcome.data.track !== 'scrape') return false;
  const markdown = outcome.data.markdown;
  return fields.every(field => containsValue(field, markdown) === true);
}
