import { ALTERNATIVES_PATH } from "@/lib/alternatives";
import { comparisons, providers, tracks } from "@/lib/catalog";

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
  "/faq",
];

/**
 * Pages whose copy changed after the run they show, with the date of that change (YYYY-MM-DD).
 * The sitemap uses the later of this and the run date, so lastmod tracks real content changes.
 */
export const COPY_CHANGED: Partial<Record<string, string>> = {
  "/search": "2026-10-28",
  [ALTERNATIVES_PATH]: "2026-10-28",
  "/crawl": "2026-10-29",
  "/compare/firecrawl-vs-context-dev": "2026-10-29",
  "/compare/context-dev-vs-scrapfly": "2026-10-29",
};
