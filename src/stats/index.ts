import type { RunResult } from "../run/result.ts";
import { random } from "../run/limits.ts";
export function quantile(values: readonly number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * p;
  const low = sorted[Math.floor(position)];
  const high = sorted[Math.ceil(position)];
  return low === undefined || high === undefined
    ? null
    : low + (high - low) * (position - Math.floor(position));
}
function rate(rows: readonly RunResult[]): number {
  return rows.filter((r) => r.success).length / rows.length;
}
export function clusteredCI(
  rows: readonly RunResult[],
  seed: number,
  samples = 2000,
): readonly [number | null, number | null] {
  const sites = [...new Set(rows.map((r) => r.site))];
  if (!sites.length) return [null, null];
  const groups = new Map(
    sites.map((site) => [site, rows.filter((r) => r.site === site)]),
  );
  const rng = random(seed);
  const estimates: number[] = [];
  for (let b = 0; b < samples; b++) {
    const sample = sites.flatMap(
      () => groups.get(sites[Math.floor(rng() * sites.length)] ?? "") ?? [],
    );
    estimates.push(rate(sample));
  }
  return [quantile(estimates, 0.025), quantile(estimates, 0.975)];
}
export function pairedDifference(
  rows: readonly RunResult[],
  reference: readonly RunResult[],
  seed: number,
  samples = 2000,
) {
  const gold = new Map(reference.map((r) => [r.taskId, r]));
  const pairs = rows.flatMap((row) => {
    const other = gold.get(row.taskId);
    return other && other.site === row.site
      ? [{ site: row.site, value: Number(row.success) - Number(other.success) }]
      : [];
  });
  const sites = [...new Set(pairs.map((p) => p.site))];
  const rng = random(seed);
  const draws: number[] = [];
  for (let b = 0; b < samples && sites.length; b++) {
    const sample = sites.flatMap(() => {
      const site = sites[Math.floor(rng() * sites.length)];
      return pairs.filter((p) => p.site === site);
    });
    draws.push(sample.reduce((sum, p) => sum + p.value, 0) / sample.length);
  }
  return {
    pairedTasks: pairs.length,
    difference: pairs.length
      ? pairs.reduce((sum, p) => sum + p.value, 0) / pairs.length
      : null,
    ci95: [quantile(draws, 0.025), quantile(draws, 0.975)],
    interpretation: !draws.length
      ? "insufficient data"
      : (quantile(draws, 0.025) ?? 0) <= 0 && (quantile(draws, 0.975) ?? 0) >= 0
        ? "unresolved"
        : "difference detected",
  };
}
export function summarize(
  allRows: readonly RunResult[],
  seed = 1,
  samples = 2000,
) {
  const groups = new Map<string, RunResult[]>();
  for (const row of allRows) {
    const key = JSON.stringify([
      row.track,
      row.provider,
      row.lane,
      row.mode,
      row.cohort,
    ]);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  const summaries = [...groups.values()].map((rows) => {
    const head = rows[0];
    if (!head) throw new Error("Empty group");
    const eligible = rows.filter((r) => r.applicability === "graded");
    const successful = eligible.filter((r) => r.success);
    const totalUsd = rows.reduce((s, r) => s + r.apiUsd + r.modelUsd, 0);
    const errors: Record<string, number> = {};
    for (const row of rows)
      for (const error of row.errors) errors[error] = (errors[error] ?? 0) + 1;
    const families = Object.fromEntries(
      [...new Set(eligible.map((r) => r.family))].map((family) => {
        const members = eligible.filter((r) => r.family === family);
        return [family, { tasks: members.length, successRate: rate(members) }];
      }),
    );
    return {
      track: head.track,
      provider: head.provider,
      lane: head.lane,
      mode: head.mode,
      cohort: head.cohort,
      tasks: eligible.length,
      na: rows.length - eligible.length,
      successes: successful.length,
      successRate: eligible.length ? rate(eligible) : null,
      ci95: clusteredCI(eligible, seed, samples),
      successfulMedianMs: quantile(
        successful.map((r) => r.totalMs),
        0.5,
      ),
      successfulP90Ms: quantile(
        successful.map((r) => r.totalMs),
        0.9,
      ),
      totalUsd,
      costPerSuccessUsd: successful.length
        ? totalUsd / successful.length
        : null,
      errors,
      families,
    };
  });
  const comparisons = summaries
    .filter((s) => !["control", "fake"].includes(s.cohort))
    .map((s) => {
      const peers = summaries.filter(
        (p) =>
          p.track === s.track &&
          p.lane === s.lane &&
          p.mode === s.mode &&
          p.cohort === s.cohort,
      );
      const best = [...peers].sort(
        (a, b) =>
          (b.successRate ?? -1) - (a.successRate ?? -1) ||
          a.provider.localeCompare(b.provider),
      )[0];
      if (!best) throw new Error("Missing peer");
      const matching = (r: RunResult) =>
        r.track === s.track &&
        r.lane === s.lane &&
        r.mode === s.mode &&
        r.cohort === s.cohort &&
        r.applicability === "graded";
      return {
        track: s.track,
        lane: s.lane,
        mode: s.mode,
        cohort: s.cohort,
        provider: s.provider,
        reference: best.provider,
        ...pairedDifference(
          allRows.filter((r) => matching(r) && r.provider === s.provider),
          allRows.filter((r) => matching(r) && r.provider === best.provider),
          seed,
          samples,
        ),
      };
    });
  return {
    methodology: {
      bootstrap:
        "paired site-clustered percentile bootstrap; resample sites with replacement, retaining all tasks per site",
      samples,
      seed,
      multiplicity:
        "Exploratory unadjusted 95% intervals. Multiple comparisons and selecting the best on these same data increase false-positive risk; unresolved is not a tie.",
      cost: "Total API and estimated model spend, including failures, divided by successful tasks. n/a excluded from success denominator.",
      pricing:
        "Model list-price estimates; verify frozen prices before publishing.",
    },
    groups: summaries,
    comparisons,
  };
}
export function markdown(summary: ReturnType<typeof summarize>): string {
  const lines = [
    "# Benchmark results",
    "",
    "Model costs are list-price estimates. Raw n/a tasks are excluded from success rates. Controls and fake adapters are not ranked against providers.",
    "",
    "| Track | Provider | Lane | Mode | Tasks | Success | 95% CI | Median ms | P90 ms | USD/success |",
    "|---|---|---|---|---:|---:|---|---:|---:|---:|",
  ];
  const fmt = (x: number | null, digits = 3) =>
    x === null ? "n/a" : x.toFixed(digits);
  for (const s of summary.groups)
    lines.push(
      `| ${s.track} | ${s.provider} | ${s.lane} | ${s.mode} | ${s.tasks} | ${fmt(s.successRate)} | ${s.ci95.map((x) => fmt(x)).join("–")} | ${fmt(s.successfulMedianMs, 0)} | ${fmt(s.successfulP90Ms, 0)} | ${fmt(s.costPerSuccessUsd, 6)} |`,
    );
  lines.push(
    "",
    "## Paired differences from the best in each cohort",
    "",
    "| Track | Lane | Mode | Provider | Reference | Paired tasks | Difference | 95% CI | Interpretation |",
    "|---|---|---|---|---|---:|---:|---|---|",
  );
  for (const c of summary.comparisons)
    lines.push(
      `| ${c.track} | ${c.lane} | ${c.mode} | ${c.provider} | ${c.reference} | ${c.pairedTasks} | ${fmt(c.difference)} | ${c.ci95.map((x) => fmt(x)).join("–")} | ${c.interpretation} |`,
    );
  lines.push(
    "",
    summary.methodology.multiplicity,
    "",
    "Per-family success and error-class counts are included in summary.json.",
    "",
  );
  return lines.join("\n");
}
