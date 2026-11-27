import { costText, doneText, listText, ordinal, rankedRuns, runOn, standingText } from "@/lib/catalog";
import type { Provider, Run } from "@/lib/catalog";
import type { Faq } from "@/lib/faq";
import { providerAnswer } from "@/lib/answers";
import { JINA_TOKEN_BUDGET, PROVIDER_NOTES } from "@/lib/notes";
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

  // Jina's own rate limits, read from https://jina.ai/reader/ on 2026-11-19. Re-check them before 2027-02-19.
  const free: Faq = {
    question: "Is the Jina Reader API free, and what did it cost per finished task?",
    answer: [
      "Jina's Reader page says the Reader API is free to use, with rate limits. On November 19, 2026 it listed 20 requests a minute to r.jina.ai without an API key and 500 with a free key, and it counts the tokens in each response.",
      "In this benchmark's smoke test, keyless calls returned HTTP 401, so every scored call used an API key.",
      `The ${budget}-token budget on each call kept the whole run inside Jina's free allowance. Under it, the agent finished ${agent.successes} of ${agent.tasks} scrape tasks (${formatPct(agent.rate)}).`,
      `Even so, its cost per finished task (${costText(agent)}${cost}) prices Reader's tokens at Jina's list rate and adds the agent model's spend, so it doesn't assume the free allowance. Model cost is a list-price estimate for ${MODEL}.`,
    ].join(" "),
    links: [
      { href: "https://jina.ai/reader/", label: "Jina's Reader page and rate limits" },
      { href: COST_PATH, label: "What cost per finished task means" },
    ],
  };

  return {
    description: `Is the Jina Reader API (r.jina.ai) free, and how did it do as an AI agent's scrape tool? ${agent.successes} of ${agent.tasks} tasks (${formatPct(agent.rate)}) at ${costText(agent)} per finished task, under a ${budget}-token budget.`,
    faqs: [called, free, markdown],
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
  const map = runOn(p, "map");

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

  const mapped: Faq | null = map
    ? {
        question: "How did Firecrawl's map API do at listing a site's URLs?",
        answer: [
          "Firecrawl's map endpoint takes a site URL and returns a list of the links it finds there rather than page content. The benchmark kept only the URLs from each response.",
          "Each map task asked the agent for every canonical URL inside one section of a documentation site. A task passed when at least 90% of the returned URLs were in that section and at least 90% of the section's URLs were returned, so a pass isn't always a complete list.",
          `With Firecrawl's map at a 1,000-URL limit and otherwise default settings, the agent finished ${doneText(map.agent)} map tasks, at ${costText(map.agent)} per finished task. ${standingText(map)}`,
        ].join(" "),
        links: [
          { href: "/map", label: "All map results" },
          { href: "/compare/string-vs-firecrawl#map", label: "String vs Firecrawl on map" },
        ],
      }
    : null;

  return {
    description: `What the Firecrawl API cost an AI agent per finished task: ${listText([first, ...others].map((r) => `${r.track.label.toLowerCase()} ${costText(r.agent)}`))}. Tasks done, intervals and how it was called.`,
    faqs: [cost, called, ...[searched, mapped].filter((f): f is Faq => f !== null)],
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
      "Scrape asked for Markdown. Search asked for at least 10 results, the API's minimum, and the agent got the first results up to the number it asked for, which the benchmark capped at 10. Map listed the URLs Context.dev already knows for the domain, filtered to the task's section of the site. Crawl was one synchronous request with a page limit and the same scope.",
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

/**
 * The cost question for a provider whose adapter estimates API spend from a documented price per call
 * (src/adapters/pricing.ts) because the response carries no usage: Linkup and Browserbase.
 */
function perCallCostFaq({ name, question, runs }: { name: string; question: string; runs: readonly [Run, ...Run[]] }): Faq {
  return {
    question,
    answer: [
      `${name}'s plan prices are on its own pricing page. This benchmark measured what it cost an AI agent to get a task done.`,
      `Per finished task, ${name} cost ${listText(runs.map(costPlaceText))}, ranked among the providers priced on each track.`,
      "That counts every API and model dollar spent on a track, failed tasks included, divided by the tasks the agent finished.",
      `The API share is an estimate: each call was priced at ${name}'s documented list price per call. Model cost is a list-price estimate for ${MODEL}. Every provider ran on a free plan.`,
    ].join(" "),
    links: [
      { href: COST_PATH, label: "What cost per finished task means" },
      { href: NOISE_PATH, label: "Which gaps rule out chance" },
    ],
  };
}

/** Linkup, for "linkup api": cost per finished task and how its v1 search and fetch endpoints were called (providers/linkup.config.md, src/adapters/linkup.ts). */
function linkupDepth(p: Provider): ProviderDepth | null {
  const runs = p.runs;

  const called: Faq = {
    question: "How was the Linkup API called in this benchmark?",
    answer: [
      "Through Linkup's v1 API at its default settings, with no SDK and no client retries.",
      "Search was one POST to /v1/search with standard depth, the searchResults output type and maxResults set to the number of results the agent asked for (the benchmark capped that at 10), so the agent got a list of results, each with a text excerpt, and no written answer.",
      "Scrape was one POST to /v1/fetch with only the page URL, so pages weren't rendered with JavaScript, and the agent read the Markdown it returned.",
      `The agent, ${MODEL}, got the same tasks, prompt and limits as every other provider on each track.`,
    ].join(" "),
    links: [
      { href: "/methodology", label: "How the benchmark works" },
      { href: "/compare/firecrawl-vs-linkup", label: "Firecrawl vs Linkup, track by track" },
    ],
  };

  return {
    description: `What the Linkup API did as an AI agent's search and scrape tool: ${listText(runs.map((r) => `${r.track.label.toLowerCase()} ${doneText(r.agent)} at ${costText(r.agent)} per finished task`))}. How it was called, intervals and caveats.`,
    faqs: [perCallCostFaq({ name: "Linkup", question: "What does the Linkup API cost per finished task?", runs }), called],
  };
}

/** Browserbase, for "browserbase fetch api": cost per finished task and how its Fetch and Search APIs were called (providers/browserbase.config.md, src/adapters/browserbase.ts). */
function browserbaseDepth(p: Provider): ProviderDepth | null {
  const runs = p.runs;

  const called: Faq = {
    question: "How were Browserbase's Fetch and Search APIs called in this benchmark?",
    answer: [
      "Through Browserbase's v1 HTTP APIs at their default settings, with no browser session, no SDK and no client retries.",
      "Scrape was one POST to /v1/fetch asking for Markdown. Fetch doesn't render JavaScript, and a page that came back with an error status counted as a failed call.",
      "Search was one POST to /v1/search for the number of results the agent asked for, which the benchmark capped at 10.",
      `The agent, ${MODEL}, got the same tasks, prompt and limits as every other provider on each track.`,
    ].join(" "),
    links: [
      { href: "/methodology", label: "How the benchmark works" },
      { href: "/compare/firecrawl-vs-browserbase", label: "Firecrawl vs Browserbase, track by track" },
    ],
  };

  return {
    description: `What Browserbase's Fetch and Search APIs did for an AI agent: ${listText(runs.map((r) => `${r.track.label.toLowerCase()} ${doneText(r.agent)} at ${costText(r.agent)} per finished task`))}. How they were called, intervals and caveats.`,
    faqs: [perCallCostFaq({ name: "Browserbase", question: "What do Browserbase's Fetch and Search APIs cost per finished task?", runs }), called],
  };
}

/**
 * TinyFish, for "tinyfish api" and "what is TinyFish and how does it compare to Firecrawl": what was tested, how its
 * Fetch and Search APIs were called (providers/tinyfish.config.md, src/adapters/tinyfish.ts) and cost per finished task
 * with the account's $0 contract caveat, read from PROVIDER_NOTES so the two never disagree.
 */
function tinyfishDepth(p: Provider): ProviderDepth | null {
  const runs = p.runs;
  const versus = providerAnswer(p)?.versus ?? [];
  const contract = (PROVIDER_NOTES[p.id] ?? []).filter((n) => !n.track).map((n) => n.text);
  if (contract.length === 0) return null;

  const what: Faq = {
    question: "What is TinyFish, and how does it compare to Firecrawl?",
    answer: [
      `TinyFish offers web APIs built for AI agents. This benchmark tested two of them, the way an agent would use them as its only tool: its Fetch API, which returns a page as Markdown, on scrape, and its Search API, which returns web results, on search. TinyFish finished ${listText(runs.map((r) => `${doneText(r.agent)} ${r.track.label.toLowerCase()} tasks`))}.`,
      ...versus,
      ...(versus.length > 0 ? contract : []),
    ].join(" "),
    links: [
      { href: "/compare/firecrawl-vs-tinyfish", label: "Firecrawl vs TinyFish, track by track" },
      { href: ALTERNATIVES_PATH, label: "Every Firecrawl alternative tested" },
    ],
  };

  const called: Faq = {
    question: "How were TinyFish's Fetch and Search APIs called in this benchmark?",
    answer: [
      "Through TinyFish's Fetch and Search HTTP APIs at their default settings, with no SDK and no client retries.",
      "Scrape was one POST to the Fetch API with the page URL and Markdown as the format; if TinyFish returned an error for the page, the call counted as failed.",
      "Search was one GET to the Search API with only the query, and the agent got the first results up to the number it asked for, which the benchmark capped at 10, each with a title and snippet but no page text.",
      "Map and crawl weren't run, because these two APIs don't cover them.",
      `The agent, ${MODEL}, got the same tasks, prompt and limits as every other provider on each track.`,
    ].join(" "),
    links: [
      { href: "/methodology", label: "How the benchmark works" },
      { href: "/search", label: "All search results" },
    ],
  };

  const cost: Faq = {
    question: "What does the TinyFish API cost per finished task?",
    answer: [
      `Per finished task, TinyFish cost ${listText(runs.map(costPlaceText))}, ranked among the providers priced on each track.`,
      "That counts every API and model dollar spent on a track, failed tasks included, divided by the tasks the agent finished.",
      ...contract,
      `Model cost is a list-price estimate for ${MODEL}. Every provider ran on a free plan, and TinyFish's own pricing page has its current plan prices.`,
    ].join(" "),
    links: [
      { href: COST_PATH, label: "What cost per finished task means" },
      { href: NOISE_PATH, label: "Which gaps rule out chance" },
    ],
  };

  return {
    description: `What TinyFish's Fetch and Search APIs did for an AI agent: ${listText(runs.map((r) => `${r.track.label.toLowerCase()} ${doneText(r.agent)}`))} tasks done. How they were called, vs Firecrawl, and cost on a $0 API contract.`,
    faqs: [what, called, cost],
  };
}

/**
 * Scrapfly, for "is Scrapfly good for crawling with AI agents" (GEO #17) and "scrapfly api": what a crawl task asked,
 * how Scrapfly did on it, and how its Scrape and Crawler APIs were called (providers/scrapfly.config.md, src/adapters/scrapfly.ts).
 * No crawl cost or time here: issue #29 hasn't settled which crawl cost and time figures are valid.
 */
function scrapflyDepth(p: Provider): ProviderDepth | null {
  const crawl = runOn(p, "crawl");
  if (!crawl) return null;
  const { track, entry, agent } = crawl;
  const titles = entry.titles;
  const crawled = rankedRuns(track).length;

  const good: Faq = {
    question: "Is Scrapfly good for crawling with AI agents?",
    answer: [
      `In this benchmark's crawl track, an AI agent with Scrapfly's Crawler API as its only tool finished ${doneText(agent)} tasks. ${standingText(crawl)}`,
      `Each task asked the agent to ${track.what.charAt(0).toLowerCase()}${track.what.slice(1, -1)}, with ${limitsText(crawl)}.`,
      track.population?.notes.split(/(?<=\.)\s/)[0] ?? null,
      titles ? `Scrapfly returned the exact HTML title for ${titles.exact} of the ${titles.expected} pages the tasks expected.` : null,
      `The crawl track is small: ${track.tasks} tasks and ${crawled} providers, all on free plans from one server, so a tie at the top says Scrapfly handled these docs sites, not that it beats the others in general.`,
    ]
      .filter((s): s is string => s !== null)
      .join(" "),
    links: [
      { href: "/crawl", label: "All crawl results" },
      { href: NOISE_PATH, label: "Which gaps rule out chance" },
    ],
  };

  const called: Faq = {
    question: "How was the Scrapfly API called in this benchmark?",
    answer: [
      "Through Scrapfly's Scrape and Crawler HTTP APIs at their default settings, with no SDK and no client retries.",
      "Scrape was one GET to /scrape asking for Markdown with Scrapfly's own retries turned off and no JavaScript rendering.",
      "Crawl was one POST to /crawl with a page limit, the task's section of the site as the only path to include, and Markdown and HTML as the content formats. The job was polled every 2 seconds, then its pages were read back. Scrapfly's server-side per-page retries can't be turned off with a documented setting.",
      `The agent, ${MODEL}, got the same tasks, prompt and limits as every other provider on each track.`,
    ].join(" "),
    links: [
      { href: "/methodology", label: "How the benchmark works" },
      { href: "/compare/firecrawl-vs-scrapfly", label: "Firecrawl vs Scrapfly, track by track" },
    ],
  };

  return {
    description: `Is Scrapfly good for crawling with AI agents? Its Crawler API finished ${doneText(agent)} crawl tasks, ${titles ? `with exact titles on ${titles.exact} of ${titles.expected} pages` : ""}. How its Scrape and Crawler APIs were called, intervals and caveats.`,
    faqs: [good, called],
  };
}

const DEPTH: Partial<Record<string, (p: Provider) => ProviderDepth | null>> = {
  scrapfly: scrapflyDepth,
  tinyfish: tinyfishDepth,
  jina: jinaDepth,
  firecrawl: firecrawlDepth,
  contextdev: contextDevDepth,
  linkup: linkupDepth,
  browserbase: browserbaseDepth,
};

export const providerDepth = (p: Provider): ProviderDepth | null => DEPTH[p.id]?.(p) ?? null;
