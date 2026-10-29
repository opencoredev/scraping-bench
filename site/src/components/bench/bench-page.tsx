"use client";

/*
 * Reference: existing web-bench statistical plate, keeping its compact charts.
 * Palette: existing dark neutral surfaces and provider OKLCH colors; no new surfaces.
 * Type: IBM Plex Sans and Mono, matching the current measurements and labels.
 * Layout: retained track tabs and interval bars, with full/core scope directly above results.
 * Signature: site-clustered interval whiskers and dithered provider colors.
 * Avoiding: decorative cards, invented data, and hidden population differences.
 * Direction: the storage-bench page, carried over as-is. Dark plate, IBM Plex, one dithered colour per provider.
 * New here: each track is one tab, success bars carry a 95% interval whisker, and the two controls (model alone,
 * correct page handed over) sit in grey among the providers so the floor and ceiling are read in place.
 */

import Link from "next/link";
import { useState } from "react";
import { Bars } from "@/components/bench/charts";
import { TaskDiagram } from "@/components/bench/diagram";
import { trackRows } from "@/lib/rows";
import { editionOf } from "@/lib/results";
import type { Edition, Results, Track } from "@/lib/results";
import { notTestedText } from "@/lib/site";
import { cn } from "@/lib/utils";


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

/** v2's tasks. Counts are from results/campaign-v2/test-*.json and core-*.json. */
const V2_SOURCES: Record<Track["id"], string> = {
  scrape:
    "The core is 38 real pages from 36 sites plus 2 pages on our own JavaScript test site. The full set froze 296 real pages from 39 real sites, mostly docs (Astral, Astro, Docker, Polars, Scrapy, FastAPI, Vite and more) plus PyPI project pages, and 4 pages on our JavaScript test site.",
  search: "All real web. Answer keys come from official package registries, GitHub releases, Wikidata, SEC filings and live docs pages, across 52 sites.",
  map: "All real web. The core is one docs section on each of 15 sites; the full set has 60 sections on those 15 sites. Each section's sitemap matches a breadth-first crawl exactly.",
  crawl: "All real web. The core is 12 docs sections on 12 sites; the full set has 40 sections on 15 sites. Each section's sitemap matches a breadth-first crawl exactly.",
};

