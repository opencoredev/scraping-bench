import { z } from "zod";
import type { TaskResult } from "../core/types.ts";
import type { ModelCall } from "../model/index.ts";
export const providerIdSchema = z.enum([
  "contextdev",
  "firecrawl",
  "tinyfish",
  "exa",
  "tavily",
  "parallel",
  "jina",
  "spider",
  "linkup",
  "perplexity",
  "brightdata",
  "scrapfly",
  "browserbase",
]);
export const runProviderSchema = z.union([
  providerIdSchema,
  z.enum(["fake", "none", "oracle"]),
]);
export type RunProvider = z.infer<typeof runProviderSchema>;
export interface RunResult extends Omit<TaskResult, "provider"> {
  readonly provider: RunProvider;
  readonly track: "search" | "scrape" | "map" | "crawl";
  readonly family: string;
  readonly site: string;
  readonly cohort: string;
  readonly applicability: "graded" | "n/a";
  readonly modelCalls: readonly ModelCall[];
  readonly truncations: readonly boolean[];
  readonly limitReason: string | null;
}
export function resultKey(
  row: Pick<RunResult, "taskId" | "provider" | "lane" | "mode">,
): string {
  return JSON.stringify([row.taskId, row.provider, row.lane, row.mode]);
}
const modelCallSchema = z.object({
  model: z.enum(["claude-haiku-5-5", "gpt-6.1-sol"]),
  inputTokens: z.number(),
  outputTokens: z.number(),
  modelUsd: z.number(),
  ms: z.number(),
  attempt: z.number(),
  pricingBasis: z.literal("list-price-estimate"),
});
export const resultSchema: z.ZodType<RunResult> = z.object({
  taskId: z.string(),
  provider: runProviderSchema,
  lane: z.enum(["default", "tuned"]),
  mode: z.enum(["agent", "raw"]),
  client: z.string(),
  startedAt: z.string(),
  success: z.boolean(),
  fields: z.array(
    z.object({
      name: z.string(),
      pass: z.boolean(),
      got: z.unknown(),
      note: z.string(),
    }),
  ),
  toolCalls: z.number(),
  toolMs: z.number(),
  totalMs: z.number(),
  apiUsd: z.number(),
  modelUsd: z.number(),
  errors: z.array(
    z.enum([
      "timeout",
      "http-4xx",
      "http-5xx",
      "rate-limited",
      "blocked",
      "empty",
      "network",
      "unsupported",
      "other",
    ]),
  ),
  track: z.enum(["search", "scrape", "map", "crawl"]),
  family: z.string(),
  site: z.string(),
  cohort: z.string(),
  applicability: z.enum(["graded", "n/a"]),
  modelCalls: z.array(modelCallSchema),
  truncations: z.array(z.boolean()),
  limitReason: z.string().nullable(),
});
