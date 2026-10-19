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

/** True when every runner-up's gap to this sole leader cleared chance. */
function leadIsReal(run: Run): boolean {
  const rest = rankedRuns(run.track).filter((r) => r.entry.id !== run.entry.id);
  const second = rest[0];
  if (!second) return false;
  return rest.filter((r) => r.agent.rate === second.agent.rate).every((r) => detectedGap(run.track, r.entry.label));
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

/** A gap between two providers is only a result when one of them led the track alone and the other's gap to it cleared chance. */
function gapIsReal(track: Track, a: Run, b: Run): boolean {
  const top = leaders(track);
  if (top.length !== 1) return false;
  const leaderId = top[0]?.entry.id;
  const other = a.entry.id === leaderId ? b : b.entry.id === leaderId ? a : undefined;
  return other !== undefined && detectedGap(track, other.entry.label) !== undefined;
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
  const real = pairs.filter(({ own, other }) => gapIsReal(own.track, own, other)).map(({ own }) => lower(own.track));
  const verdict =
    real.length === 0
      ? "None of those gaps in tasks done is a result either provider can claim: none cleared chance."
      : `Only the ${listText(real)} gap in tasks done cleared chance.`;
  return {
    text: [`Against ${ref.label}, on the same tasks: ${figures.join("; ")}. ${verdict}`],
    comparison: comparisonsWith(p).find((c) => c.a.id === ref.id || c.b.id === ref.id),
  };
}

export type ProviderAnswer = { sentences: [string, ...string[]]; comparison: Comparison | undefined };

/** The opening answer for a provider page, or null for pages that keep the default intro. */
export function providerAnswer(p: Provider): ProviderAnswer | null {
  if (!ANSWER_FIRST.has(p.id)) return null;
  const ref = referenceSentences(p);
  const lead = leadSentence(p);
  const [first, ...rest] = [lead, ...costSentences(p, lead ? "It" : p.label), ...ref.text].filter((s): s is string => s !== null);
  return first ? { sentences: [first, ...rest], comparison: ref.comparison } : null;
}
