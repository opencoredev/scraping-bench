// Writes the website's data file from the measured summary. The site keeps its existing shape:
// `agent` is the replay score, `raw` is retrieval, `controls.oracle` is the correct-page control.
// Labels, task descriptions and limits come from the previous site file, which no measurement changes.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const interval = z.tuple([z.number().nullable(), z.number().nullable()]);
const previousSchema = z.object({
  generatedAt: z.string(),
  tracks: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      what: z.string(),
      limits: z.object({ seconds: z.number(), usd: z.number(), calls: z.number() }),
      population: z.object({ fullClusters: z.number(), sources: z.string(), exclusions: z.array(z.string()) }).passthrough(),
      providers: z.array(z.object({ id: z.string(), label: z.string(), cohort: z.string() }).passthrough()),
    }).passthrough(),
  ),
});
const metric = z.object({ successes: z.number(), tasks: z.number(), rate: z.number().nullable(), ci: interval });
const summarySchema = z.object({
  tracks: z.array(
    z.object({
      track: z.string(),
      coreTasks: z.number(),
      coreSites: z.number(),
      fullTasks: z.number(),
      providers: z.array(
        z.object({
          provider: z.string(),
          tier: z.string(),
          agent: metric,
          retrieval: metric,
          costPerSuccessUsd: z.number().nullable(),
          medianMs: z.number().nullable(),
          coverage: z.object({ pages: z.number(), mean: z.number().nullable(), ci: interval }).nullable(),
          medianNoise: z.number().nullable(),
          medianBytes: z.number().nullable(),
          answerPast12k: z.number().nullable(),
          titles: z.object({ expected: z.number(), returnedWithTitle: z.number(), returnedNoTitle: z.number(), exact: z.number(), loose: z.number() }).nullable(),
        }),
      ),
      gaps: z.array(z.object({ provider: z.string(), reference: z.string(), difference: z.number().nullable(), ci: interval, pairedTasks: z.number(), resolved: z.boolean() })),
      controls: z.object({ none: metric, correctPage: metric.nullable() }),
      full: z.array(z.object({ provider: z.string(), tasks: z.number(), retrieval: metric, coverage: z.object({ pages: z.number(), mean: z.number().nullable() }).nullable() })),
    }),
  ),
});

/** What each track's fine print says about how it was measured. */
const NOTES: Record<string, string> = {
  scrape:
    "Re-measured from the stored v2 responses; no provider was called again. The agent could read every byte of each response, 32 KB at a time. Page coverage compares each response with a copy of the page fetched once on 2026-10-20; pages that changed since the run are left out. Every provider ran on its default settings. Jina Reader ran under a 5,000-token rejecting budget. Most core tasks ask for a docs heading.",
  search:
    "Re-measured from the stored v2 responses; no provider was called again. The agent replay serves the searches the original agent made, in order, and can read every result. Retrieval checks everything the provider returned in the task; install commands and figures reported in millions can pass with the agent and not in retrieval, because the model writes them from what it read.",
  map: "Re-measured from the stored v2 responses; no provider was called again. URLs outside the requested section, query-string variants and non-HTML files don't count; the section's own URL always counts, since it was the tool's input.",
  crawl:
    "Re-measured from the stored v2 responses; no provider was called again. A crawl task is done when the agent returns the right pages. Exact page titles are reported separately and don't decide the score.",
};

const score = (m: z.infer<typeof metric>, extra: { medianMs: number | null; costPerSuccessUsd: number | null }) =>
  m.rate === null ? null : { rate: m.rate, ci: m.ci, successes: m.successes, tasks: m.tasks, ...extra };

export async function writeSiteData({ summary: rawSummary, previousPath, out }: { summary: unknown; previousPath: string; out: string }) {
  const summary = summarySchema.parse(rawSummary);
  const previous = previousSchema.parse(JSON.parse(await readFile(previousPath, "utf8")));
  const tracks = summary.tracks.map((t) => {
    const before = previous.tracks.find((p) => p.id === t.track);
    if (!before) throw new Error(`No site metadata for ${t.track}`);
    const label = (id: string) => before.providers.find((p) => p.id === id)?.label ?? id;
    const named = (g: z.infer<typeof summarySchema>["tracks"][number]["gaps"][number]) => ({ ...g, provider: label(g.provider), reference: label(g.reference) });
    return {
      id: t.track,
      label: before.label,
      what: before.what,
      tasks: t.coreTasks,
      population: {
        fullTasks: t.fullTasks,
        fullClusters: before.population.fullClusters,
        coreClusters: t.coreSites,
        sources: before.population.sources,
        notes: NOTES[t.track] ?? "",
        exclusions: before.population.exclusions,
        fullScores: [],
        comparisons: t.gaps.map(named),
      },
      limits: before.limits,
      providers: t.providers.map((p) => ({
        id: p.provider,
        label: label(p.provider),
        cohort: before.providers.find((b) => b.id === p.provider)?.cohort ?? "",
        agent: score(p.agent, { medianMs: p.medianMs, costPerSuccessUsd: p.costPerSuccessUsd }),
        raw: score(p.retrieval, { medianMs: null, costPerSuccessUsd: null }),
        tuned: null,
        tier: p.tier,
        coverage: p.coverage,
        medianBytes: p.medianBytes,
        medianNoise: p.medianNoise,
        answerPast12k: p.answerPast12k,
        titles: p.titles,
      })),
      controls: {
        none: score(t.controls.none, { medianMs: null, costPerSuccessUsd: null }),
        oracle: t.controls.correctPage ? score(t.controls.correctPage, { medianMs: null, costPerSuccessUsd: null }) : null,
      },
      detected: t.gaps.filter((g) => g.resolved && g.difference !== null).map((g) => ({ provider: label(g.provider), reference: label(g.reference), difference: g.difference ?? 0, ci: g.ci, pairedTasks: g.pairedTasks })),
      full: t.full.map((f) => ({ ...f, label: label(f.provider) })),
    };
  });
  await writeFile(join(out, "site-results.json"), `${JSON.stringify({ runId: "wb-v2", generatedAt: previous.generatedAt, campaignVersion: 2, tracks }, null, 2)}\n`);
}
