import { cheapest, comparisonsWith, costText, detectedGap, leaders, listText, providerById, rankedRuns, runOn } from "@/lib/catalog";
import type { Comparison, Provider, Run } from "@/lib/catalog";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";

/**
 * Answer-first openings for provider pages: the sentence someone searching "<provider> review" wants, built from results.json.
 * Pages are added one at a time so each change can be evaluated on its own in Search Console.
 */

const ANSWER_FIRST: ReadonlySet<string> = new Set(["contextdev", "tinyfish"]);

/** The provider most searches compare against ("<provider> vs firecrawl"). */
const REFERENCE_ID = "firecrawl";

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
type PairGap = { kind: "tied" } | { kind: "untested" } | { kind: "tested"; real: boolean };

function pairGap(track: Track, a: Run, b: Run): PairGap {
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
    ({ own, other }) => `${lower(own.track)} ${formatPct(own.agent.rate)} vs ${formatPct(other.agent.rate)} of tasks done, at ${costText(own.agent)} vs ${costText(other.agent)} per finished task`,
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
