import { formatCents, formatPct, formatSeconds, results } from "@/lib/results";
import type { Score, Track } from "@/lib/results";

/**
 * Every page beyond the home page is built from this: one entry per provider, track and comparison,
 * all derived from results.json so a new run regenerates them.
 */

export type TrackId = Track["id"];
export type Entry = Track["providers"][number];
/** A provider's default agent run on one track. Providers without an agent score are not listed on that track. */
export type Run = { track: Track; entry: Entry; agent: Score };

export type Provider = { id: string; slug: string; label: string; cohort: string; runs: [Run, ...Run[]] };

/** URL slugs where the provider id isn't how people write the name. */
const SLUGS: Record<string, string> = { contextdev: "context-dev", you: "you-com" };

const COHORTS: Record<string, string> = {
  "content-api": "content API",
  "browser-infra": "browser infrastructure",
  "scraping-infra": "scraping infrastructure",
};
export const cohortLabel = (cohort: string): string => COHORTS[cohort] ?? cohort;

export const tracks = results.tracks;
export const trackById = (id: string): Track | undefined => tracks.find((t) => t.id === id);

const runsOf = (id: string): Run[] => tracks.flatMap((track) => track.providers.flatMap((entry) => (entry.id === id && entry.agent ? [{ track, entry, agent: entry.agent }] : [])));

/** Providers that run three or more jobs share the top tier, so a fourth job doesn't outrank a better score. */
const tierOf = (runs: readonly Run[]): number => Math.min(runs.length, 3);
/** Tasks finished across every job the provider ran, over the tasks it was given. */
const overallRate = (runs: readonly Run[]): number =>
  runs.reduce((a, r) => a + r.agent.successes, 0) / runs.reduce((a, r) => a + r.agent.tasks, 0);
const meanRate = (runs: readonly Run[]): number => runs.reduce((a, r) => a + r.agent.rate, 0) / runs.length;

/** Ranked by jobs run (capped at three), then overall rate, then mean rate per job. */
export const providers: Provider[] = [...new Set(tracks.flatMap((t) => t.providers.map((p) => p.id)))]
  .flatMap((id): Provider[] => {
    const [first, ...rest] = runsOf(id);
    if (!first) return [];
    return [{ id, slug: SLUGS[id] ?? id, label: first.entry.label, cohort: first.entry.cohort, runs: [first, ...rest] }];
  })
  .sort(
    (a, b) =>
      tierOf(b.runs) - tierOf(a.runs) ||
      overallRate(b.runs) - overallRate(a.runs) ||
      meanRate(b.runs) - meanRate(a.runs) ||
      a.label.localeCompare(b.label),
  );

export const providerBySlug = (slug: string): Provider | undefined => providers.find((p) => p.slug === slug);
export const providerById = (id: string): Provider | undefined => providers.find((p) => p.id === id);
export const runOn = (provider: Provider, trackId: TrackId): Run | undefined => provider.runs.find((r) => r.track.id === trackId);

/** Agent runs on a track, best first. */
export const rankedRuns = (track: Track): Run[] =>
  track.providers.flatMap((entry) => (entry.agent ? [{ track, entry, agent: entry.agent }] : [])).sort((a, b) => b.agent.rate - a.agent.rate);

export const leaders = (track: Track): Run[] => {
  const ranked = rankedRuns(track);
  const top = ranked[0]?.agent.rate;
  return ranked.filter((r) => r.agent.rate === top);
};

/** 1 plus the number of providers that finished strictly more tasks, and how many share that place. */
export function placeOn(track: Track, providerId: string): { place: number; tiedWith: number; of: number } {
  const ranked = rankedRuns(track);
  const own = ranked.find((r) => r.entry.id === providerId);
  if (!own) return { place: 0, tiedWith: 0, of: ranked.length };
  return {
    place: 1 + ranked.filter((r) => r.agent.rate > own.agent.rate).length,
    tiedWith: ranked.filter((r) => r.agent.rate === own.agent.rate && r.entry.id !== providerId).length,
    of: ranked.length,
  };
}

