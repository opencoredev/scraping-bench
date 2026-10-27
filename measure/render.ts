// Turns a stored provider response into the plain text the agent reads, and splits it into pages.
import type { ToolOutcome } from "../src/core/types.ts";

export const PAGE_BYTES = 32_000;

const TITLE_LINE = /^HTML document title: ([^\n]*)\n(?:\n)?/;

/** Native title the adapter put before a crawl page body, and the body without it. */
export function splitNativeTitle(markdown: string): { title: string | null; body: string } {
  const match = TITLE_LINE.exec(markdown);
  return match ? { title: match[1] ?? null, body: markdown.slice(match[0].length) } : { title: null, body: markdown };
}

/** The same text for every provider: no JSON escaping, empty fields left out. */
export function renderOutcome(outcome: ToolOutcome): string {
  if (outcome.kind === "error") return `Provider error: ${outcome.error}: ${outcome.message}`;
  const data = outcome.data;
  switch (data.track) {
    case "scrape":
      return `URL: ${data.finalUrl ?? "(not returned)"}\n\n${data.markdown}`;
    case "search":
      if (!data.hits.length) return "No results.";
      return data.hits
        .map((hit, i) =>
          [`[${i + 1}] ${hit.title}`, hit.url, hit.publishedAt ? `Published: ${hit.publishedAt}` : "", hit.snippet, hit.content ?? ""]
            .filter((line) => line.trim() !== "")
            .join("\n"),
        )
        .join("\n\n");
    case "map":
      return data.urls.length ? data.urls.join("\n") : "No URLs.";
    case "crawl": {
      if (!data.pages.length) return "No pages.";
      const pages = data.pages.map((page) => ({ url: page.url, ...splitNativeTitle(page.markdown) }));
      const manifest = pages.map((p) => `${p.url} | ${p.title ?? "(no title returned)"}`).join("\n");
      const bodies = pages.map((p, i) => `=== page ${i + 1}: ${p.url} ===\n${p.body}`).join("\n\n");
      return `Pages returned (URL | HTML document title):\n${manifest}\n\n${bodies}`;
    }
    default: {
      const _exhaustive: never = data;
      return _exhaustive;
    }
  }
}

/** Splits text into pages of at most `size` UTF-8 bytes, never inside a character. */
export function paginate(text: string, size = PAGE_BYTES): string[] {
  const bytes = Buffer.from(text, "utf8");
  if (bytes.length <= size) return [text];
  const pages: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + size, bytes.length);
    // Step back off UTF-8 continuation bytes (10xxxxxx) so no character is split.
    while (end < bytes.length && end > start && ((bytes[end] ?? 0) & 0xc0) === 0x80) end--;
    pages.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
  }
  return pages;
}
