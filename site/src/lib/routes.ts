import { ALTERNATIVES_PATH } from "@/lib/alternatives";
import { comparisons, providers, tracks } from "@/lib/catalog";
import { COST_PATH } from "@/lib/cost";
import { NOISE_PATH } from "@/lib/site";

/** Every indexable path, for the sitemap, llms.txt and IndexNow. /export is left out on purpose. */
export const indexablePaths: readonly string[] = [
  "/",
  "/v1",
  ...tracks.map((t) => `/${t.id}`),
  "/providers",
  ...providers.map((p) => `/providers/${p.slug}`),
  "/compare",
  ...comparisons.map((c) => `/compare/${c.slug}`),
  ALTERNATIVES_PATH,
  "/methodology",
  COST_PATH,
  NOISE_PATH,
  "/faq",
];

/**
 * The day each run's numbers went live on the site (YYYY-MM-DD), keyed by runId. A run is generated days before
 * it is published, and the pages only show its numbers from the publish date, so that is when their content changed.
 * wb-v2 was generated 2026-10-19 and published 2026-10-26 (commit 93367d3). A run missing here falls back to its generatedAt.
 */
export const RUN_PUBLISHED: Partial<Record<string, string>> = {
  "wb-v2": "2026-10-26",
};

/**
 * Pages whose copy changed after the run they show, with the date of that change (YYYY-MM-DD).
 * The sitemap uses the later of this and the run date, so lastmod tracks real content changes.
 */
export const COPY_CHANGED: Partial<Record<string, string>> = {
  "/": "2026-10-29",
  "/map": "2026-10-29",
  "/v1": "2026-10-29",
  "/search": "2026-10-28",
  [ALTERNATIVES_PATH]: "2026-10-28",
  "/crawl": "2026-10-29",
  "/compare/firecrawl-vs-context-dev": "2026-10-29",
  "/compare/context-dev-vs-scrapfly": "2026-10-29",
  "/providers/browserbase": "2026-10-30",
  "/providers/linkup": "2026-10-30",
  "/compare/firecrawl-vs-browserbase": "2026-10-30",
  "/compare/tinyfish-vs-browserbase": "2026-10-30",
  "/faq": "2026-10-30",
  [COST_PATH]: "2026-10-31",
  "/providers/spider": "2026-10-31",
  [NOISE_PATH]: "2026-11-01",
};
