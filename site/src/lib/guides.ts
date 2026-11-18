import { costText, detectedGap, doneText, intervalText, listText, providerById, rankedRuns, runOn, standingText, trackById } from "@/lib/catalog";
import type { Provider, Run, TrackId } from "@/lib/catalog";
import { zeroApiCaveat } from "@/lib/faq";
import { SCRAPING_APIS_POST } from "@/lib/blog";
import { JINA_TOKEN_BUDGET } from "@/lib/notes";
import { formatPct, results } from "@/lib/results";
import type { Track } from "@/lib/results";

/**
 * Data for the two blog guides. Three kinds of statement live here and are kept apart on the page:
 * - measured: built from results.json through the catalog helpers, never typed by hand;
 * - vendor: copied from the vendor's own pricing or docs page on PRICES_CHECKED, with the URL;
 * - editorial: our judgment, labelled as such.
 * The picks are checked against results.json at build time, so a new run that changes the order fails the build
 * instead of publishing a list the data no longer supports.
 */

export const PRICES_CHECKED = "2026-11-18";

export type Source = { label: string; url: string };

/** What a vendor's own pages said on PRICES_CHECKED. Every string here is a vendor claim, not a measurement. */
export type VendorFacts = {
  name: string;
  site: string;
  /** Free allowance, as the vendor states it. */
  free: string;
  /** The list price for plain page fetches, in the vendor's units. */
  fetchPrice: string;
  /** 1,000 plain page fetches at the entry paid price: our arithmetic from fetchPrice, so it is labelled "derived". */
  perThousand: string;
  /** Other prices worth knowing for this vendor's main jobs. */
  otherPrices: readonly string[];
  /** Billing rules that change what failures cost. */
  billing: string;
  sources: readonly Source[];
};

