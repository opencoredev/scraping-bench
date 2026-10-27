// Shared contract between task sets, provider adapters, the runner and the grader.
// Every task set, adapter and grader codes against these types only.

export type Track = "search" | "scrape" | "map" | "crawl";

export type ProviderId =
  | "contextdev"
  | "firecrawl"
  | "tinyfish"
  | "exa"
  | "tavily"
  | "parallel"
  | "jina"
  | "spider"
  | "linkup"
  | "perplexity"
  | "brightdata"
  | "scrapfly"
  | "browserbase"
  | "you"
  | "string";

/** Which kind of product a provider is, so it is only ranked against its peers. */
export type Cohort = "content-api" | "search-index" | "scraping-infra" | "browser-infra";

/** Settings lane: documented defaults, or the tuned config frozen before the run. */
export type Lane = "default" | "tuned";

// ---------- Tasks ----------

export type TaskInput =
  | { readonly track: "search"; readonly query: string }
  | { readonly track: "scrape"; readonly url: string }
  | { readonly track: "map"; readonly site: string; readonly scope: string }
  | { readonly track: "crawl"; readonly site: string; readonly scope: string; readonly maxPages: number };

/**
 * One expected field of the answer. `kind` decides how the grader compares it.
 * - text: normalized string equality against any accepted variant
 * - number: numeric equality within tolerance, after parsing units/currency
 * - version: semver-ish equality
 * - date: same calendar day (ISO)
 * - url-set: canonicalized URL set equality (or recall/precision thresholds)
 * - text-set: normalized string set equality
 * - none: the correct answer is "not found"; passes only on null
 */
export type ExpectedField =
  | { readonly kind: "text"; readonly name: string; readonly accept: readonly [string, ...string[]] }
  | { readonly kind: "number"; readonly name: string; readonly value: number; readonly tolerance: number }
  | { readonly kind: "version"; readonly name: string; readonly value: string }
  | { readonly kind: "date"; readonly name: string; readonly value: string }
  | { readonly kind: "url-set"; readonly name: string; readonly urls: readonly string[]; readonly minRecall: number; readonly minPrecision: number }
  | { readonly kind: "text-set"; readonly name: string; readonly items: readonly string[] }
  | { readonly kind: "none"; readonly name: string };

export type TaskSource =
  | { readonly kind: "fixture"; readonly page: string }
  | { readonly kind: "authoritative"; readonly source: string; readonly checkedAt: string }
  | { readonly kind: "dataset"; readonly dataset: string; readonly itemId: string };

export interface Task {
  readonly id: string;
  readonly track: Track;
  /** Task family, used for balanced reporting (e.g. "price-stock", "install-command"). */
  readonly family: string;
  /** The instruction given to the fixed answer model. */
  readonly instruction: string;
  readonly input: TaskInput;
  /** Every field must pass for the task to count as done. */
  readonly expected: readonly [ExpectedField, ...ExpectedField[]];
  readonly source: TaskSource;
  /** Groups tasks from the same site for clustered statistics. */
  readonly site: string;
}

// ---------- Adapter outputs ----------

export interface SearchHit {
  readonly url: string;
  readonly title: string;
  readonly snippet: string;
  /** Page content when the provider returns it with search results. */
  readonly content: string | null;
  readonly publishedAt: string | null;
}

export type ToolData =
  | { readonly track: "search"; readonly hits: readonly SearchHit[] }
  | { readonly track: "scrape"; readonly markdown: string; readonly finalUrl: string | null }
  | { readonly track: "map"; readonly urls: readonly string[] }
  | { readonly track: "crawl"; readonly pages: readonly { readonly url: string; readonly markdown: string }[] };

export type ErrorClass = "timeout" | "http-4xx" | "http-5xx" | "rate-limited" | "blocked" | "empty" | "network" | "unsupported" | "other";

export type ToolOutcome =
  | { readonly kind: "ok"; readonly data: ToolData; readonly ms: number; readonly billing: Billing }
  | { readonly kind: "error"; readonly error: ErrorClass; readonly message: string; readonly status: number | null; readonly nativeErrorBody?: string; readonly ms: number; readonly billing: Billing };

/** What the call cost. Credits as reported by the API when available, else estimated from list price. */
export interface Billing {
  readonly usd: number;
  readonly basis: "reported" | "list-price";
  readonly credits: number | null;
}

export interface CallContext {
  readonly lane: Lane;
  readonly timeoutMs: number;
  readonly signal: AbortSignal;
}

export interface Adapter {
  readonly id: ProviderId;
  readonly displayName: string;
  readonly cohort: Cohort;
  /** Pinned SDK/API version string, published with results. */
  readonly apiVersion: string;
  readonly search?: (args: { readonly query: string; readonly limit: number }, ctx: CallContext) => Promise<ToolOutcome>;
  readonly scrape?: (args: { readonly url: string }, ctx: CallContext) => Promise<ToolOutcome>;
  readonly map?: (args: { readonly site: string; readonly limit: number }, ctx: CallContext) => Promise<ToolOutcome>;
  readonly crawl?: (args: { readonly site: string; readonly scope: string; readonly maxPages: number }, ctx: CallContext) => Promise<ToolOutcome>;
}

// ---------- Results ----------

export interface FieldVerdict {
  readonly name: string;
  readonly pass: boolean;
  readonly got: unknown;
  readonly note: string;
}

export interface TaskResult {
  readonly taskId: string;
  readonly provider: ProviderId;
  readonly lane: Lane;
  /** "agent" = fixed model answers from tool output; "raw" = script checks raw tool output, no model. */
  readonly mode: "agent" | "raw";
  readonly client: string;
  readonly startedAt: string;
  readonly success: boolean;
  readonly fields: readonly FieldVerdict[];
  readonly toolCalls: number;
  readonly toolMs: number;
  readonly totalMs: number;
  readonly apiUsd: number;
  readonly modelUsd: number;
  readonly errors: readonly ErrorClass[];
}
