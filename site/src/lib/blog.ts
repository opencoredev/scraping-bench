import { AUTHOR, SITE_NAME, SITE_URL } from "@/lib/site";
import type { TrackId } from "@/lib/catalog";

/**
 * The blog: long-form guides that mix measured results (from results.json, through the catalog helpers), vendor
 * claims (dated, with a source link) and editorial judgment (labelled as such). Each post is its own route under /blog.
 */

export const BLOG_PATH = "/blog";

export type Post = {
  slug: string;
  path: string;
  /** The H1 and the Article headline. */
  title: string;
  /** The <title>, before the site's " · scrapingbench" suffix. */
  metaTitle: string;
  description: string;
  /** YYYY-MM-DD. */
  published: string;
  modified: string;
  /** Tracks the post is about, so track pages can link to it. */
  tracks: readonly TrackId[];
};

export const SCRAPING_APIS_POST: Post = {
  slug: "best-web-scraping-apis",
  path: `${BLOG_PATH}/best-web-scraping-apis`,
  title: "The 7 best web scraping APIs in 2026, tested on 40 agent tasks",
  metaTitle: "The 7 best web scraping APIs in 2026, tested",
  description:
    "Seven web scraping APIs picked from measured results on 40 agent tasks: tasks done, 95% intervals, cost per finished task, list prices checked November 18, 2026, and what the test doesn't cover.",
  published: "2026-11-18",
  modified: "2026-11-18",
  tracks: ["scrape"],
};

export const WEB_DATA_APIS_POST: Post = {
  slug: "top-web-data-apis",
  path: `${BLOG_PATH}/top-web-data-apis`,
  title: "Top 10 web data APIs in 2026, and the job each one fits",
  metaTitle: "Top 10 web data APIs in 2026, sorted by job",
  description:
    "Ten web data APIs for AI agents, grouped by job: scrape, search, map, crawl, browser sessions, protected sites and ready-made scrapers. Measured results where we have them, untested ones marked.",
  published: "2026-11-18",
  modified: "2026-11-18",
  tracks: ["scrape", "search", "map", "crawl"],
};

/** Newest first. */
export const posts: readonly Post[] = [WEB_DATA_APIS_POST, SCRAPING_APIS_POST];

export const postsFor = (track: TrackId): Post[] => posts.filter((p) => p.tracks.includes(track));

export const numberWord = (n: number): string => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? `${n}`;

export const dateText = (ymd: string): string =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Built from AUTHOR's base fields only, so the same file builds in the private repo, whose AUTHOR has no sameAs. */
export const postAuthor = { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url, alternateName: AUTHOR.handle } as const;

export const postPublisher = { "@type": "Organization", name: SITE_NAME, url: SITE_URL } as const;

export function blogPostingJsonLd(post: Post, image: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: `${SITE_URL}${post.path}`,
    mainEntityOfPage: `${SITE_URL}${post.path}`,
    datePublished: post.published,
    dateModified: post.modified,
    author: postAuthor,
    publisher: postPublisher,
    image: `${SITE_URL}${image}`,
    isPartOf: { "@type": "Blog", name: `${SITE_NAME} blog`, url: `${SITE_URL}${BLOG_PATH}` },
  };
}