export const VENDORS: Record<string, VendorFacts> = {
  contextdev: {
    name: "Context.dev",
    site: "https://www.context.dev",
    free: "1,000 credits a month, no card",
    fetchPrice: "1 credit per scrape (JS rendering and proxies included); Developer plan $20 a month for 10,000 credits",
    perThousand: "$2.00 on Developer",
    otherPrices: ["Search: 1 credit per 10 results", "Crawl: 1 credit per page", "Map: from 1 credit per call", "JSON extraction: 5 credits per page"],
    billing: "Credits come with a monthly plan; Pro is $90 a month.",
    sources: [{ label: "Context.dev pricing", url: "https://www.context.dev/pricing" }],
  },
  spider: {
    name: "Spider",
    site: "https://spider.cloud",
    free: "No free amount listed; pay as you go from a $5 top-up",
    fetchPrice: "Pay as you go: bandwidth at $1 per GB plus compute at $0.0001 per minute; Spider puts a typical /scrape request at about $0.0001",
    perThousand: "about $0.10 at Spider's typical figure",
    otherPrices: ["/crawl: about $0.0003 a request", "/links: about $0.0002 a request", "/search: about $0.001 a request"],
    billing: "Failed pages are billed for the bandwidth and compute they used. The balance doesn't expire.",
    sources: [{ label: "Spider pricing", url: "https://spider.cloud/pricing" }],
  },
  scrapfly: {
    name: "Scrapfly",
    site: "https://scrapfly.io",
    free: "1,000 API credits a month, no card",
    fetchPrice: "1 credit for a basic request on datacenter proxies, +5 credits with JavaScript rendering, 25 credits on residential proxies; Discovery plan $30 a month for 200,000 credits",
    perThousand: "$0.15 on Discovery ($0.90 with JS rendering)",
    otherPrices: ["Unblocker (formerly ASP): no fixed price; it can upgrade the proxy pool, capped per call with cost_budget", "Captcha solving: +5 to 20 credits"],
    billing: "Failed scrapes with 403, 429 or 5xx aren't billed, unless 30% or more of your scrapes over 24 hours, on at least 1,000 scrapes, are blocked without the Unblocker.",
    sources: [
      { label: "Scrapfly pricing", url: "https://scrapfly.io/pricing" },
      { label: "Scrapfly Scrape API billing", url: "https://scrapfly.io/docs/scrape-api/billing" },
    ],
  },
  string: {
    name: "String",
    site: "https://www.usestring.ai",
    free: "$5 of credit once at signup (about 20,000 standard fetches)",
    fetchPrice: "Starter plan ($19 a month, paid as usage credit): $0.25 per 1,000 standard fetches, $1.20 per 1,000 browser-rendered fetches",
    perThousand: "$0.25 on Starter",
    otherPrices: ["Search: $1.20 per 1,000 on Starter", "Premium-proxy fetch: $2.40 per 1,000 on Starter", "No separate map price on the pricing page"],
    billing: "Blocked requests and String's own errors aren't charged, except blocked requests sent with custom headers and requests to sites with invalid certificates. Site responses such as 404s are charged. Unused credit rolls over.",
    sources: [{ label: "String pricing", url: "https://www.usestring.ai/pricing" }],
  },
  linkup: {
    name: "Linkup",
    site: "https://www.linkup.so",
    free: "$20 of credit with a work email; Linkup tops eligible accounts back up to $20 each month",
    fetchPrice: "Fetch in standard mode: $0.001 per call without JavaScript rendering, $0.005 with it",
    perThousand: "$1.00 ($5.00 with JS rendering)",
    otherPrices: ["Standard search returning raw results: $0.005 per call", "Deep search returning raw results: $0.05 per call"],
    billing: "Failed calls are free. Pay as you go, no plan.",
    sources: [
      { label: "Linkup pricing docs", url: "https://docs.linkup.so/pages/documentation/development/pricing" },
      { label: "Linkup pricing", url: "https://www.linkup.so/pricing" },
    ],
  },
  firecrawl: {
    name: "Firecrawl",
    site: "https://www.firecrawl.dev",
    free: "1,000 credits a month, no card",
    fetchPrice: "1 credit per page; Hobby plan $19 a month for 5,000 credits, Standard $99 a month for 100,000",
    perThousand: "$3.80 on Hobby ($0.99 on Standard)",
    otherPrices: ["Search: 2 credits per 10 results", "Map: 1 credit per call", "Crawl: 1 credit per page", "JSON format: +4 credits per page"],
    billing: "A page that comes back with an error status such as 403 or 404 still costs 1 credit.",
    sources: [{ label: "Firecrawl pricing", url: "https://www.firecrawl.dev/pricing" }],
  },
  tinyfish: {
    name: "TinyFish",
    site: "https://www.tinyfish.ai",
    free: "Fetch and Search are $0, rate limited",
    fetchPrice: "TinyFetch: $0.00 per URL, up to 150 URLs a minute and 1,000 a day",
    perThousand: "$0, within 1,000 a day",
    otherPrices: ["TinySearch: $0.00 per request, 30 a minute and 500 an hour", "TinyAgent (a web agent): $0.016 per step"],
    billing: "Fetch and Search keep working at a $0 wallet balance; higher limits are an enterprise contract.",
    sources: [{ label: "TinyFish pricing", url: "https://www.tinyfish.ai/pricing" }],
  },
  browserbase: {
    name: "Browserbase",
    site: "https://www.browserbase.com",
    free: "1 browser hour, 1,000 Fetch calls and 1,000 Search calls",
    fetchPrice: "Fetch API: 1,000 calls included, then $1 per 1,000 ($4 per 1,000 with proxies)",
    perThousand: "$1.00 after the first 1,000",
    otherPrices: ["Developer plan: $20 a month for 100 browser hours, then $0.12 per browser hour", "Search API: $5 per 1,000 after the first 1,000"],
    billing: "Proxies: 1 GB included on Developer, then $12 per GB.",
    sources: [{ label: "Browserbase pricing", url: "https://www.browserbase.com/pricing" }],
  },
  brightdata: {
    name: "Bright Data",
    site: "https://brightdata.com",
    free: "5,000 Web Unlocker requests a month",
    fetchPrice: "Web Unlocker: $1.50 per 1,000 requests pay as you go; Scale plan $499 a month for 383,000 requests",
    perThousand: "$1.50 pay as you go",
    otherPrices: ["SERP API: from $1 per 1,000 requests", "Browser API: from $5 per GB"],
    billing: "Web Unlocker bills successful requests only.",
    sources: [
      { label: "Bright Data Web Unlocker pricing", url: "https://brightdata.com/pricing/web-unlocker" },
      { label: "Bright Data SERP API pricing", url: "https://brightdata.com/pricing/serp" },
    ],
  },
  apify: {
    name: "Apify",
    site: "https://apify.com",
    free: "$5 of platform usage a month",
    fetchPrice: "Starter plan $19 a month of usage, compute at $0.20 per compute unit (1 GB of RAM for an hour); each Actor sets its own price",
    perThousand: "depends on the Actor",
    otherPrices: ["Example Actor price on Apify's page: Instagram Scraper, $2.30 per 1,000 results"],
    billing: "Unused monthly usage expires at the end of the billing cycle.",
    sources: [{ label: "Apify pricing", url: "https://apify.com/pricing" }],
  },
};

