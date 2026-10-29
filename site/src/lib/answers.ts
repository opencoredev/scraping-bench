import { cheapest, comparisonsWith, costText, detectedGap, leaders, listText, pairVerdict, providerById, rankedRuns, runOn } from "@/lib/catalog";
import type { Comparison, Provider, Run, TrackId } from "@/lib/catalog";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";

/**
 * Answer-first openings for provider pages: the sentence someone searching "<provider> review" wants, built from results.json.
 * Pages are added one at a time so each change can be evaluated on its own in Search Console.
 */

const ANSWER_FIRST: ReadonlySet<string> = new Set(["contextdev", "tinyfish"]);

/** The provider most searches compare against ("<provider> vs firecrawl"). */
export const REFERENCE_ID = "firecrawl";

/** Title overrides that match how people search for a provider. Others use the default provider title. */
export const PROVIDER_TITLES: Partial<Record<string, string>> = {
  contextdev: "Context.dev review: benchmark results for AI agents",
  tinyfish: "TinyFish API benchmark: results and cost for AI agents",
};

const lower = (t: Track) => t.label.toLowerCase();

/** True when every other provider's gap to this sole leader cleared chance. Significance needn't follow score order, so all are checked. */
function leadIsReal(run: Run): boolean {
  const rest = rankedRuns(run.track).filter((r) => r.entry.id !== run.entry.id);
  return rest.length > 0 && rest.every((r) => detectedGap(run.track, r.entry.label));
}

function leadSentence(p: Provider): string | null {
  const led = p.runs.filter((r) => leaders(r.track).some((l) => l.entry.id === p.id));
  if (led.length === 0) return null;
  const parts = led.map((r) => {
    const top = leaders(r.track);
    const of = rankedRuns(r.track).length;
    return `${top.length > 1 ? "tied for the most" : "the most"} ${lower(r.track)} tasks (${formatPct(r.agent.rate)}, of ${of} providers)`;
  });
  const real = led.filter((r) => leaders(r.track).length === 1 && leadIsReal(r));
  const caveat =
    real.length === led.length
      ? "and that lead is big enough to rule out chance"
      : real.length === 0
        ? led.length === 1
          ? "but that lead is too small to rule out chance"
          : led.length === 2
            ? "but neither lead is big enough to rule out chance"
            : "but none of those leads is big enough to rule out chance"
        : `but only the ${listText(real.map((r) => lower(r.track)))} lead is big enough to rule out chance`;
  return `${p.label} finished ${listText(parts)}, ${caveat}.`;
}

function costSentences(p: Provider, subject: string): string[] {
  const cheap = p.runs.filter((r) => cheapest(r.track)?.entry.id === p.id);
  if (cheap.length === 0) return [];
  const out = [`${subject} had the lowest cost per finished task on ${listText(cheap.map((r) => `${lower(r.track)} (${costText(r.agent)})`))}, counting API and model spend, failures included.`];
  if (cheap.some((r) => r.entry.raw?.costPerSuccessUsd === 0)) {
    out.push(`No API charge was recorded for its calls on the test account, so that figure is mostly the model's spend. Check ${p.label}'s current pricing for your own volume.`);
  }
  return out;
}

/**
 * The benchmark only tests each provider's gap to its track's sole leader. A pair is tested when one of the two led alone;
 * the gap is real when the other's gap to it cleared chance.
 */
export type PairGap = { kind: "tied" } | { kind: "untested" } | { kind: "tested"; real: boolean };

export function pairGap(track: Track, a: Run, b: Run): PairGap {
  if (a.agent.successes === b.agent.successes && a.agent.tasks === b.agent.tasks) return { kind: "tied" };
  const top = leaders(track);
  const leaderId = top.length === 1 ? top[0]?.entry.id : undefined;
  const other = a.entry.id === leaderId ? b : b.entry.id === leaderId ? a : undefined;
  if (!other) return { kind: "untested" };
  return { kind: "tested", real: detectedGap(track, other.entry.label) !== undefined };
}

