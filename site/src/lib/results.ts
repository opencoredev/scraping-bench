import { z } from "zod";
import raw from "@/data/results.json";

/**
 * The benchmark results, as written by `node --experimental-strip-types src/site-data.ts` in the repo root.
 * Parsed here once, at build time, so every component works with checked types.
 */

const score = z.object({
  rate: z.number(),
  ci: z.tuple([z.number().nullable(), z.number().nullable()]),
  successes: z.number(),
  tasks: z.number(),
  medianMs: z.number().nullable(),
  costPerSuccessUsd: z.number().nullable(),
});

const resultsSchema = z.object({
  runId: z.string(),
  generatedAt: z.string(),
  tracks: z.array(
    z.object({
      id: z.enum(["search", "scrape", "map", "crawl"]),
      label: z.string(),
      what: z.string(),
      tasks: z.number(),
      limits: z.object({ seconds: z.number(), usd: z.number(), calls: z.number() }),
      providers: z.array(
        z.object({ id: z.string(), label: z.string(), cohort: z.string(), agent: score.nullable(), raw: score.nullable(), tuned: score.nullable() }),
      ),
      controls: z.object({ none: score.nullable(), oracle: score.nullable() }),
      detected: z.array(
        z.object({ provider: z.string(), reference: z.string(), difference: z.number(), ci: z.tuple([z.number().nullable(), z.number().nullable()]), pairedTasks: z.number() }),
      ),
    }),
  ),
});

export type Results = z.infer<typeof resultsSchema>;
export type Track = Results["tracks"][number];
export type Score = z.infer<typeof score>;

/** Scrape leads: this is a scraping benchmark. The data file's own order is ignored. */
const TRACK_ORDER: readonly Track["id"][] = ["scrape", "search", "map", "crawl"];

const parsed = resultsSchema.parse(raw);
export const results: Results = { ...parsed, tracks: [...parsed.tracks].sort((a, b) => TRACK_ORDER.indexOf(a.id) - TRACK_ORDER.indexOf(b.id)) };

export const formatPct = (rate: number): string => `${Math.round(rate * 100)}%`;

export const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)} s`;

/** Costs here are fractions of a cent to a few cents, so cents read better than dollars. */
export const formatCents = (usd: number): string => {
  if (usd === 0) return "free";
  const cents = usd * 100;
  return `${cents >= 10 ? cents.toFixed(1) : cents.toFixed(2)}¢`;
};
