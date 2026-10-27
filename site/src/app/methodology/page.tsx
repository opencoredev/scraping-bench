import type { Metadata } from "next";
import { Breadcrumbs, PageIntro, PageShell, Section } from "@/components/site/chrome";
import { tracks } from "@/lib/catalog";
import { results } from "@/lib/results";
import { MODEL, REPO, RESULTS_JSON, notTestedText, pageMetadata } from "@/lib/site";

/**
 * The grading method, shared by every edition. Sections marked v1 describe the v1 run (wb-20261017-final) and only
 * render when the headline data is v1; for v2 the page links to docs/MEASURE-v2.md, the rules every v2 number is measured by.
 * Limits, task counts, sources and gaps come from results.json.
 */
const V1 = results.campaignVersion === 1;

export const metadata: Metadata = pageMetadata({
  title: "How scraping-bench grades web data APIs",
  description: `Every task is pass or fail, decided by a script, not a model. How ${MODEL} uses each API, what counts as a match, where answer keys come from, and when a gap between providers counts.`,
  path: "/methodology",
});

const TOOLS: Record<(typeof tracks)[number]["id"], string> = { search: "search(query)", scrape: "scrape(url)", map: "map(site)", crawl: "crawl(site, scope)" };

const limitText = (t: (typeof tracks)[number]) => {
  const { calls, seconds, usd } = t.limits;
  const time = seconds >= 120 ? `${seconds / 60} min` : `${seconds} s`;
  return `${calls} ${calls === 1 ? "call" : "calls"}, ${time}, $${usd.toFixed(2)}`;
};

const MATCH_RULES: readonly (readonly [string, string])[] = [
  ["Text", "Case, punctuation and spacing are ignored; the words must equal an accepted answer"],
  ["Number", "$168.28 and 168.28 USD parse the same; must fall within the key's tolerance"],
  ["Version", "v0.143.3 equals 0.143.3"],
  ["Date", "Oct 17, 2026 equals 2026-10-17"],
  ["Missing answer", "Some pages leave the answer out on purpose; the right reply is null or empty"],
  ["URL list (map)", "URLs are normalised (www., trailing slash, tracking parameters). Our test site needs every page and nothing extra; real docs sites need 90% recall and 90% precision"],
  V1 ? ["Records (crawl)", "Every record present, nothing extra"] : ["Pages (crawl)", "The right page URLs, with 90% recall and 90% precision. Page titles are reported separately"],
];

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
    {children}
  </a>
);

const prose = "max-w-prose space-y-3 text-sm text-pretty text-muted-foreground";