function referenceSentences(p: Provider): { text: string[]; comparison: Comparison | undefined } {
  const ref = providerById(REFERENCE_ID);
  if (!ref || ref.id === p.id) return { text: [], comparison: undefined };
  const pairs = p.runs.flatMap((r) => {
    const other = runOn(ref, r.track.id);
    return other ? [{ own: r, other }] : [];
  });
  if (pairs.length === 0) return { text: [], comparison: undefined };
  const figures = pairs.map(
    ({ own, other }) =>
      `${lower(own.track)} ${formatPct(own.agent.rate)} vs ${formatPct(other.agent.rate)} of tasks done${
        own.agent.costPerSuccessUsd !== null && other.agent.costPerSuccessUsd !== null ? `, at ${costText(own.agent)} vs ${costText(other.agent)} per finished task` : ""
      }`,
  );
  const gaps = pairs.map(({ own, other }) => ({ track: lower(own.track), gap: pairGap(own.track, own, other) }));
  const real = gaps.flatMap((g) => (g.gap.kind === "tested" && g.gap.real ? [g.track] : []));
  const noise = gaps.flatMap((g) => (g.gap.kind === "tested" && !g.gap.real ? [g.track] : []));
  const tied = gaps.flatMap((g) => (g.gap.kind === "tied" ? [g.track] : []));
  const untested = gaps.flatMap((g) => (g.gap.kind === "untested" ? [g.track] : []));
  const verdict = [
    tied.length > 0 ? `They finished the same number of ${listText(tied)} tasks.` : null,
    real.length > 0 ? `The ${listText(real)} gap in tasks done cleared chance.` : null,
    noise.length > 0 ? `The ${listText(noise)} ${noise.length === 1 ? "gap" : "gaps"} in tasks done ${noise.length === 1 ? "is" : "are"} too small to rule out chance.` : null,
    untested.length > 0 ? `On ${listText(untested)}, neither led, so the benchmark didn't test the two against each other.` : null,
  ]
    .filter((s): s is string => s !== null)
    .join(" ");
  return {
    text: [`Against ${ref.label}, on the same tasks: ${figures.join("; ")}. ${verdict}`],
    comparison: comparisonsWith(p).find((c) => c.a.id === ref.id || c.b.id === ref.id),
  };
}

/** `summary` is what the provider did; `versus` sets it against the reference provider, when both ran a track. */
export type ProviderAnswer = { summary: [string, ...string[]]; versus: string[]; comparison: Comparison | undefined };

/** The opening answer for a provider page, or null for pages that keep the default intro. */
export function providerAnswer(p: Provider): ProviderAnswer | null {
  if (!ANSWER_FIRST.has(p.id)) return null;
  const lead = leadSentence(p);
  const [first, ...rest] = [lead, ...costSentences(p, lead ? "It" : p.label)].filter((s): s is string => s !== null);
  const ref = referenceSentences(p);
  return first ? { summary: [first, ...rest], versus: ref.text, comparison: ref.comparison } : null;
}

/**
 * Compare pages that open with a short answer, and the track each leads with: the one the page is searched for, or the
 * one whose gap is real. Added one at a time, like ANSWER_FIRST, so each change can be evaluated on its own.
 */
const PAIR_LEADS: Partial<Record<string, TrackId>> = {
  "firecrawl-vs-context-dev": "scrape",
  "context-dev-vs-scrapfly": "crawl",
};

/** The pair's shared tracks, lead track first when the page has one. Others keep results order. */
export function pairTracks(c: Comparison): Track[] {
  const lead = PAIR_LEADS[c.slug];
  return [...c.shared].sort((x, y) => Number(y.id === lead) - Number(x.id === lead));
}

/** True when neither run's gap to its track's leader cleared chance, so nothing can be said about the gap between them. */
const neitherDetected = (track: Track, a: Run, b: Run): boolean => !detectedGap(track, a.entry.label) && !detectedGap(track, b.entry.label);

/**
 * What the benchmark can say about this pair's gap on one track, never more than it tested. An untested pair can still
 * sit in a track's comparison table when one of the two tied for the lead, so the copy only says what holds either way.
 */
function gapSentence(track: Track, a: Run, b: Run): string | null {
  const gap = pairGap(track, a, b);
  switch (gap.kind) {
    case "tied":
      return null;
    case "untested":
      return neitherDetected(track, a, b)
        ? `Neither one's gap to the ${lower(track)} leader cleared chance, so this ${Math.round(Math.abs(a.agent.rate - b.agent.rate) * 100)}-point gap isn't a result either can claim.`
        : pairVerdict(track, a, b);
    case "tested":
      return gap.real ? "That gap is big enough to rule out chance." : "That gap is too small to rule out chance.";
    default: {
      const _exhaustive: never = gap;
      return _exhaustive;
    }
  }
}

