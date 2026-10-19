import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, PageIntro, PageShell } from "@/components/site/chrome";
import { faqs } from "@/lib/faq";
import { SITE_URL, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Web scraping and search APIs for AI agents: FAQ",
  description: "Which web scraping, search, map and crawl APIs work best for AI agents, answered from the benchmark data, with the caveats that come with it.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "FAQ", path: "/faq" }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: `${SITE_URL}/faq`,
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <PageIntro title="Questions, answered from the data">
        <p>Short answers from the latest run. Where the data can&apos;t separate providers, the answer says so.</p>
      </PageIntro>
      <div className="border-t border-border">
        {faqs.map((f) => (
          <section key={f.question} className="border-b border-border/60 py-7">
            <h2 className="max-w-prose text-base font-medium text-pretty">{f.question}</h2>
            <p className="mt-2 max-w-prose text-sm text-pretty text-muted-foreground">{f.answer}</p>
            {f.links.length > 0 ? (
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {f.links.map((l) =>
                  l.href.startsWith("/") ? (
                    <Link key={l.href} href={l.href} className="underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
                      {l.label}
                    </Link>
                  ) : (
                    <a key={l.href} href={l.href} className="underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
                      {l.label}
                    </a>
                  ),
                )}
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </PageShell>
  );
}
