import type { ToolOutcome } from '../core/types.ts';
import { TOOL_OUTPUT_TOKEN_CAP, CRAWL_TOOL_OUTPUT_TOKEN_CAP } from '../run/config.ts';

export function truncateOutput(
  value: unknown,
  cap = TOOL_OUTPUT_TOKEN_CAP,
): { text: string; truncated: boolean; tokenUpperBound: number } {
  const full = JSON.stringify(value);
  const buffer = Buffer.from(full);
  const truncated = buffer.length > cap;
  const text = truncated
    ? new TextDecoder("utf-8", { fatal: false })
        .decode(buffer.subarray(0, Math.max(0, cap - 32)))
        .replace(/\uFFFD$/, "") + "\n[OUTPUT TRUNCATED]"
    : full;
  return { text, truncated, tokenUpperBound: Buffer.byteLength(text) };
}

// The adapters prepend this line only when a native title was returned. Stored
// campaign responses use the same representation; body headings are not titles.
export function crawlNativeTitle(markdown: string): string | null {
  return /^HTML document title: ([^\n]*)\n/.exec(markdown)?.[1] ?? null;
}

export function crawlEvidence(outcome: ToolOutcome, cap = CRAWL_TOOL_OUTPUT_TOKEN_CAP) {
  if (outcome.kind !== 'ok' || outcome.data.track !== 'crawl') return truncateOutput(outcome, cap);
  const pages = outcome.data.pages;
  const manifest = pages.map(page => ({ url: page.url, title: crawlNativeTitle(page.markdown) }));
  const bodies = pages.map(page => page.markdown.replace(/^HTML document title: [^\n]*\n\n/, ''));
  const render = (length: number) => JSON.stringify({
    kind: outcome.kind,
    data: { track: 'crawl', pages: manifest },
    excerpts: bodies.map((body, page) => ({ page, markdown: body.slice(0, length).replace(/[\uD800-\uDBFF]$/, '') })),
    ms: outcome.ms,
    billing: outcome.billing,
  });
  if (Buffer.byteLength(render(0)) > cap) throw new Error('Crawl manifest exceeds evidence cap; refusing to omit pages');
  let low = 0;
  let high = Math.max(0, ...bodies.map(body => body.length));
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (Buffer.byteLength(render(mid)) <= cap) low = mid;
    else high = mid - 1;
  }
  const text = render(low);
  return { text, truncated: bodies.some(body => body.length > low), tokenUpperBound: Buffer.byteLength(text) };
}
