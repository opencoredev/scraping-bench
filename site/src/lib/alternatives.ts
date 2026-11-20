import { REFERENCE_ID, pairGap } from "@/lib/answers";
import type { PairGap } from "@/lib/answers";
import { comparisonsWith, costText, detectedGap, doneText, leaders, listText, providerById, rankedRuns, runOn, standingText, trackById, tracks } from "@/lib/catalog";
import type { Comparison, Provider, Run } from "@/lib/catalog";
import { zeroApiCaveat } from "@/lib/faq";
import type { Faq } from "@/lib/faq";
import { PROVIDER_NOTES, TESTED_AS } from "@/lib/notes";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";
import { NOT_TESTED } from "@/lib/site";

/**
 * "<provider> alternatives" pages: every tested provider set against one provider on the tracks both ran, from results.json.
 * Gaps are only called when the benchmark tested them (see `pairGap`), so most rows say the gap is too small or untested.
 */

export const ALTERNATIVES_PATH = "/firecrawl-alternatives";
export const JINA_ALTERNATIVES_PATH = "/jina-reader-alternatives";
export const CONTEXT_DEV_ALTERNATIVES_PATH = "/context-dev-alternatives";

const JINA_ID = "jina";
const CONTEXT_DEV_ID = "contextdev";

/** Names that show up in "alternatives" listicles but were never part of this benchmark. No numbers exist for them. */
const NEVER_BENCHMARKED = "Apify, Crawl4AI and ZenRows";

export const notTestedAlternatives = `${NOT_TESTED} weren't tested, and ${NEVER_BENCHMARKED} were never part of this benchmark, so this page has no numbers for them.`;

export type AlternativeRow = { run: Run; gap: PairGap; comparison: Comparison | undefined };

export type TrackAlternatives = { track: Track; reference: Run; rows: AlternativeRow[]; standing: string; cheaper: Run[] };

/** One scrape run's page coverage: the share of sentences sampled from each page's own text that reached the agent. */
export type TextKeptRow = { run: Run; mean: number; low: number | null; high: number | null; pages: number };

/** Page coverage on scrape for the reference and every alternative, most text kept first. */
export type TextKept = { reference: TextKeptRow; rows: [TextKeptRow, ...TextKeptRow[]] };

/**
 * `caveats` are the reference provider's own notes (what was tested, budgets), which change how every row should be read.
 * `textKept` is only set where the reference is mainly used to turn a URL into text for a model (Jina Reader).
 */
export type Alternatives = { reference: Provider; path: string; tested: Provider[]; byTrack: TrackAlternatives[]; caveats: string[]; textKept: TextKept | null };

/** How one alternative stands against the reference on one track, never claiming more than the benchmark tested. */
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

/** The published comparison between two runs, if the benchmark ran one. When leaders tie, it compares everyone with one co-leader. */
function directComparison(track: Track, a: Run, b: Run) {
  return track.population?.comparisons.find(
    (x) => (x.provider === a.entry.label && x.reference === b.entry.label) || (x.provider === b.entry.label && x.reference === a.entry.label),
  );
}

/** `pairGap`, plus the pairs a tied lead hides from it: a direct comparison with the co-leader the benchmark used as its reference. */
function rowGap(track: Track, run: Run, own: Run): PairGap {
  const gap = pairGap(track, run, own);
  if (gap.kind !== "untested") return gap;
  const direct = directComparison(track, run, own);
  return direct ? { kind: "tested", real: direct.resolved } : gap;
}

/**
 * `standingText`, except when the lead is tied and the reference trails it: `standingText` then names the first co-leader,
 * which may not be the one the benchmark compared it with. Name the tie and the co-leader that was tested instead.
 */
function standingFor(track: Track, own: Run): string {
  const top = leaders(track);
  if (top.length < 2 || top.some((r) => r.entry.id === own.entry.id)) return standingText(own);
  const direct = top.flatMap((r) => directComparison(track, r, own) ?? [])[0];
  if (!direct) return standingText(own);
  const gap = Math.round(Math.abs((top[0]?.agent.rate ?? own.agent.rate) - own.agent.rate) * 100);
  return `${own.entry.label} is behind ${listText(top.map((r) => r.entry.label))} (${formatPct(top[0]?.agent.rate ?? 0)}), which tied for the lead. The benchmark tested its ${gap}-point gap to ${direct.reference}, and it is ${
    direct.resolved ? "big enough to rule out chance" : "too small to rule out chance"
  }.`;
}

