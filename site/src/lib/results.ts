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

export const resultsSchema = z.object({
  runId: z.string(),
  generatedAt: z.string(),
  campaignVersion: z.number().default(1),
  tracks: z.array(
    z.object({
      id: z.enum(["search", "scrape", "map", "crawl"]),
      label: z.string(),
      what: z.string(),
      tasks: z.number(),
      population: z.object({ fullTasks: z.number(), fullClusters: z.number(), coreClusters: z.number(), sources: z.string(), notes: z.string(), exclusions: z.array(z.string()), fullScores: z.array(z.object({ label: z.string(), score })), comparisons: z.array(z.object({ provider: z.string(), reference: z.string(), difference: z.number().nullable(), ci: z.tuple([z.number().nullable(), z.number().nullable()]), pairedTasks: z.number(), resolved: z.boolean() })) }).optional(),
      limits: z.object({ seconds: z.number(), usd: z.number(), calls: z.number() }),
      providers: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          cohort: z.string(),
          agent: score.nullable(),
          raw: score.nullable(),
          tuned: score.nullable(),
          /** Share of sampled sentences from each page's own text that reached the agent (scrape only). */
          coverage: z.object({ pages: z.number(), mean: z.number().nullable(), ci: z.tuple([z.number().nullable(), z.number().nullable()]) }).nullable().optional(),
          medianBytes: z.number().nullable().optional(),
          /** Crawl only: how the provider's native page titles compare with each page's HTML title. */
          titles: z.object({ expected: z.number(), returnedWithTitle: z.number(), returnedNoTitle: z.number(), exact: z.number(), loose: z.number() }).nullable().optional(),
        }),
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

/** Providers whose terms forbid publishing results. Dropped here, so no page can show them even if a run includes them. */
const WITHHELD: readonly string[] = ["parallel"];

/** Parses a results file, orders its tracks and drops withheld providers. Every edition goes through this. */
export const publishable = (input: unknown): Results => {
  const parsed = resultsSchema.parse(input);
  return {
    ...parsed,
    tracks: [...parsed.tracks]
      .sort((a, b) => TRACK_ORDER.indexOf(a.id) - TRACK_ORDER.indexOf(b.id))
      .map((t) => ({
        ...t,
        providers: t.providers.filter((p) => !WITHHELD.includes(p.id)),
        detected: t.detected.filter((d) => !WITHHELD.some((w) => [d.provider, d.reference].some((name) => name.toLowerCase() === w))),
      })),
  };
};

export const results: Results = publishable(raw);

export const formatPct = (rate: number): string => `${Math.round(rate * 100)}%`;

export const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)} s`;

/** Costs here are fractions of a cent to a few cents, so cents read better than dollars. */
export const formatCents = (usd: number): string => {
  if (usd === 0) return "free";
  const cents = usd * 100;
  return `${cents >= 10 ? cents.toFixed(1) : cents.toFixed(2)}¢`;
};

/** Which published run a results file is: v2 on the home page, v1 on /v1. Keyed on runId so a page can never label one run as the other. */
export type Edition = { kind: "v2" } | { kind: "v1" };

export const editionOf = (r: Results): Edition => {
  if (r.campaignVersion === 1) return { kind: "v1" };
  if (r.runId === "wb-v2") return { kind: "v2" };
  throw new Error(`Unknown v2 run ${r.runId}: add it to editionOf before publishing.`);
};
