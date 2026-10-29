import type { Metadata } from "next";
import { BenchPage } from "@/components/bench/bench-page";
import { JsonLd, Section, SiteFooter, SiteHeader, TextLink } from "@/components/site/chrome";
import { providers, tracks } from "@/lib/catalog";
import { baselineText, costSummary, coverageText, picks, runCaveats, trackSummaries } from "@/lib/home";
import type { HomeLink } from "@/lib/home";
import { results } from "@/lib/results";
import { AUTHOR, HOME_TITLE, MODEL, NOT_TESTED, REPO, RESULTS_JSON, RESULTS_JSON_RAW, SITE_NAME, SITE_URL, pageMetadata, parallelNote } from "@/lib/site";

const description = `${providers.length} web scraping and web data APIs graded on whether an AI agent got the right answer: task success, cost per finished task and time, with confidence intervals.`;

export const metadata: Metadata = pageMetadata({ title: HOME_TITLE, description, path: "/", absoluteTitle: true });

const organization = { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, sameAs: [REPO, AUTHOR.url] };

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    organization,
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description, inLanguage: "en", publisher: { "@id": organization["@id"] } },
    {
      "@type": "Dataset",
      "@id": `${SITE_URL}/#dataset`,
      name: "scraping-bench results: web data APIs for AI agents",
      description: `Pass or fail results for ${providers.map((p) => p.label).join(", ")} on ${tracks.map((t) => `${t.tasks} ${t.label.toLowerCase()}`).join(", ")} tasks. Every provider gets the same tasks, the same model (${MODEL}) and the same limits, and a script checks every answer. Includes tasks done, 95% intervals from a bootstrap over sites, cost per finished task and median time, plus no-tool and correct-page controls.`,
      url: SITE_URL,
      sameAs: RESULTS_JSON,
      version: results.runId,
      dateModified: results.generatedAt,
      license: "https://opensource.org/licenses/MIT",
      isAccessibleForFree: true,
      creator: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      publisher: { "@id": organization["@id"] },
      keywords: ["web scraping API", "web search API", "AI agents", "benchmark", "crawl", "site map", ...providers.map((p) => p.label)],
      measurementTechnique: "Each task is pass or fail, decided by a script that compares every answer field with a verified key",
      variableMeasured: ["Tasks done (share of tasks passed)", "95% interval from a site-level bootstrap", "Cost per finished task in US dollars", "Median time per finished task"],
      distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: RESULTS_JSON_RAW }],
    },
  ],
};

/* Written sections around the charts, so people and answer engines can read the results without the charts. */

const Prose = ({ children }: { children: React.ReactNode }) => <div className="max-w-prose space-y-4 text-[15px] leading-relaxed text-pretty">{children}</div>;

function Links({ links }: { links: readonly HomeLink[] }) {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
      {links.map((l) =>
        l.href.startsWith("/") ? (
          <TextLink key={l.href} href={l.href}>
            {l.label}
          </TextLink>
        ) : (
          <a key={l.href} href={l.href} className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
            {l.label}
          </a>
        ),
      )}
    </p>
  );
}

function ShortAnswer() {
  return (
    <section aria-labelledby="short-answer" className="border-t border-border py-10">
      <h2 id="short-answer" className="text-base font-medium">
        The short answer
      </h2>
      <dl className="mt-4 border-t border-border/60">
        {trackSummaries.map(({ track, providers: count, verdict }) => (
          <div key={track.id} className="grid gap-1 border-b border-border/60 py-4 md:grid-cols-[10rem_1fr] md:gap-6">
            <dt className="text-sm">
              <TextLink href={`/${track.id}`}>{track.label}</TextLink>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {count} providers, {track.tasks} tasks
              </span>
            </dt>
            <dd className="max-w-prose text-[15px] leading-relaxed text-pretty">{verdict}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-prose text-sm text-pretty text-muted-foreground">{costSummary()}</p>
    </section>
  );
}

function About() {
  return (
    <>
      <Section title="How to pick a provider" id="pick">
        <Prose>
          <p>Each track is scored on its own and there is no overall ranking, so start from what your agent needs to do.</p>
        </Prose>
        <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {picks.map((p) => (
            <section key={p.id} aria-labelledby={`pick-${p.id}`} className="space-y-3">
              <h3 id={`pick-${p.id}`} className="text-sm font-medium text-balance">
                {p.title}
              </h3>
              <p className="text-sm text-pretty text-muted-foreground">{p.need}</p>
              <p className="text-[15px] leading-relaxed text-pretty">{p.advice}</p>
              {p.note ? <p className="text-sm text-pretty text-muted-foreground">{p.note}</p> : null}
              <Links links={p.links} />
            </section>
          ))}
        </div>
      </Section>

      <Section title="How it's measured" id="how">
        <Prose>
          <p>
            Each provider becomes the only tool of the same agent ({MODEL}, same prompt, same limits), which has to return specific facts: a package version, a page&apos;s
            heading, every URL in a docs section. A script compares each answer with a key taken from official sources, and a task passes only if every field matches within
            the limits. No model grades anything, and every task, the grader and every result row are on <a className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground" href={REPO}>GitHub</a>.
          </p>
          {baselineText()[0] ? <p>{baselineText()[0]}</p> : null}
        </Prose>
        <div className="mt-4">
          <Links links={[{ href: "/methodology", label: "Full methodology" }, { href: "/faq", label: "FAQ" }]} />
        </div>
      </Section>

      <Section title="What wasn't tested" id="caveats">
        <Prose>
          <p>
            {NOT_TESTED} were not tested, so this benchmark has no numbers for them. {parallelNote(results)} Not every provider ran every track: {coverageText()}. Everything ran on free
            plans, from one server, with one model.
          </p>
          {runCaveats().length ? <p>{runCaveats().join(" ")}</p> : null}
        </Prose>
      </Section>
    </>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <BenchPage results={results} summary={<ShortAnswer />} about={<About />} />
      <SiteFooter runLine={false} />
    </div>
  );
}
