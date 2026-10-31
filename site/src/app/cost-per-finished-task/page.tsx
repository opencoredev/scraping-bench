import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { costText, doneText, intervalText, listText, providerById, providers } from "@/lib/catalog";
import type { Run } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { COST_DEFINITION, COST_PATH, costFaqs, limitText, trackCostText, trackCosts, unpricedTracks } from "@/lib/cost";
import type { TrackCost } from "@/lib/cost";
import { ALTERNATIVES_PATH } from "@/lib/alternatives";
import { COPY_CHANGED } from "@/lib/routes";
import { AUTHOR, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";

const TITLE = "Cost per finished task: what a scraping API really costs an AI agent";
const PUBLISHED = COPY_CHANGED[COST_PATH] ?? "2026-10-31";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: TITLE,
    description: `Cost per finished task is all API and model spend, failures included, divided by tasks done. Measured for ${providers.length} web data APIs: ${trackCosts
      .map((c) => `${c.track.label.toLowerCase()} from ${costText(c.cheapest.agent)}`)
      .join(", ")}.`,
    path: COST_PATH,
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

function CostTable({ c }: { c: TrackCost }) {
  return (
    <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[520px] table-fixed text-left text-sm tabular-nums">
        <caption className="sr-only">{`${c.track.label}: cost per finished task, lowest first, with tasks done`}</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="w-[28%] py-2 pr-4 font-normal">Provider</th>
            <th scope="col" className="w-[24%] py-2 pr-4 font-normal">Cost per finished task</th>
            <th scope="col" className="w-[24%] py-2 pr-4 font-normal">Tasks done</th>
            <th scope="col" className="py-2 font-normal">95% interval</th>
          </tr>
        </thead>
        <tbody>
          {c.priced.map((run) => (
            <tr key={run.entry.id} className="border-b border-border/60">
              <th scope="row" className="py-2.5 pr-4 font-medium">
                <ProviderCell run={run} />
              </th>
              <td className="py-2.5 pr-4">{costText(run.agent)}</td>
              <td className="py-2.5 pr-4">{doneText(run.agent)}</td>
              <td className="py-2.5 text-muted-foreground">{intervalText(run.agent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CostPerFinishedTaskPage() {
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Methodology", path: "/methodology" }, { name: "Cost per finished task", path: COST_PATH }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          url: `${SITE_URL}${COST_PATH}`,
          mainEntityOfPage: `${SITE_URL}${COST_PATH}`,
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
          url: `${SITE_URL}${COST_PATH}`,
          mainEntity: costFaqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <PageIntro title="What cost per finished task means for scraping APIs">
        <p className="text-foreground">{COST_DEFINITION}</p>
        <p className="font-mono text-xs text-foreground">cost per finished task = (API spend + model spend, on every task) ÷ tasks finished</p>
        <p>
          A price list tells you what one call costs. An agent pays for every call it makes, pays the model to read each response, and pays for the tasks it gets wrong too. This figure puts all of
          that over the answers that came out right, so it&apos;s the number to compare when you choose a web data API for an agent.
        </p>
      </PageIntro>

      {trackCosts.map((c) => (
        <Section key={c.track.id} id={c.track.id} title={c.track.label} note={`${c.track.tasks} tasks · ${c.track.what}`}>
          <CostTable c={c} />
          <div className="mt-5 max-w-prose space-y-3 text-sm text-pretty text-muted-foreground">
            <p>{trackCostText(c)}</p>
            <p>{limitText(c.track)}</p>
            {c.track.population?.notes ? <p>{c.track.population.notes}</p> : null}
            <p>
              <TextLink href={`/${c.track.id}`}>All {c.track.label.toLowerCase()} results and charts</TextLink>
            </p>
          </div>
        </Section>
      ))}
      {unpricedTracks.length > 0 ? (
        <p className="max-w-prose pb-6 text-sm text-pretty text-muted-foreground">No cost was measured on {listText(unpricedTracks.map((t) => t.label.toLowerCase()))}.</p>
      ) : null}

      <Section title="Short answers">
        <div className="border-t border-border/60">
          {costFaqs.map((f) => (
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
          How tasks are graded is on the <TextLink href="/methodology">methodology</TextLink> page, each provider&apos;s cost on every track is on the <TextLink href="/providers">providers</TextLink> page, and
          the cheapest Firecrawl alternatives per track are on the <TextLink href={ALTERNATIVES_PATH}>Firecrawl alternatives</TextLink> page.
        </p>
      </Section>
    </PageShell>
  );
}
