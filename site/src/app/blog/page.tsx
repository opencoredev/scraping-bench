import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, TextLink } from "@/components/site/chrome";
import { BLOG_FEED_PATH, BLOG_PATH, dateText, postAuthor, postPublisher, posts } from "@/lib/blog";
import { SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";

const base = pageMetadata({
  title: "Blog: guides to web data APIs for AI agents",
  description: "Guides to choosing web scraping and web data APIs for AI agents, built on scrapingbench's measured results, with vendor prices dated and untested APIs marked.",
  path: BLOG_PATH,
});

export const metadata: Metadata = {
  ...base,
  alternates: { ...base.alternates, types: { "application/rss+xml": [{ url: BLOG_FEED_PATH, title: `${SITE_NAME} blog` }] } },
};

export default function BlogPage() {
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Blog", path: BLOG_PATH }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `${SITE_NAME} blog`,
          url: `${SITE_URL}${BLOG_PATH}`,
          publisher: postPublisher,
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${SITE_URL}${p.path}`,
            datePublished: p.published,
            dateModified: p.modified,
            author: postAuthor,
          })),
        }}
      />
      <PageIntro title="Guides to web data APIs for AI agents">
        <p>
          Longer guides built on the benchmark. Every score in them comes from the results data; prices come from vendor pages on a stated date; anything else is marked as our judgment.
        </p>
        <p>
          <TextLink href={BLOG_FEED_PATH}>Follow the blog by RSS</TextLink>
        </p>
      </PageIntro>
      <ul className="border-t border-border">
        {posts.map((p) => (
          <li key={p.slug} className="border-b border-border/60 py-6">
            <p className="text-xs text-muted-foreground">
              <time dateTime={p.published}>{dateText(p.published)}</time>
            </p>
            <h2 className="mt-1 text-base font-medium text-pretty">
              <Link href={p.path} className="hover:underline">
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 max-w-prose text-sm text-pretty text-muted-foreground">{p.description}</p>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
