import type { Metadata } from "next";
import { results, type Results } from "@/lib/results";

/** Where the site lives and what it links out to. One place, so canonicals, sitemap and JSON-LD agree. */

export const SITE_URL = "https://www.scrapingbench.com";
export const SITE_NAME = "scrapingbench";
export const REPO = "https://github.com/opencoredev/scraping-bench";
export const RESULTS_JSON = `${REPO}/blob/main/site/src/data/results.json`;
export const RESULTS_JSON_RAW = "https://raw.githubusercontent.com/opencoredev/scraping-bench/main/site/src/data/results.json";
export const AUTHOR = { name: "Leo", url: "https://x.com/leodev", handle: "@leodev" } as const;
export const MODEL = "Claude Haiku 5.5";

export const NOT_TESTED = "Exa, Tavily, Bright Data and Perplexity";
export const WITHHELD_NOTE = "Parallel was tested on search, but its customer terms require written consent to publish benchmark results, so its results are left out.";

/** Who wasn't tested, which differs between editions: v1 tested Parallel but withholds it, v2 didn't test it. */
export const notTestedText = (r: Results): string =>
  r.campaignVersion === 2
    ? `Not tested in v2: ${NOT_TESTED} and Parallel. Jina search left out: it has no hard cap on tokens per call.`
    : `Not tested: ${NOT_TESTED}. Parallel results withheld.`;

/** The Parallel sentence for prose, matching `notTestedText`. */
export const parallelNote = (r: Results): string => (r.campaignVersion === 2 ? "Parallel was not tested in v2." : WITHHELD_NOTE);

export const HOME_TITLE = "Scraping API benchmark for AI agents: scrape, search, map and crawl";

export type OgImage = "overview" | "scrape" | "search" | "map" | "crawl";

const trackAlt = (id: Exclude<OgImage, "overview">): string => {
  const track = results.tracks.find((t) => t.id === id);
  const label = id.charAt(0).toUpperCase() + id.slice(1);
  return `${label} results: tasks done${track ? ` out of ${track.tasks}` : ""} per provider, with cost per finished task`;
};

const OG_ALT: Record<OgImage, string> = {
  overview: "Every provider's tasks done and cost per finished task on scrape, search, map and crawl",
  scrape: trackAlt("scrape"),
  search: trackAlt("search"),
  map: trackAlt("map"),
  crawl: trackAlt("crawl"),
};

/** Canonical, Open Graph and X card for one page. `path` starts with a slash; the home page passes "/". */
export function pageMetadata({ title, description, path, image = "overview", absoluteTitle = false }: { title: string; description: string; path: string; image?: OgImage; absoluteTitle?: boolean }): Metadata {
  const images = [{ url: `/og/${image}.png`, width: 2400, height: 1350, alt: OG_ALT[image] }];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", url: path, title, description, images },
    twitter: { card: "summary_large_image", creator: AUTHOR.handle, title, description, images },
  };
}

export const absoluteUrl = (path: string): string => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);
