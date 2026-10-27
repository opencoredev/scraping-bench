import { cheapest, comparisonsOn, costText, detectedGap, doneText, leaders, listText, providerById, rankedRuns, tracks } from "@/lib/catalog";
import type { Run, TrackId } from "@/lib/catalog";
import { formatPct, results } from "@/lib/results";
import type { Track } from "@/lib/results";
import { MODEL } from "@/lib/site";

/**
 * Prose for the home page, built from results.json so every number follows the data. Hand-written facts that only
 * hold for one run sit in RUN_FACTS and show only when that run is the one on the page. Sources: docs/FINDINGS.md.
 */

export type HomeLink = { href: string; label: string };

const lower = (t: Track) => t.label.toLowerCase();
const points = (a: number, b: number) => Math.round(Math.abs(a - b) * 100);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const labels = (runs: readonly Run[]) => listText(runs.map((r) => r.entry.label));

/** Facts from docs/FINDINGS.md for the v2 run. Wrong for any other run, so they're dropped for one. */
const RUN_FACTS = results.runId === "wb-v2";

/** The verdict for one track in words: who led, by how much, and whether each gap cleared chance. */
export function trackVerdict(track: Track): string {
  const [first, ...rest] = rankedRuns(track);
  if (!first) return "";
  const name = lower(track);
  const top = leaders(track);
  if (top.length > 1) return `${labels(top)} tied for the most ${name} tasks, ${doneText(first.agent)} each, so the data names no leader.`;
  const second = rest[0];
  if (!second) return `${first.entry.label} was the only provider on ${name}, finishing ${doneText(first.agent)}.`;
  const runnersUp = rest.filter((r) => r.agent.successes === second.agent.successes);
  const opening = `${first.entry.label} finished the most ${name} tasks, ${doneText(first.agent)}, ${points(first.agent.rate, second.agent.rate)} points ahead of ${labels(runnersUp)} at ${formatPct(second.agent.rate)}.`;
  const cleared = rest.filter((r) => detectedGap(track, r.entry.label));
  const open = rest.filter((r) => !detectedGap(track, r.entry.label));
  if (open.length === 0) return `${opening} ${rest.length === 1 ? "That gap is" : "Its lead over every other provider is"} big enough to rule out chance.`;
  if (cleared.length === 0) return `${opening} ${rest.length === 1 ? "That gap is" : "Each of its leads is"} too small to rule out chance, so ${name} has no clear leader.`;
  return `${opening} Its lead over ${labels(open)} is too small to rule out chance. Its ${cleared.length === 1 ? "lead" : "leads"} over ${labels(cleared)} ${cleared.length === 1 ? "is" : "are"} big enough.`;
}

/** Why a track has no cost figure, when it has none. */
const noCostReason = (_track: Track): string => "it wasn't measured";

/** One sentence per track, plus cost, for the answer-first summary. */
export type TrackSummary = { track: Track; providers: number; verdict: string };

export const trackSummaries: readonly TrackSummary[] = tracks.map((track) => ({ track, providers: rankedRuns(track).length, verdict: trackVerdict(track) }));

export function costSummary(): string {
  const priced = tracks.flatMap((t) => {
    const c = cheapest(t);
    return c ? [{ track: t, run: c }] : [];
  });
  const unpriced = tracks.filter((t) => !cheapest(t));
  const free = priced.filter(({ run }) => run.entry.raw?.costPerSuccessUsd === 0);
  return [
    "Cost per finished task counts all API and model spend, failures included, divided by tasks done.",
    priced.length ? `The lowest on each track was ${listText(priced.map(({ track, run }) => `${run.entry.label} on ${lower(track)} (${costText(run.agent)})`))}.` : "",
    ...free.map(({ track, run }) => `No API charge was recorded for ${run.entry.label}'s ${lower(track)} calls on the free account, so its figure is mostly the model's spend.`),
    ...unpriced.map((t) => `${t.label} has no cost figure because ${noCostReason(t)}.`),
  ]
    .filter(Boolean)
    .join(" ");
}


/* Model-only baseline */

export function baselineText(): string[] {
  const withNone = tracks.flatMap((t) => (t.controls.none ? [{ track: t, none: t.controls.none }] : []));
  const scored = withNone.filter((x) => x.none.successes > 0);
  const zero = withNone.filter((x) => x.none.successes === 0);
  const first = scored.length ? `With no tool at all, ${MODEL} finished ${listText(scored.map(({ track, none }) => `${doneText(none)} core ${lower(track)} tasks`))}, answering from what it already knew.` : "";
  const fullNone = scored.flatMap(({ track }) => {
    const s = track.population?.fullScores.find((f) => f.label === "Model alone")?.score;
    return s ? [`On the full set of ${s.tasks} ${lower(track)} tasks it finished ${s.successes} (${formatPct(s.rate)}).`] : [];
  });
  const floor = scored.length
    ? `So read a ${listText(scored.map((x) => lower(x.track)))} score against that floor, not against zero: some facts, like a well-known founding year, are in the model's memory.`
    : "";
  const zeroFull = zero.flatMap(({ track }) => {
    const f = track.population?.fullScores.find((x) => x.label === "Model alone")?.score;
    return f && f.successes > 0 ? [`${f.successes} of ${f.tasks} on the full ${lower(track)} set`] : [];
  });
  const zeroMeaning = zero.length
    ? `On the core ${listText(zero.map((x) => lower(x.track)))} tasks, the model alone passed nothing${zeroFull.length ? `, though it passed ${listText(zeroFull)}` : ""}. Those tracks ask for things like a page's exact heading or a site's current list of URLs, so a provider's score there measures what the tool returned and how well the model used it, together.`
    : "";
  const oracle = tracks.flatMap((t) => (t.controls.oracle ? [{ track: t, oracle: t.controls.oracle }] : []));
  const oracleText = oracle.map(
    ({ track, oracle: o }) =>
      `Handed the correct page directly, the same model finished ${doneText(o)} ${lower(track)} tasks. ${
        o.successes === o.tasks ? `So every core ${lower(track)} task can be answered from the right page within the limits.` : "That is roughly the ceiling for a provider that returns the right page."
      } That control doesn't say whether a provider's miss came from what it returned or from how the model read it.`,
  );
  return [[first, ...fullNone, floor].filter(Boolean).join(" "), [zeroMeaning, ...oracleText].filter(Boolean).join(" ")].filter(Boolean);
}

