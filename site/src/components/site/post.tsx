import Link from "next/link";
import { JsonLd, TextLink } from "@/components/site/chrome";
import { BLOG_PATH, dateText, posts } from "@/lib/blog";
import type { Post } from "@/lib/blog";
import { PRICES_CHECKED } from "@/lib/guides";
import type { Source } from "@/lib/guides";
import type { Faq } from "@/lib/faq";
import { RUN_PUBLISHED } from "@/lib/routes";
import { results } from "@/lib/results";
import { AUTHOR, SITE_URL } from "@/lib/site";

/** Pieces shared by blog posts: byline, the measured/vendor/editorial key, FAQ, sources and related posts. */

export function Byline({ post }: { post: Post }) {
  const run = RUN_PUBLISHED[results.runId];
  return (
    <p className="pb-1 text-xs text-muted-foreground">
      By{" "}
      <a href={AUTHOR.url} className="hover:text-foreground">
        {AUTHOR.name}
      </a>{" "}
      · Published <time dateTime={post.published}>{dateText(post.published)}</time>
      {post.modified !== post.published ? (
        <>
          {" "}
          · Updated <time dateTime={post.modified}>{dateText(post.modified)}</time>
        </>
      ) : null}{" "}
      · {`Benchmark run ${results.runId}${run ? `, published ${dateText(run)}` : ""}`} · Prices checked {dateText(PRICES_CHECKED)}
    </p>
  );
}

const KINDS = {
  measured: { label: "Measured", text: "from the benchmark's results.json, built into the page" },
  vendor: { label: "Vendor", text: `what the vendor's own pricing or docs page said on ${dateText(PRICES_CHECKED)}` },
  editorial: { label: "Our call", text: "our judgment, not a measurement" },
} as const;
export type Kind = keyof typeof KINDS;
const KIND_ORDER: readonly Kind[] = ["measured", "vendor", "editorial"];

/** A small label in front of a paragraph, so a reader can tell a measurement from a price list or an opinion. */
export function KindLabel({ kind }: { kind: Kind }) {
  return <span className="mr-1.5 inline-block rounded-sm border border-border px-1 py-px align-[1px] text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{KINDS[kind].label}</span>;
}

export function KindKey() {
  return (
    <ul className="space-y-1.5 text-xs text-muted-foreground">
      {KIND_ORDER.map((k) => (
        <li key={k}>
          <KindLabel kind={k} />
          {KINDS[k].text}
        </li>
      ))}
    </ul>
  );
}

export function FaqList({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <div className="border-t border-border/60">
      {faqs.map((f) => (
        <section key={f.question} className="border-b border-border/60 py-6">
          <h3 className="max-w-prose text-sm font-medium text-pretty">{f.question}</h3>
          <p className="mt-2 max-w-prose text-sm text-pretty text-muted-foreground">{f.answer}</p>
          {f.links.length > 0 ? (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {f.links.map((l) => (
                <TextLink key={l.href} href={l.href}>
                  {l.label}
                </TextLink>
              ))}
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export function FaqJsonLd({ post, faqs }: { post: Post; faqs: readonly Faq[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        url: `${SITE_URL}${post.path}`,
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
      }}
    />
  );
}

/** External sources as a numbered list. They open the vendor's page, so they use plain anchors. */
export function SourceList({ sources }: { sources: readonly Source[] }) {
  return (
    <ol className="max-w-prose list-decimal space-y-1.5 pl-5 text-sm text-pretty text-muted-foreground marker:text-muted-foreground/70">
      {sources.map((s) => (
        <li key={s.url}>
          <a href={s.url} className="break-words text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
            {s.label}
          </a>{" "}
          <span className="break-all">({s.url.replace(/^https:\/\//, "")})</span>
        </li>
      ))}
    </ol>
  );
}

export function OtherPosts({ current }: { current: Post }) {
  const others = posts.filter((p) => p.slug !== current.slug);
  return (
    <ul className="space-y-3 text-sm">
      {others.map((p) => (
        <li key={p.slug}>
          <Link href={p.path} className="font-medium hover:underline">
            {p.title}
          </Link>
          <span className="block max-w-prose text-pretty text-muted-foreground">{p.description}</span>
        </li>
      ))}
      <li>
        <TextLink href={BLOG_PATH}>All posts</TextLink>
      </li>
    </ul>
  );
}

/** Body copy: the same measure and rhythm as the explainer pages. */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-prose space-y-3 text-sm text-pretty text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">{children}</div>;
}
