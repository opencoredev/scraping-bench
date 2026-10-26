import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { TRACK_LIMITS } from "./run/config.ts";
import type { Track } from "./core/types.ts";

/** Writes site/src/data/results.json, the only data the site reads, from a final run's summary.json. */

const RUN = process.argv[2] ?? "wb-20261017-final";

const ci = z.tuple([z.number().nullable(), z.number().nullable()]);
const track = z.enum(["search", "scrape", "map", "crawl"]);
const group = z.object({
  track,
  provider: z.string(),
  lane: z.enum(["default", "tuned"]),
  mode: z.enum(["agent", "raw"]),
  cohort: z.string(),
  tasks: z.number(),
  successes: z.number(),
  successRate: z.number().nullable(),
  ci95: ci,
  successfulMedianMs: z.number().nullable(),
  costPerSuccessUsd: z.number().nullable(),
  totalUsd: z.number(),
});
const comparisonBase = z.object({
  track,
  lane: z.enum(["default", "tuned"]),
  mode: z.enum(["agent", "raw"]),
  provider: z.string(),
  reference: z.string(),
  pairedTasks: z.number(),
});
const comparison = z.discriminatedUnion("interpretation", [
  comparisonBase.extend({ interpretation: z.literal("insufficient data") }),
  comparisonBase.extend({ interpretation: z.enum(["unresolved", "difference detected"]), difference: z.number(), ci95: ci }),
]);
const leader = z.object({
  provider: z.string(),
  pairedVsLeader: z.discriminatedUnion("interpretation", [
    z.object({ interpretation: z.literal("insufficient data"), pairedTasks: z.number() }),
    z.object({ interpretation: z.enum(["unresolved", "difference detected"]), pairedTasks: z.number(), difference: z.number(), ci95: ci }),
  ]),
});
const summarySchema = z.object({
  runId: z.string(),
  generatedAt: z.string(),
  groups: z.array(group),
  comparisons: z.array(comparison),
  leaderboards: z.record(track, z.array(leader)),
});

const LABELS: Record<string, string> = {
  contextdev: "Context.dev",
  firecrawl: "Firecrawl",
  tinyfish: "TinyFish",
  parallel: "Parallel",
  jina: "Jina",
  spider: "Spider",
  linkup: "Linkup",
  scrapfly: "Scrapfly",
  browserbase: "Browserbase",
  string: "String",
};

const TRACKS: readonly { id: Track; label: string; what: string }[] = [
  { id: "search", label: "Search", what: "Find a fact on the live web: a package's latest version, a filing figure, a release date." },
  { id: "scrape", label: "Scrape", what: "Read one page and pull out exact fields: prices, versions, install commands." },
  { id: "map", label: "Map", what: "List every URL in a section of a site nobody has indexed yet." },
  { id: "crawl", label: "Crawl", what: "Read a whole section of a site and return every record in it." },
];

const summary = summarySchema.parse(JSON.parse(await readFile(`results/${RUN}/summary.json`, "utf8")));
type Group = z.infer<typeof group>;

const score = (g: Group | undefined) =>
  g && g.successRate !== null && g.tasks > 0
    ? { rate: g.successRate, ci: g.ci95, successes: g.successes, tasks: g.tasks, medianMs: g.successfulMedianMs, costPerSuccessUsd: g.costPerSuccessUsd }
    : null;
const find = (t: Track, provider: string, lane: Group["lane"], mode: Group["mode"]) =>
  summary.groups.find((g) => g.track === t && g.provider === provider && g.lane === lane && g.mode === mode);

const model = {
  runId: summary.runId,
  generatedAt: summary.generatedAt,
  tracks: TRACKS.map((t) => {
    const ids = [...new Set(summary.groups.filter((g) => g.track === t.id && g.cohort !== "control").map((g) => g.provider))];
    const limits = TRACK_LIMITS[t.id];
    return {
      ...t,
      tasks: find(t.id, "none", "default", "agent")?.tasks ?? 0,
      limits: { seconds: limits.ms / 1000, usd: limits.usd, calls: limits.calls },
      providers: ids.map((id) => ({
        id,
        label: LABELS[id] ?? id,
        cohort: summary.groups.find((g) => g.track === t.id && g.provider === id)?.cohort ?? "",
        agent: score(find(t.id, id, "default", "agent")),
        raw: score(find(t.id, id, "default", "raw")),
        tuned: score(find(t.id, id, "tuned", "agent")),
      })),
      controls: { none: score(find(t.id, "none", "default", "agent")), oracle: score(find(t.id, "oracle", "default", "agent")) },
      // Each provider against the track's leader on the same tasks, the only comparison the site states.
      detected: (summary.leaderboards[t.id] ?? []).flatMap((g) => {
        const top = summary.leaderboards[t.id]?.[0]?.provider ?? "";
        const c = g.pairedVsLeader;
        return c.interpretation === "difference detected"
          ? [{ provider: LABELS[g.provider] ?? g.provider, reference: LABELS[top] ?? top, difference: c.difference, ci: c.ci95, pairedTasks: c.pairedTasks }]
          : [];
      }),
    };
  }),
};

await mkdir("site/src/data", { recursive: true });
await writeFile("site/src/data/results.json", `${JSON.stringify(model, null, 2)}\n`);
process.stdout.write(`wrote site/src/data/results.json from ${RUN}\n`);
