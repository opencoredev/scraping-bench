import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalUrl,
  gradeAnswer,
  gradeField,
  normalizeDate,
  normalizeText,
  normalizeVersion,
  parseNumber,
  setScores,
} from "./index.ts";
import { gradeRaw } from "../raw/index.ts";
import type { ExpectedField } from "../core/types.ts";

test("text folds Unicode width, case, whitespace, punctuation, but preserves accents", () => {
  assert.equal(normalizeText("  ＨELLO,\nWorld!  "), "hello world");
  assert.equal(normalizeText("Cafe\u0301"), normalizeText("CAFÉ"));
  assert.notEqual(normalizeText("cafe"), normalizeText("café"));
});
for (const [value, expected] of [
  ["$1,234.50", 1234.5],
  ["€ 2.5 M", 2.5e6],
  ["3 billion USD", 3e9],
  ["(£42)", -42],
  ["10 kg", 10],
  ["25%", 25],
  ["-3K", -3000],
  ["0", 0],
  ["USD 5", 5],
  ["1.2.3", null],
  ["NaN", null],
  ["3 widgets", null],
  ["42)", null],
] satisfies [string, number | null][])
  test(`number ${value}`, () => assert.equal(parseNumber(value), expected));
test("non-string numbers and invalid values", () => {
  assert.equal(parseNumber(42), 42);
  assert.equal(parseNumber(Infinity), null);
  assert.equal(parseNumber(null), null);
});
for (const [value, expected] of [
  ["v1.2", "1.2.0"],
  ["1.2.3+build.4", "1.2.3"],
  ["v2.0.0-RC.1", "2.0.0-rc.1"],
  ["latest", null],
  ["1.2.3.4", null],
] satisfies [string, string | null][])
  test(`version ${value}`, () =>
    assert.equal(normalizeVersion(value), expected));
for (const [value, expected] of [
  ["2026-10-16", "2026-10-16"],
  ["2026/1/2", "2026-01-02"],
  ["10/16/2026", "2026-10-16"],
  ["October 16, 2026", "2026-10-16"],
  ["16 October 2026", "2026-10-16"],
  ["2026-10-16T23:59:00-05:00", "2026-10-16"],
  ["2024-02-29", "2024-02-29"],
  ["2026-02-29", null],
  ["February 30, 2026", null],
  ["yesterday", null],
] satisfies [string, string | null][])
  test(`date ${value}`, () => assert.equal(normalizeDate(value), expected));
for (const [value, expected] of [
  [
    "HTTP://WWW.Example.COM:80/a/?utm_source=x&b=2&a=1#hi",
    "example.com/a?a=1&b=2",
  ],
  ["https://example.com:443/", "example.com"],
  ["example.com/a/", "example.com/a"],
  ["https://example.com:8443/a", "example.com:8443/a"],
  ["https://u:p@example.com", null],
  ["ftp://example.com", null],
  ["%%% nonsense", null],
] satisfies [string, string | null][])
  test(`URL ${value}`, () => assert.equal(canonicalUrl(value), expected));