/* How to pick a provider */

const WORKFLOWS: Record<TrackId, { title: string; need: string }> = {
  scrape: { title: "Reading one page you already have the URL for", need: "Your agent knows the page and needs a fact or heading from it." },
  search: { title: "Finding facts on the web", need: "Your agent has a question, not a URL: a release version, a filing figure, a docs heading." },
  map: { title: "Listing every URL in part of a site", need: "You need the pages under a docs section before deciding what to fetch." },
  crawl: { title: "Turning a docs section into data", need: "You want every page's URL and title back as data." },
};

/** Hand-written notes for one workflow, true only for the v2 run. */
const PICK_NOTES: Partial<Record<TrackId, string>> = RUN_FACTS
  ? {
      scrape: "Spider ran scrape only. Most scrape tasks ask for a docs heading, so test your own pages too.",
      crawl: "A crawl task counts as done when the right pages come back. Exact page titles are shown separately on the crawl page.",
    }
  : {};

export type Pick = { id: TrackId; title: string; need: string; advice: string; note: string | undefined; links: HomeLink[] };

/** Advice per workflow. Gaps are only tested against the top scorer, so the copy never compares two others. */
function pickAdvice(track: Track): string {
  const [top, ...others] = rankedRuns(track);
  if (!top) return "";
  const figure = (r: Run) => `${r.entry.label} (${formatPct(r.agent.rate)}${r.agent.costPerSuccessUsd !== null ? `, ${costText(r.agent)} per finished task` : ""})`;
  if (others.length === 0) return `${figure(top)} was the only provider tested here, so there is nothing to compare it with.`;
  const close = others.filter((r) => !detectedGap(track, r.entry.label));
  const behind = others.filter((r) => detectedGap(track, r.entry.label));
  const behindText = behind.length ? ` ${labels(behind)} finished clearly fewer tasks than ${top.entry.label}.` : "";
  const [onlyClose] = close;
  if (!onlyClose) return `Start with ${figure(top)}. Every other provider's gap to it was big enough to rule out chance.`;
  const closeText =
    close.length === 1
      ? `${onlyClose.entry.label}'s gap to ${top.entry.label} is too small to rule out chance`
      : `${labels(close)} each trail ${top.entry.label} by a gap too small to rule out chance, and the benchmark doesn't test them against each other`;
  return `Shortlist ${listText([top, ...close].map(figure))}. ${closeText}${behind.length ? "." : ", so choose on price, limits and how well each fits your stack."}${behindText}`;
}

export const picks: readonly Pick[] = tracks.map((track) => {
  const shortlist = rankedRuns(track).filter((r) => !detectedGap(track, r.entry.label));
  const pairs = comparisonsOn(track).filter((c) => shortlist.some((r) => r.entry.id === c.a.id || r.entry.id === c.b.id)).slice(0, 2);
  const people = shortlist.flatMap((r) => {
    const p = providerById(r.entry.id);
    return p ? [{ href: `/providers/${p.slug}`, label: p.label }] : [];
  });
  return {
    id: track.id,
    ...WORKFLOWS[track.id],
    advice: pickAdvice(track),
    note: PICK_NOTES[track.id],
    links: [{ href: `/${track.id}`, label: `${track.label} results` }, ...people, ...pairs.map((c) => ({ href: `/compare/${c.slug}`, label: `${c.a.label} vs ${c.b.label}` }))],
  };
});

/* Caveats */

/** How many providers ran each track, for the "not every provider ran every track" sentence. */
export const coverageText = (): string => listText(tracks.map((t) => `${rankedRuns(t).length} on ${lower(t)}`));

/** Run-specific caveats from docs/FINDINGS.md. Each one names a provider only to say how it was set up. */
export function runCaveats(): string[] {
  if (!RUN_FACTS) return [];
  return [
    "Spider ran scrape only, because its small free wallet couldn't safely cover the multi-page tracks. It refused the JavaScript test pages hosted on our workers.dev domain, so it couldn't pass those.",
    "Jina Reader ran under a rejecting token budget to fit its free allowance, so its scrape score describes that setup, not Jina Reader in general. Its search was left out because that API has no hard cap on tokens per call.",
    "Browserbase here means its HTTP Fetch and Search APIs, not its browser sessions.",
  ];
}
