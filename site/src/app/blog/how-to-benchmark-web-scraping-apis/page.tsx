import type { Metadata } from "next";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { Byline, FaqJsonLd, FaqList, KindKey, KindLabel, OtherPosts, Prose, ScrollHint, SourceList } from "@/components/site/post";
import { BENCHMARK_GUIDE_POST as POST, BLOG_PATH, blogPostingJsonLd } from "@/lib/blog";
import { listText, tracks } from "@/lib/catalog";
import type { Faq } from "@/lib/faq";
import type { Source } from "@/lib/guides";
import { trackGaps, trackNote } from "@/lib/noise";
import { formatPct } from "@/lib/results";
import type { Track } from "@/lib/results";
import { MODEL, NOISE_PATH, REPO, RESULTS_JSON, pageMetadata } from "@/lib/site";

const IMAGE = "/og/overview.png";

export function generateMetadata(): Metadata {
  const base = pageMetadata({ title: POST.metaTitle, description: POST.description, path: POST.path, image: "overview" });
  return { ...base, openGraph: { ...base.openGraph, type: "article", publishedTime: POST.published, modifiedTime: POST.modified } };
}

const MEASURE_DOC = `${REPO}/blob/main/docs/MEASURE-v2.md`;
const ROWS = `${REPO}/blob/main/results/measure-v2-string/rows.jsonl`;

const lower = (t: Track) => t.label.toLowerCase();
const usd = (n: number) => `$${n.toFixed(2)}`;

/** "40 tasks from 37 sites, so one task is 2.5 points", per track, for the core sets in results.json. */
const siteLines = trackGaps.map((t) => ({ id: t.track.id, label: t.track.label, text: trackNote(t) }));

/** The model's score with no tool at all, per track: the baseline an API's score sits on. */
const noTool = tracks.flatMap((t) => (t.controls.none ? [{ track: t, score: t.controls.none }] : []));
const noToolText = listText(noTool.map((x) => `${x.score.successes} of ${x.score.tasks} ${lower(x.track)} tasks (${formatPct(x.score.rate)})`));
const oracleTracks = tracks.filter((t) => t.controls.oracle !== null).map((t) => lower(t));

type Step = { step: string; what: string; did: string };
const STEPS: Step[] = [
  { step: "Grade the finished task", what: "A script checks the agent's final answer against a key from an official source", did: `${MODEL} using one provider's API at a time, pass or fail per task` },
  { step: "Use many real sites", what: "Tasks from the sites your agent visits, spread over many of them", did: `Core sets of ${listText(trackGaps.map((t) => `${t.track.tasks} ${lower(t.track)} tasks from ${t.sites} sites`))}` },
  { step: "Run controls", what: "The model with no tool, and the model with the right page handed to it", did: `No-tool baseline on every track; correct page given on ${listText(oracleTracks)} only` },
  { step: "Hold everything else fixed", what: "Same model, prompt, tool-call budget, time and spend caps for every API", did: "One cap set per track when the provider calls were collected (table below)" },
  { step: "Count what failures cost", what: "All spend, failed tasks included, divided by tasks finished", did: "Cost per finished task: provider charges for the calls used plus model tokens at list price" },
  { step: "Compare with an interval", what: "Paired comparison on the same tasks, resampling whole sites", did: "A 95% interval for every gap to a track's leader" },
  { step: "Publish it", what: "Tasks, grader, rows and the limits", did: "Tasks, grader and graded provider-task rows are public; stored responses stay private" },
];

type Field = { field: string; example: string };
const WORKSHEET: Field[] = [
  { field: "Input", example: "A documentation page URL your agent will really fetch" },
  { field: "Ask", example: "Return the page's first heading, exactly as written" },
  { field: "Answer key", example: "The heading read from the page's own HTML, saved once and frozen" },
  { field: "Grader", example: "Normalize both strings the same way (Unicode, whitespace, Markdown syntax), then require an exact match" },
  { field: "Site", example: "Record it, so tasks from one site can be resampled together" },
  { field: "Budget", example: "Tool calls, seconds and dollars allowed, the same for every API" },
  { field: "Controls", example: "The model with no tool, and the model given the frozen page" },
];