/* Measured: the scraping list. */

const SCRAPE = trackById("scrape");
if (!SCRAPE) throw new Error("guides: results.json has no scrape track");
export const scrapeTrack: Track = SCRAPE;

export const runFor = (id: string, track: TrackId): Run | undefined => {
  const p = providerById(id);
  return p ? runOn(p, track) : undefined;
};

/** True when the run's gap to the track's leader cleared chance, so it sits below the top group. */
export const belowTop = (run: Run): boolean => detectedGap(run.track, run.entry.label) !== undefined;

/** The /scrape order: the top group first (gap to the leader could be chance), then tasks done. */
export const scrapeOrder: Run[] = [...rankedRuns(scrapeTrack)].sort((a, b) => Number(belowTop(a)) - Number(belowTop(b)) || b.agent.rate - a.agent.rate);

/** The seven, in order. Hand-written copy below is keyed to these ids, so the list is pinned and checked against the data. */
export const SCRAPING_PICK_IDS = ["contextdev", "spider", "scrapfly", "string", "linkup", "firecrawl", "tinyfish"] as const;

{
  const top = scrapeOrder.slice(0, SCRAPING_PICK_IDS.length).map((r) => r.entry.id);
  if (top.join() !== SCRAPING_PICK_IDS.join()) throw new Error(`guides: the scrape top ${SCRAPING_PICK_IDS.length} is now ${top.join()}; rewrite the scraping post`);
  const last = scrapeOrder[SCRAPING_PICK_IDS.length - 1];
  const next = scrapeOrder[SCRAPING_PICK_IDS.length];
  if (last && next && last.agent.successes === next.agent.successes && belowTop(last) === belowTop(next)) throw new Error("guides: the 7th and 8th scrape runs tie, so the cut isn't defined");
}

export const scrapingPicks: Run[] = scrapeOrder.slice(0, SCRAPING_PICK_IDS.length);
export const scrapingCut: Run | undefined = scrapeOrder[SCRAPING_PICK_IDS.length];
export const scrapingRest: Run[] = scrapeOrder.slice(SCRAPING_PICK_IDS.length);
export const scrapeTopGroup: Run[] = scrapeOrder.filter((r) => !belowTop(r));

/** "92%" or "not measured": the share of each page's own sentences that reached the agent. */
export const coverageText = (run: Run): string => (run.entry.coverage?.mean != null ? formatPct(run.entry.coverage.mean) : "not measured");

/** The measured sentences for one scrape pick: tasks done with the interval, cost, coverage and where it stands. */
export function scrapeMeasured(run: Run): string[] {
  const caveat = zeroApiCaveat([run]);
  return [
    `${run.entry.label} finished ${doneText(run.agent)} scrape tasks, with a 95% interval of ${intervalText(run.agent)}, at ${costText(run.agent)} per finished task.${caveat ? ` ${caveat}` : ""}`,
    `${coverageText(run)} of sampled sentences from each page's own text reached the agent.`,
    standingText(run),
  ];
}

/** Hand-written per pick: what the API is, our judgment, and who should pick it. */
export type PickCopy = { what: string; judgment: readonly string[]; pickIf: string };