const cases: { field: ExpectedField; got: unknown; pass: boolean }[] = [
  {
    field: { kind: "text", name: "a", accept: ["Hello world", "hi"] },
    got: "HELLO, WORLD!",
    pass: true,
  },
  {
    field: { kind: "text", name: "a", accept: ["hello"] },
    got: 42,
    pass: false,
  },
  {
    field: { kind: "number", name: "a", value: 100, tolerance: 1 },
    got: "$101",
    pass: true,
  },
  {
    field: { kind: "number", name: "a", value: 100, tolerance: 1 },
    got: "102",
    pass: false,
  },
  {
    field: { kind: "version", name: "a", value: "1.2.0" },
    got: "v1.2",
    pass: true,
  },
  {
    field: { kind: "version", name: "a", value: "1.2.0" },
    got: "1.2.0-beta",
    pass: false,
  },
  {
    field: { kind: "date", name: "a", value: "2026-10-16" },
    got: "October 16, 2026",
    pass: true,
  },
  { field: { kind: "none", name: "a" }, got: null, pass: true },
  { field: { kind: "none", name: "a" }, got: "", pass: true },
  { field: { kind: "none", name: "a" }, got: [], pass: true },
  { field: { kind: "none", name: "a" }, got: undefined, pass: false },
  { field: { kind: "none", name: "a" }, got: 0, pass: false },
  {
    field: {
      kind: "url-set",
      name: "a",
      urls: ["https://x.com/a", "https://x.com/b"],
      minRecall: 0.5,
      minPrecision: 1,
    },
    got: ["http://www.x.com/a/", "https://x.com/a#x"],
    pass: true,
  },
  {
    field: {
      kind: "url-set",
      name: "a",
      urls: ["https://x.com/a"],
      minRecall: 1,
      minPrecision: 1,
    },
    got: ["https://x.com/a", "https://x.com/other"],
    pass: false,
  },
  {
    field: {
      kind: "url-set",
      name: "a",
      urls: [],
      minRecall: 1,
      minPrecision: 1,
    },
    got: [],
    pass: true,
  },
  {
    field: { kind: "text-set", name: "a", items: ["One", "Two"] },
    got: ["two", "ONE!", "one"],
    pass: true,
  },
  {
    field: { kind: "text-set", name: "a", items: ["One"] },
    got: [42],
    pass: false,
  },
];
for (const [i, c] of cases.entries())
  test(`field kind ${c.field.kind} case ${i}`, () =>
    assert.equal(gradeField(c.field, c.got).pass, c.pass));
test("all fields required and missing none cannot pass", () => {
  assert.deepEqual(
    gradeAnswer([{ kind: "none", name: "absent" }], {}).map((f) => f.pass),
    [false],
  );
  assert.deepEqual(setScores([], ["a"]), { recall: 0, precision: 0 });
  assert.deepEqual(setScores([], []), { recall: 1, precision: 1 });
});
test("raw checks all evidence and normalizes numeric/version/date values", () => {
  const fields: ExpectedField[] = [
    { kind: "number", name: "price", value: 1200, tolerance: 0 },
    { kind: "version", name: "version", value: "2.4.1" },
    { kind: "date", name: "date", value: "2026-10-16" },
    { kind: "text", name: "stock", accept: ["in stock"] },
  ];
  const data = {
    track: "scrape",
    markdown: "Price: $1.2K; v2.4.1; October 16, 2026. IN STOCK.",
    finalUrl: null,
  } satisfies Parameters<typeof gradeRaw>[1];
  assert.equal(
    gradeRaw(fields, data).fields.every((f) => f.pass),
    true,
  );
  assert.equal(
    gradeRaw(
      [...fields, { kind: "text", name: "missing", accept: ["out of stock"] }],
      data,
    ).fields.every((f) => f.pass),
    false,
  );
  assert.equal(
    gradeRaw([{ kind: "none", name: "x" }], data).applicability,
    "n/a",
  );
  assert.equal(
    gradeRaw([{ kind: "text", name: "x", accept: ["price"] }], {
      track: "map",
      urls: [],
    }).applicability,
    "n/a",
  );
});
test("raw URL check uses hits, not a misleading snippet link", () => {
  const f: ExpectedField = {
    kind: "url-set",
    name: "urls",
    urls: ["https://gold.com"],
    minRecall: 1,
    minPrecision: 1,
  };
  const raw = gradeRaw([f], {
    track: "search",
    hits: [
      {
        url: "https://wrong.com",
        title: "",
        snippet: "https://gold.com",
        content: null,
        publishedAt: null,
      },
    ],
  });
  assert.equal(raw.fields[0]?.pass, false);
});

test("units do not become magnitude suffixes", () => {
  assert.equal(parseNumber("42 ms"), 42);
  assert.equal(parseNumber("42 MB"), 42);
  assert.equal(parseNumber("42 M"), 42000000);
});

test("raw search finds gold URL among other retrieved hits", () => {
  const field: ExpectedField = {
    kind: "url-set",
    name: "source",
    urls: ["https://gold.com"],
    minRecall: 1,
    minPrecision: 1,
  };
  const raw = gradeRaw([field], {
    track: "search",
    hits: ["https://other.com", "https://gold.com"].map((url) => ({
      url,
      title: "",
      snippet: "",
      content: null,
      publishedAt: null,
    })),
  });
  assert.equal(raw.fields[0]?.pass, true);
});
