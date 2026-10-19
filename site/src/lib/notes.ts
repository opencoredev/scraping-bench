import type { TrackId } from "@/lib/catalog";

/** Hand-written context that the numbers alone don't carry. Sources: README.md and docs/FINDINGS.md. */

/** What was actually tested, when the product name alone could mislead. */
export const TESTED_AS: Partial<Record<string, string>> = {
  browserbase: "Browserbase here means its HTTP Fetch and Search APIs, not its browser sessions.",
  spider: "Spider was tested on scrape only, because its free wallet was small.",
  jina: "Jina is scored on scrape only. An earlier 7-task search run is kept as historical evidence and isn't part of these scores.",
};

/** A caveat that changes how a provider's numbers should be read, tagged with the track it's about when it's about one track. */
export type Note = { text: string; track?: TrackId };

export const PROVIDER_NOTES: Partial<Record<string, readonly Note[]>> = {
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
export const TRACK_NOTES: Partial<Record<TrackId, string>> = {
  scrape:
    "Scrape has only two site clusters: 50 pages on our own test site and 10 project pages on PyPI. With so few clusters, the narrow intervals here shouldn't be read as certainty.",
  map: "The test site was built fresh for this run, so no provider could have indexed it. Map services returned sparse or empty lists on those new paths. That says something about cold sites, not about mature, indexed ones.",
  crawl: "Only 10 tasks, from 4 site clusters. Crawl asks for every record in a section, so it tests extraction as well as retrieval.",
};

/** Where each track's tasks come from. */
export const TRACK_SOURCES: Record<TrackId, string> = {
  search: "Answer keys come from npm, PyPI, crates.io, GitHub releases, Wikidata and SEC filings.",
  scrape: "50 pages on our own test site, including JavaScript, PDFs, tabs and missing answers, plus 10 project pages on PyPI.",
  map: "8 sections of our test site, built fresh for this run so nobody could have indexed it, plus 7 sections of real docs for Typer, Ruff, MkDocs and HTTPX.",
  crawl: "7 sections of our test site plus 3 real docs sites.",
};

/** The phrase people search for, used in titles and headings. */
export const TRACK_TOPIC: Record<TrackId, string> = {
  scrape: "web scraping API",
  search: "web search API",
  map: "site map API",
  crawl: "web crawling API",
};