function onTrack(reference: Provider, track: Track): TrackAlternatives | null {
  const own = runOn(reference, track.id);
  if (!own) return null;
  const rows = rankedRuns(track)
    .filter((r) => r.entry.id !== reference.id)
    .map((run) => ({
      run,
      gap: rowGap(track, run, own),
      comparison: comparisonsWith(reference).find((c) => c.a.id === run.entry.id || c.b.id === run.entry.id),
    }));
  const ownCost = own.agent.costPerSuccessUsd;
  const cheaper = ownCost === null ? [] : rows.map((r) => r.run).filter((r) => r.agent.costPerSuccessUsd !== null && r.agent.costPerSuccessUsd < ownCost);
  return { track, reference: own, rows, standing: standingFor(track, own), cheaper };
}

/** Page coverage for every scrape run that has it, the reference's first in `reference`, null when the reference has none. */
function textKeptFor(reference: Provider): TextKept | null {
  const track = trackById("scrape");
  if (!track) return null;
  const all = rankedRuns(track)
    .flatMap((run): TextKeptRow[] => {
      const c = run.entry.coverage;
      return c && c.mean !== null ? [{ run, mean: c.mean, low: c.ci[0], high: c.ci[1], pages: c.pages }] : [];
    })
    .sort((a, b) => b.mean - a.mean);
  const own = all.find((r) => r.run.entry.id === reference.id);
  const [first, ...rest] = all;
  if (!own || !first || rest.length === 0) return null;
  return { reference: own, rows: [first, ...rest] };
}

/** Labels of the runs that share the shown (rounded) value, so ties are named together. */
const sharing = (rows: TextKeptRow[], shown: string, value: (r: TextKeptRow) => string): string => listText(rows.filter((r) => value(r) === shown).map((r) => r.run.entry.label));

/**
 * What reached the agent from each response, read as text kept and answers present, never as a ranking of gaps:
 * these measures have intervals but no head-to-head tests, so no difference is called.
 */
export function textKeptText(k: TextKept): string {
  const own = k.reference;
  const name = own.run.entry.label;
  const others = k.rows.filter((r) => r.run.entry.id !== own.run.entry.id);
  const pct = (r: TextKeptRow) => formatPct(r.mean);
  const lowest = others.every((r) => r.mean > own.mean);
  const top = others[0];
  const bottom = others[others.length - 1];
  const range =
    top && bottom
      ? lowest
        ? ` Every alternative's response held more, from ${sharing(others, pct(bottom), pct)} (${pct(bottom)}) to ${sharing(others, pct(top), pct)} (${pct(top)}).`
        : ` The alternatives held from ${sharing(others, pct(bottom), pct)} (${pct(bottom)}) to ${sharing(others, pct(top), pct)} (${pct(top)}).`
      : "";
  const coverage = `On the ${own.pages} scrape pages checked against a saved copy, ${name}'s response held ${pct(own)} of the sentences sampled from each page's own text${
    lowest ? `, the lowest of the ${k.rows.length} providers measured` : ""
  }.${range}`;

  const withRaw = others.flatMap((r) => (r.run.entry.raw ? [{ label: r.run.entry.label, raw: r.run.entry.raw }] : []));
  const ownRaw = own.run.entry.raw;
  const rawRates = withRaw.map((r) => r.raw.rate);
  const most = Math.max(...rawRates);
  const least = Math.min(...rawRates);
  const named = (rate: number) => listText(withRaw.filter((r) => r.raw.rate === rate).map((r) => r.label));
  const answer =
    ownRaw && withRaw.length > 0
      ? ` Before any model read it, the answer a task asked for was in ${name}'s response on ${doneText(ownRaw)} tasks; for the alternatives it ranged from ${formatPct(least)} (${named(least)}) to ${formatPct(most)} (${named(most)}).`
      : "";
  return `${coverage}${answer} These measures have intervals but no head-to-head tests, so this page doesn't say which of these differences rule out chance.`;
}

