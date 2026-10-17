import type { BarRow } from "@/components/bench/charts";
import { formatCents, formatPct, formatSeconds } from "@/lib/results";
import type { Score, Track } from "@/lib/results";

/** Chart rows for one track, shared by the page and the export cards. Server-safe: no client hooks. */

const CONTROL_LABELS = { none: "Model alone", oracle: "Correct page given" } as const;

/** A success bar, with the cost of each finished task printed after the rate. */
const successRow = (id: string, label: string, s: Score, sub = ""): BarRow => {
  const [lo, hi] = s.ci;
  const range = lo !== null && hi !== null ? `, 95% interval ${formatPct(lo)}–${formatPct(hi)}` : "";
  const cost = s.costPerSuccessUsd === null ? "" : s.costPerSuccessUsd === 0 ? "free" : `${formatCents(s.costPerSuccessUsd)} per task`;
  return { id, label, sub, value: s.rate, text: formatPct(s.rate), extra: cost, detail: `${label}: ${s.successes} of ${s.tasks} tasks done${range}${cost ? `, ${cost}` : ""}` };
};

export function trackRows(track: Track) {
  const ranked = <T extends { value: number }>(rows: T[], better: "higher" | "lower") => rows.sort((a, b) => (better === "higher" ? b.value - a.value : a.value - b.value));
  const scored = track.providers.flatMap((p) => (p.agent ? [{ p, s: p.agent }] : []));

  const success = ranked(
    [
      ...scored.map(({ p, s }) => successRow(p.id, p.label, s)),
      ...(["none", "oracle"] as const).flatMap((k) => {
        const s = track.controls[k];
        return s ? [successRow(k, CONTROL_LABELS[k], s, "control")] : [];
      }),
    ],
    "higher",
  );

  const cost = ranked(
    scored.flatMap(({ p, s }) =>
      s.costPerSuccessUsd === null ? [] : [{ id: p.id, label: p.label, sub: "", value: s.costPerSuccessUsd, text: formatCents(s.costPerSuccessUsd), extra: "", detail: `${p.label}: ${formatCents(s.costPerSuccessUsd)} per finished task, API and model spend, failures included` }],
    ),
    "lower",
  );

  const time = ranked(
    scored.flatMap(({ p, s }) =>
      s.medianMs === null ? [] : [{ id: p.id, label: p.label, sub: "", value: s.medianMs, text: formatSeconds(s.medianMs), extra: "", detail: `${p.label}: median ${formatSeconds(s.medianMs)} over ${s.successes} finished tasks` }],
    ),
    "lower",
  );

  const raw = ranked(
    track.providers.flatMap((p) => (p.raw ? [successRow(p.id, p.label, p.raw)] : [])),
    "higher",
  );

  const tuned = ranked(
    track.providers.flatMap((p) => (p.tuned ? [successRow(p.id, p.label, p.tuned, p.agent ? `default ${formatPct(p.agent.rate)}` : "")] : [])),
    "higher",
  );

  return { success, cost, time, raw, tuned };
}
