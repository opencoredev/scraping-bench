import type { ExpectedField, FieldVerdict, ToolData } from "../core/types.ts";
import { canonicalUrl, gradeField, normalizeText } from "../grade/index.ts";

export function containsValue(
  field: ExpectedField,
  text: string,
): boolean | null {
  switch (field.kind) {
    case "none":
      return null; // Absence of an answer cannot be proved by a bag of text.
    case "text":
      return field.accept.some((v) =>
        ` ${normalizeText(text)} `.includes(` ${normalizeText(v)} `),
      );
    case "text-set":
      if (field.items.some(v => v.includes(" | "))) return null;
      return field.items.every((v) =>
        ` ${normalizeText(text)} `.includes(` ${normalizeText(v)} `),
      );
    case "url-set": {
      const urls = text.match(/https?:\/\/[^\s<>"\])]+/g) ?? [];
      return gradeField(field, urls).pass;
    }
    case "number":
      return (
        text.match(
          /(?:\(?[+-]?[\p{Sc}]?\s*\d[\d,]*(?:\.\d+)?(?:\s*(?:billion|million|thousand|[KMB])(?![a-z]))?\)?)/giu,
        ) ?? []
      ).some((v) => gradeField(field, v.trim()).pass);
    case "version":
      return (
        text.match(
          /\bv?\d+(?:\.\d+){0,2}(?:-[\da-z.-]+)?(?:\+[\da-z.-]+)?\b/gi,
        ) ?? []
      ).some((v) => gradeField(field, v).pass);
    case "date":
      return (
        text.match(
          /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b[A-Za-z]+ \d{1,2},? \d{4}\b|\b\d{1,2} [A-Za-z]+ \d{4}\b/g,
        ) ?? []
      ).some((v) => gradeField(field, v).pass);
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}
export function rawApplicable(
  expected: readonly ExpectedField[],
  track: ToolData["track"],
): boolean {
  return expected.every(
    (f) => f.kind !== "none" && !(f.kind === "text-set" && f.items.some(v => v.includes(" | "))) && (track !== "map" || f.kind === "url-set"),
  );
}
export function gradeRaw(
  expected: readonly ExpectedField[],
  data: ToolData,
): { applicability: "graded" | "n/a"; fields: FieldVerdict[] } {
  const text =
    data.track === "scrape"
      ? data.markdown
      : data.track === "search"
        ? data.hits
            .map((h) => `${h.title}\n${h.snippet}\n${h.content ?? ""}`)
            .join("\n")
        : data.track === "crawl"
          ? data.pages.map((p) => p.markdown).join("\n")
          : "";
  const urls =
    data.track === "search"
      ? data.hits.map((h) => h.url)
      : data.track === "map"
        ? data.urls
        : data.track === "crawl"
          ? data.pages.map((p) => p.url)
          : null;
  let applicable = rawApplicable(expected, data.track);
  const fields = expected.map((field) => {
    const pass =
      field.kind === "url-set" && urls
        ? gradeField(
            data.track === "search" ? { ...field, minPrecision: 0 } : field,
            urls,
          ).pass
        : data.track === "map"
          ? null
          : containsValue(field, text);
    if (pass === null) applicable = false;
    return {
      name: field.name,
      pass: pass ?? false,
      got: null,
      note:
        pass === null
          ? "n/a: raw output cannot establish this field"
          : "raw evidence check",
    };
  });
  return { applicability: applicable ? "graded" : "n/a", fields };
}
export { canonicalUrl };
