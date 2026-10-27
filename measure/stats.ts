// Site-clustered bootstrap, the same algorithm and random stream as src/stats, over plain outcomes.
import { random } from "../src/run/limits.ts";
import { quantile } from "../src/stats/index.ts";

export const SEED = 19019;
export const DRAWS = 10_000;

export type Outcome = { readonly taskId: string; readonly site: string; readonly value: number };
export type Interval = readonly [number | null, number | null];

const mean = (values: readonly Outcome[]) => values.reduce((sum, v) => sum + v.value, 0) / values.length;

/** 95% interval for a mean, resampling whole sites with replacement. Matches src/stats clusteredCI for 0/1 values. */
export function clusteredInterval(rows: readonly Outcome[], seed = SEED, draws = DRAWS): Interval {
  const sites = [...new Set(rows.map((r) => r.site))];
  if (!sites.length) return [null, null];
  const groups = new Map(sites.map((site) => [site, rows.filter((r) => r.site === site)]));
  const rng = random(seed);
  const estimates: number[] = [];
  for (let b = 0; b < draws; b++) {
    const sample = sites.flatMap(() => groups.get(sites[Math.floor(rng() * sites.length)] ?? "") ?? []);
    estimates.push(mean(sample));
  }
  return [quantile(estimates, 0.025), quantile(estimates, 0.975)];
}

/** Paired gap `rows - reference` over shared tasks, resampling sites. Matches src/stats pairedDifference. */
export function pairedGap(rows: readonly Outcome[], reference: readonly Outcome[], seed = SEED, draws = DRAWS) {
  const gold = new Map(reference.map((r) => [r.taskId, r]));
  const pairs = rows.flatMap((row) => {
    const other = gold.get(row.taskId);
    return other && other.site === row.site ? [{ site: row.site, value: row.value - other.value }] : [];
  });
  const sites = [...new Set(pairs.map((p) => p.site))];
  const rng = random(seed);
  const estimates: number[] = [];
  for (let b = 0; b < draws && sites.length; b++) {
    const sample = sites.flatMap(() => {
      const site = sites[Math.floor(rng() * sites.length)];
      return pairs.filter((p) => p.site === site);
    });
    estimates.push(sample.reduce((sum, p) => sum + p.value, 0) / sample.length);
  }
  const ci: Interval = [quantile(estimates, 0.025), quantile(estimates, 0.975)];
  const [low, high] = ci;
  return {
    pairedTasks: pairs.length,
    difference: pairs.length ? pairs.reduce((sum, p) => sum + p.value, 0) / pairs.length : null,
    ci,
    resolved: low !== null && high !== null && (high < 0 || low > 0),
  };
}
