import { z } from "zod";
import type { Task, ToolOutcome } from "./types.ts";
const strings = z.array(z.string());
const field = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    name: z.string(),
    accept: z.tuple([z.string()], z.string()),
  }),
  z.object({
    kind: z.literal("number"),
    name: z.string(),
    value: z.number(),
    tolerance: z.number().nonnegative(),
  }),
  z.object({ kind: z.literal("version"), name: z.string(), value: z.string() }),
  z.object({ kind: z.literal("date"), name: z.string(), value: z.string() }),
  z.object({
    kind: z.literal("url-set"),
    name: z.string(),
    urls: strings,
    minRecall: z.number().min(0).max(1),
    minPrecision: z.number().min(0).max(1),
  }),
  z.object({ kind: z.literal("text-set"), name: z.string(), items: strings }),
  z.object({ kind: z.literal("none"), name: z.string() }),
]);
export const taskSchema: z.ZodType<Task> = z
  .object({
    id: z.string().min(1),
    track: z.enum(["search", "scrape", "map", "crawl"]),
    family: z.string(),
    instruction: z.string(),
    input: z.discriminatedUnion("track", [
      z.object({ track: z.literal("search"), query: z.string() }),
      z.object({ track: z.literal("scrape"), url: z.url() }),
      z.object({ track: z.literal("map"), site: z.url(), scope: z.string() }),
      z.object({
        track: z.literal("crawl"),
        site: z.url(),
        scope: z.string(),
        maxPages: z.number().int().positive(),
      }),
    ]),
    expected: z.tuple([field], field),
    site: z.string().min(1),
    source: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("fixture"), page: z.string() }),
      z.object({
        kind: z.literal("authoritative"),
        source: z.string(),
        checkedAt: z.string(),
      }),
      z.object({
        kind: z.literal("dataset"),
        dataset: z.string(),
        itemId: z.string(),
      }),
    ]),
  })
  .superRefine((t, ctx) => {
    if (t.track !== t.input.track)
      ctx.addIssue({
        code: "custom",
        message: "Task and input track disagree",
      });
    if (new Set(t.expected.map((f) => f.name)).size !== t.expected.length)
      ctx.addIssue({ code: "custom", message: "Duplicate field names" });
  });
const billing = z.object({
  usd: z.number().nonnegative(),
  basis: z.enum(["reported", "list-price"]),
  credits: z.number().nullable(),
});
export const outcomeSchema: z.ZodType<ToolOutcome> = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal("ok"),
      ms: z.number().nonnegative(),
      billing,
      data: z.discriminatedUnion("track", [
        z.object({
          track: z.literal("search"),
          hits: z.array(
            z.object({
              url: z.string(),
              title: z.string(),
              snippet: z.string(),
              content: z.string().nullable(),
              publishedAt: z.string().nullable(),
            }),
          ),
        }),
        z.object({
          track: z.literal("scrape"),
          markdown: z.string(),
          finalUrl: z.string().nullable(),
        }),
        z.object({ track: z.literal("map"), urls: strings }),
        z.object({
          track: z.literal("crawl"),
          pages: z.array(z.object({ url: z.string(), markdown: z.string() })),
        }),
      ]),
    }),
    z.object({
      kind: z.literal("error"),
      error: z.enum([
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
      message: z.string(),
      nativeErrorBody: z.string().optional(),
      status: z.number().nullable(),
      ms: z.number().nonnegative(),
      billing,
    }),
  ],
);