/** The gap to the track's leader that cleared chance, if this provider has one. `detected` names providers by label. */
export const detectedGap = (track: Track, label: string) => track.detected.find((d) => d.provider === label);

export const cheapest = (track: Track): Run | undefined =>
  rankedRuns(track)
    .filter((r) => r.agent.costPerSuccessUsd !== null)
    .sort((a, b) => (a.agent.costPerSuccessUsd ?? 0) - (b.agent.costPerSuccessUsd ?? 0))[0];

export const fastest = (track: Track): Run | undefined =>
  rankedRuns(track)
    .filter((r) => r.agent.medianMs !== null)
    .sort((a, b) => (a.agent.medianMs ?? 0) - (b.agent.medianMs ?? 0))[0];

/* Comparisons */

/**
 * Pairs people search for. Only pairs that share a track are published; the rest are dropped at build time.
 * Order is how the name is usually searched, e.g. "firecrawl vs jina".
 */
const PAIRS: readonly (readonly [string, string])[] = [
  ["firecrawl", "contextdev"],
  ["firecrawl", "jina"],
  ["firecrawl", "linkup"],
  ["firecrawl", "tinyfish"],
  ["firecrawl", "scrapfly"],
  ["firecrawl", "spider"],
  ["firecrawl", "browserbase"],
  ["contextdev", "linkup"],
  ["contextdev", "tinyfish"],
  ["contextdev", "scrapfly"],
  ["contextdev", "jina"],
  ["linkup", "tinyfish"],
  ["jina", "scrapfly"],
  ["tinyfish", "browserbase"],
  ["string", "contextdev"],
  ["string", "firecrawl"],
  ["string", "spider"],
  ["string", "scrapfly"],
  ["string", "linkup"],
];

export type Comparison = { slug: string; a: Provider; b: Provider; shared: [Track, ...Track[]] };

export const comparisons: Comparison[] = PAIRS.flatMap(([x, y]): Comparison[] => {
  const a = providerById(x);
  const b = providerById(y);
  if (!a || !b) return [];
  const [first, ...rest] = tracks.filter((t) => runOn(a, t.id) && runOn(b, t.id));
  if (!first) return [];
  return [{ slug: `${a.slug}-vs-${b.slug}`, a, b, shared: [first, ...rest] }];
});

export const comparisonBySlug = (slug: string): Comparison | undefined => comparisons.find((c) => c.slug === slug);
export const comparisonsWith = (provider: Provider): Comparison[] => comparisons.filter((c) => c.a.id === provider.id || c.b.id === provider.id);
export const comparisonsOn = (track: Track): Comparison[] => comparisons.filter((c) => c.shared.some((t) => t.id === track.id));

/* Copy helpers. Every number on the new pages goes through these. */

export const intervalText = (s: Score): string => {
  const [lo, hi] = s.ci;
  return lo !== null && hi !== null ? `${formatPct(lo)}–${formatPct(hi)}` : "not available";
};

export const costText = (s: Score): string => (s.costPerSuccessUsd === null ? "not measured" : formatCents(s.costPerSuccessUsd));
export const timeText = (s: Score): string => (s.medianMs === null ? "not measured" : formatSeconds(s.medianMs));
export const doneText = (s: Score): string => `${s.successes} of ${s.tasks} (${formatPct(s.rate)})`;