function alternativesFor(id: string, path: string, opts: { textKept: boolean } = { textKept: false }): Alternatives | null {
  const reference = providerById(id);
  if (!reference) return null;
  const byTrack = tracks.flatMap((t) => onTrack(reference, t) ?? []);
  if (byTrack.length === 0) return null;
  const ids = new Set(byTrack.flatMap((t) => t.rows.map((r) => r.run.entry.id)));
  const tested = [...ids].flatMap((pid) => providerById(pid) ?? []);
  const testedAs = TESTED_AS[id];
  const caveats = [...(testedAs ? [testedAs] : []), ...(PROVIDER_NOTES[id] ?? []).map((n) => n.text)];
  return { reference, path, tested, byTrack, caveats, textKept: opts.textKept ? textKeptFor(reference) : null };
}

export const firecrawlAlternatives = (): Alternatives | null => alternativesFor(REFERENCE_ID, ALTERNATIVES_PATH);

export const jinaAlternatives = (): Alternatives | null => alternativesFor(JINA_ID, JINA_ALTERNATIVES_PATH, { textKept: true });

export const contextDevAlternatives = (): Alternatives | null => alternativesFor(CONTEXT_DEV_ID, CONTEXT_DEV_ALTERNATIVES_PATH);

/** Provider id to its alternatives page, for the "compared" section on provider pages. */
export const ALTERNATIVES_PAGES: Partial<Record<string, string>> = {
  [REFERENCE_ID]: ALTERNATIVES_PATH,
  [JINA_ID]: JINA_ALTERNATIVES_PATH,
  [CONTEXT_DEV_ID]: CONTEXT_DEV_ALTERNATIVES_PATH,
};

/** "cost less per finished task than Firecrawl's 1.67¢: Spider (0.88¢), …", or null when none did. */
export function cheaperText(t: TrackAlternatives): string | null {
  if (t.cheaper.length === 0) return null;
  const names = listText([...t.cheaper].sort((a, b) => (a.agent.costPerSuccessUsd ?? 0) - (b.agent.costPerSuccessUsd ?? 0)).map((r) => `${r.entry.label} (${costText(r.agent)})`));
  const caveat = zeroApiCaveat(t.cheaper);
  return `${names} cost less per finished ${t.track.label.toLowerCase()} task than ${t.reference.entry.label}'s ${costText(t.reference.agent)}, counting API and model spend, failures included.${caveat ? ` ${caveat}` : ""}`;
}

/**
 * When the reference finished the fewest tasks on a track: says so, and which of those gaps the benchmark tested.
 * Only the gap to the track's sole leader is tested, so the others are never called.
 */
export function trailingText(t: TrackAlternatives): string | null {
  const lowest = t.rows.length > 0 && t.rows.every((r) => r.run.agent.rate > t.reference.agent.rate);
  if (!lowest) return null;
  const name = t.reference.entry.label;
  const top = leaders(t.track);
  const leader = top.length === 1 ? top[0] : undefined;
  const gap = detectedGap(t.track, name);
  const coLeader = leader ? undefined : top.flatMap((r) => directComparison(t.track, r, t.reference) ?? [])[0];
  const tested =
    leader && gap
      ? `The benchmark tested only the gap to ${leader.entry.label}, the leader, and that one rules out chance; the other gaps weren't tested head to head.`
      : leader
        ? `The benchmark tested only the gap to ${leader.entry.label}, the leader, and it is too small to rule out chance; the other gaps weren't tested head to head.`
        : coLeader
          ? `${listText(top.map((r) => r.entry.label))} tied for the lead. The benchmark tested only the gap to ${coLeader.reference}, and it is ${
              coLeader.resolved ? "big enough to rule out chance" : "too small to rule out chance"
            }; the other gaps weren't tested head to head.`
          : "No provider led this track alone, so this page doesn't call these gaps.";
  return `Every other provider on ${t.track.label.toLowerCase()} finished more tasks than ${name}'s ${formatPct(t.reference.agent.rate)}. ${tested}`;
}