export const SCRAPING_COPY: Record<(typeof SCRAPING_PICK_IDS)[number], PickCopy> = {
  contextdev: {
    what: "Context.dev's scrape endpoint returns a page as Markdown. JavaScript rendering, anti-bot handling and proxies are part of the one-credit price, so there are no feature flags to price out.",
    judgment: [
      "It finished the most scrape tasks, and it was in the top group on all four tracks, so one key covers search, map and crawl too.",
      "Its entry plan costs more per page than String, Scrapfly or Spider. At the Pro plan the per-page price drops by more than half.",
    ],
    pickIf: "you want one API for every job and would rather pay a flat credit per page than tune proxy and rendering options.",
  },
  spider: {
    what: "Spider bills by bandwidth and compute instead of credits. Its /scrape endpoint returns HTML, Markdown, text or JSON.",
    judgment: [
      "Its typical price per page is the lowest of the APIs here that charge per page, but the bill moves with page size, and failed pages cost money too.",
      "Spider ran scrape only in this benchmark, so there's no measured evidence for its crawl or search endpoints.",
    ],
    pickIf: "you fetch a lot of pages, can live with a variable bill, and don't want a monthly plan.",
  },
  scrapfly: {
    what: "Scrapfly is scraping infrastructure: you choose the proxy pool, JavaScript rendering and its Unblocker per request, and each choice changes the credit price.",
    judgment: [
      "A basic request is cheap, but JavaScript rendering costs six times as much and a residential proxy 25 times, so the price you plan for depends on your sites.",
      "Its billing policy waives 403, 429 and 5xx failures, which matters more than the headline price on sites that block often. Scrapfly also tied for the most crawl tasks.",
    ],
    pickIf: "your sites need per-request control over proxies and rendering, and you'll set a cost budget per call.",
  },
  string: {
    what: "String fetches pages over plain HTTP or a real browser and only escalates to premium proxies when a site needs it. It joined the benchmark on 2026-10-24, on the same frozen tasks.",
    judgment: [
      "It pairs a top-group scrape score with one of the lowest per-page prices here, and the $19 plan fee comes back as usage credit that rolls over.",
      "Some of its misses came from its Markdown putting the HTML <title> as a heading above the page's real H1, and the agent answered with the title. If your agent reads the first heading, strip that line.",
    ],
    pickIf: "price per page matters most and you also need site maps: String finished the most map tasks.",
  },
  linkup: {
    what: "Linkup is mainly a search API (it finished the most search tasks). Its Fetch endpoint turns a URL into Markdown, with JavaScript rendering as an option. The benchmark called Fetch without rendering.",
    judgment: [
      "It kept the most page text of any API here, yet finished fewer tasks than the top group. This test rewards keeping headings and structure, not text alone, so pick it for the search-plus-fetch pairing rather than as a pure scraper.",
      "Failed calls are free, and the $20 of free credit covers about 20,000 standard fetches without rendering.",
    ],
    pickIf: "your agent already searches with Linkup and you want page fetches on the same key and bill.",
  },
  firecrawl: {
    what: "Firecrawl has endpoints for scrape, search, map and crawl, plus JSON extraction and browser interaction.",
    judgment: [
      "On scrape it finished clearly fewer tasks than Context.dev, but it was in the top group on search, map and crawl. It's the broadest single toolkit here.",
      "Its entry price per page is the highest on this list, and error pages cost a credit. The benchmark ran on free plans, and Firecrawl's free plan allows 10 scrape requests a minute.",
    ],
    pickIf: "you want scrape, search, map and crawl from one SDK and the per-page price isn't the deciding factor.",
  },
  tinyfish: {
    what: "TinyFish sells a web agent; its Fetch and Search APIs are free within rate limits. TinyFetch returns Markdown, HTML or JSON.",
    judgment: [
      "It costs nothing per call within 1,000 URLs a day, which makes it the cheapest way to prototype. The daily cap rules it out for bulk work without a contract.",
      "It's also in the top search group, so the free Search and Fetch pair is a reasonable first stack for a small agent.",
    ],
    pickIf: "you're prototyping or your agent fetches fewer than 1,000 pages a day.",
  },
};

const COPY_BY_ID: ReadonlyMap<string, PickCopy> = new Map(Object.entries(SCRAPING_COPY));

