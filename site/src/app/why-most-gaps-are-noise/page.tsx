import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { providers } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { COST_PATH } from "@/lib/cost";
import { METHOD_TEXT, NOISE_PATH, VERDICT_LABEL, clearedCount, gapCount, intervalPointsText, noiseFaqs, pointsText, shortAnswer, trackGaps, trackNote, trackVerdictText } from "@/lib/noise";
import type { Gap, TrackGaps } from "@/lib/noise";
import { COPY_CHANGED } from "@/lib/routes";
import { AUTHOR, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";

const TITLE = "Why most gaps between scraping APIs are noise: benchmark confidence intervals explained";
const PUBLISHED = COPY_CHANGED[NOISE_PATH] ?? "2026-11-01";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: TITLE,
    description: `${clearedCount} of ${gapCount} gaps between web data APIs and each track's leader rule out chance. Every comparison with its paired 95% interval, and how to read a scraping API benchmark without over-reading it.`,
    path: NOISE_PATH,
  });
}

function ProviderName({ label }: { label: string }) {
  const p = providers.find((x) => x.label === label);
  if (!p) return <>{label}</>;
  return (
    <Link href={`/providers/${p.slug}`} className="hover:underline" style={{ color: colorOf(p.id) }}>
      {label}
    </Link>
  );
}

const VERDICT_TONE: Record<Gap["verdict"], string> = { cleared: "text-foreground", "too-small": "text-muted-foreground", tied: "text-muted-foreground" };

function GapTable({ t }: { t: TrackGaps }) {
  return (
    <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[560px] table-fixed text-left text-sm tabular-nums">
        <caption className="sr-only">{`${t.track.label}: each provider's gap to ${t.reference} on the same tasks, with its paired 95% interval in points`}</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="w-[26%] py-2 pr-4 font-normal">Provider</th>
            <th scope="col" className="w-[22%] py-2 pr-4 font-normal">Behind {t.reference}</th>
            <th scope="col" className="w-[26%] py-2 pr-4 font-normal">95% interval (points)</th>
            <th scope="col" className="py-2 font-normal">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {t.gaps.map((g) => (
            <tr key={g.provider} className="border-b border-border/60">
              <th scope="row" className="py-2.5 pr-4 font-medium">
                <ProviderName label={g.provider} />
              </th>
              <td className="py-2.5 pr-4">{g.difference === 0 ? "0 points" : pointsText(g.difference)}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{intervalPointsText(g)}</td>
              <td className={`py-2.5 ${VERDICT_TONE[g.verdict]}`}>{VERDICT_LABEL[g.verdict]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WhyMostGapsAreNoisePage() {
  const [first, ...rest] = shortAnswer();
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Methodology", path: "/methodology" }, { name: "Why most gaps are noise", path: NOISE_PATH }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          url: `${SITE_URL}${NOISE_PATH}`,
          mainEntityOfPage: `${SITE_URL}${NOISE_PATH}`,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
          publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          image: `${SITE_URL}/og/overview.png`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: `${SITE_URL}${NOISE_PATH}`,
          mainEntity: noiseFaqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <PageIntro title="Why most gaps between web scraping APIs are noise">
        {first ? <p className="text-foreground">{first}</p> : null}
        {rest.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </PageIntro>

      <Section title="How a gap is tested">
        <div className="max-w-prose space-y-3 text-sm text-pretty text-muted-foreground">
          {METHOD_TEXT.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
      </Section>

      {trackGaps.map((t) => (
        <Section key={t.track.id} id={t.track.id} title={t.track.label} note={trackNote(t)}>
          <GapTable t={t} />
          <div className="mt-5 max-w-prose space-y-3 text-sm text-pretty text-muted-foreground">
            <p>{trackVerdictText(t)}</p>
            <p>
              <TextLink href={`/${t.track.id}`}>All {t.track.label.toLowerCase()} results and charts</TextLink>
            </p>
          </div>
        </Section>
      ))}

      <Section title="Short answers">
        <div className="border-t border-border/60">
          {noiseFaqs.map((f) => (
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
        <p className="mt-6 max-w-prose text-sm text-pretty text-muted-foreground">
          How tasks are graded is on the <TextLink href="/methodology">methodology</TextLink> page, what the cost figure counts is on <TextLink href={COST_PATH}>cost per finished task</TextLink>, and every
          pair people search for is on the <TextLink href="/compare">compare</TextLink> page.
        </p>
      </Section>
    </PageShell>
  );
}
