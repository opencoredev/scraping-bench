import { cheapest, comparisons, costText, listText, pairVerdict, rankedRuns, runOn, trackById } from "@/lib/catalog";
import type { Run, TrackId } from "@/lib/catalog";
import { formatPct, results } from "@/lib/results";
import { MODEL, NOT_TESTED, REPO, parallelNote } from "@/lib/site";

/** Some answers describe the v1 run only (Spider and workers.dev, free plans, cold test sites). See lib/notes.ts. */
const V1 = results.campaignVersion === 1;

/**
 * Questions people ask, answered from results.json. Answers are plain text so the page and its FAQPage
 * JSON-LD say exactly the same thing; `links` are shown on the page only.
 */

export type Faq = { question: string; answer: string; links: readonly { href: string; label: string }[] };

/** "Context.dev 92%; Firecrawl, Linkup and TinyFish 90%; …", grouping providers with the same score. */
function scoresText(runs: readonly Run[]): string {
  const groups: Run[][] = [];
  for (const r of runs) {
    const last = groups[groups.length - 1];
    if (last && last[0]?.agent.successes === r.agent.successes) last.push(r);
    else groups.push([r]);
  }
  return groups.map((g) => `${listText(g.map((r) => r.entry.label))} ${formatPct(g[0]?.agent.rate ?? 0)}`).join("; ");
}

function gapsText(trackId: TrackId): string {
  const track = trackById(trackId);
  if (!track) return "";
  if (track.detected.length === 0) return "None of these gaps is big enough to rule out chance, so the data doesn't name one best provider.";
  const gaps = track.detected.map((d) => `${d.provider} finished ${Math.round(-d.difference * 100)} points fewer tasks than ${d.reference}`).join("; ");
  const compared = rankedRuns(track).length - 1;
  const lead = track.detected.length === 1 ? "The only gap big enough to rule out chance" : "Gaps big enough to rule out chance";
  return `${lead}: ${gaps}.${track.detected.length < compared ? " The rest can't be told apart yet." : ""}`;
}

function bestOn(trackId: TrackId, question: string, extra: (runs: Run[]) => string[] = () => []): Faq[] {
  const track = trackById(trackId);
  if (!track) return [];
  const runs = rankedRuns(track);
  const cheap = cheapest(track);
  const answer = [
    `On ${track.tasks} ${track.label.toLowerCase()} tasks with the same model and limits, tasks done were: ${scoresText(runs)}.`,
    gapsText(trackId),
    ...extra(runs),
    cheap ? `${cheap.entry.label} cost the least per finished task, ${costText(cheap.agent)}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return [{ question, answer, links: [{ href: `/${track.id}`, label: `${track.label} results` }] }];
}

const spiderNote = (runs: Run[]) => {
  if (!V1) return [];
  const spider = runs.find((r) => r.entry.id === "spider");
  return [
    ...(spider ? [`Spider's ${formatPct(spider.agent.rate)} is because it refused our test site's workers.dev domain; it scraped all 10 PyPI pages correctly.`] : []),
    "Bright Data, which also sells scraping, was not tested.",
  ];
};

function headToHead(): Faq[] {
  const c = comparisons[0];
  if (!c) return [];
  const verdicts = c.shared.flatMap((t) => {
    const a = runOn(c.a, t.id);
    const b = runOn(c.b, t.id);
    return a && b ? [`On ${t.label.toLowerCase()}, ${c.a.label} finished ${formatPct(a.agent.rate)} and ${c.b.label} ${formatPct(b.agent.rate)}. ${pairVerdict(t, a, b)}`] : [];
  });
  return [{ question: `Is ${c.a.label} or ${c.b.label} better for AI agents?`, answer: verdicts.join(" "), links: [{ href: `/compare/${c.slug}`, label: `${c.a.label} vs ${c.b.label}` }] }];
}

function cheapestFaq(): Faq {
  const parts = results.tracks.flatMap((t) => {
    const c = cheapest(t);
    return c ? [`${t.label.toLowerCase()}: ${c.entry.label} at ${costText(c.agent)}`] : [];
  });
  return {
    question: "Which web data API is cheapest per finished task?",
    answer: `Cost per finished task counts all API and model spend, failures included, divided by tasks done. The cheapest on each track: ${parts.join("; ")}.${V1 ? " Everything ran on free plans, so these are list-price equivalents, not invoices." : ""}`,
    links: [{ href: "/providers", label: "Every provider's cost" }],
  };
}

const ranOn = new Date(results.generatedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const notTestedFaq: Faq = {
  question: `Were ${NOT_TESTED} tested?`,
  answer: `No. This benchmark has no numbers for ${NOT_TESTED}.`,
  links: [],
};

export const faqs: readonly Faq[] = [
  ...bestOn("scrape", "What is the best web scraping API for AI agents?", spiderNote),
  ...bestOn("search", "What is the best search API for AI agents?", () => [`Exa, Tavily and Perplexity, which also sell search APIs, were not tested.`]),
  ...bestOn("crawl", "Which API is best for crawling a website?", (runs) => [`Crawl has only ${runs[0]?.agent.tasks ?? 0} tasks, so its intervals are wide.`]),
  ...bestOn("map", "Which API is best for listing every URL on a site?", () => (V1 ? ["Map tasks ran mostly on a site built fresh for this run, so they test cold sites that no provider had indexed."] : [])),
  cheapestFaq(),
  ...headToHead(),
  ...(V1
    ? [
  {
        question: "Why did Spider score so low?",
        answer:
          "Spider's malicious-URL filter flags the workers.dev domain our test site runs on, so it refused those pages. It scraped all 10 PyPI pages correctly. The score is a domain compatibility finding, not a measure of how well it scrapes sites it accepts.",
        links: [{ href: "/providers/spider", label: "Spider's results" }],
      },
      ]
    : []),
  notTestedFaq,
  {
    question: "Why isn't Parallel in the results?",
    answer: parallelNote(results),
    links: [],
  },
  {
    question: "How are the tasks graded?",
    answer: `Every task is pass or fail, and a script decides it. ${MODEL} uses the provider as its only tool and answers in JSON; the script compares every field with an answer key and passes the task only if every field matches, the run stayed inside its limits and nothing errored. No model grades anything.`,
    links: [{ href: "/methodology", label: "Methodology" }],
  },
  {
    question: "What do the 95% intervals mean?",
    answer:
      "Tasks from the same site aren't independent, so the intervals come from a bootstrap that resamples whole sites 10,000 times. Each provider is compared with its track's leader on the same tasks, and a gap counts only when its interval excludes zero.",
    links: [{ href: "/methodology", label: "When a gap counts" }],
  },
  {
    question: "Which model ran the tasks?",
    answer: `${MODEL} at temperature 0, with the same prompt and limits for every provider. The model and its settings are part of what's measured, so these are not pure vendor scores.`,
    links: [],
  },
  {
    question: "When was this run, and can I reuse the data?",
    answer: `The results are from run ${results.runId} on ${ranOn}, all from one server${V1 ? " on free plans" : ""}. Tasks, grader, harness and every result row are MIT licensed on GitHub at ${REPO}.`,
    links: [{ href: REPO, label: "GitHub" }],
  },
];
