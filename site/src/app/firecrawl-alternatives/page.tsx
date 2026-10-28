import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { ALTERNATIVES_PATH, alternativesFaqs, cheaperText, firecrawlAlternatives, gapText, notTestedAlternatives } from "@/lib/alternatives";
import type { TrackAlternatives } from "@/lib/alternatives";
import { costText, doneText, intervalText, listText, providerById } from "@/lib/catalog";
import type { Run } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { formatPct } from "@/lib/results";
import { MODEL, SITE_URL, pageMetadata } from "@/lib/site";

const data = firecrawlAlternatives();

export function generateMetadata(): Metadata {
  if (!data) return {};
  const name = data.reference.label;
  return pageMetadata({
    title: `${name} alternatives: ${data.tested.length} APIs benchmarked for AI agents`,
    description: `${data.tested.length} ${name} alternatives on the same scrape, search, map and crawl tasks, same model and limits: ${data.byTrack
      .map((t) => `${t.track.label.toLowerCase()} ${name} ${formatPct(t.reference.agent.rate)}, best ${formatPct(Math.max(t.reference.agent.rate, ...t.rows.map((r) => r.run.agent.rate)))}`)
      .join("; ")}. Intervals, cost per finished task, and which gaps are real.`,
    path: ALTERNATIVES_PATH,
  });
}

function ProviderCell({ run }: { run: Run }) {
  const p = providerById(run.entry.id);
  if (!p) return <>{run.entry.label}</>;
  return (
    <Link href={`/providers/${p.slug}`} className="hover:underline" style={{ color: colorOf(p.id) }}>
      {run.entry.label}
    </Link>
  );
}

function TrackTable({ t }: { t: TrackAlternatives }) {
  const name = t.reference.entry.label;
  return (
    <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[640px] table-fixed text-left text-sm tabular-nums">
        <caption className="sr-only">{`${t.track.label}: ${name} and every alternative on the same tasks`}</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="w-[17%] py-2 pr-4 font-normal">Provider</th>
            <th scope="col" className="w-[15%] py-2 pr-4 font-normal">Tasks done</th>
            <th scope="col" className="w-[15%] py-2 pr-4 font-normal">95% interval</th>
            <th scope="col" className="w-[17%] py-2 pr-4 font-normal">Cost per finished task</th>
            <th scope="col" className="py-2 font-normal">Against {name}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/60 bg-muted/40">
            <th scope="row" className="py-2.5 pr-4 font-medium">
              <ProviderCell run={t.reference} />
            </th>
            <td className="py-2.5 pr-4">{doneText(t.reference.agent)}</td>
            <td className="py-2.5 pr-4">{intervalText(t.reference.agent)}</td>
            <td className="py-2.5 pr-4">{costText(t.reference.agent)}</td>
            <td className="py-2.5 text-muted-foreground">Reference</td>
          </tr>
          {t.rows.map((row) => (
            <tr key={row.run.entry.id} className="border-b border-border/60">
              <th scope="row" className="py-2.5 pr-4 font-medium">
                <ProviderCell run={row.run} />
              </th>
              <td className="py-2.5 pr-4">{doneText(row.run.agent)}</td>
              <td className="py-2.5 pr-4">{intervalText(row.run.agent)}</td>
              <td className="py-2.5 pr-4">{costText(row.run.agent)}</td>
              <td className="py-2.5">
                {gapText(row, t.reference)}
                {row.comparison ? (
                  <>
                    {" · "}
                    <Link href={`/compare/${row.comparison.slug}#${t.track.id}`} className="text-muted-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
                      compare
                    </Link>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FirecrawlAlternativesPage() {
  if (!data) notFound();
  const name = data.reference.label;
  const faqs = alternativesFaqs(data);

  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Compare", path: "/compare" }, { name: `${name} alternatives`, path: ALTERNATIVES_PATH }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: `${SITE_URL}${ALTERNATIVES_PATH}`,
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <PageIntro title={`${name} alternatives for AI agents, tested on the same tasks`}>
        <p className="text-foreground">
          {data.byTrack.map((t) => `${t.track.label}: ${t.standing}`).join(" ")}
        </p>
        <p>
          {listText(data.tested.map((p) => p.label))} ran at least one track alongside {name}, with the same tasks, the same model ({MODEL}), the same prompt and the same limits. A task counts
          only when a script confirms every field of the answer. The benchmark tests each provider&apos;s gap to its track&apos;s leader, so this page says when a gap to {name} is real, when it&apos;s too
          small, and when the two weren&apos;t tested head to head.
        </p>
        <p>{notTestedAlternatives}</p>
      </PageIntro>

      {data.byTrack.map((t) => (
        <Section key={t.track.id} id={t.track.id} title={`${t.track.label}`} note={`${t.track.tasks} tasks · ${t.track.what}`}>
          <TrackTable t={t} />
          <div className="mt-5 max-w-prose space-y-3 text-sm text-pretty text-muted-foreground">
            <p>{t.standing}</p>
            {t.track.population?.notes ? <p>{t.track.population.notes}</p> : null}
            {cheaperText(t) ? <p>{cheaperText(t)}</p> : null}
            <p>
              <TextLink href={`/${t.track.id}`}>All {t.track.label.toLowerCase()} results and charts</TextLink>
            </p>
          </div>
        </Section>
      ))}

      <Section title="Short answers">
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
        <p className="mt-6 max-w-prose text-sm text-pretty text-muted-foreground">
          Every {name} head-to-head is on the <TextLink href="/compare">compare</TextLink> page, {name}&apos;s own results are on its <TextLink href={`/providers/${data.reference.slug}`}>provider page</TextLink>,
          and how a gap is tested is on the <TextLink href="/methodology">methodology</TextLink> page.
        </p>
      </Section>
    </PageShell>
  );
}
