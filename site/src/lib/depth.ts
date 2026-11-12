import { costText, doneText, listText, ordinal, rankedRuns, runOn, standingText } from "@/lib/catalog";
import type { Provider, Run } from "@/lib/catalog";
import type { Faq } from "@/lib/faq";
import { JINA_TOKEN_BUDGET } from "@/lib/notes";
import { formatPct } from "@/lib/results";
import { ALTERNATIVES_PATH, CONTEXT_DEV_ALTERNATIVES_PATH } from "@/lib/alternatives";
import { COST_PATH, MODEL, NOISE_PATH } from "@/lib/site";

/**
 * Extra depth for provider pages people search for by API name ("jina reader api"): a description and questions
 * answered from results.json. The hand-written parts (how the API was called, the token budget) come from
 * src/adapters/jina.ts, providers/jina.config.md, providers/firecrawl.config.md and docs/METHODOLOGY.md. Added one provider at a time.
 */

export type ProviderDepth = { description: string; faqs: [Faq, ...Faq[]] };

const limitsText = ({ track }: Run): string => {
  const { calls, seconds, usd } = track.limits;
  return `up to ${calls} ${calls === 1 ? "call" : "calls"}, ${seconds >= 120 ? `${seconds / 60} minutes` : `${seconds} seconds`} and $${usd.toFixed(2)} per task`;
};

/** Where a run sits on one measure among every provider measured on its track: "low", "high", or null when it's at neither end. */
function extreme({ run, value }: { run: Run; value: (r: Run) => number | null }): { end: "low" | "high"; of: number } | null {
  const own = value(run);
  if (own === null) return null;
  const all = rankedRuns(run.track).flatMap((r) => {
    const v = value(r);
    return v === null ? [] : [v];
  });
  if (all.length < 2) return null;
  if (all.every((v) => v >= own) && all.some((v) => v > own)) return { end: "low", of: all.length };
  if (all.every((v) => v <= own) && all.some((v) => v < own)) return { end: "high", of: all.length };
  return null;
}

function jinaDepth(p: Provider): ProviderDepth | null {
  const run = runOn(p, "scrape");
  const budget = JINA_TOKEN_BUDGET;
  if (!run || !budget) return null;
  const { agent, entry } = run;
  const raw = entry.raw;
  const coverage = entry.coverage;
  const coverageMean = coverage?.mean ?? null;

  const coveredAt = extreme({ run, value: (r) => r.entry.coverage?.mean ?? null });
  const doneAt = extreme({ run, value: (r) => r.agent.rate });
  const costAt = extreme({ run, value: (r) => r.agent.costPerSuccessUsd });
  const covered = coveredAt ? `, the ${coveredAt.end === "low" ? "lowest" : "highest"} of the ${coveredAt.of} providers measured` : "";
  const done = doneAt ? `, the ${doneAt.end === "low" ? "fewest" : "most"} on scrape` : "";
  const cost = costAt ? `, the ${costAt.end === "low" ? "lowest" : "highest"} on scrape` : "";

  const called: Faq = {
    question: "How was the Jina Reader API called in this benchmark?",
    answer: [
      "Each scrape call was one GET request to r.jina.ai followed by the page URL, with an API key, asking for JSON, at Jina's default settings.",
      `Every call carried a ${budget}-token budget (the X-Token-Budget header), which makes Reader reject a page longer than that instead of returning it. The budget kept the run inside Jina's free allowance.`,
      `The agent, ${MODEL}, got the same ${run.track.tasks} scrape tasks, prompt and limits as every other provider: ${limitsText(run)}.`,
      "Jina's search API wasn't run, because it has no hard cap on tokens per call.",
    ].join(" "),
    links: [
      { href: "/methodology", label: "How the benchmark works" },
      { href: "/scrape", label: "All scrape results" },
    ],
  };

  const markdown: Faq = {
    question: "Is the Jina Reader API good for turning web pages into Markdown for an LLM?",
    answer: [
      coverage && coverageMean !== null
        ? `On the ${coverage.pages} scrape pages checked against a saved copy, Jina Reader's Markdown held ${formatPct(coverageMean)} of the sentences sampled from each page's own text${covered}.`
        : null,
      raw ? `The answer a task asked for was in its response on ${raw.successes} of ${raw.tasks} tasks (${formatPct(raw.rate)}).` : null,
      `With the ${budget}-token budget, the agent finished ${agent.successes} of ${agent.tasks} scrape tasks (${formatPct(agent.rate)})${done}, at ${costText(agent)} per finished task${cost}.`,
      "Some calls were rejected outright; the token budget is a plausible cause, but the stored evidence can't prove it. Many pages that did come back lacked the top-level heading most tasks asked for.",
      "If your pages are short, or you can allow a larger budget, test Reader on your own pages before you rule it out.",
    ]
      .filter((s): s is string => s !== null)
      .join(" "),
    links: [
      { href: COST_PATH, label: "What cost per finished task means" },
      { href: NOISE_PATH, label: "Which gaps rule out chance" },
    ],
  };

  return {
    description: `How the Jina Reader API (r.jina.ai) did as an AI agent's scrape tool: ${agent.successes} of ${agent.tasks} tasks (${formatPct(agent.rate)}) at ${costText(agent)} per finished task, under a ${budget}-token budget. Intervals and caveats.`,
    faqs: [called, markdown],
  };
}

