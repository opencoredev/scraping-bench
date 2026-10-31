import { comparisons, costText, doneText, intervalText, leaders, providers, rankedRuns, standingText, tracks } from "@/lib/catalog";
import { results } from "@/lib/results";
import { MODEL, RESULTS_JSON_RAW, SITE_URL, absoluteUrl, notTestedText } from "@/lib/site";
import { PROVIDER_NOTES } from "@/lib/notes";
import { ALTERNATIVES_PATH } from "@/lib/alternatives";
import { COST_PATH } from "@/lib/cost";

export const dynamic = "force-static";

/** llms.txt (llmstxt.org): a plain summary for AI assistants, rebuilt from results.json with every deploy. */
function body(): string {
  const lines: string[] = [
    "# scrapingbench",
    "",
    `> A benchmark of ${providers.length} web data APIs for AI agents (${providers.map((p) => p.label).join(", ")}) on four tracks: scrape, search, map and crawl. Every provider gets the same tasks, the same model (${MODEL}), the same prompt and the same limits. A task counts only when a script confirms every field of the answer. Run ${results.runId}.`,
    "",
    "Most gaps between providers are too small to call. Tasks from the same site are counted as one group, and the 95% intervals come from resampling whole sites, so only gaps whose interval excludes zero are reported as real.",
    "",
    notTestedText(results),
    "",
    ...(results.campaignVersion === 2
      ? [`These are the v2 results. The earlier, smaller v1 run is at ${absoluteUrl("/v1")}.`, ""]
      : []),
    "## Results",
    "",
  ];
  for (const t of tracks) {
    lines.push(`### ${t.label} (${t.tasks} tasks): ${t.what}`, "");
    for (const r of rankedRuns(t)) lines.push(`- ${r.entry.label}: ${doneText(r.agent)} tasks done, 95% interval ${intervalText(r.agent)}, ${costText(r.agent)} per finished task`);
    const lead = leaders(t)[0];
    lines.push("", lead ? standingText(lead) : "", ...t.detected.map((d) => `Gap that rules out chance: ${d.reference} finished ${Math.round(-d.difference * 100)} points more tasks than ${d.provider}.`), "");
  }
  lines.push("## Caveats", "");
  for (const p of providers) for (const n of PROVIDER_NOTES[p.id] ?? []) lines.push(`- ${p.label}: ${n.text}`);
  lines.push(
    "",
    "## Pages",
    "",
    `- [Results](${SITE_URL}): all four tracks with charts`,
    ...tracks.map((t) => `- [${t.label}](${absoluteUrl(`/${t.id}`)}): ${t.what}`),
    ...providers.map((p) => `- [${p.label}](${absoluteUrl(`/providers/${p.slug}`)}): ${p.label}'s results on ${p.runs.map((r) => r.track.label.toLowerCase()).join(", ")}`),
    ...comparisons.map((c) => `- [${c.a.label} vs ${c.b.label}](${absoluteUrl(`/compare/${c.slug}`)})`),
    `- [Firecrawl alternatives](${absoluteUrl(ALTERNATIVES_PATH)}): every tested provider against Firecrawl, track by track`,
    `- [Methodology](${absoluteUrl("/methodology")}): how tasks are graded and when a gap counts`,
    `- [Cost per finished task](${absoluteUrl(COST_PATH)}): what the cost figure means and the cheapest provider on each track`,
    `- [FAQ](${absoluteUrl("/faq")})`,
    "",
    "## Data",
    "",
    `- [results.json](${RESULTS_JSON_RAW}): every number on the site, MIT licensed`,
    "",
  );
  return lines.join("\n");
}

export function GET(): Response {
  return new Response(body(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
