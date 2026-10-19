import type { Metadata } from "next";

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

export const HOME_TITLE = "Web data API benchmark for agents: scrape, search, map and crawl";

export type OgImage = "overview" | "scrape" | "search" | "map" | "crawl";

const OG_ALT: Record<OgImage, string> = {
  overview: "Every provider's tasks done and cost per finished task on scrape, search, map and crawl",
  scrape: "Scrape results: tasks done out of 60 per provider, with cost per finished task",
  search: "Search results: tasks done out of 60 per provider, with cost per finished task",
  map: "Map results: tasks done out of 15 per provider, with cost per finished task",
  crawl: "Crawl results: tasks done out of 10 per provider, with cost per finished task",
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
