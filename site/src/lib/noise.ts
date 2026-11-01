import { listText, rankedRuns, tracks } from "@/lib/catalog";
import type { Faq } from "@/lib/faq";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";
import { COST_PATH, MODEL, REPO, RESULTS_JSON } from "@/lib/site";

export { NOISE_PATH } from "@/lib/site";

/**
 * The /why-most-gaps-are-noise explainer: every published comparison against a track's leader, with its paired 95% interval,
 * and which ones cleared chance. Every figure comes from results.json (population.comparisons), never typed by hand.
 */

/** One provider compared with its track's leader on the same tasks. Differences and bounds are shares (0.1 = 10 points). */
export type Gap = { provider: string; reference: string; difference: number; lo: number; hi: number; pairedTasks: number; verdict: "cleared" | "too-small" | "tied" };

/** `gaps` is never empty: a track only gets here with at least one complete comparison. */
export type TrackGaps = { track: Track; gaps: [Gap, ...Gap[]]; reference: string; sites: number };

const lower = (t: Track) => t.label.toLowerCase();

function gapsOn(track: Track): TrackGaps | null {
  const pop = track.population;
  if (!pop) return null;
  const rows = pop.comparisons.flatMap((c): Gap[] => {
    const [lo, hi] = c.ci;
    if (c.difference === null || lo === null || hi === null) return [];
    const verdict = c.resolved ? "cleared" : c.difference === 0 ? "tied" : "too-small";
    return [{ provider: c.provider, reference: c.reference, difference: c.difference, lo, hi, pairedTasks: c.pairedTasks, verdict }];
  });
  const [first, ...rest] = rows.sort((a, b) => b.difference - a.difference);
  if (!first) return null;
  return { track, gaps: [first, ...rest], reference: first.reference, sites: pop.coreClusters };
}

export const trackGaps: readonly TrackGaps[] = tracks.flatMap((t) => gapsOn(t) ?? []);

const allGaps: readonly Gap[] = trackGaps.flatMap((t) => t.gaps);
export const clearedCount = allGaps.filter((g) => g.verdict === "cleared").length;
export const gapCount = allGaps.length;

/** Whole points, always positive: "10 points". */
export const pointsText = (share: number): string => {
  const n = Math.round(Math.abs(share) * 100);
  return `${n} ${n === 1 ? "point" : "points"}`;
};

/** "10-point": the adjective form, for "a 10-point gap". */
const pointAdj = (share: number): string => `${Math.round(Math.abs(share) * 100)}-point`;

/** What one task is worth, to one decimal under 10 points so 2.5 doesn't read as 3: "2.5 points". */
const taskPointsText = (tasks: number): string => {
  const n = 100 / tasks;
  return `${n >= 10 ? Math.round(n) : Number(n.toFixed(1))} points`;
};

/** A signed interval in points, e.g. "−21 to −2". */
export const intervalPointsText = (g: Gap): string => {
  const signed = (x: number) => {
    const n = Math.round(x * 100);
    return n < 0 ? `−${-n}` : `${n}`;
  };
  return `${signed(g.lo)} to ${signed(g.hi)}`;
};

export const VERDICT_LABEL: Record<Gap["verdict"], string> = { cleared: "Cleared chance", "too-small": "Too small to call", tied: "Tied" };

/** The smallest gap that cleared chance and the largest that didn't, with their tracks: the clearest sign that size alone decides nothing. */
function contrast(): { cleared: { gap: Gap; track: Track }; unresolved: { gap: Gap; track: Track } } | null {
  const withTrack = trackGaps.flatMap((t) => t.gaps.map((gap) => ({ gap, track: t.track })));
  const cleared = withTrack.filter((x) => x.gap.verdict === "cleared").sort((a, b) => Math.abs(a.gap.difference) - Math.abs(b.gap.difference))[0];
  const unresolved = withTrack.filter((x) => x.gap.verdict === "too-small").sort((a, b) => Math.abs(b.gap.difference) - Math.abs(a.gap.difference))[0];
  return cleared && unresolved ? { cleared, unresolved } : null;
}

/** The first answer on the page: how many gaps cleared, and the contrast that shows why. */
export function shortAnswer(): string[] {
  const out = [
    `Of the ${gapCount} gaps between a provider and its track's leader in this run, ${clearedCount} ${clearedCount === 1 ? "is" : "are"} big enough to rule out chance and ${gapCount - clearedCount} ${gapCount - clearedCount === 1 ? "isn't" : "aren't"}. A ranking still puts every provider in order, but many of those places could swap if the same test ran on a different sample of sites.`,
  ];
  const c = contrast();
  if (c && Math.abs(c.unresolved.gap.difference) >= Math.abs(c.cleared.gap.difference)) {
    out.push(
      `Size alone doesn't decide it. On ${lower(c.cleared.track)}, ${c.cleared.gap.provider}'s ${pointAdj(c.cleared.gap.difference)} gap to ${c.cleared.gap.reference} cleared chance over ${c.cleared.gap.pairedTasks} tasks. On ${lower(c.unresolved.track)}, ${c.unresolved.gap.provider}'s ${pointAdj(c.unresolved.gap.difference)} gap to ${c.unresolved.gap.reference} didn't, because that track has ${c.unresolved.gap.pairedTasks} tasks and each one moves the score by ${taskPointsText(c.unresolved.gap.pairedTasks)}.`,
    );
  }
  return out;
}

