import { costText, doneText, leaders, listText, rankedRuns, tracks } from "@/lib/catalog";
import type { Run } from "@/lib/catalog";
import { cheapestFaq } from "@/lib/faq";
import type { Faq } from "@/lib/faq";
import type { Track } from "@/lib/results";
import { MODEL } from "@/lib/site";

export { COST_PATH } from "@/lib/site";

/**
 * The /cost-per-finished-task explainer: what the metric every table uses means, and what it showed on each track.
 * Every figure comes from results.json through the catalog helpers.
 */

/** The definition, worded like the methodology page so the two never disagree. */
export const COST_DEFINITION = `Cost per finished task is all the API and model spend on a track, failed tasks included, divided by the tasks the agent finished. Model cost is a list-price estimate for ${MODEL}.`;

/** `priced` is every run with a measured cost, cheapest first. Both ends exist because a track only gets here with one priced run. */
export type TrackCost = { track: Track; priced: [Run, ...Run[]]; cheapest: Run; dearest: Run };

const lower = (t: Track) => t.label.toLowerCase();
const usd = (n: number): string => `$${n.toFixed(2)}`;

function onTrack(track: Track): TrackCost | null {
  const sorted = rankedRuns(track)
    .filter((r) => r.agent.costPerSuccessUsd !== null)
    .sort((a, b) => (a.agent.costPerSuccessUsd ?? 0) - (b.agent.costPerSuccessUsd ?? 0));
  const [cheapest, ...rest] = sorted;
  if (!cheapest) return null;
  return { track, priced: [cheapest, ...rest], cheapest, dearest: rest[rest.length - 1] ?? cheapest };
}

export const trackCosts: readonly TrackCost[] = tracks.flatMap((t) => onTrack(t) ?? []);

/** Tracks with no measured cost (none in v2's headline data so far, but a replayed track can drop its cost). */
export const unpricedTracks: readonly Track[] = tracks.filter((t) => !trackCosts.some((c) => c.track.id === t.id));

/** "1.4" or "6": how many times the lowest cost the highest one is. */
function times(c: TrackCost): string | null {
  const lo = c.cheapest.agent.costPerSuccessUsd;
  const hi = c.dearest.agent.costPerSuccessUsd;
  if (lo === null || hi === null || lo === 0 || c.dearest.entry.id === c.cheapest.entry.id) return null;
  const x = hi / lo;
  return x >= 3 ? `${Math.round(x)}` : x.toFixed(1);
}

/** What cost per finished task showed on one track: the cheapest (rounded ties shown together), who finished the most, and the spread. */
export function trackCostText(c: TrackCost): string {
  const shown = costText(c.cheapest.agent);
  const lowest = c.priced.filter((r) => costText(r.agent) === shown);
  const top = leaders(c.track);
  const topText = (rs: readonly Run[]) => listText(rs.map((r) => r.entry.label));
  const isLowest = (r: Run) => lowest.some((l) => l.entry.id === r.entry.id);
  const lowestTop = top.filter(isLowest);
  const restTop = top.filter((r) => !isLowest(r));
  const spread = times(c);
  const [one] = lowest;
  const cheapSentence =
    lowest.length === 1 && one
      ? `${one.entry.label} cost the least per finished ${lower(c.track)} task, ${shown}, and finished ${doneText(one.agent)}.`
      : `${topText(lowest)} cost the least per finished ${lower(c.track)} task, ${shown} each.`;
  const doneOfTop = doneText((top[0] ?? c.cheapest).agent);
  const costsOf = (rs: readonly Run[]) => listText(rs.map((r) => costText(r.agent)));
  const topSentence =
    lowestTop.length === 0
      ? `${topText(restTop)} finished the most tasks, ${doneOfTop}, at ${costsOf(restTop)} per finished task.`
      : restTop.length > 0
        ? lowest.length === 1
          ? `That ties it with ${topText(restTop)} for the most tasks done.`
          : `${topText(lowestTop)} also tied for the most tasks done, ${doneOfTop}, with ${topText(restTop)}.`
        : lowest.length === 1 && top.length === 1
          ? "No provider finished more tasks on this track."
          : `${topText(lowestTop)} also finished the most tasks, ${doneOfTop}.`;
  return [cheapSentence, topSentence, spread ? `The highest cost per finished task, ${c.dearest.entry.label}'s ${costText(c.dearest.agent)}, is ${spread} times the lowest.` : null]
    .filter((s): s is string => s !== null)
    .join(" ");
}

/** The budget each task ran under. Going over it fails the task, so its spend counts with nothing to show for it. */
export const limitText = (t: Track): string =>
  `Each ${lower(t)} task could use up to ${t.limits.calls} tool ${t.limits.calls === 1 ? "call" : "calls"}, ${t.limits.seconds} seconds and ${usd(t.limits.usd)}. A task that went over failed, and its spend still counts.`;

const callsText = listText(tracks.map((t) => `${t.limits.calls} on ${lower(t)}`));

/** Short answers for the page and its FAQPage JSON-LD, so both say exactly the same thing. */
export const costFaqs: readonly Faq[] = [
  {
    question: "What does cost per finished task mean for a scraping API?",
    answer: `${COST_DEFINITION} A task counts as finished only when a script confirms every field of the agent's answer, so the figure is what one correct answer cost.`,
    links: [{ href: "/methodology", label: "Methodology" }],
  },
  {
    question: "How is cost per finished task different from price per request?",
    answer: `A price per request or per credit is what one call costs. An agent can make several calls per task (up to ${callsText} here), pays the model to read every response, and fails some tasks. Cost per finished task puts all of that over the tasks that came out right, so an API with cheap calls that often fail can cost more per finished task than one with pricier calls that work. Billing only for successful requests is a different thing: a request can succeed and the task still fail because the answer is wrong, and the model's spend is paid either way.`,
    links: [],
  },
  { ...cheapestFaq(), links: [{ href: "/providers", label: "Every provider's cost" }] },
  {
    question: "How far can these cost figures be trusted?",
    answer: `They come from one benchmark run, from one server, with ${MODEL} as the only agent model, at test volume. The task scores have 95% intervals, but the costs don't, so a small cost difference isn't a ranking. Check each provider's current pricing for your own volume.`,
    links: [{ href: "/faq", label: "FAQ" }],
  },
];