const faqs: Faq[] = [
  {
    question: "How many tasks do I need to benchmark a scraping API?",
    answer: `More than the score resolution suggests. One task's worth in points only sets the smallest step a score can move: in scrapingbench v2's core sets, ${listText(siteLines.map((l) => `${l.label.toLowerCase()} has ${l.text.replace(/\.$/, "")}`))}. How precise a comparison is depends on how many independent sites you have and on how often two providers disagree on the same tasks. Run a small paired pilot, look at how wide the interval is, and grow the set until it is narrow enough for the gap you care about.`,
    links: [{ href: NOISE_PATH, label: "Why most gaps are noise" }],
  },
  {
    question: "Should a model grade the answers?",
    answer:
      "Use a script wherever the answer can be checked exactly, such as a heading, a version number or a list of URLs. A script gives the same answer the same grade every time. A model judge adds a second source of error to every score. scrapingbench grades every task by script.",
    links: [{ href: "/methodology", label: "How scrapingbench grades" }],
  },
  {
    question: "What should a scraping API benchmark report besides the success rate?",
    answer:
      "Cost per finished task, time on tasks that passed, the controls, and a 95% interval for each score and for each gap between providers. Report each job (scrape, search, map, crawl) on its own rather than one overall ranking, and say how the numbers were produced.",
    links: [{ href: "/methodology", label: "Methodology" }],
  },
];

const sources: Source[] = [
  { label: "How v2 is measured (MEASURE-v2.md)", url: MEASURE_DOC },
  { label: "scrapingbench methodology and v2 corrections (METHODOLOGY.md)", url: `${REPO}/blob/main/docs/METHODOLOGY.md` },
  { label: "Graded v2 provider-task rows (rows.jsonl)", url: ROWS },
  { label: "The site's results summary (results.json)", url: RESULTS_JSON },
];

