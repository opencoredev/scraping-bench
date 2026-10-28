import { REFERENCE_ID, pairGap } from "@/lib/answers";
import type { PairGap } from "@/lib/answers";
import { comparisonsWith, costText, listText, providerById, rankedRuns, runOn, standingText, tracks } from "@/lib/catalog";
import type { Comparison, Provider, Run } from "@/lib/catalog";
import type { Faq } from "@/lib/faq";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";
import { NOT_TESTED } from "@/lib/site";

/**
 * The /firecrawl-alternatives page: every tested provider set against Firecrawl on the tracks both ran, from results.json.
 * Gaps are only called when the benchmark tested them (see `pairGap`), so most rows say the gap is too small or untested.
 */

export const ALTERNATIVES_PATH = "/firecrawl-alternatives";

/** Names that show up in "Firecrawl alternatives" listicles but were never part of this benchmark. No numbers exist for them. */
const NEVER_BENCHMARKED = "Apify, Crawl4AI and ZenRows";

export const notTestedAlternatives = `${NOT_TESTED} weren't tested, and ${NEVER_BENCHMARKED} were never part of this benchmark, so this page has no numbers for them.`;

export type AlternativeRow = { run: Run; gap: PairGap; comparison: Comparison | undefined };

export type TrackAlternatives = { track: Track; reference: Run; rows: AlternativeRow[]; standing: string; cheaper: Run[] };

export type FirecrawlAlternatives = { reference: Provider; tested: Provider[]; byTrack: TrackAlternatives[] };

/** How one alternative stands against Firecrawl on one track, never claiming more than the benchmark tested. */
export function gapText({ run, gap }: AlternativeRow, reference: Run): string {
  switch (gap.kind) {
    case "tied":
      return "Same tasks done";
    case "untested":
      return "Not tested head to head";
    case "tested": {
      const ahead = run.agent.rate > reference.agent.rate;
      if (!gap.real) return "Gap too small to rule out chance";
      return ahead ? "More tasks done; the gap rules out chance" : "Fewer tasks done; the gap rules out chance";
    }
    default: {
      const _exhaustive: never = gap;
      return _exhaustive;
    }
  }
}

function onTrack(reference: Provider, track: Track): TrackAlternatives | null {
  const own = runOn(reference, track.id);
  if (!own) return null;
  const rows = rankedRuns(track)
    .filter((r) => r.entry.id !== reference.id)
    .map((run) => ({
      run,
      gap: pairGap(track, run, own),
      comparison: comparisonsWith(reference).find((c) => c.a.id === run.entry.id || c.b.id === run.entry.id),
    }));
  const ownCost = own.agent.costPerSuccessUsd;
  const cheaper = ownCost === null ? [] : rows.map((r) => r.run).filter((r) => r.agent.costPerSuccessUsd !== null && r.agent.costPerSuccessUsd < ownCost);
  return { track, reference: own, rows, standing: standingText(own), cheaper };
}

export function firecrawlAlternatives(): FirecrawlAlternatives | null {
  const reference = providerById(REFERENCE_ID);
  if (!reference) return null;
  const byTrack = tracks.flatMap((t) => onTrack(reference, t) ?? []);
  const ids = new Set(byTrack.flatMap((t) => t.rows.map((r) => r.run.entry.id)));
  const tested = [...ids].flatMap((id) => providerById(id) ?? []);
  return { reference, tested, byTrack };
}

/** "cost less per finished task than Firecrawl's 1.67¢: Spider (0.88¢), …", or null when none did. */
export function cheaperText(t: TrackAlternatives): string | null {
  if (t.cheaper.length === 0) return null;
  const names = listText([...t.cheaper].sort((a, b) => (a.agent.costPerSuccessUsd ?? 0) - (b.agent.costPerSuccessUsd ?? 0)).map((r) => `${r.entry.label} (${costText(r.agent)})`));
  return `${names} cost less per finished ${t.track.label.toLowerCase()} task than ${t.reference.entry.label}'s ${costText(t.reference.agent)}, counting API and model spend, failures included.`;
}

/** Short answers for the page and its FAQPage JSON-LD, so both say exactly the same thing. */
export function alternativesFaqs(a: FirecrawlAlternatives): Faq[] {
  const name = a.reference.label;
  const best = a.byTrack.map((t) => `On ${t.track.label.toLowerCase()} (${t.track.tasks} tasks), ${name} finished ${formatPct(t.reference.agent.rate)}. ${t.standing}`).join(" ");
  const cheap = a.byTrack.flatMap((t) => {
    const lowest = [...t.cheaper].sort((x, y) => (x.agent.costPerSuccessUsd ?? 0) - (y.agent.costPerSuccessUsd ?? 0))[0];
    return lowest ? [`${t.track.label.toLowerCase()}: ${lowest.entry.label} at ${costText(lowest.agent)}, against ${name}'s ${costText(t.reference.agent)}`] : [];
  });
  const noCheaper = a.byTrack.filter((t) => t.cheaper.length === 0).map((t) => t.track.label.toLowerCase());
  return [
    {
      question: `What is the best ${name} alternative for AI agents?`,
      answer: `It depends on the job, and on most tracks the data can't separate ${name} from the providers around it. ${best}`,
      links: a.byTrack.map((t) => ({ href: `/${t.track.id}`, label: `${t.track.label} results` })),
    },
    {
      question: `Which ${name} alternative costs the least per finished task?`,
      answer: `Cost per finished task counts all API and model spend, failures included, divided by tasks done. The cheapest alternative on each track: ${cheap.join("; ")}.${
        noCheaper.length > 0 ? ` On ${listText(noCheaper)}, no alternative cost less than ${name}.` : ""
      }`,
      links: [{ href: "/providers", label: "Every provider's cost" }],
    },
    {
      question: `Were Bright Data, Apify, Crawl4AI, ZenRows, Exa and Tavily tested against ${name}?`,
      answer: `No. ${notTestedAlternatives}`,
      links: [],
    },
  ];
}
