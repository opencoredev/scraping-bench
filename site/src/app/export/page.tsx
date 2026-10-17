import type { Metadata } from "next";
import { TaskDiagram } from "@/components/bench/diagram";
import { results } from "@/lib/results";

/** 1200×675 cards (X's 16:9 image size) of each track's diagram, screenshotted into exports/ for posts. */

export const metadata: Metadata = { title: "webbench diagrams for export", robots: { index: false } };

export default function Export() {
  return (
    <div className="flex flex-col items-start gap-10 p-10">
      {results.tracks.map((t) => (
        <section key={t.id} id={`export-${t.id}`} className="flex h-[675px] w-[1200px] shrink-0 flex-col justify-between bg-background px-14 py-12">
          <div className="flex items-baseline justify-between">
            <h1 className="text-3xl font-medium tracking-[-0.02em]">How a {t.label.toLowerCase()} task runs</h1>
            <span className="text-lg font-medium tracking-[-0.03em]">
              web<span className="text-muted-foreground">bench</span>
            </span>
          </div>
          <TaskDiagram track={t} layout="wide" className="w-full" />
          <p className="text-base text-muted-foreground">Same model, same prompt, same limits for every provider. Only the API behind the tool changes.</p>
        </section>
      ))}
    </div>
  );
}
