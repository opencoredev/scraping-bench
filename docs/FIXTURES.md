# Known-answer site

The deployed Northstar Instruments site is at `https://northstar-instruments.leoisadev.workers.dev`. Each run lives at `/r/<seed>/`; seeds contain 1–64 letters, digits, hyphens, or underscores. All prices, versions, commands, article metadata, report figures, and answer keys come from `fixtures/site/src/data.ts`. Pages contain no evaluation labels.

Generate a run and check its deployed scrape inputs:

```sh
npm run fixtures:tasks -- --seed pilot-1 --base https://northstar-instruments.leoisadev.workers.dev --check
```

This writes `tasks/fixture-pilot-1.json`: 120 scrape, 20 map, and 15 crawl tasks matching `src/core/types.ts`. `generateFixtureTasks({ seed, baseUrl, now })` also works as a library. `baseUrl` is an origin, without a run path. With an explicit `now`, output is deterministic. The optional clock affects only freshness.

## Page families and expected behavior

| Route below `/r/<seed>` | Content and expectation |
| --- | --- |
| `/store` | Four categories; 60 product detail pages with name, USD price, stock, SKU, three specifications, and review rating. Category indexes use three pages of five products. Follow pagination to get all products. |
| `/docs` | 50 articles across five nested guide/API sections. Each has a tools version, separate macOS/Linux/Windows install code blocks, and numbered migration steps. Match commands to the requested platform. |
| `/blog` | 60 posts across 2025–2026, with ISO dates, authors and tags. Six index pages contain ten posts each. Year and tag map tasks require article inspection, not just URL discovery. |
| `/pricing` | Three named monthly tiers, USD prices, device counts. Return the complete tier set. |
| `/resources/js` | Calibration reference is fetched and injected after 1.5 seconds. Initial HTML intentionally lacks the answer. Wait for the rendered content. |
| `/resources/lazy` | Reserve reference loads through IntersectionObserver after scrolling to the lower section. Initial HTML lacks the answer. |
| `/resources/iframe` | Permit reference appears only inside a same-origin iframe at `/content/iframe`. Fetch or enter the frame. |
| `/resources/shadow` | Device reference is fetched into an open shadow root. Initial HTML lacks the answer; extract rendered component text. |
| `/resources/tabs` | Recovery reference is present in a hidden DOM section. The button reveals it. HTML extraction may succeed without clicking; visible-text-only extraction must reveal the section. |
| `/resources/report.pdf` | Real twelve-page PDF with selectable text. Each page has a different seeded USD revenue. Tasks ask for pages 1, 3, 6, 9, or 12; use only the specified page. |
| `/resources/long` | 400-procedure manual. The archive reference occurs at procedure 370, far beyond a short content excerpt. |
| `/resources/nonEnglish` | Spanish service copy. Preserve the assigned station code and accents. |
| `/resources/cookie` | Dispatch reference surrounded by a cookie notice and a large support directory. Extract the main fact; the dismiss button removes the notice. |
| `/resources/freshness` | Revision is `floor(Date.now() / 600000)`. Response uses `Cache-Control: no-store`; D1 records the exact served revision. See freshness handling below. |
| `/archive/bulletin-1` … `6` | Six service bulletins occur only in the run sitemap. No HTML link points directly to them. Their map/crawl family is labeled `sitemap-only-orphans`. |
| `/private/operations` | Linked from resources but disallowed by origin robots.txt. Never belongs in a map expected set; origin logs expose unauthorized fetching. This is a public test path, not access-controlled storage. |
| `/resources/redirect/1` | Three HTTP 302 hops end at the dispatch page. Follow all hops and return its reference. |
| `/resources/soft-404` | HTTP 200 with an unavailable-item message, no product or price. Correct answer is null (`kind: "none"`). |
| Unknown path | Real HTTP 404 with an unavailable-page message. |
| `/sitemap.xml` | Complete run URL set, including six otherwise unlinked bulletins, excluding private paths. Linked from every run page and declared in its sitemap metadata. Root `/sitemap.xml` is the demo run. |
| `/robots.txt` | Run-specific sitemap declaration. Origin robots.txt disallows `/r/*/private/`, `/private/`, and `/__log`, and advertises the demo sitemap. |