/** For a reference that trails everyone on a track: who finished the most and who cost the least, saying which gaps were tested. */
function pickText(t: TrackAlternatives): string {
  const name = t.reference.entry.label;
  const track = t.track.label.toLowerCase();
  const top = leaders(t.track);
  const leader = top.length === 1 ? top[0] : undefined;
  const most = leader
    ? `On ${track} (${t.track.tasks} tasks), ${leader.entry.label} finished the most (${formatPct(leader.agent.rate)}) against ${name}'s ${formatPct(t.reference.agent.rate)}, and that gap ${
        detectedGap(t.track, name) ? "rules out chance" : "is too small to rule out chance"
      }.`
    : `On ${track} (${t.track.tasks} tasks), ${listText(top.map((r) => r.entry.label))} tied for the most (${formatPct(top[0]?.agent.rate ?? 0)}) against ${name}'s ${formatPct(t.reference.agent.rate)}.`;
  const lowest = [...t.cheaper].sort((x, y) => (x.agent.costPerSuccessUsd ?? 0) - (y.agent.costPerSuccessUsd ?? 0))[0];
  const cheap = !lowest
    ? null
    : lowest.entry.id === leader?.entry.id
      ? `${lowest.entry.label} also cost the least per finished task (${costText(lowest.agent)}).`
      : `${lowest.entry.label} cost the least per finished task (${costText(lowest.agent)}, against ${costText(t.reference.agent)})${
          leader ? `, but its gap to ${name} wasn't tested head to head` : ""
        }.`;
  return [most, cheap, lowest ? zeroApiCaveat([lowest]) || null : null].filter((s): s is string => s !== null).join(" ");
}

/** Short answers for the page and its FAQPage JSON-LD, so both say exactly the same thing. */
export function alternativesFaqs(a: Alternatives): Faq[] {
  const name = a.reference.label;
  const allTrailing = a.byTrack.every((t) => trailingText(t) !== null);
  const best = allTrailing
    ? a.byTrack.map((t) => pickText(t)).join(" ")
    : a.byTrack.map((t) => `On ${t.track.label.toLowerCase()} (${t.track.tasks} tasks), ${name} finished ${formatPct(t.reference.agent.rate)}. ${t.standing}`).join(" ");
  const opener = allTrailing
    ? `Every provider tested alongside ${name} finished more ${listText(a.byTrack.map((t) => t.track.label.toLowerCase()))} tasks.`
    : `It depends on the job, and on most tracks the data can't separate ${name} from the providers around it.`;
  const lowestRuns = a.byTrack.flatMap((t) => {
    const lowest = [...t.cheaper].sort((x, y) => (x.agent.costPerSuccessUsd ?? 0) - (y.agent.costPerSuccessUsd ?? 0))[0];
    return lowest ? [{ t, lowest }] : [];
  });
  const cheap = lowestRuns.map(({ t, lowest }) => `${t.track.label.toLowerCase()}: ${lowest.entry.label} at ${costText(lowest.agent)}, against ${name}'s ${costText(t.reference.agent)}`);
  const cheapCaveat = zeroApiCaveat(lowestRuns.map(({ lowest }) => lowest));
  const noCheaper = a.byTrack.filter((t) => t.cheaper.length === 0).map((t) => t.track.label.toLowerCase());
  const kept: Faq[] = a.textKept
    ? [
        {
          question: `Which ${name} alternative keeps the most of a page's text?`,
          answer: textKeptText(a.textKept),
          links: [{ href: "/methodology", label: "How page coverage is measured" }],
        },
      ]
    : [];
  return [
    {
      question: `What is the best ${name} alternative for AI agents?`,
      answer: `${opener} ${best}`,
      links: a.byTrack.map((t) => ({ href: `/${t.track.id}`, label: `${t.track.label} results` })),
    },
    ...kept,
    {
      question: `Which ${name} alternative costs the least per finished task?`,
      answer: `Cost per finished task counts all API and model spend, failures included, divided by tasks done. The cheapest alternative on each track: ${cheap.join("; ")}.${
        noCheaper.length > 0 ? ` On ${listText(noCheaper)}, no alternative cost less than ${name}.` : ""
      }${cheapCaveat ? ` ${cheapCaveat}` : ""}`,
      links: [{ href: "/providers", label: "Every provider's cost" }],
    },
    {
      question: `Were Bright Data, Apify, Crawl4AI, ZenRows, Exa and Tavily tested against ${name}?`,
      answer: `No. ${notTestedAlternatives}`,
      links: [],
    },
  ];
}
