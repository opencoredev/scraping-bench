import { costText, rankedRuns, runOn } from "@/lib/catalog";
import type { Provider, Run } from "@/lib/catalog";
import type { Faq } from "@/lib/faq";
import { JINA_TOKEN_BUDGET } from "@/lib/notes";
import { formatPct } from "@/lib/results";
import { COST_PATH, MODEL, NOISE_PATH } from "@/lib/site";

/**
 * Extra depth for provider pages people search for by API name ("jina reader api"): a description and questions
 * answered from results.json. The hand-written parts (how the API was called, the token budget) come from
 * src/adapters/jina.ts, providers/jina.config.md and docs/METHODOLOGY.md. Added one provider at a time.
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

const DEPTH: Partial<Record<string, (p: Provider) => ProviderDepth | null>> = {
  jina: jinaDepth,
};

export const providerDepth = (p: Provider): ProviderDepth | null => DEPTH[p.id]?.(p) ?? null;
