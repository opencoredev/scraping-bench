import { BLOG_PATH, BLOG_FEED_PATH, posts } from "@/lib/blog";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

const escapeXml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RFC 822 date for RSS, from a YYYY-MM-DD post date. */
const rssDate = (ymd: string): string => new Date(`${ymd}T00:00:00Z`).toUTCString();

/** RSS 2.0 feed of the blog, built from the same post list as /blog. */
function body(): string {
  const newest = posts.reduce<string | null>((latest, p) => (latest === null || p.modified > latest ? p.modified : latest), null);
  const items = posts.map((p) => {
    const url = absoluteUrl(p.path);
    return [
      "    <item>",
      `      <title>${escapeXml(p.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <description>${escapeXml(p.description)}</description>`,
      `      <pubDate>${rssDate(p.published)}</pubDate>`,
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${SITE_NAME} blog`)}</title>`,
    `    <link>${absoluteUrl(BLOG_PATH)}</link>`,
    `    <atom:link href="${absoluteUrl(BLOG_FEED_PATH)}" rel="self" type="application/rss+xml" />`,
    "    <description>Guides to choosing web scraping and web data APIs for AI agents, built on scrapingbench's measured results.</description>",
    "    <language>en-us</language>",
    ...(newest ? [`    <lastBuildDate>${rssDate(newest)}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export function GET(): Response {
  return new Response(body(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
