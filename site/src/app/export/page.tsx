import type { Metadata } from "next";
import { Bars } from "@/components/bench/charts";
import { TaskDiagram } from "@/components/bench/diagram";
import { results } from "@/lib/results";
import type { Track } from "@/lib/results";
import { trackRows } from "@/lib/rows";
import { colorOf } from "@/lib/colors";
import { fillStyle } from "@/lib/dither";
import { formatCents, formatPct } from "@/lib/results";
import type { Score } from "@/lib/results";

/** 1200×675 cards (X's 16:9 image size) for posts: each track's diagram and its results, screenshotted into exports/. */

export const metadata: Metadata = { title: "webbench cards for export", robots: { index: false } };

const URL = "web-data-bench.vercel.app";

function Card({ id, title, footer, children }: { id: string; title: string; footer: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex h-[675px] w-[1200px] shrink-0 flex-col justify-between bg-background px-14 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-medium tracking-[-0.02em]">{title}</h1>
        <span className="text-lg font-medium tracking-[-0.03em]">
          web<span className="text-muted-foreground">bench</span>
        </span>
      </div>
      {children}
      <div className="flex items-baseline justify-between gap-8 text-base text-muted-foreground">
        <p className="max-w-[880px] text-pretty">{footer}</p>
        <span className="shrink-0">{URL}</span>
      </div>
    </section>
  );
}

function gapLine(track: Track) {
  const d = track.detected;
  if (d.length === 0) return `No gap here is big enough to rule out chance on ${track.tasks} tasks.`;
  return `${d.map((g) => `${g.reference} finished ${Math.round(-g.difference * 100)} points more than ${g.provider}`).join("; ")}, the only gap that rules out chance.`;
}

/** Every provider against every track: the one-image summary of the whole run. */
function Overview() {
  const tracks = results.tracks;
  const ids = [...new Set(tracks.flatMap((t) => t.providers.filter((p) => p.agent).map((p) => p.id)))];
  const labelOf = (id: string) => tracks.flatMap((t) => t.providers).find((p) => p.id === id)?.label ?? id;
  const scoreOf = (id: string, t: Track) => t.providers.find((p) => p.id === id)?.agent ?? null;
  const best = (t: Track) => Math.max(...t.providers.flatMap((p) => (p.agent ? [p.agent.rate] : [])));
  const offered = (id: string) => tracks.filter((t) => scoreOf(id, t)).length;
  const mean = (id: string) => tracks.reduce((a, t) => a + (scoreOf(id, t)?.rate ?? 0), 0);
  ids.sort((a, b) => offered(b) - offered(a) || mean(b) - mean(a));
  const total = tracks.reduce((a, t) => a + t.tasks, 0);

  const Cell = ({ s, color, lead }: { s: Score | null; color: string; lead: boolean }) =>
    s === null ? (
      <span className="text-muted-foreground/40">—</span>
    ) : (
      <span className="flex items-center gap-3">
        <span className="relative h-3.5 w-[96px] shrink-0 bg-foreground/[0.06]">
          <span className="absolute inset-y-0 left-0" style={{ width: `${Math.max(s.rate * 100, 1)}%`, ...fillStyle("gradient", { color, edge: "right", length: 12, to: 0.25 }) }} />
          {s.rate > 0 ? <span className="absolute inset-y-0 w-[2px]" style={{ left: `calc(${s.rate * 100}% - 2px)`, background: color }} /> : null}
        </span>
        <span className={`w-11 text-[17px] tabular-nums ${lead ? "font-semibold text-foreground" : ""}`}>{formatPct(s.rate)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{s.costPerSuccessUsd === null ? "" : s.costPerSuccessUsd === 0 ? "free" : formatCents(s.costPerSuccessUsd)}</span>
      </span>
    );

  return (
    <Card
      id="overview"
      title={`${ids.length} web data APIs, ${tracks.length} jobs, ${total} tasks`}
      footer="One agent, one model, one tool. Only the API behind it changes. A script checks every answer. Bold is the top score per job; the small figure is cost per finished task. — means not run."
    >
      <div className="grid grid-cols-[150px_repeat(4,1fr)] items-center gap-x-6 gap-y-[9px] py-4">
        <span />
        {tracks.map((t) => (
          <span key={t.id} className="text-sm text-muted-foreground">
            <span className="text-base font-medium text-foreground">{t.label}</span> · {t.tasks} tasks
          </span>
        ))}
        {ids.map((id) => (
          <div key={id} className="col-span-5 grid grid-cols-subgrid items-center border-t border-foreground/[0.07] pt-[9px]">
            <span className="text-[17px] font-medium" style={{ color: colorOf(id) }}>{labelOf(id)}</span>
            {tracks.map((t) => {
              const s = scoreOf(id, t);
              return <Cell key={t.id} s={s} color={colorOf(id)} lead={s !== null && s.rate === best(t)} />;
            })}
          </div>
        ))}
        <div className="col-span-5 grid grid-cols-subgrid items-center border-t border-foreground/[0.07] pt-[9px]">
          <span className="text-[17px] font-medium text-muted-foreground">
            Model alone <span className="text-xs font-normal">control</span>
          </span>
          {tracks.map((t) => <Cell key={t.id} s={t.controls.none} color="var(--muted-foreground)" lead={false} />)}
        </div>
      </div>
    </Card>
  );
}

export default function Export() {
  return (
    <div className="flex flex-col items-start gap-10 p-10">
      <Overview />
      {results.tracks.map((t) => (
        <Card key={t.id} id={`export-${t.id}`} title={`How a ${t.label.toLowerCase()} task runs`} footer="Same model, same prompt, same limits for every provider. Only the API behind the tool changes.">
          <TaskDiagram track={t} layout="wide" className="w-full" />
        </Card>
      ))}
      {results.tracks.map((t) => (
        <Card key={t.id} id={`results-${t.id}`} title={`${t.label}: tasks done, out of ${t.tasks}`} footer={`Every answer checked by script. Cost is all API and model spend per finished task. ${gapLine(t)}`}>
          <div className="flex flex-1 flex-col justify-center py-6 text-lg">
            <Bars rows={trackRows(t).success} empty="No results." scaleMax={1} />
          </div>
        </Card>
      ))}
    </div>
  );
}
