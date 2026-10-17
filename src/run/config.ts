import type { Track } from "../core/types.ts";
export const TRACK_LIMITS = {
  search: { ms: 60_000, usd: 0.1, calls: 3 },
  scrape: { ms: 60_000, usd: 0.1, calls: 2 },
  map: { ms: 120_000, usd: 0.25, calls: 2 },
  crawl: { ms: 600_000, usd: 2, calls: 1 },
} satisfies Record<Track, { ms: number; usd: number; calls: number }>;
// A UTF-8 byte is a conservative token upper bound for byte-fallback tokenizers.
export const TOOL_OUTPUT_TOKEN_CAP = 12_000;
export const CRAWL_TOOL_OUTPUT_TOKEN_CAP = 48_000;
export const PROVIDER_DEFAULTS = {
  concurrency: 2,
  perSecond: 1,
  burst: 1,
  maxUsd: 10,
};