export default function MethodologyPage() {
  const gapCount = tracks.reduce((n, t) => n + t.detected.length, 0);
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Methodology", path: "/methodology" }]} />
      <PageIntro title="How scraping-bench grades">
        <p>Every task is pass or fail, and a script decides it. {MODEL} only does the task; no model grades anything.</p>
      </PageIntro>

      <Section title="One task">
        <ol className={`${prose} list-decimal pl-5 marker:text-muted-foreground/60`}>
          <li>
            The model gets the task, one tool and the same prompt for every provider. The tool is {tracks.map((t, i) => (
              <span key={t.id}>
                {i > 0 ? (i === tracks.length - 1 ? " or " : ", ") : ""}
                <code className="font-mono text-[13px] text-foreground">{TOOLS[t.id]}</code>
              </span>
            ))}
            , and the provider behind it is the only thing that changes.
          </li>
          <li>It may call the tool a fixed number of times, within a time and dollar limit per task: {tracks.map((t) => `${t.label.toLowerCase()} ${limitText(t)}`).join("; ")}.</li>
          {V1 ? null : <li>Long responses arrive in pages of 32 KB, and the model can read every page, so a long response costs more tokens but never hides the answer.</li>}
          <li>It answers in JSON with the named fields the task asks for.</li>
          <li>A script compares each field with the answer key. The task passes only if every field matches, the run stayed inside its limits and nothing errored.</li>
        </ol>
      </Section>

      <Section title="What counts as a match" note="formatting is forgiven; values are not">
        <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-6 font-normal">Field</th>
                <th scope="col" className="py-2 font-normal">Rule</th>
              </tr>
            </thead>
            <tbody>
              {MATCH_RULES.map(([field, rule]) => (
                <tr key={field} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2.5 pr-6 font-medium whitespace-nowrap">{field}</th>
                  <td className="py-2.5 text-muted-foreground">{rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          The rules are in <Ext href={`${REPO}/blob/main/src/grade/index.ts`}>src/grade/index.ts</Ext>, with tests beside it.
        </p>
      </Section>

      {V1 ? (
      <Section title="Where the answer keys come from">
          <div className={prose}>
            <p>
              <span className="text-foreground">Our test site.</span> Most scrape, map and crawl tasks run on a site generated for this run, at a fresh path nobody could have indexed. The key is the data the
              site was built from. Before the run a script fetched every scrape page and confirmed each answer is on it, that answers meant to need JavaScript are absent from the plain HTML, and that pages
              meant to have no answer have none. See <Ext href={`${REPO}/blob/main/docs/FIXTURES.md`}>FIXTURES.md</Ext>.
            </p>
            <p>
              <span className="text-foreground">The real web.</span> Search keys come from PyPI, npm, crates.io, GitHub releases, Wikidata and SEC filings. Real docs scopes come from each site&apos;s own sitemap
              and pages. Every key records its source and fetch time. See <Ext href={`${REPO}/blob/main/docs/TASKS.md`}>TASKS.md</Ext>.
            </p>
          </div>
        </Section>
      ) : (
        <Section title="Where the answer keys come from">
          <ul className={`${prose} list-disc pl-5 marker:text-muted-foreground/50`}>
            {tracks.map((t) => (t.population ? (
              <li key={t.id}>
                <span className="text-foreground">{t.label}.</span> {t.population.sources}
              </li>
            ) : null))}
          </ul>
        </Section>
      )}

      {V1 ? (
        <>
      <Section title="How we know the keys are right">
        <ul className={`${prose} list-disc pl-5 marker:text-muted-foreground/50`}>
          <li>Before the run, every real-web key was fetched again and compared exactly: 287 of 288 matched, and the one that drifted was dropped.</li>
          <li>With the correct page handed to it, the model passed 60 of 60 scrape tasks, so the keys agree with the pages and the grader accepts right answers as models write them.</li>
          <li>After the run, a script fetched all 80 real-web keys again. None had changed during the run.</li>
          <li>Every failed answer in the final run was read by hand. Nearly all are a provider returning an older release than the source had.</li>
        </ul>
        <p className={`${prose} mt-4`}>
          Five of the 60 search tasks have two defensible answers: three founding years where Wikidata differs from the year most sources give (Lonely Planet, WWE, Airbus), and two release dates just after
          midnight UTC, which providers gave as the US date. They stay as frozen. Dropping them, or accepting both answers, moves Firecrawl from 85% to 92% at most and changes no provider&apos;s place.
        </p>
      </Section>
        </>
      ) : null}

      <Section title="Controls">
        <ul className={`${prose} list-disc pl-5 marker:text-muted-foreground/50`}>
          <li>
            <span className="text-foreground">Model alone</span>: no tool. Shows what the model already knows.
          </li>
          <li>
            <span className="text-foreground">Correct page given</span>: the right page, fetched independently, is handed to the model. The ceiling for scrape.
          </li>
        </ul>
      </Section>

      <Section title="Numbers">
        <ul className={`${prose} list-disc pl-5 marker:text-muted-foreground/50`}>
          <li>
            <span className="text-foreground">Tasks done</span>: the share of tasks that passed.
          </li>
          <li>
            <span className="text-foreground">Cost per finished task</span>: all API and model spend, failures included, divided by tasks done. Model cost is a list-price estimate.
          </li>
          <li>
            <span className="text-foreground">Time</span>: the median over tasks that passed.
          </li>
          <li>
            <span className="text-foreground">{V1 ? "Raw output" : "Answer in the provider's response"}</span>: no model. Does the API&apos;s own output contain every answer?
          </li>
          {V1 ? null : (
            <li>
              <span className="text-foreground">Page coverage</span>: for scrape, the share of 8 sentences sampled from each page&apos;s own text that appear in the provider&apos;s response.
            </li>
          )}
        </ul>
      </Section>

      <Section title="When a gap counts">
        <p className={prose}>
          Tasks from the same site are not independent, so each provider is compared with its track&apos;s leader on the same tasks, with a 95% interval from a bootstrap that resamples whole sites 10,000
          times. A gap counts only when its interval excludes zero.{" "}
          {gapCount === 0
            ? "None does on this run."
            : `${gapCount} ${gapCount === 1 ? "gap does" : "gaps do"} on this run; each track's page lists them.`}
        </p>
      </Section>

      <Section title="What was left out">
        <p className={prose}>
          {notTestedText(results)}
        </p>
      </Section>

      <Section title="Limits">
        <p className={prose}>
          One client location.{V1 ? " Free plans, so rate limits show up in time and errors. Scrape has only two site clusters." : ""} The model and its settings are part of what is measured, so these are not pure
          vendor scores.{V1 ? "" : " The rules every v2 number is measured by are in "}
          {V1 ? null : <Ext href={`${REPO}/blob/main/docs/MEASURE-v2.md`}>MEASURE-v2.md</Ext>}
          {V1 ? "" : "."} The full list is in <Ext href={`${REPO}/blob/main/docs/FINDINGS.md`}>FINDINGS.md</Ext>. Every number on this site comes from <Ext href={RESULTS_JSON}>results.json</Ext>, run {results.runId}.
        </p>
      </Section>
    </PageShell>
  );
}