/** What one task is worth on a track, and how many sites its tasks come from. */
export function trackNote(t: TrackGaps): string {
  const n = t.track.tasks;
  return `${n} tasks from ${t.sites} ${t.sites === 1 ? "site" : "sites"}, so one task is ${taskPointsText(n)}.`;
}

/** One sentence per track on what its comparisons show. */
export function trackVerdictText(t: TrackGaps): string {
  const cleared = t.gaps.filter((g) => g.verdict === "cleared").map((g) => g.provider);
  const small = t.gaps.filter((g) => g.verdict === "too-small").map((g) => g.provider);
  const tied = t.gaps.filter((g) => g.verdict === "tied").map((g) => g.provider);
  const leaderRate = rankedRuns(t.track).find((r) => r.entry.label === t.reference)?.agent.rate;
  const rate = leaderRate === undefined ? "" : ` (${formatPct(leaderRate)})`;
  const lead =
    tied.length > 0
      ? `${t.reference}${rate} is the reference here, one of the providers tied for the most ${lower(t.track)} tasks.`
      : `${t.reference}${rate} is the reference here, as the provider that finished the most ${lower(t.track)} tasks.`;
  const parts = [
    lead,
    tied.length > 0 ? `${listText(tied)} finished exactly as many tasks, so ${tied.length === 1 ? "the two share" : "they share"} the lead.` : null,
    small.length > 0
      ? `${listText(small)} ${small.length === 1 ? "is" : "are"} behind, but ${small.length === 1 ? "its interval includes" : "each interval includes"} zero, so the gap is too small to call.`
      : null,
    cleared.length > 0
      ? `${listText(cleared)} ${cleared.length === 1 ? "finished" : "each finished"} clearly fewer tasks: ${cleared.length === 1 ? "that interval stays" : "those intervals stay"} below zero.`
      : `No gap on this track cleared chance.`,
  ];
  return parts.filter((s): s is string => s !== null).join(" ");
}

/** The method, in the words of docs/METHODOLOGY.md. */
export const METHOD_TEXT = [
  `Every provider runs the same tasks with the same model, ${MODEL}, and a script grades each task pass or fail. Tasks from one site tend to pass or fail together, so they aren't independent observations.`,
  "So each provider is compared with its track's leader on the same tasks, and a bootstrap redraws whole sites, not single tasks, 10,000 times. The middle 95% of those redrawn differences is the interval. If it includes zero, the gap is too small to rule out chance. An interval that ends at exactly zero still includes it.",
  "These comparisons are exploratory. They aren't adjusted for testing many pairs at once, and the reference is whichever provider happened to score highest, which makes a false positive more likely, not less. Treat a gap that cleared chance as evidence about these tasks, not as proof for every site.",
];

export const noiseFaqs: readonly Faq[] = [
  {
    question: "Are there benchmarks of web scraping APIs that report confidence intervals?",
    answer: `Yes. scrapingbench grades web data APIs on ${listText(tracks.map((t) => `${t.tasks} ${lower(t)}`))} tasks, each pass or fail by a script, and reports a 95% interval for every score and for every gap to a track's leader, from a bootstrap that resamples whole sites. The tasks, grader and every result row are open source and MIT licensed.`,
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: RESULTS_JSON, label: "results.json" },
    ],
  },
  {
    question: "Does \"too small to rule out chance\" mean two providers are equally good?",
    answer:
      "No. It means this sample of tasks can't tell them apart. The provider ahead may well be better; the test just doesn't have enough sites to show it. A bigger or different task set could resolve the gap either way.",
    links: [],
  },
  {
    question: "Why doesn't the benchmark name one winner per track?",
    answer: `Because on most tracks the leader's lead isn't big enough. ${trackGaps
      .map((t) => {
        const small = t.gaps.filter((g) => g.verdict !== "cleared").length;
        return `On ${lower(t.track)}, ${small} of ${t.gaps.length} ${t.gaps.length === 1 ? "gap" : "gaps"} to ${t.reference} ${small === 1 ? "is" : "are"} too small to call or tied.`;
      })
      .join(" ")} The site only says a lead rules out chance when every gap to the leader cleared it.`,
    links: [{ href: "/providers", label: "All providers" }],
  },
  {
    question: "How should I benchmark scraping APIs for my own agent?",
    answer:
      "Use tasks from the sites your agent will really visit, give every provider the same tasks, model and limits, and grade the final answer with a script rather than a model. Count the spend on failed tasks too, so cost means cost per finished task. Spread tasks over many sites, since tasks from one site count as one cluster, and compare providers on the same tasks with an interval before you call a winner.",
    links: [
      { href: COST_PATH, label: "Cost per finished task" },
      { href: `${REPO}/blob/main/docs/METHODOLOGY.md`, label: "METHODOLOGY.md" },
    ],
  },
];

export const NOISE_SUMMARY = `which gaps between providers clear chance (${clearedCount} of ${gapCount}) and why most don't`;