The three `not-found` scrape tasks request a manufacturer fax number absent from product pages. They require null, not a guessed contact. Crawl tasks use `maxPages: 400`; record arrays use the exact pipe-delimited format in each instruction. Article paths in records are run-relative, such as `/docs/guides/migration/topic-3`.

Scrape counts: price-stock 40; specs-table-cell 20; install-command 30; blog-date-author 10; pdf-number 5; not-found 3; pricing-tiers, js-rendered-field, lazy-loaded-field, iframe-field, shadow-dom-field, tabs-field, long-page-deep-fact, non-english-field, cookie-boilerplate, freshness-version, redirect, soft-404 each 1.

Map counts: products-category 4; docs-section 5; blog-tag 4; blog-2026, docs-guides, products-all, sitemap-only-orphans, blog-2025, docs-api, blog-all each 1. Crawl counts: section-commands 5; category-inventory 4; pricing-tiers, blog-2026, install-commands, sitemap-only-orphans, blog-all, migration-steps each 1.

## Freshness handling

Static `Task.expected` cannot represent a changing clock. The generated freshness key is a snapshot, not a permanent expected value. Generate immediately before a run. For a completed provider fetch, match its D1 request record and call `withFixtureOriginVersion({ task, contentVersion: row.content_version })` before grading. This validates the run seed and replaces the revision with the exact version served. The runner must preserve the matched record as evidence; do not substitute the grading-time clock. If no unique origin record can be matched, report freshness as ungradable rather than scoring against an old key. A cache response with no new origin fetch should be compared to the revision at the provider request time and reported separately as cached evidence.

`src/core/types.ts` is unchanged. The parent runner must integrate this helper for freshness scoring; ordinary fields need no special handling.

## Origin logs

Every request, including redirects, robots, PDFs, content fetches, errors, and authorized or rejected log reads, awaits a D1 insert before responding. Rows include timestamp, path, raw query, user-agent, connecting IP, ASN, colo, content version, and HTTP status. Do not put credentials in URL queries: raw queries are logged.

Read `GET /__log?since=<ISO timestamp>&after=<id>` with `Authorization: Bearer <token>`. Responses contain up to 1,000 rows, ordered by id; use the last id as `after` until no rows remain. The log request itself appears on the next read. `since` is inclusive. Missing/wrong authorization returns 401.

The token is `FIXTURE_LOG_TOKEN` in `/home/leo/web-bench/.env.cloudflare` (mode 0600, gitignored), deployed as Worker secret `LOG_TOKEN`. To read logs without printing credentials:

```sh
node --input-type=module <<'JS'
import { readFileSync } from 'node:fs';
const env = readFileSync('/home/leo/web-bench/.env.cloudflare', 'utf8');
const token = env.split('\n').find(line => line.startsWith('FIXTURE_LOG_TOKEN='))?.split('=')[1];
if (!token) throw new Error('Missing FIXTURE_LOG_TOKEN');
const response = await fetch('https://northstar-instruments.leoisadev.workers.dev/__log?since=2026-10-17T00%3A00%3A00Z', {
  headers: { Authorization: `Bearer ${token}` },
});
if (!response.ok) throw new Error(`Log read returned ${response.status}`);
process.stdout.write(JSON.stringify(await response.json(), null, 2) + '\n');
JS
```

Logs contain IP addresses and user agents. Keep raw logs private and redact them before publishing results. No automatic retention cleanup is configured.

## Deployment and checks

Wrangler config is `fixtures/site/wrangler.jsonc`; the only resources are Worker `northstar-instruments` and D1 `northstar-origin-logs`. Deployment uses workers.dev only, with no DNS or routes configured. Existing Wrangler OAuth credentials already cover Workers and D1, so no extra API token was created.

```sh
npx wrangler@latest d1 migrations apply LOGS --remote --config fixtures/site/wrangler.jsonc
npx wrangler@latest deploy --config fixtures/site/wrangler.jsonc
npx tsc -p .
```

`--check` fetches each scrape input, checks text/number/date/version/set fields, verifies PDF numbers in the requested page stream, and checks semantic absence witnesses. For JS, lazy, shadow, and iframe pages it confirms the answer is absent from initial HTML and present at the content endpoint. This is an origin-integrity check, not a claim that plain fetch can render those four families. Browser verification remains required for their interactions.
