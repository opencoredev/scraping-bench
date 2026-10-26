// Writes measure/out/REPORT.md from the summary. Pure formatting; every number comes from summary.json.
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

type Interval = readonly [number | null, number | null];
type Metric = { successes: number; tasks: number; rate: number | null; ci: Interval };
type SummaryLike = {
  gates: { name: string; pass: boolean; detail: string }[];
  referencePages: { usable: number; changed: number; unavailable: number; withProbes: number };
  tracks: {
    track: string;
    coreTasks: number;
    coreSites: number;
    leader: string | null;
    providers: {
      provider: string;
      tier: string;
      agent: Metric;
      retrieval: Metric;
      costPerSuccessUsd: number | null;
      medianMs: number | null;
      coverage: { pages: number; mean: number | null; ci: Interval } | null;
      medianNoise: number | null;
      medianBytes: number | null;
      answerPast12k: number | null;
      titles: { expected: number; returnedWithTitle: number; returnedNoTitle: number; exact: number; loose: number } | null;
      diagnostics: { parseFailures: number; strictParseFailures: number; readLimitHits: number; argMismatches: number; pagesRead: number; agentPassRetrievalFail: string[] };
    }[];
    gaps: { provider: string; reference: string; difference: number | null; ci: Interval; resolved: boolean }[];
    controls: { none: Metric; correctPage: Metric | null };
    full: { provider: string; tasks: number; retrieval: Metric; coverage: { pages: number; mean: number | null } | null }[];
  }[];
};

const pct = (v: number | null) => (v === null ? "n/a" : `${Math.round(v * 100)}%`);
const ci = ([a, b]: Interval) => (a === null || b === null ? "" : ` (${Math.round(a * 100)}–${Math.round(b * 100)})`);
const score = (m: Metric) => `${m.successes}/${m.tasks} ${pct(m.rate)}${ci(m.ci)}`;
const pts = (v: number | null) => (v === null ? "n/a" : `${v > 0 ? "+" : ""}${Math.round(v * 100)}`);
const cents = (usd: number | null) => (usd === null ? "n/a" : `${(usd * 100).toFixed(2)}¢`);
const secs = (ms: number | null) => (ms === null ? "n/a" : `${(ms / 1000).toFixed(1)} s`);
const kb = (b: number | null) => (b === null ? "n/a" : `${(b / 1000).toFixed(1)} KB`);

export async function writeReport({ summary, out }: { summary: SummaryLike; out: string }) {
  const lines: string[] = ["# v2, re-measured", "", "Every number below comes from the stored v2 provider responses under docs/MEASURE-v2.md. No provider was called again.", ""];
  lines.push("## Build gates", "", "| Gate | Result | Detail |", "|---|---|---|");
  for (const g of summary.gates) lines.push(`| ${g.name} | ${g.pass ? "PASS" : "FAIL"} | ${g.detail} |`);
  lines.push("", `Reference pages: ${summary.referencePages.usable} usable, ${summary.referencePages.changed} changed since the run, ${summary.referencePages.unavailable} unavailable.`, "");
  for (const t of summary.tracks) {
    lines.push(`## ${t.track}`, "", `${t.coreTasks} core tasks from ${t.coreSites} sites. Agent = Haiku finished the task reading the full responses. Retrieval = the answer was in what the provider returned to the agent: every successful response in the task, after dropping repeats.`, "");
    lines.push("| Provider | Tier | Agent | Retrieval | Gap to leader | Cost / finished task | Median time |", "|---|---|---|---|---|---|---|");
    for (const p of [...t.providers].sort((a, b) => (b.agent.rate ?? 0) - (a.agent.rate ?? 0))) {
      const gap = t.gaps.find((g) => g.provider === p.provider);
      const gapText = gap ? `${pts(gap.difference)}${ci(gap.ci)}${gap.resolved ? " resolved" : ""}` : "leader";
      lines.push(`| ${p.provider} | ${p.tier} | ${score(p.agent)} | ${score(p.retrieval)} | ${gapText} | ${cents(p.costPerSuccessUsd)} | ${secs(p.medianMs)} |`);
    }
    lines.push("", `Controls: model alone ${score(t.controls.none)}${t.controls.correctPage ? `; correct page given ${score(t.controls.correctPage)}` : ""}.`, "");
    if (t.track === "scrape") {
      lines.push("| Provider | Page coverage | Median response | Median noise ratio | Answer past 12 KB |", "|---|---|---|---|---|");
      for (const p of t.providers)
        lines.push(`| ${p.provider} | ${p.coverage ? `${pct(p.coverage.mean)}${ci(p.coverage.ci)} over ${p.coverage.pages} pages` : "n/a"} | ${kb(p.medianBytes)} | ${p.medianNoise === null ? "n/a" : `${p.medianNoise.toFixed(1)}×`} | ${p.answerPast12k ?? "n/a"} |`);
      lines.push("");
    }
    if (t.track === "crawl") {
      lines.push("| Provider | Expected pages | Returned with title | Returned, no title | Exact title | Page-specific part matches |", "|---|---|---|---|---|---|");
      for (const p of t.providers) if (p.titles) lines.push(`| ${p.provider} | ${p.titles.expected} | ${p.titles.returnedWithTitle} | ${p.titles.returnedNoTitle} | ${p.titles.exact} | ${p.titles.loose} |`);
      lines.push("");
    }
    lines.push("| Provider | Parse failures | Old strict parser failures | Reading limit hits | Pages read | Arg mismatches | Agent pass, retrieval fail |", "|---|---|---|---|---|---|---|");
    for (const p of t.providers) {
      const d = p.diagnostics;
      lines.push(`| ${p.provider} | ${d.parseFailures} | ${d.strictParseFailures} | ${d.readLimitHits} | ${d.pagesRead} | ${d.argMismatches} | ${d.agentPassRetrievalFail.length ? d.agentPassRetrievalFail.join(", ") : "none"} |`);
    }
    if (t.full.length) {
      lines.push("", "Full sets, descriptive only:", "", "| Provider | Tasks | Retrieval | Page coverage |", "|---|---|---|---|");
      for (const f of t.full) lines.push(`| ${f.provider} | ${f.tasks} | ${score(f.retrieval)} | ${f.coverage ? pct(f.coverage.mean) : "n/a"} |`);
    }
    lines.push("");
  }
  await writeFile(join(out, "REPORT.md"), `${lines.join("\n")}\n`);
}
