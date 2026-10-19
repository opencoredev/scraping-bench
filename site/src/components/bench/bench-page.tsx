"use client";

/*
 * Direction: the storage-bench page, carried over as-is. Dark plate, IBM Plex, one dithered colour per provider.
 * New here: each track is one tab, success bars carry a 95% interval whisker, and the two controls (model alone,
 * correct page handed over) sit in grey among the providers so the floor and ceiling are read in place.
 */

import { useState } from "react";
import { Bars } from "@/components/bench/charts";
import { TaskDiagram } from "@/components/bench/diagram";
import { trackRows } from "@/lib/rows";
import type { Results, Track } from "@/lib/results";
import { cn } from "@/lib/utils";

const NOT_TESTED = "Exa, Tavily, Bright Data and Perplexity";
const REPO = "https://github.com/opencoredev/scraping-bench";

/** Caveats that belong next to one track's charts. */
const NOTES: Partial<Record<Track["id"], string>> = {
  search:
    "5 of the 60 tasks have two defensible answers: three founding years where Wikidata differs from the year most sources give, and two releases just after midnight UTC that providers dated in US time. Dropping them, or accepting both answers, moves Firecrawl to 92% at most and changes no provider's place.",
  scrape:
    "Spider refused our test site because its filter flags the workers.dev domain; it scraped all 10 PyPI pages correctly. Firecrawl's tuned run hit its free plan's 10 requests a minute, which is why it scores lower than its default.",
  crawl: "Only 10 tasks. Firecrawl's time includes waiting out its free-plan rate limit.",
};

/** Where each track's tasks come from, printed under the diagram. */
const SOURCES: Record<Track["id"], string> = {
  search: "Answer keys come from npm, PyPI, crates.io, GitHub releases, Wikidata and SEC filings.",
  scrape: "50 pages on our own test site, including JavaScript, PDFs, tabs and missing answers, plus 10 project pages on PyPI.",
  map: "8 sections of our test site, built fresh for this run so nobody could have indexed it, plus 7 sections of real docs for Typer, Ruff, MkDocs and HTTPX.",
  crawl: "7 sections of our test site plus 3 real docs sites.",
};

function HowItRuns({ track }: { track: Track }) {
  return (
    <section className="pt-6 pb-10">
      <h2 className="text-base font-medium">How a {track.label.toLowerCase()} task runs</h2>
      <figure className="mt-6">
        <TaskDiagram track={track} layout="wide" className="hidden w-full md:block" />
        <TaskDiagram track={track} layout="tall" className="mx-auto w-full max-w-sm md:hidden" />
        <figcaption className="mt-6 max-w-prose text-sm text-pretty text-muted-foreground">
          {track.tasks} tasks. {SOURCES[track.id]}
        </figcaption>
      </figure>
    </section>
  );
}


function Chips({ label, options, value, onChange }: { label: string; options: readonly { id: string; label: string; sub?: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-8 shrink-0 rounded-full border px-3 text-sm whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-foreground/40",
            o.id === value ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
          {o.sub ? <span className={cn("ml-1.5 text-xs", o.id === value ? "text-background/70" : "text-muted-foreground/80")}>{o.sub}</span> : null}
        </button>
      ))}
    </div>
  );
}

function Chart({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-10">
      <h2 className="text-base font-medium">
        {title} <span className="ml-1 text-sm font-normal text-muted-foreground">{note}</span>
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}


function TrackView({ track }: { track: Track }) {
  const { success, cost, time, raw, tuned } = trackRows(track);

  return (
    <>
      <HowItRuns track={track} />

      <Chart title="Tasks done" note="every answer correct, checked by script, with the cost of each finished task">
        <Bars rows={success} empty="No results." scaleMax={1} />
        <p className="max-w-prose text-sm text-pretty">
          {track.detected.length === 0
            ? `None of the gaps between providers is big enough to rule out chance on ${track.tasks} tasks, since tasks from the same site are counted as one group.`
            : `${track.detected.length === 1 ? "The only gap" : "Gaps"} big enough to rule out chance: ${track.detected
                .map((d) => `${d.reference} finished ${Math.round(-d.difference * 100)} points more tasks than ${d.provider}`)
                .join("; ")}. The rest can't be told apart yet.`}
        </p>
      </Chart>

      <Chart title="Cost per finished task" note="all API and model spend, failures included, divided by tasks done">
        <Bars rows={cost} empty="No costs." />
      </Chart>

      <Chart title="Time per finished task" note="median, lower is better">
        <Bars rows={time} empty="No timings." />
      </Chart>

      {raw.length > 0 ? (
        <Chart title="Raw output, no model" note="does the API's own output contain every answer? Cost is the API alone">
          <Bars rows={raw} empty="No raw results." scaleMax={1} />
        </Chart>
      ) : null}

      {tuned.length > 0 ? (
        <Chart title="Tuned settings" note="each provider's best documented settings, frozen before the run">
          <Bars rows={tuned} empty="No tuned results." scaleMax={1} />
        </Chart>
      ) : null}

      {NOTES[track.id] ? (
        <div className="border-t border-border py-8">
          <p className="max-w-prose text-xs text-pretty text-muted-foreground">{NOTES[track.id]}</p>
        </div>
      ) : null}
    </>
  );
}

export function BenchPage({ results }: { results: Results }) {
  const { tracks } = results;
  const [trackId, setTrackId] = useState<string>(tracks[0]?.id ?? "search");
  const track = tracks.find((t) => t.id === trackId) ?? tracks[0];
  if (!track) return null;
  const providerCount = new Set(tracks.flatMap((t) => t.providers.map((p) => p.id))).size;
  const ranOn = new Date(results.generatedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <header className="flex items-center justify-between py-6">
        <span className="text-lg font-medium tracking-[-0.03em]">
          scraping<span className="text-muted-foreground">bench</span>
        </span>
        <a className="text-sm text-muted-foreground hover:text-foreground" href={REPO}>
          GitHub
        </a>
      </header>

      <h1 className="pt-8 pb-3 text-2xl font-medium tracking-[-0.02em] text-balance md:text-3xl">
        {providerCount} web data APIs for agents, graded on whether the job got done
      </h1>
      <p className="max-w-prose pb-6 text-sm text-pretty text-muted-foreground">
        Every provider gets the same tasks, the same model and the same limits. A task only counts when a script confirms every answer.
      </p>

      <div className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Chips label="Track" value={track.id} onChange={setTrackId} options={tracks.map((t) => ({ id: t.id, label: t.label, sub: `${t.tasks} tasks` }))} />
      </div>

      <main>
        <TrackView key={track.id} track={track} />
      </main>

      <footer className="flex flex-wrap justify-between gap-2 border-t border-border py-6 text-xs text-muted-foreground">
        <span>
          Run {results.runId}, {ranOn}, all from one server
        </span>
        <span>Not tested: {NOT_TESTED}. Parallel was tested, but its terms need written consent to publish results.</span>
        <a className="hover:text-foreground" href={`${REPO}/blob/main/docs/METHODOLOGY.md`}>
          How it was graded
        </a>
      </footer>
    </div>
  );
}
