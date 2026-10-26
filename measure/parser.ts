// Reads the agent's final answer. The headline accepts one JSON object with exactly the requested
// fields even when the model wraps it in a code fence or a sentence; the old strict parse is kept as a diagnostic.
export type Parsed =
  | { readonly kind: "answer"; readonly value: Readonly<Record<string, unknown>> }
  | { readonly kind: "no-object" }
  | { readonly kind: "several-objects"; readonly count: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactFields = (value: Record<string, unknown>, fields: readonly string[]) => {
  const keys = Object.keys(value);
  return keys.length === fields.length && fields.every((f) => keys.includes(f));
};

const stripFence = (text: string) => text.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```$/, "");

/** Every balanced top-level `{...}` span, ignoring braces inside JSON strings. */
export function topLevelObjects(text: string): string[] {
  const spans: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"' && depth > 0) inString = true;
    else if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}" && depth > 0) {
      depth--;
      if (depth === 0) spans.push(text.slice(start, i + 1));
    }
  }
  return spans;
}

export function parseAnswer(content: string, fields: readonly string[]): Parsed {
  const candidates = topLevelObjects(stripFence(content)).flatMap((span) => {
    try {
      const value: unknown = JSON.parse(span);
      return isRecord(value) && hasExactFields(value, fields) ? [value] : [];
    } catch {
      return [];
    }
  });
  const [only, ...rest] = candidates;
  if (!only) return { kind: "no-object" };
  if (rest.length) return { kind: "several-objects", count: candidates.length };
  return { kind: "answer", value: only };
}

/** The first v2 run's parser: the whole reply, after one optional fence, must be exactly the object. */
export function parsesStrictly(content: string, fields: readonly string[]): boolean {
  try {
    const value: unknown = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    return isRecord(value) && hasExactFields(value, fields);
  } catch {
    return false;
  }
}
