import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/bench/bench-page";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { ScoreTable } from "@/components/site/score-table";
import { cheapest, comparisonsOn, costText, fastest, leaders, listText, rankedRuns, timeText, standingText, trackById, tracks } from "@/lib/catalog";
import type { TrackId } from "@/lib/catalog";
import { faqs, notTestedFaq } from "@/lib/faq";
import { TRACK_NOTES, TRACK_SEO, TRACK_TOPIC } from "@/lib/notes";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";
import { NOT_TESTED, SITE_URL, pageMetadata } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams(): { track: TrackId }[] {
  return tracks.map((t) => ({ track: t.id }));
}

/** FAQ answers that link to this track, plus the untested-providers one. Shown on the page and in its FAQPage JSON-LD. */
const trackFaqs = (track: Track) => (TRACK_SEO[track.id] ? faqs.filter((f) => f === notTestedFaq || f.links.some((l) => l.href === `/${track.id}`)) : []);

const trackOf = async (params: Promise<{ track: string }>): Promise<Track> => {
  const track = trackById((await params).track);
  if (!track) notFound();
  return track;
};

export async function generateMetadata({ params }: PageProps<"/[track]">): Promise<Metadata> {
  const track = await trackOf(params);
  const runs = rankedRuns(track);
  return pageMetadata({
    title: TRACK_SEO[track.id]?.title(runs.length) ?? `${track.label} benchmark: ${runs.length} ${TRACK_TOPIC[track.id]}s for AI agents`,
    description: `${runs.length} ${TRACK_SEO[track.id] ? `${TRACK_TOPIC[track.id]}s` : "providers"} on ${track.tasks} ${track.label.toLowerCase()} tasks with the same model and limits: ${runs
      .slice(0, 3)
      .map((r) => `${r.entry.label} ${formatPct(r.agent.rate)}`)
      .join(", ")}. Tasks done, 95% intervals, cost per finished task and time.`,
    path: `/${track.id}`,
    image: track.id,
  });
}

export default async function TrackPage({ params }: PageProps<"/[track]">) {
  const track = await trackOf(params);
  const runs = rankedRuns(track);
  const lead = leaders(track)[0];
  const cheap = cheapest(track);
  const fast = fastest(track);
  const pairs = comparisonsOn(track);
  const { seconds, usd, calls } = track.limits;
  const noTool = track.controls.none;
  const seo = TRACK_SEO[track.id];
  const questions = trackFaqs(track);

  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: track.label, path: `/${track.id}` }]} />
      {questions.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            url: `${SITE_URL}/${track.id}`,
            mainEntity: questions.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }}
        />
      ) : null}
      <PageIntro title={seo?.heading ?? `${track.label} benchmark: which ${TRACK_TOPIC[track.id]} gets an agent the right answer`}>
        <p>
          {track.what} {runs.length} providers ran the same {track.tasks} tasks with the same model and prompt. Each task allowed {calls} {calls === 1 ? "call" : "calls"}, {seconds >= 120 ? `${seconds / 60} minutes` : `${seconds} seconds`} and ${usd.toFixed(2)}.
        </p>
        <p>
          {lead ? standingText(lead) : null}
          {cheap ? ` ${cheap.entry.label} cost the least per finished task, ${costText(cheap.agent)}.` : null}
          {noTool ? ` With no tool at all, the model alone passed ${noTool.successes === 0 ? "none" : formatPct(noTool.rate)}.` : null}
        </p>
        {seo ? <p>{NOT_TESTED} weren&apos;t tested, so there are no numbers for them here.</p> : null}
      </PageIntro>

      <TrackView track={track} />

      <Section title="Every provider" note="the numbers behind the charts">
        <ScoreTable runs={runs} caption={`${track.label} results for every provider`} />
        {TRACK_NOTES[track.id] ? <p className="mt-6 max-w-prose text-xs text-pretty text-muted-foreground">{TRACK_NOTES[track.id]}</p> : null}
        <p className="mt-3 max-w-prose text-xs text-pretty text-muted-foreground">
          {fast ? `${listText(runs.filter((r) => r.agent.medianMs === fast.agent.medianMs).map((r) => r.entry.label))} had the shortest median time per finished task, ${timeText(fast.agent)}. ` : null}Not tested: {NOT_TESTED}.
        </p>
      </Section>

      {questions.length > 0 ? (
        <Section title="Questions">
          <div className="border-t border-border/60">
            {questions.map((f) => (
              <section key={f.question} className="border-b border-border/60 py-6">
                <h3 className="max-w-prose text-sm font-medium text-pretty">{f.question}</h3>
                <p className="mt-2 max-w-prose text-sm text-pretty text-muted-foreground">{f.answer}</p>
              </section>
            ))}
          </div>
          <p className="mt-6 text-sm">
            <TextLink href="/faq">More questions, answered from the data</TextLink>
          </p>
        </Section>
      ) : null}

      {pairs.length > 0 ? (
        <Section title="Head to head" note={`pairs that both ran ${track.label.toLowerCase()}`}>
          <ul className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {pairs.map((c) => (
              <li key={c.slug}>
                <Link href={`/compare/${c.slug}`} className="hover:underline">
                  {c.a.label} vs {c.b.label}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Other tracks">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {tracks
            .filter((t) => t.id !== track.id)
            .map((t) => (
              <li key={t.id}>
                <TextLink href={`/${t.id}`}>{t.label}</TextLink> <span className="text-muted-foreground">· {t.tasks} tasks</span>
              </li>
            ))}
        </ul>
        <p className="mt-4 max-w-prose text-sm text-pretty text-muted-foreground">
          How every task is graded, and when a gap counts, is on the <TextLink href="/methodology">methodology</TextLink> page.
        </p>
      </Section>
    </PageShell>
  );
}