/** v2 and v1 as one segmented control of plain links. */
function RunSwitch({ current }: { current: "v1" | "v2" }) {
  const runs = [
    { id: "v2", href: "/", label: "v2", sub: "latest" },
    { id: "v1", href: "/v1", label: "v1", sub: "earlier" },
  ] as const;
  return (
    <nav aria-label="Benchmark run" className="mr-auto ml-4 flex gap-1.5 sm:ml-6">
      {runs.map((r) => (
        <a
          key={r.id}
          href={r.href}
          aria-current={r.id === current ? "page" : undefined}
          className={cn(
            "flex h-8 items-center rounded-full border px-3 text-sm whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-foreground/40",
            r.id === current ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {r.label}
          <span className={cn("ml-1.5 text-xs", r.id === current ? "text-background/70" : "text-muted-foreground/80")}>{r.sub}</span>
        </a>
      ))}
    </nav>
  );
}

function HowItRuns({ track }: { track: Track }) {
  return (
    <section className="pt-10 pb-10">
      <h2 className="text-base font-medium">How a {track.label.toLowerCase()} task runs</h2>
      <figure className="mt-6">
        <TaskDiagram track={track} layout="wide" className="hidden w-full md:block" />
        <TaskDiagram track={track} layout="tall" className="mx-auto w-full max-w-sm md:hidden" />
        <figcaption className="mt-6 max-w-prose text-sm text-pretty text-muted-foreground">
          {track.population ? `${track.tasks} core tasks from ${track.population.coreClusters} sites; the full set has ${track.population.fullTasks} tasks from ${track.population.fullClusters} sites. ` : `${track.tasks} tasks. `}{track.population ? V2_SOURCES[track.id] : SOURCES[track.id]}{track.population ? " The diagram is an example task, not a real one." : ""}
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


/**
 * One track's diagram, charts and notes. `withLink` adds a link to the track's own page, for the home page tabs.
 */
export function TrackView({ track, withLink = false }: { track: Track; withLink?: boolean }) {
  const { success, cost, time, raw, coverage, tuned } = trackRows(track);
  const titled = track.providers.flatMap((p) => (p.titles ? [{ label: p.label, ...p.titles }] : []));

  return (
    <>
      <div className="pt-6" />
      <Chart title="Tasks done" note={cost.length ? "every answer correct, checked by script, with the cost of each finished task" : "every answer correct, checked by script"}>
        <Bars rows={success} empty="No results." scaleMax={1} />
        <div className="max-w-prose">
          {track.id === "scrape" && track.providers.some((p) => p.id === "jina") ? <p className="text-xs text-pretty text-muted-foreground">Jina Reader&apos;s score is under a 5,000-token rejecting budget. This track mostly tests docs headings and structure, not general extraction.</p> : null}
        </div>
      </Chart>

      {cost.length > 0 ? <Chart title="Cost per finished task" note="all API and model spend, failures included, divided by tasks done">
        <Bars rows={cost} empty="No costs." />
      </Chart> : null}

      {time.length > 0 ? <Chart title="Time per finished task" note="median, lower is better">
        <Bars rows={time} empty="No timings." />
      </Chart> : null}

      {raw.length > 0 ? (
        <Chart title="Answer in the provider's response" note="checked by script on everything the provider returned, no model. An upper bound: it can't tell a heading from a menu link with the same words">
          <Bars rows={raw} empty="No results." scaleMax={1} />
        </Chart>
      ) : null}

      {coverage.length > 0 ? (
        <Chart title="How much of the page came through" note="share of 8 sentences, sampled from each page's own text, found in the provider's response. The size after each bar is the median response">
          <Bars rows={coverage} empty="No coverage results." scaleMax={1} />
        </Chart>
      ) : null}

      {titled.length > 0 ? (
        <div className="border-t border-border py-8">
          <h2 className="text-sm font-medium">Page titles</h2>
          <p className="mt-1.5 max-w-prose text-sm text-pretty text-muted-foreground">
            Titles don&apos;t decide the crawl score. This compares the title each provider returned with the page&apos;s HTML title, for every expected page it found.
          </p>
          <div className="overflow-x-auto">
            <table className="mt-5 w-full text-left text-xs tabular-nums sm:text-sm">
              <thead>
                <tr>
                  <th className="py-3 pr-3 font-medium sm:pr-4">Provider</th>
                  <th className="pr-3 font-medium sm:pr-4">Exact title</th>
                  <th className="font-medium">Page name in the title</th>
                </tr>
              </thead>
              <tbody>
                {titled.map((t) => (
                  <tr key={t.label} className="border-t border-border/60">
                    <td className="py-3 pr-3 sm:pr-4">{t.label}</td>
                    <td className="pr-3 sm:pr-4">{t.exact} of {t.expected}</td>
                    <td>{t.loose} of {t.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}


      {track.population?.comparisons.length ? (
        <details className="border-t border-border py-8">
          <summary className="cursor-pointer text-sm font-medium">Every provider against the top scorer</summary>
          <p className="mt-4 max-w-prose text-sm text-pretty text-muted-foreground">Compared with {track.population.comparisons[0]?.reference}, the top scorer on these tasks. Gaps are in percentage points, negative when the provider finished fewer tasks. The 95% range counts tasks from the same site as one group.</p>
          <div className="overflow-x-auto">
            <table className="mt-5 w-full text-left text-xs tabular-nums sm:text-sm">
              <thead><tr><th className="py-3 pr-4">Provider</th><th className="pr-4">Gap</th><th className="pr-4">95% range</th><th className="pr-4">Tasks compared</th><th>Verdict</th></tr></thead>
              <tbody>{track.population.comparisons.map(d=><tr key={d.provider}><td className="py-3 pr-4">{d.provider}</td><td className="pr-4">{d.difference===null?"n/a":(d.difference*100).toFixed(1)}</td><td className="whitespace-nowrap pr-4">{d.ci.map(v=>v===null?"n/a":(v*100).toFixed(1)).join(" to ")}</td><td className="pr-4">{d.pairedTasks}</td><td>{d.resolved?"Confident gap":"Could be chance"}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      ) : null}
      {track.population?.fullScores.length ? (
        <details className="border-t border-border py-8">
          <summary className="cursor-pointer text-sm font-medium">Results on the full task set</summary>
          <p className="mt-4 max-w-prose text-sm text-pretty text-muted-foreground">Only providers and controls that ran all {track.population.fullTasks} full-set tasks appear here. These numbers describe the larger set and don&apos;t change the charts above.</p>
          <table className="mt-5 w-full text-left text-sm tabular-nums">
            <thead><tr><th className="pb-3 font-medium">Provider</th><th className="pb-3 font-medium">Done</th><th className="pb-3 font-medium">95% range</th></tr></thead>
            <tbody>{track.population.fullScores.map(({label,score})=><tr key={label}><td className="py-2">{label}</td><td>{score.successes}/{score.tasks}</td><td>{score.ci.map(v=>v===null?"n/a":`${Math.round(v*100)}%`).join(" to ")}</td></tr>)}</tbody>
          </table>
        </details>
      ) : null}
      {tuned.length > 0 ? (
        <Chart title="Tuned settings" note="each provider's best documented settings, frozen before the run">
          <Bars rows={tuned} empty="No tuned results." scaleMax={1} />
        </Chart>
      ) : null}

      <div className="border-t border-border">
        <HowItRuns track={track} />
        {track.population?.exclusions.length ? <p className="-mt-4 pb-8 text-sm text-muted-foreground">Left out of this track: {track.population.exclusions.join("; ")}</p> : null}
      </div>

      {(track.population?.notes ?? NOTES[track.id]) ? (
        <div className="border-t border-border py-8">
          <p className="max-w-prose text-xs text-pretty text-muted-foreground">{track.population?.notes ?? NOTES[track.id]}</p>
        </div>
      ) : null}

      {withLink ? (
        <div className="border-t border-border py-8 text-sm">
          <Link href={`/${track.id}`} className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
            {track.label} results by provider, with caveats and head-to-head comparisons
          </Link>
        </div>
      ) : null}
    </>
  );
}

/** The labels that change between v2 and v1. */
function editionCopy(edition: Edition) {
  const shared = "Same Claude Haiku 5.5 agent and limits for every provider; a script checks every answer.";
  switch (edition.kind) {
    case "v2":
      return {
        population: `${shared} Everything ran on the real web, mostly docs sites such as Astro, Docker, FastAPI and Vite, except a few scrape pages on our own JavaScript test site.`,
        intro: "",
      };
    case "v1":
      return {
        population:
          "Search was real web. Scrape was 50 tasks on our own test site plus 10 PyPI pages, and map and crawl mixed test-site sections with a few real docs sites.",
        intro: `Different tasks and providers from v2, so the two runs can't be compared to show change over time. ${shared}`,
      };
    default: {
      const _exhaustive: never = edition;
      return _exhaustive;
    }
  }
}

/**
 * `summary` and `about` follow the track tabs, so the charts come first; both are server-rendered by the home page.
 */
export function BenchPage({ results, summary, about }: { results: Results; summary?: React.ReactNode; about?: React.ReactNode }) {
  const { tracks } = results;
  const [trackId, setTrackId] = useState<string>(tracks[0]?.id ?? "scrape");
  const track = tracks.find((t) => t.id === trackId) ?? tracks[0];
  if (!track) return null;
  const providerCount = new Set(tracks.flatMap((t) => t.providers.map((p) => p.id))).size;
  const edition = editionOf(results);
  const copy = editionCopy(edition);
  const ranOn = new Date(results.generatedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <div className="-ml-4 flex pt-6 sm:-ml-6">
        <RunSwitch current={edition.kind} />
      </div>

      <h1 className="pt-8 pb-3 text-2xl font-medium tracking-[-0.02em] text-balance md:text-3xl">
        {providerCount} scraping and web data APIs for AI agents, graded on whether the job got done
      </h1>
      <p className="max-w-prose pb-3 text-sm text-pretty text-muted-foreground">{edition.kind === "v2" ? "Same agent, same limits for every provider. A script checks every answer." : copy.population}</p>
      {copy.intro ? <p className="max-w-prose pb-6 text-sm text-pretty text-muted-foreground">{copy.intro}</p> : <div className="pb-3" />}

      <div className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Chips label="Track" value={track.id} onChange={setTrackId} options={tracks.map((t) => ({ id: t.id, label: t.label, sub: `${t.tasks} tasks` }))} />
      </div>

      <main>
        <TrackView key={track.id} track={track} withLink={edition.kind === "v2"} />
        {summary}
        {about}
      </main>

      {/* This edition's own run; the site footer below names the headline run. */}
      <p className="flex flex-wrap justify-between gap-2 border-t border-border py-6 text-xs text-muted-foreground">
        <span>
          Run {results.runId}, {ranOn}, all from one server
        </span>
        <span>{notTestedText(results)}</span>
      </p>
    </>
  );
}
