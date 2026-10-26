import type { ExpectedField, FieldVerdict } from "../core/types.ts";

export function normalizeText(value: string): string {
  return value
    .replace(/[\p{Co}\p{Cf}]/gu, "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value
    .normalize("NFKC")
    .trim()
    .replace(/[\p{Sc},\s_]/gu, "")
    .replace(/^(?:usd|eur|gbp)/i, "")
    .replace(
      /(?:milliseconds?|ms|seconds?|s|kilograms?|kg|gb|mb|bytes?|units?)$/i,
      "",
    );
  const match =
    /^(\()?([+-]?(?:\d+(?:\.\d*)?|\.\d+))(k|m|b|thousand|million|billion)?(?:usd|eur|gbp|dollars?|%|percent|ms|milliseconds?|seconds?|s|kg|kilograms?|gb|mb|bytes?|units?)?(\))?$/i.exec(
      cleaned,
    );
  if (!match || Boolean(match[1]) !== Boolean(match[4])) return null;
  const suffix = match[3]?.toLowerCase();
  const factor =
    suffix === "k" || suffix === "thousand"
      ? 1e3
      : suffix === "m" || suffix === "million"
        ? 1e6
        : suffix === "b" || suffix === "billion"
          ? 1e9
          : 1;
  const n = Number(match[2]) * factor * (match[1] ? -1 : 1);
  return Number.isFinite(n) ? n : null;
}
export function normalizeVersion(value: string): string | null {
  const m =
    /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i.exec(
      value.trim(),
    );
  return m
    ? `${Number(m[1])}.${Number(m[2] ?? 0)}.${Number(m[3] ?? 0)}${m[4]?.toLowerCase() ?? ""}`
    : null;
}
export function normalizeDate(value: string): string | null {
  const s = value.trim();
  let y: number;
  let m: number;
  let d: number;
  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:T.*)?$/.exec(s);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (us) {
    y = Number(us[3]);
    m = Number(us[1]);
    d = Number(us[2]);
  } else {
    if (!/^(?:[A-Za-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Za-z]+ \d{4})$/.test(s))
      return null;
    const time = Date.parse(s + " UTC");
    if (!Number.isFinite(time)) return null;
    const parsed = new Date(time);
    y = parsed.getUTCFullYear();
    m = parsed.getUTCMonth() + 1;
    d = parsed.getUTCDate();
    // Reject named dates that Date.parse silently rolls into a later month.
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const month = s
      .match(/[A-Za-z]+/)?.[0]
      ?.slice(0, 3)
      .toLowerCase();
    if (month !== months[m - 1]) return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
    ? date.toISOString().slice(0, 10)
    : null;
}
export function canonicalUrl(value: string): string | null {
  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`,
    );
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.hash = "";
    for (const key of [...url.searchParams.keys()])
      if (/^(utm_.*|fbclid|gclid|msclkid|dclid)$/i.test(key))
        url.searchParams.delete(key);
    url.searchParams.sort();
    return `${url.hostname}${url.port ? ":" + url.port : ""}${url.pathname.replace(/\/+$/, "")}${url.search}`;
  } catch {
    return null;
  }
}
export function setScores(got: readonly string[], expected: readonly string[]) {
  const actual = new Set(got);
  const gold = new Set(expected);
  const matches = [...actual].filter((v) => gold.has(v)).length;
  return {
    recall: gold.size ? matches / gold.size : 1,
    precision: actual.size ? matches / actual.size : gold.size ? 0 : 1,
  };
}
export function gradeField(field: ExpectedField, got: unknown): FieldVerdict {
  let pass = false;
  let note = "normalized comparison";
  switch (field.kind) {
    case "text":
      pass =
        typeof got === "string" &&
        field.accept.some((s) => normalizeText(s) === normalizeText(got));
      break;
    case "number": {
      const n = parseNumber(got);
      pass =
        n !== null &&
        Math.abs(n - field.value) <=
          field.tolerance + Number.EPSILON * Math.max(1, Math.abs(field.value));
      break;
    }
    case "version": {
      const n = typeof got === "string" ? normalizeVersion(got) : null;
      pass = n !== null && n === normalizeVersion(field.value);
      break;
    }
    case "date": {
      const n = typeof got === "string" ? normalizeDate(got) : null;
      pass = n !== null && n === normalizeDate(field.value);
      break;
    }
    case "none":
      pass =
        got === null || got === "" || (Array.isArray(got) && got.length === 0);
      break;
    case "url-set":
    case "text-set": {
      if (
        !Array.isArray(got) ||
        !got.every((v: unknown): v is string => typeof v === "string")
      )
        break;
      const norm = field.kind === "url-set" ? canonicalUrl : normalizeText;
      const actual = got.map(norm);
      const expected = (
        field.kind === "url-set" ? field.urls : field.items
      ).map(norm);
      if (actual.some((v) => v === null) || expected.some((v) => v === null))
        break;
      const scores = setScores(
        actual.filter((v) => v !== null),
        expected.filter((v) => v !== null),
      );
      pass =
        scores.recall >= (field.kind === "url-set" ? field.minRecall : 1) &&
        scores.precision >= (field.kind === "url-set" ? field.minPrecision : 1);
      note = `recall=${scores.recall}; precision=${scores.precision}`;
      break;
    }
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
  return { name: field.name, pass, got: got ?? null, note };
}
export function gradeAnswer(
  expected: readonly ExpectedField[],
  answer: unknown,
): FieldVerdict[] {
  const object =
    typeof answer === "object" && answer !== null && !Array.isArray(answer)
      ? answer
      : {};
  return expected.map((field) =>
    gradeField(
      field,
      Object.hasOwn(object, field.name)
        ? Reflect.get(object, field.name)
        : undefined,
    ),
  );
}