/** Where a run's cost per finished task sits among every priced run on its track, cheapest first. Rounded-equal costs count as a tie. */
function costPlace(run: Run): { place: number; tied: boolean; of: number } | null {
  const own = run.agent.costPerSuccessUsd;
  if (own === null) return null;
  const priced = rankedRuns(run.track).filter((r) => r.agent.costPerSuccessUsd !== null);
  const shown = costText(run.agent);
  const cheaper = priced.filter((r) => costText(r.agent) !== shown && (r.agent.costPerSuccessUsd ?? 0) < own).length;
  const tied = priced.some((r) => r.entry.id !== run.entry.id && costText(r.agent) === shown);
  return { place: cheaper + 1, tied, of: priced.length };
}

const costPlaceText = (run: Run): string => {
  const at = costPlace(run);
  if (!at) return `${run.track.label.toLowerCase()}, cost not measured`;
  const where = at.place === 1 ? "lowest" : at.place === at.of ? "highest" : `${ordinal(at.place)} lowest`;
  return `${run.track.label.toLowerCase()} ${costText(run.agent)} (${at.tied ? "tied for " : ""}${where} of ${at.of})`;
};

function firecrawlDepth(p: Provider): ProviderDepth | null {
  const [first, ...others] = p.runs;
  const costs = [first, ...others].map(costPlaceText);
  const search = runOn(p, "search");

  const cost: Faq = {
    question: "What does the Firecrawl API cost per finished task?",
    answer: [
      "Firecrawl's plan prices are on its own pricing page. This benchmark measured something a plan price can't tell you: what it cost an AI agent to get a task done.",
      `Per finished task, Firecrawl cost ${listText(costs)}, ranked among the providers priced on each track.`,
      "That counts every API and model dollar spent on a track, failed tasks included, divided by the tasks the agent finished.",
      `Firecrawl reports credits, which were converted to dollars at its documented list rate. Model cost is a list-price estimate for ${MODEL}. Every provider ran on a free plan.`,
    ].join(" "),
    links: [
      { href: COST_PATH, label: "What cost per finished task means" },
      { href: ALTERNATIVES_PATH, label: "Firecrawl alternatives, cost included" },
    ],
  };

  const called: Faq = {
    question: "How was the Firecrawl API called in this benchmark?",
    answer: [
      "Through Firecrawl's v2 API at its default settings, with no SDK and no client retries.",
      "Scrape and crawl asked for Markdown. Search returned web results without scraping each result page. Map used the documented defaults. A crawl was submitted once and polled every 2 seconds.",
      `The agent, ${MODEL}, got the same tasks, prompt and limits as every other provider on each track.`,
    ].join(" "),
    links: [
      { href: "/methodology", label: "How the benchmark works" },
      { href: NOISE_PATH, label: "Which gaps rule out chance" },
    ],
  };

  const searched: Faq | null = search
    ? {
        question: "How did Firecrawl's search API do for an AI agent?",
        answer: `With Firecrawl's search, the agent finished ${doneText(search.agent)} search tasks, at ${costText(search.agent)} per finished task. ${standingText(search)}`,
        links: [
          { href: "/search", label: "All search results" },
          { href: "/compare/firecrawl-vs-linkup", label: "Firecrawl vs Linkup on search" },
        ],
      }
    : null;

  return {
    description: `What the Firecrawl API cost an AI agent per finished task: ${listText([first, ...others].map((r) => `${r.track.label.toLowerCase()} ${costText(r.agent)}`))}. Tasks done, intervals and how it was called.`,
    faqs: searched ? [cost, called, searched] : [cost, called],
  };
}

/** Context.dev, for "context.dev pricing": cost per finished task and how the v1 API was called (providers/contextdev.config.md, src/adapters/contextdev.ts). */
function contextDevDepth(p: Provider): ProviderDepth | null {
  const [first, ...others] = p.runs;
  const runs = [first, ...others];

  const cost: Faq = {
    question: "What does the Context.dev API cost per finished task?",
    answer: [
      "Context.dev's plan prices are on its own pricing page. This benchmark measured what it cost an AI agent to get a task done.",
      `Per finished task, Context.dev cost ${listText(runs.map(costPlaceText))}, ranked among the providers priced on each track.`,
      "That counts every API and model dollar spent on a track, failed tasks included, divided by the tasks the agent finished.",
      `Context.dev reports the credits each call used, which were converted to dollars at its documented list rate. Model cost is a list-price estimate for ${MODEL}. Every provider ran on a free plan.`,
    ].join(" "),
    links: [
      { href: COST_PATH, label: "What cost per finished task means" },
      { href: CONTEXT_DEV_ALTERNATIVES_PATH, label: "Context.dev alternatives, cost included" },
    ],
  };

  const called: Faq = {
    question: "How was the Context.dev API called in this benchmark?",
    answer: [
      "Through Context.dev's v1 web API at its default settings, with no SDK and no client retries, one request at a time on the free plan.",
      "Scrape asked for Markdown. Search asked for at least 10 results, the API's minimum, and the agent got the number the task asked for. Map listed the URLs Context.dev already knows for the domain, filtered to the task's section of the site. Crawl was one synchronous request with a page limit and the same scope.",
      `The agent, ${MODEL}, got the same tasks, prompt and limits as every other provider on each track.`,
    ].join(" "),
    links: [
      { href: "/methodology", label: "How the benchmark works" },
      { href: NOISE_PATH, label: "Which gaps rule out chance" },
    ],
  };

  return {
    description: `What the Context.dev API cost an AI agent per finished task: ${listText(runs.map((r) => `${r.track.label.toLowerCase()} ${costText(r.agent)}`))}. Tasks done, intervals and how it was called.`,
    faqs: [cost, called],
  };
}

const DEPTH: Partial<Record<string, (p: Provider) => ProviderDepth | null>> = {
  jina: jinaDepth,
  firecrawl: firecrawlDepth,
  contextdev: contextDevDepth,
};

export const providerDepth = (p: Provider): ProviderDepth | null => DEPTH[p.id]?.(p) ?? null;
