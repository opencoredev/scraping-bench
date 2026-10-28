import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { ScoreTable } from "@/components/site/score-table";
import {
  cohortLabel,
  comparisonsWith,
  costText,
  doneText,
  intervalText,
  listText,
  ordinal,
  placeOn,
  providerBySlug,
  providers,
  rankedRuns,
  standingText,
  timeText,
  tracks,
} from "@/lib/catalog";
import type { Provider, Run } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { linkOf } from "@/lib/links";
import { PROVIDER_NOTES, TESTED_AS, searchedName } from "@/lib/notes";
import { PROVIDER_TITLES, REFERENCE_ID, providerAnswer } from "@/lib/answers";
import { ALTERNATIVES_PATH } from "@/lib/alternatives";
import { formatPct } from "@/lib/results";
import { MODEL, pageMetadata } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return providers.map((p) => ({ slug: p.slug }));
}

const providerOf = async (params: Promise<{ slug: string }>): Promise<Provider> => {
  const provider = providerBySlug((await params).slug);
  if (!provider) notFound();
  return provider;
};

const trackNames = (p: Provider) => listText(p.runs.map((r) => r.track.label.toLowerCase()));

export async function generateMetadata({ params }: PageProps<"/providers/[slug]">): Promise<Metadata> {
  const p = await providerOf(params);
  const answer = providerAnswer(p);
  return pageMetadata({
    title: PROVIDER_TITLES[p.id] ?? `${searchedName(p)} benchmark results for AI agents`,
    description: answer
      ? `${answer.summary[0]} Intervals, cost and caveats.`
      : `How ${searchedName(p)} did as an AI agent's ${trackNames(p)} tool: ${p.runs
      .map((r) => `${formatPct(r.agent.rate)} of ${r.track.tasks} ${r.track.label.toLowerCase()} tasks at ${costText(r.agent)} each`)
      .join(", ")}. With 95% intervals and caveats.`,
    path: `/providers/${p.slug}`,
  });
}

function Figure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-medium tabular-nums">{value}</dd>
      {sub ? <dd className="text-xs text-muted-foreground tabular-nums">{sub}</dd> : null}
    </div>
  );
}

function TrackResult({ run }: { run: Run }) {
  const { track, entry, agent } = run;
  const { place, tiedWith, of } = placeOn(track, entry.id);
  return (
    <Section id={track.id} title={track.label} note={`${track.tasks} tasks · ${track.what}`}>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4">
        <Figure label="Tasks done" value={formatPct(agent.rate)} sub={`${agent.successes} of ${agent.tasks}`} />
        <Figure label="95% interval" value={intervalText(agent)} />
        <Figure label="Cost per finished task" value={costText(agent)} />
        <Figure label="Median time" value={timeText(agent)} />
      </dl>
      <div className="mt-6 max-w-prose space-y-3 text-sm text-pretty text-muted-foreground">
        <p>
          {ordinal(place)} of {of} on tasks done{tiedWith > 0 ? `, tied with ${tiedWith} ${tiedWith === 1 ? "other" : "others"}` : ""}. {standingText(run)}
        </p>
        {entry.raw ? (
          <p>
            Answer in the provider&apos;s response, no model: what the API returned held every answer on {entry.raw.successes} of {entry.raw.tasks} applicable tasks ({formatPct(entry.raw.rate)})
            {entry.raw.costPerSuccessUsd === null ? "" : entry.raw.costPerSuccessUsd === 0 ? ", with no API charge recorded" : `, at ${costText(entry.raw)} of API spend per finished task`}.
          </p>
        ) : null}
        {entry.tuned ? (
          <p>
            Tuned settings, frozen before the run: {doneText(entry.tuned)}, against {formatPct(agent.rate)} with defaults.
          </p>
        ) : null}
      </div>
      <div className="mt-6">
        <ScoreTable runs={rankedRuns(track)} caption={`${track.label} results, ${entry.label} highlighted`} highlight={[entry.id]} />
      </div>
      <p className="mt-4 text-sm">
        <TextLink href={`/${track.id}`}>All {track.label.toLowerCase()} results and charts</TextLink>
      </p>
    </Section>
  );
}

export default async function ProviderPage({ params }: PageProps<"/providers/[slug]">) {
  const p = await providerOf(params);
  const notes = PROVIDER_NOTES[p.id] ?? [];
  const pairs = comparisonsWith(p);
  const untested = tracks.filter((t) => !p.runs.some((r) => r.track.id === t.id));
  const answer = providerAnswer(p);

  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Providers", path: "/providers" }, { name: searchedName(p), path: `/providers/${p.slug}` }]} />
      <PageIntro title={`${searchedName(p)} for AI agents: benchmark results`}>
        {answer ? <p className="text-foreground">{answer.summary.join(" ")}</p> : null}
        {answer && answer.versus.length > 0 ? (
          <p>
            {answer.versus.join(" ")}
            {answer.comparison ? (
              <>
                {" "}
                <TextLink href={`/compare/${answer.comparison.slug}`}>
                  {answer.comparison.a.label} vs {answer.comparison.b.label}, track by track
                </TextLink>
                .
              </>
            ) : null}
          </p>
        ) : null}
        <p>
          <span className="font-medium" style={{ color: colorOf(p.id) }}>
            {p.label}
          </span>{" "}
          ({cohortLabel(p.cohort)}) was tested on {trackNames(p)}
          {untested.length > 0 ? `, not on ${listText(untested.map((t) => t.label.toLowerCase()))}` : ""}. It got the same tasks, the same model ({MODEL}), the same prompt and the same limits as
          every other provider, and a script checked every answer. {TESTED_AS[p.id] ?? ""}
        </p>
        {linkOf(p.id) ? (
          <p>
            <a href={linkOf(p.id)} target="_blank" rel="noopener" className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
              {p.label} website
            </a>
          </p>
        ) : null}
      </PageIntro>

      {p.runs.map((run) => (
        <TrackResult key={run.track.id} run={run} />
      ))}

      {notes.length > 0 ? (
        <Section title="Read these numbers with">
          <ul className="max-w-prose list-disc space-y-2 pl-5 text-sm text-pretty text-muted-foreground marker:text-muted-foreground/50">
            {notes.map((n) => (
              <li key={n.text}>{n.text}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {pairs.length > 0 ? (
        <Section title={`${p.label} compared`}>
          {p.id === REFERENCE_ID ? (
            <p className="mb-5 max-w-prose text-sm text-pretty text-muted-foreground">
              Every tested provider against {p.label} on one page: <TextLink href={ALTERNATIVES_PATH}>{p.label} alternatives</TextLink>.
            </p>
          ) : null}
          <ul className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {pairs.map((c) => {
              const other = c.a.id === p.id ? c.b : c.a;
              return (
                <li key={c.slug}>
                  <Link href={`/compare/${c.slug}`} className="hover:underline">
                    {c.a.label} vs {c.b.label}
                  </Link>{" "}
                  <span className="text-xs text-muted-foreground">
                    {listText(c.shared.map((t) => t.label.toLowerCase()))}
                    <span className="sr-only">, compared with {other.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section title="Other providers">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {providers
            .filter((o) => o.id !== p.id)
            .map((o) => (
              <li key={o.id}>
                <Link href={`/providers/${o.slug}`} className="hover:underline" style={{ color: colorOf(o.id) }}>
                  {o.label}
                </Link>
              </li>
            ))}
        </ul>
      </Section>
    </PageShell>
  );
}