export default function BenchmarkGuidePage() {
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Blog", path: BLOG_PATH }, { name: "How to benchmark web scraping APIs", path: POST.path }]} />
      <JsonLd data={blogPostingJsonLd(POST, IMAGE)} />
      <FaqJsonLd post={POST} faqs={faqs} />

      <PageIntro title={POST.title}>
        <Byline post={POST} prices={false} />
        <p className="text-foreground">
          Run every API on the same tasks from the sites your agent visits, with the same model and limits, and grade the agent&apos;s final answer by script. Then compare cost per finished task and a
          paired interval before you say one API is better.
        </p>
        <p>Below are the seven steps, a worksheet for writing one task, and what each step looked like in scrapingbench v2.</p>
      </PageIntro>
      <div className="max-w-prose pb-8">
        <p className="pb-2 text-xs text-muted-foreground">Paragraphs below are marked by where their facts come from:</p>
        <KindKey kinds={["measured", "editorial"]} />
      </div>

      <Section title="The seven steps">
        <ScrollHint />
        <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Seven steps for benchmarking a web scraping API, and what scrapingbench v2 did for each</caption>
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-normal">Step</th>
                <th scope="col" className="py-2 pr-4 font-normal">What to do</th>
                <th scope="col" className="py-2 font-normal">What scrapingbench v2 did</th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map((s, i) => (
                <tr key={s.step} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2.5 pr-4 font-medium">
                    {i + 1}. {s.step}
                  </th>
                  <td className="py-2.5 pr-4 text-muted-foreground">{s.what}</td>
                  <td className="py-2.5 text-muted-foreground">{s.did}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Worksheet: write down one task" note="an example, not a scrapingbench task">
        <Prose>
          <p className="text-foreground">Before you run anything, write each task down so a script can grade it.</p>
        </Prose>
        <div className="mt-3 max-w-prose">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">The fields to write down for one benchmark task, with an example scrape task</caption>
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-normal">Field</th>
                <th scope="col" className="py-2 font-normal">Example for a scrape task</th>
              </tr>
            </thead>
            <tbody>
              {WORKSHEET.map((f) => (
                <tr key={f.field} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2 pr-4 font-medium">{f.field}</th>
                  <td className="py-2 text-muted-foreground">{f.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <Prose>
            <p>
              <KindLabel kind="editorial" />
              If you can&apos;t write the answer key and the grader rule before the run, the task is too vague to score. Freeze the keys first, so no result can change what counts as right.
            </p>
          </Prose>
        </div>
      </Section>

      <Section title="1. Grade the finished task, not the fetch">
        <Prose>
          <p className="text-foreground">Grade whether the agent got the answer, not whether the API returned a page.</p>
          <p>
            <KindLabel kind="editorial" />
            An HTTP 200 only says the API sent something back. The page can be a login wall, a cookie banner or a shell that needs JavaScript, and a metric that checks only HTTP status counts all of those as wins.
            What you need to know is whether your agent, using that API, finished the job.
          </p>
          <p>
            <KindLabel kind="measured" />
            In scrapingbench, {MODEL} works through one provider's API at a time and must return a specific fact. A script compares the answer with a key from an official source and marks the task pass or fail. No
            model grades anything.
          </p>
        </Prose>
      </Section>

      <Section title="2. Take tasks from many of your own sites">
        <Prose>
          <p className="text-foreground">Use the pages your agent will really visit, and spread the tasks over as many sites as you can.</p>
          <p>
            <KindLabel kind="editorial" />
            Tasks from one site tend to pass or fail together. A site that blocks one request usually blocks the next, so ten tasks from one site tell you less than ten tasks from ten sites.
          </p>
          <p>
            <KindLabel kind="measured" />
            The v2 core sets, which every provider on a track ran:
          </p>
          <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground/50">
            {siteLines.map((l) => (
              <li key={l.id}>
                <TextLink href={`/${l.id}`}>{l.label}</TextLink>: {l.text}
              </li>
            ))}
          </ul>
        </Prose>
      </Section>

      <Section title="3. Run two controls before you score any API">
        <Prose>
          <p className="text-foreground">Run the model with no tool, and the model with the right page handed to it.</p>
          <p>
            <KindLabel kind="editorial" />
            The no-tool run is a baseline: it shows how many tasks the model gets right with no retrieval at all, so you can read each API&apos;s score against it. The correct-page run shows how close to perfect the model gets
            when retrieval isn&apos;t the problem. When it fails there, check the model&apos;s reading, the evidence and the grading before you blame retrieval.
          </p>
          <p>
            <KindLabel kind="measured" />
            With no tool, {MODEL} finished {noToolText}.
            In v2 the correct-page control ran on{" "}
            {listText(oracleTracks)} only. Both are described on the <TextLink href="/methodology">methodology</TextLink> page.
          </p>
        </Prose>
      </Section>

      <Section title="4. Give every API the same model, limits and settings">
        <Prose>
          <p className="text-foreground">Change one thing at a time: the API.</p>
          <p>
            <KindLabel kind="editorial" />
            Keep the model, the prompt, the number of tool calls, and the time and spend caps the same for every provider. If you tune one provider&apos;s settings, tune all of them, or run them all on
            defaults.
          </p>
          <p>
            <KindLabel kind="measured" />
            The caps per task when the v2 provider calls were collected:
          </p>
        </Prose>
        <div className="mt-3 max-w-prose">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Time, spend and tool-call caps per task on each scrapingbench v2 track, as collected</caption>
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-normal">Track</th>
                <th scope="col" className="py-2 pr-4 font-normal">Time</th>
                <th scope="col" className="py-2 pr-4 font-normal">Spend</th>
                <th scope="col" className="py-2 font-normal">Tool calls</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <th scope="row" className="py-2 pr-4 font-medium">{t.label}</th>
                  <td className="py-2 pr-4 text-muted-foreground">{t.limits.seconds} s</td>
                  <td className="py-2 pr-4 text-muted-foreground">{usd(t.limits.usd)}</td>
                  <td className="py-2 text-muted-foreground">{t.limits.calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <Prose>
            <p>
              <KindLabel kind="measured" />
              The published v2 scores weren&apos;t a second live run. Every provider response was stored once, and the scores re-run the agent on those stored responses, served one provider at a time and read page by page within a reading budget per task.
              No provider was called again. <a href={MEASURE_DOC} className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">MEASURE-v2.md</a> has
              the rules. If you can, store your raw responses too: then a grading fix doesn&apos;t mean paying for every call again.
            </p>
          </Prose>
        </div>
      </Section>

      <Section title="5. Count what failures cost">
        <Prose>
          <p className="text-foreground">Divide everything you spent, failed tasks included, by the tasks that finished.</p>
          <p>
            <KindLabel kind="editorial" />
            A low price per request flatters an API that fails often, because a failed task still costs the API calls it made and the model tokens it used. Cost per finished task puts a cheap API that fails and a pricier one that works on the
            same scale.
          </p>
          <p>
            <KindLabel kind="measured" />
            In v2, a task&apos;s cost is the provider charges for the calls used in the replay plus the replay&apos;s model tokens at list price, failed tasks included, and cost per finished task divides
            the total by tasks done. Time is likewise the provider time for those calls plus the replay&apos;s model time.
          </p>
        </Prose>
      </Section>

      <Section title="6. Compare providers on the same tasks, with an interval">
        <Prose>
          <p className="text-foreground">Before you say one API is better, check how much the gap moves when you resample the sites you tested.</p>
          <p>
            <KindLabel kind="editorial" />
            Compare two providers on the same tasks. Resample the observed sites with replacement, whole sites rather than single tasks, and recompute the gap in percentage points each time. If the
            middle 95% of those gaps includes zero, the gap is too small to call. If it excludes zero, that is evidence about your tasks, not proof for every site. Screening many pairs without
            adjustment raises the chance that one clears by luck, so confirm a gap you care about on a separate run with new sites.
          </p>
          <p>
            <KindLabel kind="measured" />
            scrapingbench compares each provider with its track&apos;s leader by a bootstrap that redraws whole sites, and labels the comparisons exploratory and unadjusted. Every gap and its interval is
            on <TextLink href={NOISE_PATH}>why most gaps are noise</TextLink>.
          </p>
        </Prose>
      </Section>

      <Section title="7. Publish the tasks, the grader and the limits">
        <Prose>
          <p className="text-foreground">Publish enough that someone else can check your scores.</p>
          <p>
            <KindLabel kind="editorial" />
            Share the tasks, the grader and every graded row, and write down what limits the result: which model, which plans, where it ran, and which kinds of pages the tasks favor.
          </p>
          <p>
            <KindLabel kind="measured" />
            scrapingbench&apos;s tasks and grader are open source under the MIT license, and the graded v2 provider-task rows are in{" "}
            <a href={ROWS} className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">rows.jsonl</a>. The stored provider responses hold full copies
            of third-party pages, so they stay private: you can audit the published scores, but not rerun the exact measurement. The v2 run used one model ({MODEL}), free plans and one server, and most of
            its tasks come from documentation sites.
          </p>
        </Prose>
      </Section>

      <Section title="Questions">
        <FaqList faqs={faqs} />
      </Section>

      <Section title="Sources">
        <SourceList sources={sources} />
      </Section>

      <Section title="More guides">
        <OtherPosts current={POST} />
      </Section>
    </PageShell>
  );
}