/** The hand-written copy for one of the seven. Every pick has copy (SCRAPING_COPY is keyed by the pinned ids), so a miss is a bug. */
export function scrapingCopy(run: Run): PickCopy {
  const copy = COPY_BY_ID.get(run.entry.id);
  if (!copy) throw new Error(`guides: no copy for scrape pick ${run.entry.id}`);
  return copy;
}

/** Measured on scrape but below the cut, with why each isn't in the seven. Hand-written; checked against the data below. */
export const SCRAPE_NOT_PICKED: Record<string, string> = {
  browserbase:
    "This is Browserbase's HTTP Fetch API, not its browser sessions. It is the first API below the cut, and that cut is our call: the benchmark doesn't test the gap between it and TinyFish.",
  you: "You.com's Contents API. Its main product is search, and on search it also finished clearly fewer tasks than the leader.",
  jina: `Jina Reader (r.jina.ai) ran under a ${JINA_TOKEN_BUDGET ?? "small"}-token budget that rejects pages over it. That budget is a plausible cause of its rejected calls, though the stored evidence can't prove it, so this is not a general score for Jina Reader.`,
};
{
  const missing = scrapingRest.filter((r) => !SCRAPE_NOT_PICKED[r.entry.id]).map((r) => r.entry.id);
  if (missing.length > 0) throw new Error(`guides: no note for scrape runs below the cut: ${missing.join()}`);
}

/** Scraping APIs people ask about that this benchmark never ran. No numbers for them anywhere. */
export const SCRAPE_UNTESTED = ["Bright Data Web Unlocker", "Zyte API", "ScrapingBee", "ZenRows", "ScraperAPI", "Apify", "Exa Contents", "Tavily Extract", "Crawl4AI"] as const;

/* The web data list: every API in a measured top group, plus one per job the benchmark doesn't measure. */

export type Job = "all four jobs" | "search" | "map" | "crawl" | "scrape" | "browser sessions" | "protected sites" | "ready-made scrapers";

export type DataPick = {
  id: string;
  /** Provider id in results.json, when the API was tested. */
  tested: boolean;
  jobs: readonly Job[];
  /** Why it's on the list. Editorial. */
  why: string;
  /** What to watch for. Editorial, drawn from the vendor's pages or the measured data. */
  watch: string;
};

export const DATA_PICKS: readonly DataPick[] = [
  {
    id: "contextdev",
    tested: true,
    jobs: ["all four jobs"],
    why: "The only API in the top group on all four measured jobs: scrape, search, map and crawl.",
    watch: "Its entry plan costs more per page than the cheapest scrapers here, and in crawl it finished one task fewer than Scrapfly and Firecrawl, a gap too small to rule out chance.",
  },
  {
    id: "firecrawl",
    tested: true,
    jobs: ["all four jobs"],
    why: "Endpoints for every job plus JSON extraction, and in the top group on search, map and crawl.",
    watch: "On scrape it finished clearly fewer tasks than Context.dev, and its entry plan has the highest price per page of the seven measured APIs on this list.",
  },
  {
    id: "linkup",
    tested: true,
    jobs: ["search"],
    why: "The search pick: it finished the most search tasks, and failed calls cost nothing.",
    watch: "Its lead over TinyFish, Firecrawl and Context.dev is too small to rule out chance. Deep search costs ten times a standard one.",
  },
  {
    id: "tinyfish",
    tested: true,
    jobs: ["search"],
    why: "In the top search group, and its Search and Fetch APIs are free within rate limits.",
    watch: "The free limits cap how much one agent can do: 500 searches an hour and 1,000 fetches a day. Its measured cost is model spend only, because the test account paid nothing for calls.",
  },
  {
    id: "string",
    tested: true,
    jobs: ["map", "scrape"],
    why: "Finished the most map tasks and is in the top scrape group, at $0.25 per 1,000 standard fetches on its Starter plan.",
    watch: "Its map lead is too small to rule out chance, and on search it finished clearly fewer tasks than Linkup. It has no crawl endpoint.",
  },
  {
    id: "scrapfly",
    tested: true,
    jobs: ["crawl", "scrape"],
    why: "Tied for the most crawl tasks and is in the top scrape group, with per-request control over proxies and rendering.",
    watch: "Budgeting is harder than with a flat credit per page: the same page can cost 1 credit or 30 depending on rendering and proxy pool, so set cost_budget on each call.",
  },
  {
    id: "spider",
    tested: true,
    jobs: ["scrape"],
    why: "In the top scrape group, with the lowest typical per-page price of the APIs here that charge per page.",
    watch: "It ran scrape only, so its crawl, links and search endpoints have no measured results here. The pay-as-you-go bill moves with page size.",
  },
  {
    id: "browserbase",
    tested: false,
    jobs: ["browser sessions"],
    why: "For pages an agent has to click, log in to or fill in, you need a real browser. Browserbase hosts headless browsers that your code drives with Playwright or Puppeteer.",
    watch: "We didn't test browser sessions. We did test its HTTP Fetch and Search APIs, and both finished clearly fewer tasks than the leader on their tracks.",
  },
  {
    id: "brightdata",
    tested: false,
    jobs: ["protected sites"],
    why: "For sites behind anti-bot systems, Web Unlocker routes each request through Bright Data's proxy network with CAPTCHA solving and fingerprinting, and bills successful requests only.",
    watch: "Not tested here, and our tasks were mostly documentation sites that don't block. Run it on your own target sites before you commit.",
  },
  {
    id: "apify",
    tested: false,
    jobs: ["ready-made scrapers"],
    why: "When you need structured records from one big site (a store, maps listings, a social network), Apify's store has prebuilt scrapers, called Actors, that return them as JSON.",
    watch: "Not tested here. Each Actor has its own price and its own maintainer, so quality varies by Actor, not by Apify.",
  },
];