export const listText = (items: readonly string[]): string =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export const ordinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/** One sentence on where a provider stands against its track's leader, never claiming more than the interval allows. */
export function standingText(run: Run): string {
  const { track, entry, agent } = run;
  const top = leaders(track);
  const isLeader = top.some((r) => r.entry.id === entry.id);
  const gap = detectedGap(track, entry.label);
  if (gap) {
    return `${entry.label} finished ${Math.round(-gap.difference * 100)} points fewer tasks than ${gap.reference}, the leader. That gap is big enough to rule out chance.`;
  }
  if (isLeader && top.length === 1) {
    const rest = rankedRuns(track).filter((r) => r.entry.id !== entry.id);
    const second = rest[0];
    if (!second) return `${entry.label} was the only provider on this track.`;
    const runnersUp = rest.filter((r) => r.agent.successes === second.agent.successes).map((r) => r.entry.label);
    const cleared = runnersUp.filter((label) => detectedGap(track, label));
    if (cleared.length === runnersUp.length) {
      return `${entry.label} finished the most ${track.label.toLowerCase()} tasks, and its lead over ${listText(runnersUp)} (${formatPct(second.agent.rate)}) is big enough to rule out chance.`;
    }
    return `${entry.label} finished the most ${track.label.toLowerCase()} tasks, but its lead over ${listText(runnersUp.filter((l) => !cleared.includes(l)))} (${formatPct(second.agent.rate)}) is too small to rule out chance.`;
  }
  if (isLeader) return `${entry.label} tied for the most ${track.label.toLowerCase()} tasks with ${listText(top.filter((r) => r.entry.id !== entry.id).map((r) => r.entry.label))}.`;
  const leader = top[0];
  if (!leader) return "";
  return `${entry.label} is behind ${leader.entry.label} (${formatPct(leader.agent.rate)}), but the gap of ${Math.round((leader.agent.rate - agent.rate) * 100)} points is too small to rule out chance.`;
}

/** What the benchmark can and can't say about a pair on one track. Gaps are only tested against the leader. */
export function pairVerdict(track: Track, a: Run, b: Run): string {
  const top = leaders(track);
  const gaps = [a, b].flatMap((r) => {
    const g = detectedGap(track, r.entry.label);
    return g ? [{ run: r, gap: g }] : [];
  });
  const leaderIn = [a, b].find((r) => top.some((t) => t.entry.id === r.entry.id) && top.length === 1);
  const other = leaderIn ? (leaderIn === a ? b : a) : undefined;

  if (leaderIn && other) {
    const g = detectedGap(track, other.entry.label);
    return g
      ? `${leaderIn.entry.label} led this track and finished ${Math.round(-g.difference * 100)} points more tasks than ${other.entry.label}. That gap is big enough to rule out chance.`
      : `${leaderIn.entry.label} led this track, but its gap to ${other.entry.label} is too small to rule out chance.`;
  }
  if (gaps.length > 0) {
    const leader = top[0]?.entry.label ?? "the leader";
    const named = gaps.map((x) => x.run.entry.label);
    const rest = [a, b].filter((r) => !named.includes(r.entry.label)).map((r) => r.entry.label);
    return `${listText(named)} finished clearly fewer tasks than ${leader}, the leader${rest.length ? `, and ${listText(rest)} did not` : ""}. The two weren't tested against each other directly, so this page doesn't call a winner between them.`;
  }
  if (a.agent.successes === b.agent.successes) return `They finished the same number of tasks.`;
  // When the leaders tie, the published comparisons use one of them as the reference, so this pair may have been compared directly.
  const direct = track.population?.comparisons.find((x) => (x.provider === a.entry.label && x.reference === b.entry.label) || (x.provider === b.entry.label && x.reference === a.entry.label));
  if (direct) {
    return `The benchmark compared ${direct.provider} with ${direct.reference}, which tied for the lead, on the same ${direct.pairedTasks} tasks, and this ${Math.round(Math.abs(a.agent.rate - b.agent.rate) * 100)}-point gap is too small to rule out chance.`;
  }
  const wide = [a, b].filter((r) => {
    const [lo, hi] = r.agent.ci;
    return lo !== null && hi !== null && hi - lo >= 0.5;
  });
  const why = wide.length
    ? ` ${listText(wide.map((r) => `${r.entry.label}'s interval runs ${intervalText(r.agent)}`))}, because whole sites are resampled and this track has few of them.`
    : "";
  return `Neither gap to the track's leader cleared chance, and the benchmark doesn't test these two against each other, so this ${Math.round(Math.abs(a.agent.rate - b.agent.rate) * 100)}-point gap isn't a result either can claim.${why}`;
}
