import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { cohortLabel, costText, leaders, providers, runOn, tracks } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { fillStyle } from "@/lib/dither";
import { formatPct, results } from "@/lib/results";
import { NOT_TESTED, pageMetadata, parallelNote } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Web data API providers for AI agents, compared",
  description: `${providers.length} web data APIs tested on scrape, search, map and crawl: ${providers.map((p) => p.label).join(", ")}. Tasks done and cost per finished task for each.`,
  path: "/providers",
});

export default function ProvidersPage() {
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Providers", path: "/providers" }]} />
      <PageIntro title={`${providers.length} web data APIs, every track they ran`}>
        <p>
          Each cell is tasks done with the provider as the agent&apos;s only tool, and the cost of each finished task. Bold marks the most tasks done on a track; each track&apos;s page says which gaps are big
          enough to rule out chance. A dash means the provider didn&apos;t run that track.
        </p>
      </PageIntro>

      <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <table className="w-full min-w-[720px] text-left text-sm tabular-nums">
          <caption className="sr-only">Tasks done and cost per finished task, by provider and track</caption>
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 font-normal">
                Provider
              </th>
              {tracks.map((t) => (
                <th key={t.id} scope="col" className="py-2 pr-4 font-normal">
                  <Link href={`/${t.id}`} className="text-foreground hover:underline">
                    {t.label}
                  </Link>{" "}
                  · {t.tasks} tasks
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-b border-border/60">
                <th scope="row" className="py-3 pr-4 font-medium">
                  <Link href={`/providers/${p.slug}`} className="hover:underline" style={{ color: colorOf(p.id) }}>
                    {p.label}
                  </Link>
                  <span className="block text-xs font-normal text-muted-foreground">{cohortLabel(p.cohort)}</span>
                </th>
                {tracks.map((t) => {
                  const run = runOn(p, t.id);
                  if (!run) {
                    return (
                      <td key={t.id} className="py-3 pr-4 text-muted-foreground/50">
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">not run</span>
                      </td>
                    );
                  }
                  const lead = leaders(t).some((l) => l.entry.id === p.id);
                  return (
                    <td key={t.id} className="py-3 pr-4">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="relative h-3 w-16 shrink-0 bg-foreground/[0.06]">
                          <span className="absolute inset-y-0 left-0" style={{ width: `${Math.max(run.agent.rate * 100, 1)}%`, ...fillStyle("gradient", { color: colorOf(p.id), edge: "right", length: 10, to: 0.25 }) }} />
                        </span>
                        <span className={lead ? "font-semibold" : ""}>{formatPct(run.agent.rate)}</span>
                        <span className="text-xs text-muted-foreground">{costText(run.agent)}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Section title="Not in this table">
        <p className="max-w-prose text-sm text-pretty text-muted-foreground">
          {NOT_TESTED} were not tested, so there are no numbers for them here. {parallelNote(results)} Want a head-to-head? See the <TextLink href="/compare">comparisons</TextLink>.
        </p>
      </Section>
    </PageShell>
  );
}
