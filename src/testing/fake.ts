import type { Adapter, ToolData, ToolOutcome } from "../core/types.ts";
import { ZERO_BILLING } from "../agent/tools.ts";
export const FAKE_TEXT =
  "# Orbit Widget\nThe current price is $42.00. Version v2.4.1 was released October 16, 2026. Status: in stock.\n";
export const FAKE_URL = "https://fixture.invalid/products/orbit";
function ok(data: ToolData): ToolOutcome {
  return { kind: "ok", data, ms: 0, billing: ZERO_BILLING };
}
// The shared contract has no fake ID. The runner always labels these calls "fake".
export const fakeAdapter: Adapter = {
  id: "exa",
  displayName: "FAKE: deterministic local evidence",
  cohort: "content-api",
  apiVersion: "fake-v1",
  search: async () =>
    ok({
      track: "search",
      hits: [
        {
          url: FAKE_URL,
          title: "Orbit Widget",
          snippet: FAKE_TEXT,
          content: null,
          publishedAt: null,
        },
      ],
    }),
  scrape: async () =>
    ok({ track: "scrape", markdown: FAKE_TEXT, finalUrl: FAKE_URL }),
  map: async () => ok({ track: "map", urls: [FAKE_URL] }),
  crawl: async () =>
    ok({ track: "crawl", pages: [{ url: FAKE_URL, markdown: FAKE_TEXT }] }),
};
export function oracleAdapter(text: string | null, pages?: Readonly<Record<string, string>>): Adapter {
  return {
    id: "exa",
    displayName: "Oracle plain fetch / supplied evidence",
    cohort: "content-api",
    apiVersion: "plain-fetch-v1",
    scrape: async ({ url }, ctx) => {
      const start = performance.now();
      const supplied = pages?.[url] ?? text;
      if (supplied !== null)
        return ok({ track: "scrape", markdown: supplied, finalUrl: url });
      const response = await fetch(url, {
        signal: ctx.signal,
        redirect: "follow",
      });
      if (!response.ok)
        return {
          kind: "error",
          error: response.status >= 500 ? "http-5xx" : "http-4xx",
          message: "Oracle fetch failed",
          status: response.status,
          ms: performance.now() - start,
          billing: ZERO_BILLING,
        };
      return {
        ...ok({
          track: "scrape",
          markdown: await response.text(),
          finalUrl: response.url,
        }),
        ms: performance.now() - start,
      };
    },
  };
}
