import type { Metadata } from "next";
import { Bars } from "@/components/bench/charts";
import { TaskDiagram } from "@/components/bench/diagram";
import { results } from "@/lib/results";
import type { Track } from "@/lib/results";
import { trackRows } from "@/lib/rows";
import { providers } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { fillStyle } from "@/lib/dither";
import { formatCents, formatPct } from "@/lib/results";
import type { Score } from "@/lib/results";

/** 1200×675 cards (X's 16:9 image size) for posts: each track's diagram and its results, screenshotted into exports/. */

export const metadata: Metadata = { title: "scrapingbench cards for export", robots: { index: false } };

const URL = "scrapingbench.com";

function Card({ id, title, footer, children }: { id: string; title: string; footer: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex h-[675px] w-[1200px] shrink-0 flex-col justify-between bg-background px-14 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-medium tracking-[-0.02em]">{title}</h1>
        <span className="text-lg font-medium tracking-[-0.03em]">
          scraping<span className="text-muted-foreground">bench</span>
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

/** Every provider against every track: the one-image summary of the whole run. */
function Overview() {
  const tracks = results.tracks;
  const ids = providers.map((p) => p.id);
  const labelOf = (id: string) => tracks.flatMap((t) => t.providers).find((p) => p.id === id)?.label ?? id;
  const scoreOf = (id: string, t: Track) => t.providers.find((p) => p.id === id)?.agent ?? null;
  const best = (t: Track) => Math.max(...t.providers.flatMap((p) => (p.agent ? [p.agent.rate] : [])));
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
      title={`${ids.length} web data APIs, ${tracks.length} jobs, ${total} core tasks`}
      footer=""
    >
      <div className="grid grid-cols-[150px_repeat(4,1fr)] items-center gap-x-6 gap-y-[6px] py-2">
        <span />
        {tracks.map((t) => (
          <span key={t.id} className="text-sm text-muted-foreground">
            <span className="text-base font-medium text-foreground">{t.label}</span> · {t.tasks} tasks
          </span>
        ))}
        {ids.map((id) => (
          <div key={id} className="col-span-5 grid grid-cols-subgrid items-center border-t border-foreground/[0.07] pt-[6px]">
            <span className="text-[17px] font-medium" style={{ color: colorOf(id) }}>{labelOf(id)}</span>
            {tracks.map((t) => {
              const s = scoreOf(id, t);
              return <Cell key={t.id} s={s} color={colorOf(id)} lead={s !== null && s.rate === best(t)} />;
            })}
          </div>
        ))}
        <div className="col-span-5 grid grid-cols-subgrid items-center border-t border-foreground/[0.07] pt-[6px]">
          <span className="text-[17px] font-medium text-muted-foreground">
            Model alone <span className="text-xs font-normal">control</span>
          </span>
          {tracks.map((t) => <Cell key={t.id} s={t.controls.none} color="var(--muted-foreground)" lead={false} />)}
        </div>
      </div>
    </Card>
  );
}

/** The confident gaps in one short line, so a share card's footer never overflows. */
const cardGaps = (t: Track): string => {
  const [first] = t.detected;
  if (!first) return "No gap between providers clears chance on these tasks.";
  const list = t.detected.map((d) => d.provider).join(", ");
  return `Clearly behind ${first.reference}: ${list}. Every other gap could be chance.`;
};

export default function Export() {
  return (
    <div className="flex flex-col items-start gap-10 p-10">
      <Overview />
      {results.tracks.map((t) => (
        <Card key={t.id} id={`export-${t.id}`} title={`How a ${t.label.toLowerCase()} task runs`} footer="Illustrative task shape. Same model, prompt and limits. Headline results use identical core tasks.">
          <TaskDiagram track={t} layout="wide" className="w-full" linked={false} />
        </Card>
      ))}
      {results.tracks.map((t) => (
        <Card key={t.id} id={`results-${t.id}`} title={`${t.label}: tasks done, out of ${t.tasks} core tasks`} footer={`Every answer checked by script. Cost is all API and model spend per finished task. ${cardGaps(t)}`}>
          <div className="flex flex-1 flex-col justify-center py-2 text-lg">
            <Bars rows={trackRows(t).success} empty="No results." scaleMax={1} />
          </div>
        </Card>
      ))}
    </div>
  );
}