if (DATA_PICKS.length !== 10) throw new Error(`guides: the web data list has ${DATA_PICKS.length} entries, not 10`);
if (SCRAPING_PICK_IDS.length !== 7) throw new Error("guides: the scraping list must have 7 entries");

/** Every provider in a measured top group on any track: no gap to the leader that cleared chance. */
export const topGroupIds: ReadonlySet<string> = new Set(results.tracks.flatMap((t) => rankedRuns(t).filter((r) => !belowTop(r)).map((r) => r.entry.id)));

{
  const measured = DATA_PICKS.filter((p) => p.tested).map((p) => p.id);
  const want = [...topGroupIds];
  if (measured.length !== want.length || want.some((id) => !measured.includes(id))) {
    throw new Error(`guides: tested picks ${measured.join()} don't match the measured top groups ${want.join()}`);
  }
  for (const p of DATA_PICKS) {
    if (!VENDORS[p.id]) throw new Error(`guides: no vendor facts for ${p.id}`);
    // An untested pick may still have tested products (Browserbase's Fetch and Search); only Bright Data and Apify must be absent.
    if (!p.tested && p.id !== "browserbase" && providerById(p.id)) throw new Error(`guides: ${p.id} is in results.json but listed as untested`);
  }
}

/**
 * Qualitative measured claims the hand-written copy makes ("finished the most search tasks", "top group on all four").
 * Checked here so a new run that breaks one fails the build.
 */
{
  const soleLeader = (track: TrackId, id: string) => {
    const t = trackById(track);
    const ranked = t ? rankedRuns(t) : [];
    return ranked[0]?.entry.id === id && (ranked[1]?.agent.rate ?? -1) < (ranked[0]?.agent.rate ?? 0);
  };
  const tiedLeader = (track: TrackId, id: string) => {
    const t = trackById(track);
    const ranked = t ? rankedRuns(t) : [];
    const top = ranked[0]?.agent.rate;
    return ranked.filter((r) => r.agent.rate === top).length > 1 && ranked.some((r) => r.entry.id === id && r.agent.rate === top);
  };
  const topOn = (id: string, track: TrackId) => {
    const r = runFor(id, track);
    return r !== undefined && !belowTop(r);
  };
  const claims: [string, boolean][] = [
    ["Context.dev leads scrape alone", soleLeader("scrape", "contextdev")],
    ["Linkup leads search alone", soleLeader("search", "linkup")],
    ["String leads map alone", soleLeader("map", "string")],
    ["Scrapfly ties for the crawl lead", tiedLeader("crawl", "scrapfly")],
    ["Context.dev is top on all four", (["scrape", "search", "map", "crawl"] as const).every((t) => topOn("contextdev", t))],
    ["Firecrawl is top on search, map and crawl, below on scrape", (["search", "map", "crawl"] as const).every((t) => topOn("firecrawl", t)) && !topOn("firecrawl", "scrape")],
    ["Context.dev finished one crawl task fewer than the leaders", (() => {
      const c = runFor("contextdev", "crawl");
      const s = runFor("scrapfly", "crawl");
      const f = runFor("firecrawl", "crawl");
      return !!c && !!s && !!f && s.agent.successes === f.agent.successes && s.agent.successes - c.agent.successes === 1 && !belowTop(c);
    })()],
    ["String is below the top group on search", (() => { const r = runFor("string", "search"); return !!r && belowTop(r); })()],
    ["Only Context.dev and Firecrawl ran all four tracks", results.tracks.length === 4 && ["contextdev", "firecrawl"].every((id) => providerById(id)?.runs.length === 4) && [...topGroupIds, "browserbase", "you", "jina"].filter((id) => !["contextdev", "firecrawl"].includes(id)).every((id) => (providerById(id)?.runs.length ?? 0) < 4)],
    ["Linkup has the highest scrape page coverage", (() => {
      const runs = rankedRuns(scrapeTrack).filter((r) => r.entry.coverage?.mean != null);
      const best = Math.max(...runs.map((r) => r.entry.coverage?.mean ?? 0));
      return runFor("linkup", "scrape")?.entry.coverage?.mean === best && runs.filter((r) => r.entry.coverage?.mean === best).length === 1;
    })()],
    ["TinyFish is in the top search group", (() => { const r = runFor("tinyfish", "search"); return !!r && !belowTop(r); })()],
    ["The scraping post's title and description match the scrape task count", SCRAPING_APIS_POST.title.includes(`${scrapeTrack.tasks} agent tasks`) && SCRAPING_APIS_POST.description.includes(`${scrapeTrack.tasks} agent tasks`)],
    ["The scrape top group is Context.dev, Spider, Scrapfly and String", scrapeTopGroup.map((r) => r.entry.id).join() === "contextdev,spider,scrapfly,string"],
    ["Browserbase is the first scrape API below the cut", scrapingCut?.entry.id === "browserbase"],
    ["String has no crawl run", runFor("string", "crawl") === undefined],
    ["Jina Reader ran scrape only", providerById("jina")?.runs.map((r) => r.track.id).join() === "scrape"],
    ["Spider ran scrape only", providerById("spider")?.runs.map((r) => r.track.id).join() === "scrape"],
    ["Browserbase's Fetch and Search are below the top group", (["scrape", "search"] as const).every((t) => { const r = runFor("browserbase", t); return !!r && belowTop(r); })],
    ["You.com is below the top group on search", (() => { const r = runFor("you", "search"); return !!r && belowTop(r); })()],
    ["Linkup, Firecrawl, TinyFish and You.com are below the top group on scrape", ["linkup", "firecrawl", "tinyfish", "you"].every((id) => { const r = runFor(id, "scrape"); return !!r && belowTop(r); })],
  ];
  const broken = claims.filter(([, ok]) => !ok).map(([c]) => c);
  if (broken.length > 0) throw new Error(`guides: claims no longer true: ${broken.join("; ")}`);
}

/** Measured results for a tested pick, track by track. Crawl cost is left out: the v2 crawl replay doesn't measure it end to end. */
export function trackLines(p: Provider): { track: Track; done: string; cost: string | null; top: boolean }[] {
  return p.runs.map((r) => ({ track: r.track, top: !belowTop(r), done: `${r.agent.successes} of ${r.agent.tasks} tasks`, cost: r.track.id === "crawl" ? null : costText(r.agent) }));
}

/** "top group on scrape, search, map and crawl" or "below the top group on scrape". */
export function groupSummary(p: Provider): string {
  const top = p.runs.filter((r) => !belowTop(r)).map((r) => r.track.label.toLowerCase());
  const below = p.runs.filter((r) => belowTop(r)).map((r) => r.track.label.toLowerCase());
  return [top.length ? `top group on ${listText(top)}` : null, below.length ? `below it on ${listText(below)}` : null].filter(Boolean).join("; ");
}
