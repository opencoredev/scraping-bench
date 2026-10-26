// Retrieval: was the answer in what the provider returned to the agent? No model is involved.
import { canonicalUrl, gradeField } from "../src/grade/index.ts";
import { gradeRaw } from "../src/raw/index.ts";
import type { ExpectedField, Task, ToolData, ToolOutcome } from "../src/core/types.ts";

export type Retrieval = { readonly kind: "graded"; readonly pass: boolean } | { readonly kind: "not-applicable" };

/** True when a canonical URL is the scope root or below it. */
export function inScope(url: string, root: string): boolean {
  const u = canonicalUrl(url);
  const r = canonicalUrl(root);
  return u !== null && r !== null && (u === r || u.startsWith(`${r}/`));
}

/**
 * The task asks for canonical HTML documentation URLs without query strings, so URLs that are plainly
 * something else don't count against a provider: query-string variants and files whose extension isn't
 * an HTML page (`.md` copies, images, feeds). A `#fragment` points into the same page, so canonicalUrl
 * strips it and the page counts.
 */
export function isPageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.search) return false;
    const last = u.pathname.split("/").at(-1) ?? "";
    const ext = /\.([a-z0-9]+)$/i.exec(last)?.[1]?.toLowerCase();
    return ext === undefined || ext === "html" || ext === "htm";
  } catch {
    return false;
  }
}

const urlField = (task: Task): Extract<ExpectedField, { kind: "url-set" }> | undefined =>
  task.expected.find((f): f is Extract<ExpectedField, { kind: "url-set" }> => f.kind === "url-set");

const okData = (outcomes: readonly ToolOutcome[]): ToolData[] => outcomes.flatMap((o) => (o.kind === "ok" ? [o.data] : []));

/** Grades the union of every response the provider gave the agent for this task. */
export function gradeRetrieval(task: Task, outcomes: readonly ToolOutcome[]): Retrieval {
  if (task.expected.some((f) => f.kind === "none")) return { kind: "not-applicable" };
  const data = okData(outcomes);
  const input = task.input;
  switch (input.track) {
    case "scrape": {
      // Each call fetched the same page, so the answer counts as returned if any response holds it.
      const graded = data.map((d) => gradeRaw(task.expected, d));
      if (graded.some((g) => g.applicability === "n/a")) return { kind: "not-applicable" };
      return { kind: "graded", pass: graded.some((g) => g.fields.every((f) => f.pass)) };
    }
    case "search": {
      const hits = data.flatMap((d) => (d.track === "search" ? d.hits : []));
      const graded = gradeRaw(task.expected, { track: "search", hits });
      return graded.applicability === "graded" ? { kind: "graded", pass: graded.fields.every((f) => f.pass) } : { kind: "not-applicable" };
    }
    case "map":
    case "crawl": {
      // The adapters take a site, not a scope, so only page URLs inside the scope count, as the agent
      // is asked to filter them. The scope root is the tool's own input, so it always counts as found.
      const field = urlField(task);
      if (!field) return { kind: "not-applicable" };
      const returned = data.flatMap((d) => (d.track === "map" ? d.urls : d.track === "crawl" ? d.pages.map((p) => p.url) : []));
      const urls = [...new Set([input.site, ...returned.filter((u) => inScope(u, input.site) && isPageUrl(u))])];
      if (!data.length) return { kind: "graded", pass: false };
      return { kind: "graded", pass: gradeField(field, urls).pass };
    }
    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}
