import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bars } from "@/components/bench/charts";
import { Breadcrumbs, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { ScoreTable } from "@/components/site/score-table";
import { comparisonBySlug, comparisons, comparisonsWith, costText, listText, pairVerdict, runOn, tracks } from "@/lib/catalog";
import type { Comparison, Provider, Run } from "@/lib/catalog";
import { pairAnswer, pairTracks } from "@/lib/answers";
import { colorOf } from "@/lib/colors";
import { PROVIDER_NOTES, TESTED_AS, searchedName } from "@/lib/notes";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";
import { trackRows } from "@/lib/rows";
import { MODEL, pageMetadata } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams(): { pair: string }[] {
  return comparisons.map((c) => ({ pair: c.slug }));
}

const comparisonOf = async (params: Promise<{ pair: string }>): Promise<Comparison> => {
  const c = comparisonBySlug((await params).pair);
  if (!c) notFound();
  return c;
};

const sharedNames = (c: Comparison) => listText(c.shared.map((t) => t.label.toLowerCase()));

/** Both runs on a shared track. `shared` only holds tracks where both ran, so a miss means the data changed under us. */
function bothOn(c: Comparison, track: Track): [Run, Run] | null {
  const a = runOn(c.a, track.id);
  const b = runOn(c.b, track.id);
  return a && b ? [a, b] : null;
}

export async function generateMetadata({ params }: PageProps<"/compare/[pair]">): Promise<Metadata> {
  const c = await comparisonOf(params);
  const figures = pairTracks(c).flatMap((t) => {
    const runs = bothOn(c, t);
    return runs ? [`${t.label.toLowerCase()} ${formatPct(runs[0].agent.rate)} vs ${formatPct(runs[1].agent.rate)}`] : [];
  });
  return pageMetadata({
    title: pairAnswer(c) ? `${searchedName(c.a)} vs ${searchedName(c.b)}: which is better for AI agents?` : `${searchedName(c.a)} vs ${searchedName(c.b)} for AI agents`,
    description: `${searchedName(c.a)} and ${searchedName(c.b)} on the same ${sharedNames(c)} tasks, same model and limits: ${figures.join(", ")}. Cost per task, time, intervals, and whether the gap is real.`,
    path: `/compare/${c.slug}`,
    image: c.shared.length === 1 ? c.shared[0].id : "overview",
  });
}

function PairTrack({ c, track }: { c: Comparison; track: Track }) {
  const runs = bothOn(c, track);
  if (!runs) return null;
  const [a, b] = runs;
  const rows = trackRows(track).success.filter((r) => r.id === c.a.id || r.id === c.b.id);
  const cheaper = [a, b].filter((r) => r.agent.costPerSuccessUsd !== null).sort((x, y) => (x.agent.costPerSuccessUsd ?? 0) - (y.agent.costPerSuccessUsd ?? 0));
  const [lo, hi] = cheaper;

  return (
    <Section id={track.id} title={track.label} note={`${track.tasks} tasks · ${track.what}`}>
      <Bars rows={rows} empty="No results." scaleMax={1} />
      <div className="max-w-prose space-y-3 text-sm text-pretty text-muted-foreground">
        <p>{pairVerdict(track, a, b)}</p>
        {lo && hi && lo.agent.costPerSuccessUsd !== hi.agent.costPerSuccessUsd ? (
          <p>
            {lo.entry.label} cost {costText(lo.agent)} per finished task and {hi.entry.label} {costText(hi.agent)}, counting all API and model spend, failures included.
          </p>
        ) : null}
      </div>
      <div className="mt-6">
        <ScoreTable runs={[a, b].sort((x, y) => y.agent.rate - x.agent.rate)} caption={`${c.a.label} and ${c.b.label} on ${track.label.toLowerCase()}`} />
      </div>
    </Section>
  );
}

const ProviderName = ({ p }: { p: Provider }) => (
  <Link href={`/providers/${p.slug}`} className="font-medium hover:underline" style={{ color: colorOf(p.id) }}>
    {searchedName(p)}
  </Link>
);

export default async function ComparePage({ params }: PageProps<"/compare/[pair]">) {
  const c = await comparisonOf(params);
  const onlyOne = tracks.flatMap((t) => {
    const a = runOn(c.a, t.id);
    const b = runOn(c.b, t.id);
    if (a && !b) return [`only ${c.a.label} ran ${t.label.toLowerCase()}`];
    if (b && !a) return [`only ${c.b.label} ran ${t.label.toLowerCase()}`];
    return [];
  });
  // Only caveats about a track both ran, or about the provider as a whole.
  const notes = [c.a, c.b].flatMap((p) => {
    const tested = TESTED_AS[p.id];
    const relevant = (PROVIDER_NOTES[p.id] ?? []).filter((n) => n.track === undefined || c.shared.some((t) => t.id === n.track)).map((n) => n.text);
    return tested ? [tested, ...relevant] : relevant;
  });
  const answer = pairAnswer(c);
  const related = [...new Map([...comparisonsWith(c.a), ...comparisonsWith(c.b)].filter((o) => o.slug !== c.slug).map((o) => [o.slug, o])).values()];

  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Compare", path: "/compare" }, { name: `${searchedName(c.a)} vs ${searchedName(c.b)}`, path: `/compare/${c.slug}` }]} />
      <PageIntro title={`${searchedName(c.a)} vs ${searchedName(c.b)} for AI agents`}>
        {answer ? (
          <>
            <p className="text-foreground">{answer.lead}</p>
            {answer.rest ? <p>{answer.rest}</p> : null}
          </>
        ) : null}
        <p>
          <ProviderName p={c.a} /> and <ProviderName p={c.b} /> both ran {sharedNames(c)}, with the same tasks, the same model ({MODEL}), the same prompt and the same limits. A task counts only when a
          script confirms every answer.{onlyOne.length > 0 ? ` Beyond that, ${listText(onlyOne)}.` : ""}
        </p>
        <p>
          The benchmark tests each provider&apos;s gap to its track&apos;s leader, with 95% intervals from resampling whole sites. It doesn&apos;t test every pair directly, so this page says when a gap is
          real and when it isn&apos;t one anybody can claim.
        </p>
      </PageIntro>

      {pairTracks(c).map((t) => (
        <PairTrack key={t.id} c={c} track={t} />
      ))}

      {notes.length > 0 ? (
        <Section title="Read these numbers with">
          <ul className="max-w-prose list-disc space-y-2 pl-5 text-sm text-pretty text-muted-foreground marker:text-muted-foreground/50">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="More">
        <p className="max-w-prose text-sm text-pretty text-muted-foreground">
          Every provider on each track: {c.shared.map((t, i) => (
            <span key={t.id}>
              {i > 0 ? ", " : ""}
              <TextLink href={`/${t.id}`}>{t.label.toLowerCase()}</TextLink>
            </span>
          ))}
          . How a gap is tested: <TextLink href="/methodology">methodology</TextLink>.
        </p>
        {related.length > 0 ? (
          <ul className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {related.map((o) => (
              <li key={o.slug}>
                <Link href={`/compare/${o.slug}`} className="hover:underline">
                  {o.a.label} vs {o.b.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </PageShell>
  );
}
