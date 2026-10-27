// Content coverage: how much of a page's real text reached the agent. The reference text is fetched
// once from the public page (not through any provider) and compared against each provider's response.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { parse } from "parse5";
import { z } from "zod";
import { normalizeText } from "../src/grade/index.ts";

export const USER_AGENT = "scrapingbench-measure/1.0 (+https://www.scrapingbench.com; leodoesdev@gmail.com)";
const SKIP = new Set(["script", "style", "noscript", "template", "nav", "header", "footer", "aside", "svg"]);
const BLOCK = new Set(["p", "div", "section", "article", "main", "li", "ul", "ol", "table", "tr", "td", "th", "pre", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "dt", "dd", "br", "figcaption"]);

type Node = { nodeName: string; value?: string; childNodes?: Node[] };
const nodeSchema: z.ZodType<Node> = z.lazy(() => z.object({ nodeName: z.string(), value: z.string().optional(), childNodes: z.array(nodeSchema).optional() }).passthrough());

function find(node: Node, name: string): Node | undefined {
  if (node.nodeName === name) return node;
  for (const child of node.childNodes ?? []) {
    const hit = find(child, name);
    if (hit) return hit;
  }
  return undefined;
}
function text(node: Node): string {
  if (node.nodeName === "#text") return node.value ?? "";
  if (SKIP.has(node.nodeName)) return "";
  const inner = (node.childNodes ?? []).map(text).join("");
  return BLOCK.has(node.nodeName) ? `\n${inner}\n` : inner;
}

/** Main text of an HTML page: `main`, else `body`, without navigation, header, footer, aside or scripts. */
export function mainText(html: string): { text: string; title: string | null; h1: string | null } {
  const tree = nodeSchema.parse(parse(html));
  const root = find(tree, "main") ?? find(tree, "body") ?? tree;
  const titleNode = find(tree, "title");
  const h1Node = find(root, "h1") ?? find(tree, "h1");
  const clean = (s: string) => s.replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
  return {
    text: clean(text(root)),
    title: titleNode ? clean(text(titleNode)) || null : null,
    h1: h1Node ? clean(text(h1Node)) || null : null,
  };
}

/** Sentences at `.`, `!` or `?` followed by whitespace, and at line breaks; at least eight words. */
export function sentences(body: string): string[] {
  return body
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 8);
}

const hashOf = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Eight probe sentences spread over the page: boilerplate shared with two or more other pages of the
 * same site is removed, the rest is cut into eight equal spans, and SHA-256 of `taskId:span` picks the
 * sentence in each span: its first 32 bits, modulo the span's length, are the index.
 */
export function probes({ taskId, own, siblings }: { taskId: string; own: readonly string[]; siblings: readonly (readonly string[])[] }): string[] {
  const shared = (s: string) => siblings.filter((other) => other.includes(s)).length >= 2;
  const eligible = [...new Set(own)].filter((s) => !shared(s));
  if (eligible.length <= 8) return eligible;
  const picks: string[] = [];
  for (let span = 0; span < 8; span++) {
    const slice = eligible.slice(Math.floor((span * eligible.length) / 8), Math.floor(((span + 1) * eligible.length) / 8));
    const pick = slice[Number.parseInt(hashOf(`${taskId}:${span}`).slice(0, 8), 16) % Math.max(1, slice.length)];
    if (pick !== undefined) picks.push(pick);
  }
  return picks;
}

/** Removes Markdown link targets and images' URLs so link text reads as plain text. */
const plain = (markdown: string) =>
  markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/<https?:\/\/[^>]+>/g, " ");

/** Share of probe sentences present in the response, after the standard normalization. */
export function coverage(response: string, probeList: readonly string[]): number | null {
  if (!probeList.length) return null;
  const haystack = ` ${normalizeText(plain(response))} `;
  return probeList.filter((p) => haystack.includes(` ${normalizeText(p)} `)).length / probeList.length;
}

// ---------- Reference fetch: the stage's only network access ----------

const referenceSchema = z.object({
  url: z.string(),
  fetchedAt: z.string(),
  status: z.number(),
  finalUrl: z.string(),
  bodySha256: z.string(),
  text: z.string(),
  title: z.string().nullable(),
  h1: z.string().nullable(),
  robots: z.enum(["allowed", "denied", "unavailable"]),
});
export type Reference = z.infer<typeof referenceSchema>;

const robotsFactory = z.function({ input: [z.string(), z.string()], output: z.unknown() }).parse(createRequire(import.meta.url)("robots-parser"));
const robotsMethods = z.object({ isAllowed: z.function({ input: [z.string(), z.string()], output: z.boolean().optional() }) });
const robotsCache = new Map<string, Promise<(url: string) => boolean>>();
const lastHit = new Map<string, number>();

async function politeFetch(url: string): Promise<Response> {
  const host = new URL(url).host;
  const wait = Math.max(0, (lastHit.get(host) ?? 0) + 1100 - Date.now());
  await new Promise((resolve) => setTimeout(resolve, wait));
  lastHit.set(host, Date.now());
  return fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow", signal: AbortSignal.timeout(45_000) });
}

async function robotsFor(origin: string): Promise<(url: string) => boolean> {
  const existing = robotsCache.get(origin);
  if (existing) return existing;
  const pending = (async () => {
    const response = await politeFetch(`${origin}/robots.txt`);
    if (response.status >= 400) return () => true;
    const instance = robotsFactory(`${origin}/robots.txt`, await response.text());
    if (typeof instance !== "object" || instance === null || !("isAllowed" in instance) || typeof instance.isAllowed !== "function")
      throw new Error("Invalid robots-parser instance");
    const methods = robotsMethods.parse({ isAllowed: instance.isAllowed.bind(instance) });
    return (url: string) => methods.isAllowed(url, USER_AGENT) !== false;
  })();
  robotsCache.set(origin, pending);
  return pending;
}

/** The stored reference for a page; fetches it once when `fetchMissing` is set, otherwise a missing page is null. */
export async function reference({ url, dir, fetchMissing }: { url: string; dir: string; fetchMissing: boolean }): Promise<Reference | null> {
  const path = join(dir, `${hashOf(url)}.json`);
  try {
    return referenceSchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  if (!fetchMissing) return null;
  let record: Reference;
  const allow = await robotsFor(new URL(url).origin).catch(() => null);
  if (allow === null || !allow(url)) {
    record = { url, fetchedAt: new Date().toISOString(), status: 0, finalUrl: url, bodySha256: "", text: "", title: null, h1: null, robots: allow === null ? "unavailable" : "denied" };
  } else {
    const response = await politeFetch(url);
    const body = await response.text();
    const page = response.ok ? mainText(body) : { text: "", title: null, h1: null };
    record = { url, fetchedAt: new Date().toISOString(), status: response.status, finalUrl: response.url, bodySha256: hashOf(body), ...page, robots: "allowed" };
  }
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(path, JSON.stringify(record), { mode: 0o600 });
  return record;
}

