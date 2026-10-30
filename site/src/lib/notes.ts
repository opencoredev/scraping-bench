import type { TrackId } from "@/lib/catalog";
import { results } from "@/lib/results";

/**
 * Hand-written caveats below describe the v1 run (wb-20261017-final) and are wrong for v2, where tasks, sites and
 * providers changed. They only show when the headline data is v1; v2 pages use the notes and sources in results.json.
 * Port each one to v2 only after checking it against docs/FINDINGS.md for the v2 run.
 */
const V1 = results.campaignVersion === 1;

/** Hand-written context that the numbers alone don't carry. Sources: README.md and docs/FINDINGS.md. */

/** What was actually tested, when the product name alone could mislead. */
const V1_TESTED_AS: Partial<Record<string, string>> = {
  browserbase: "Browserbase here means its HTTP Fetch and Search APIs, not its browser sessions.",
  tinyfish: "TinyFish here means its Fetch API for scrape and its Search API for search.",
  spider: "Spider was tested on scrape only, because its free wallet was small.",
  jina: "Jina here means Jina Reader (r.jina.ai), scored on scrape only. An earlier 7-task Jina Search run is kept as historical evidence and isn't part of these scores.",
};

/** The product name people search for, when it differs from the provider's label in the results. Used in titles and headings. */
export const SEARCHED_NAMES: Partial<Record<string, string>> = {
  jina: "Jina Reader",
};
export const searchedName = (p: { id: string; label: string }): string => SEARCHED_NAMES[p.id] ?? p.label;

/** A caveat that changes how a provider's numbers should be read, tagged with the track it's about when it's about one track. */
export type Note = { text: string; track?: TrackId };

const V1_PROVIDER_NOTES: Partial<Record<string, readonly Note[]>> = {
  spider: [
    { text: "Spider refused our test site because its malicious-URL filter flags the workers.dev domain. Three inspected responses carry that explicit 403.", track: "scrape" },
    { text: "It scraped all 10 PyPI pages correctly. Two of its other passes are tasks where the right answer was empty, which it returned because the page was blocked.", track: "scrape" },
    { text: "This is a domain compatibility finding, not a measure of how well Spider scrapes sites it accepts.", track: "scrape" },
  ],
  firecrawl: [
    { text: "Everything ran on free plans. Firecrawl's free plan allows 10 requests a minute, so its tuned scrape run hit rate limits and scored lower than its default.", track: "scrape" },
    { text: "Firecrawl's crawl time includes waiting out its free plan's rate limit: its crawls were spaced 65 seconds apart to stay under it.", track: "crawl" },
    { text: "On search, 5 of the 60 tasks have two defensible answers. Accepting both moves Firecrawl to 92% at most and changes no provider's place.", track: "search" },
  ],
  browserbase: [{ text: "Its Search responses carried useful URLs and titles but blank snippets, which limits how many facts the model could answer from them.", track: "search" }],
  tinyfish: [{ text: "TinyFish wasn't given a tuned run: its plan offered no affordable alternate preset.", track: "scrape" }],
  scrapfly: [{ text: "Scrapfly's tuned scrape preset finished 55 of 60, 2 more than its default, but that change is too small to rule out chance.", track: "scrape" }],
};

/** Caveats that belong to a whole track, beyond the ones printed under its charts. */
const V1_TRACK_NOTES: Partial<Record<TrackId, string>> = {
  scrape:
    "Scrape has only two site clusters: 50 pages on our own test site and 10 project pages on PyPI. With so few clusters, the narrow intervals here shouldn't be read as certainty.",
  map: "The test site was built fresh for this run, so no provider could have indexed it. Map services returned sparse or empty lists on those new paths. That says something about cold sites, not about mature, indexed ones.",
  crawl: "Only 10 tasks, from 4 site clusters. Crawl asks for every record in a section, so it tests extraction as well as retrieval.",
};


/** v2 caveats, each checked against docs/FINDINGS.md for the v2 run ("Browserbase means HTTP Fetch/Search, not a browser-session agent"). */
const V2_TESTED_AS: Partial<Record<string, string>> = {
  browserbase: "Browserbase here means its HTTP Fetch and Search APIs, not its browser sessions.",
};

const V2_PROVIDER_NOTES: Partial<Record<string, readonly Note[]>> = {
  browserbase: [{ text: "Its Search API returns URLs and titles without excerpts, so the model had less to answer from on search.", track: "search" }],
};

export const TESTED_AS: Partial<Record<string, string>> = V1 ? V1_TESTED_AS : V2_TESTED_AS;
export const PROVIDER_NOTES: Partial<Record<string, readonly Note[]>> = V1 ? V1_PROVIDER_NOTES : V2_PROVIDER_NOTES;
export const TRACK_NOTES: Partial<Record<TrackId, string>> = V1 ? V1_TRACK_NOTES : {};

/** The phrase people search for, used in titles and headings. */
export const TRACK_TOPIC: Record<TrackId, string> = {
  scrape: "web scraping API",
  search: "web search API",
  map: "site map API",
  crawl: "web crawling API",
};

/**
 * Titles and headings that match how a track is searched, where the default wording misses it.
 * `title` gets the provider count; `heading` is the page's H1. Others use the default track title.
 */
export const TRACK_SEO: Partial<Record<TrackId, { title: (providers: number) => string; heading: string }>> = {
  search: {
    title: (n) => `AI search API benchmark: ${n} web search APIs for LLM agents`,
    heading: "Web search API benchmark: which AI search API gets an LLM agent the right answer",
  },
  map: {
    title: (n) => `URL map API benchmark: ${n} APIs that list a website's URLs for AI agents`,
    heading: "Site map API benchmark: which API gets an agent every URL in a website's docs section",
  },
  crawl: {
    title: (n) => `Website crawler API benchmark: ${n} web crawler APIs for AI agents`,
    heading: "Web crawler API benchmark: which website crawler API returns every page an agent asks for",
  },
};