function leadSentences(track: Track, a: Run, b: Run): string {
  const [hi, lo] = b.agent.rate > a.agent.rate ? [b, a] : [a, b];
  const of = (r: Run) => `${r.agent.successes} of ${r.agent.tasks}`;
  const done =
    hi.agent.successes === lo.agent.successes
      ? `On ${lower(track)}, ${a.entry.label} and ${b.entry.label} both finished ${of(a)} tasks (${formatPct(a.agent.rate)}).`
      : `On ${lower(track)}, ${hi.entry.label} finished ${of(hi)} tasks (${formatPct(hi.agent.rate)}) and ${lo.entry.label} ${of(lo)} (${formatPct(lo.agent.rate)}).`;
  const priced = [a, b].filter((r) => r.agent.costPerSuccessUsd !== null).sort((x, y) => (x.agent.costPerSuccessUsd ?? 0) - (y.agent.costPerSuccessUsd ?? 0));
  const [cheap, dear] = priced;
  const cost =
    cheap && dear && cheap.agent.costPerSuccessUsd !== dear.agent.costPerSuccessUsd
      ? `${cheap.entry.label} cost less per finished task, ${costText(cheap.agent)} against ${costText(dear.agent)}.`
      : null;
  return [done, gapSentence(track, a, b), cost].filter((s): s is string => s !== null).join(" ");
}

function restSentences(pairs: readonly { track: Track; a: Run; b: Run }[]): string {
  const figures = pairs.map(({ track, a, b }) => `${lower(track)}, ${a.entry.label} ${formatPct(a.agent.rate)} and ${b.entry.label} ${formatPct(b.agent.rate)}`);
  const gaps = pairs.map(({ track, a, b }) => ({ track: lower(track), gap: pairGap(track, a, b) }));
  const real = gaps.flatMap((g) => (g.gap.kind === "tested" && g.gap.real ? [g.track] : []));
  const noise = gaps.flatMap((g) => (g.gap.kind === "tested" && !g.gap.real ? [g.track] : []));
  const tied = gaps.flatMap((g) => (g.gap.kind === "tied" ? [g.track] : []));
  const untested = pairs.flatMap(({ track, a, b }) => (pairGap(track, a, b).kind === "untested" && neitherDetected(track, a, b) ? [lower(track)] : []));
  const elsewhere = pairs.flatMap(({ track, a, b }) => (pairGap(track, a, b).kind === "untested" && !neitherDetected(track, a, b) ? [`On ${lower(track)}: ${pairVerdict(track, a, b)}`] : []));
  return [
    `On the other ${pairs.length === 1 ? "track" : "tracks"} both ran, tasks done were: ${figures.join("; ")}.`,
    tied.length > 0 ? `They finished the same number of ${listText(tied)} tasks.` : null,
    real.length > 0 ? `The ${listText(real)} ${real.length === 1 ? "gap clears" : "gaps clear"} chance.` : null,
    noise.length > 0 ? `The ${listText(noise)} ${noise.length === 1 ? "gap is" : "gaps are"} too small to rule out chance.` : null,
    untested.length > 0
      ? `On ${listText(untested)}, neither one's gap to the track's leader cleared chance, so ${untested.length === 1 ? "that gap isn't a result" : "those gaps aren't results"} either can claim.`
      : null,
    ...elsewhere,
  ]
    .filter((s): s is string => s !== null)
    .join(" ");
}

/** `lead` is the short answer on the lead track; `rest` sums up the other shared tracks, when there are any. */
export type PairAnswer = { lead: string; rest: string | null };

/** The opening answer for a compare page, or null for pages that keep the default intro. */
export function pairAnswer(c: Comparison): PairAnswer | null {
  if (PAIR_LEADS[c.slug] === undefined) return null;
  const pairs = pairTracks(c).flatMap((track) => {
    const a = runOn(c.a, track.id);
    const b = runOn(c.b, track.id);
    return a && b ? [{ track, a, b }] : [];
  });
  const [first, ...rest] = pairs;
  if (!first) return null;
  return { lead: leadSentences(first.track, first.a, first.b), rest: rest.length > 0 ? restSentences(rest) : null };
}
