import { ALTERNATIVES_PATH, CONTEXT_DEV_ALTERNATIVES_PATH, JINA_ALTERNATIVES_PATH } from "@/lib/alternatives";
import { comparisons, providers, tracks } from "@/lib/catalog";
import { BLOG_PATH, posts } from "@/lib/blog";
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
  JINA_ALTERNATIVES_PATH,
  CONTEXT_DEV_ALTERNATIVES_PATH,
  "/methodology",
  COST_PATH,
  NOISE_PATH,
  "/faq",
  BLOG_PATH,
  ...posts.map((p) => p.path),
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
  "/": "2026-11-17",
  "/map": "2026-11-20",
  "/v1": "2026-10-29",
  "/search": "2026-11-20",
  "/scrape": "2026-11-20",
  [ALTERNATIVES_PATH]: "2026-11-21",
  "/crawl": "2026-11-20",
  "/providers/browserbase": "2026-11-16",
  "/providers/linkup": "2026-11-16",
  "/compare/tinyfish-vs-browserbase": "2026-11-14",
  "/faq": "2026-11-17",
  [COST_PATH]: "2026-11-17",
  "/providers/spider": "2026-10-31",
  [NOISE_PATH]: "2026-11-01",
  "/providers/jina": "2026-11-19",
  "/providers/firecrawl": "2026-11-03",
  "/providers/string": "2026-11-05",
  "/providers/scrapfly": "2026-11-22",
  [JINA_ALTERNATIVES_PATH]: "2026-11-20",
  "/compare": "2026-11-11",
  "/providers/you-com": "2026-11-09",
  [CONTEXT_DEV_ALTERNATIVES_PATH]: "2026-11-17",
  "/providers/context-dev": "2026-11-17",
  "/compare/string-vs-spider": "2026-11-13",
  "/compare/linkup-vs-tinyfish": "2026-11-14",
  "/providers/tinyfish": "2026-11-17",
  "/compare/context-dev-vs-jina": "2026-11-15",
  "/compare/context-dev-vs-linkup": "2026-11-15",
  "/compare/context-dev-vs-scrapfly": "2026-11-15",
  "/compare/context-dev-vs-tinyfish": "2026-11-15",
  "/compare/firecrawl-vs-browserbase": "2026-11-15",
  "/compare/firecrawl-vs-context-dev": "2026-11-15",
  "/compare/firecrawl-vs-jina": "2026-11-15",
  "/compare/firecrawl-vs-linkup": "2026-11-15",
  "/compare/firecrawl-vs-scrapfly": "2026-11-22",
  "/compare/firecrawl-vs-spider": "2026-11-15",
  "/compare/firecrawl-vs-tinyfish": "2026-11-15",
  "/compare/jina-vs-scrapfly": "2026-11-15",
  "/compare/string-vs-context-dev": "2026-11-15",
  "/compare/string-vs-firecrawl": "2026-11-15",
  "/providers": "2026-11-18",
  [BLOG_PATH]: "2026-11-19",
  ...Object.fromEntries(posts.map((p) => [p.path, p.modified])),
};
