import type { Metadata } from "next";
import { Bars } from "@/components/bench/charts";
import { TaskDiagram } from "@/components/bench/diagram";
import { results } from "@/lib/results";
import type { Track } from "@/lib/results";
import { trackRows } from "@/lib/rows";

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

export default function Export() {
  return (
    <div className="flex flex-col items-start gap-10 p-10">
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
