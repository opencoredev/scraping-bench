import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { Byline, FaqJsonLd, FaqList, KindKey, KindLabel, OtherPosts, Prose, SourceList } from "@/components/site/post";
import { BLOG_PATH, SCRAPING_APIS_POST, WEB_DATA_APIS_POST as POST, blogPostingJsonLd, numberWord } from "@/lib/blog";
import { leaders, listText, providerById, rankedRuns, trackById, tracks } from "@/lib/catalog";
import type { Provider } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { COST_PATH } from "@/lib/cost";
import type { Faq } from "@/lib/faq";
import { DATA_PICKS, VENDORS, belowTop, groupSummary, trackLines } from "@/lib/guides";
import type { DataPick, Source } from "@/lib/guides";
import { JINA_TOKEN_BUDGET } from "@/lib/notes";
import { MODEL, NOISE_PATH, REPO, SITE_URL, pageMetadata } from "@/lib/site";

const IMAGE = "/og/overview.png";

export function generateMetadata(): Metadata {
  const base = pageMetadata({ title: POST.metaTitle, description: POST.description, path: POST.path, image: "overview" });
  return { ...base, openGraph: { ...base.openGraph, type: "article", publishedTime: POST.published, modifiedTime: POST.modified } };
}

const label = (id: string): string => providerById(id)?.label ?? VENDORS[id]?.name ?? id;
const lower = (s: string) => s.toLowerCase();
const tested = DATA_PICKS.filter((p) => p.tested);
const untested = DATA_PICKS.filter((p) => !p.tested);

/** Who leads each measured track, and whether any lead is big enough to rule out chance. */
function leadText(): string {
  const parts = tracks.map((t) => {
    const top = leaders(t);
    const names = listText(top.map((r) => r.entry.label));
    return `${names}${top.length > 1 ? " (tied)" : ""} on ${lower(t.label)}`;
  });
  const anyReal = tracks.some((t) => {
    const top = leaders(t);
    const rest = rankedRuns(t).filter((r) => !top.some((x) => x.entry.id === r.entry.id));
    return top.length === 1 && rest.length > 0 && rest.every(belowTop);
  });
  return `The leaders: ${listText(parts)}. ${anyReal ? "Some of those leads are big enough to rule out chance." : "None of those leads is big enough to rule out chance."}`;
}

function allTracksText(): string {
  const all = tested.flatMap((p) => {
    const prov = providerById(p.id);
    return prov && prov.runs.length === tracks.length && prov.runs.every((r) => !belowTop(r)) ? [prov.label] : [];
  });
  return `${listText(all)} ${all.length === 1 ? "was" : "were"} in the top group on all ${numberWord(tracks.length)} jobs we measured.`;
}

function shortAnswer(): string[] {
  return [
    "A web data API is what an AI agent calls to get something from the web: one page's text, search results, the list of URLs on a site, a whole docs section, or a browser it can click through. These are different jobs, and the API that does one well may not offer another.",
    `${allTracksText()} ${leadText()}`,
    `The list below has the ${numberWord(tested.length)} APIs that made a top group in our benchmark, plus ${numberWord(untested.length)} for jobs it doesn't measure: browser sessions, sites that block bots, and ready-made scrapers for specific sites. Those ${numberWord(untested.length)} have no scores.`,
  ];
}

type JobRow = { job: string; send: string; get: string; use: string; measured: string };
const JOBS: JobRow[] = [
  { job: "Scrape", send: "A URL", get: "That page as Markdown, HTML or JSON", use: "Reading a page you already know about", measured: "Yes, scrape track" },
  { job: "Search", send: "A query", get: "Ranked results with snippets or page text", use: "Finding pages and facts you don't have URLs for", measured: "Yes, search track" },
  { job: "Map", send: "A site or section URL", get: "A list of the URLs in it", use: "Finding out what pages exist before you fetch them", measured: "Yes, map track" },
  { job: "Crawl", send: "A start URL and a scope", get: "Many pages' content in one job", use: "Pulling a whole docs section into an index", measured: "Yes, crawl track" },
  { job: "Browser sessions", send: "Commands to a remote browser", get: "Whatever the page shows after clicks, logins and forms", use: "Pages that only work with interaction", measured: "No" },
  { job: "Protected sites", send: "A URL, through a proxy and unblocking service", get: "The page, past anti-bot checks", use: "Sites that block plain HTTP requests", measured: "No" },
  { job: "Ready-made scrapers", send: "A site-specific job, like a store or maps search", get: "Structured records for that site", use: "Data from one big site without writing a scraper", measured: "No" },
];

const faqs: Faq[] = [
  {
    question: "What is a web data API?",
    answer:
      "An API that gets data from the public web for a program or an AI agent. The main kinds are scrape (a URL in, the page's content out), search (a query in, results out), map (a site in, its URLs out), crawl (many pages in one job), hosted browsers for pages that need clicks or logins, unblocking services for sites that block automated requests, and ready-made scrapers that return structured records from one site.",
    links: [],
  },
  {
    question: "Which web data API is best for an AI agent?",
    answer: `It depends on the job, and scrapingbench doesn't produce one overall ranking. ${allTracksText()} ${leadText()} Every score comes from ${MODEL} using one API as its only tool, graded by script.`,
    links: [{ href: "/providers", label: "Every provider on every track" }],
  },
  {
    question: "Which search API should an AI agent use?",
    answer: (() => {
      const search = trackById("search");
      const top = search ? rankedRuns(search).filter((r) => !belowTop(r)) : [];
      return `On our ${search?.tasks ?? ""} search tasks, ${listText(top.map((r) => r.entry.label))} made the top group, with ${top[0]?.entry.label} finishing the most. Exa, Tavily and Perplexity's search API weren't tested, so we can't say how they compare.`;
    })(),
    links: [{ href: "/search", label: "Search results" }],
  },
];

const sources: Source[] = [
  ...DATA_PICKS.flatMap((p) => VENDORS[p.id]?.sources ?? []),
  { label: "Exa pricing", url: "https://exa.ai/pricing" },
  { label: "Tavily pricing", url: "https://www.tavily.com/pricing" },
  { label: "scrapingbench results data (results.json)", url: `${REPO}/blob/main/site/src/data/results.json` },
  { label: "scrapingbench v2 methodology and corrections", url: `${REPO}/blob/main/docs/METHODOLOGY.md` },
];

function Name({ pick }: { pick: DataPick }) {
  const p = providerById(pick.id);
  return p ? (
    <Link href={`/providers/${p.slug}`} className="hover:underline" style={{ color: colorOf(p.id) }}>
      {p.label}
    </Link>
  ) : (
    <a href={VENDORS[pick.id]?.site} className="hover:underline">
      {label(pick.id)}
    </a>
  );
}

function testedText(pick: DataPick, p: Provider | undefined): string {
  if (pick.tested && p) return groupSummary(p);
  if (p) return `sessions not tested; ${p.runs.map((r) => lower(r.track.label)).join(" and ")} APIs below the top group`;
  return "not tested";
}

function MeasuredLines({ p }: { p: Provider }) {
  return (
    <ul className="mt-1 space-y-1">
      {trackLines(p).map((l) => (
        <li key={l.track.id}>
          <Link href={`/${l.track.id}`} className="text-foreground hover:underline">
            {l.track.label}
          </Link>
          : {l.done}
          {l.cost ? `, ${l.cost} per finished task` : ""}, {l.top ? "top group" : "below the top group"}
        </li>
      ))}
    </ul>
  );
}

export default function TopWebDataApisPage() {
  const [first, ...rest] = shortAnswer();
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Blog", path: BLOG_PATH }, { name: "Top 10 web data APIs", path: POST.path }]} />
      <JsonLd data={blogPostingJsonLd(POST, IMAGE)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: POST.title,
          numberOfItems: DATA_PICKS.length,
          itemListOrder: "https://schema.org/ItemListUnordered",
          itemListElement: DATA_PICKS.map((pick, i) => {
            const p = providerById(pick.id);
            return { "@type": "ListItem", position: i + 1, name: label(pick.id), url: p ? `${SITE_URL}/providers/${p.slug}` : VENDORS[pick.id]?.site };
          }),
        }}
      />
      <FaqJsonLd post={POST} faqs={faqs} />

      <PageIntro title={POST.title}>
        <Byline post={POST} />
        {first ? <p className="text-foreground">{first}</p> : null}
        {rest.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </PageIntro>
      <div className="max-w-prose pb-8">
        <p className="pb-2 text-xs text-muted-foreground">Paragraphs below are marked by where their facts come from:</p>
        <KindKey />
      </div>

      <Section title="Seven jobs a web data API can do">
        <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Kinds of web data API: what you send, what you get, when to use it and whether scrapingbench measures it</caption>
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-normal">Job</th>
                <th scope="col" className="py-2 pr-4 font-normal">You send</th>
                <th scope="col" className="py-2 pr-4 font-normal">You get back</th>
                <th scope="col" className="py-2 pr-4 font-normal">Use it for</th>
                <th scope="col" className="py-2 font-normal">Measured here</th>
              </tr>
            </thead>
            <tbody>
              {JOBS.map((j) => (
                <tr key={j.job} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2.5 pr-4 font-medium">{j.job}</th>
                  <td className="py-2.5 pr-4 text-muted-foreground">{j.send}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{j.get}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{j.use}</td>
                  <td className="py-2.5">{j.measured}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <Prose>
            <p>
              Most agents need two of these: search to find pages and scrape to read them. Map and crawl matter when the agent works through a whole site, such as answering from a product&apos;s docs. The
              last three jobs are for pages that fight back or need a person&apos;s clicks, and they cost more per page.
            </p>
          </Prose>
        </div>
      </Section>

      <Section title="The ten at a glance" note="numbered for reference, not ranked">
        <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Ten web data APIs: the jobs each fits, whether it was tested and its free allowance</caption>
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3 font-normal">#</th>
                <th scope="col" className="py-2 pr-4 font-normal">API</th>
                <th scope="col" className="py-2 pr-4 font-normal">Fits</th>
                <th scope="col" className="py-2 pr-4 font-normal">Measured result</th>
                <th scope="col" className="py-2 font-normal">Free allowance (vendor)</th>
              </tr>
            </thead>
            <tbody>
              {DATA_PICKS.map((pick, i) => {
                const p = providerById(pick.id);
                return (
                  <tr key={pick.id} className="border-b border-border/60 align-top">
                    <td className="py-2.5 pr-3 text-muted-foreground">{i + 1}</td>
                    <th scope="row" className="py-2.5 pr-4 font-medium">
                      <Name pick={pick} />
                    </th>
                    <td className="py-2.5 pr-4">{pick.jobs.join(", ")}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{testedText(pick, p)}</td>
                    <td className="py-2.5 text-muted-foreground">{VENDORS[pick.id]?.free}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <Prose>
            <p>
              &quot;Top group&quot; means the API&apos;s gap to the track&apos;s leader is too small to rule out chance. The order follows the jobs: all-rounders first, then search, map, crawl and scrape, then
              the three jobs we don&apos;t measure. Scrapingbench scores each job on its own and has no overall ranking, so neither does this list.
            </p>
          </Prose>
        </div>
      </Section>

      {DATA_PICKS.map((pick, i) => {
        const p = providerById(pick.id);
        const v = VENDORS[pick.id];
        return (
          <Section key={pick.id} id={pick.id} title={`${i + 1}. ${label(pick.id)}`} note={pick.jobs.join(", ")}>
            <Prose>
              <p className="text-foreground">{pick.why}</p>
              {p ? (
                <div>
                  <p>
                    <KindLabel kind="measured" />
                    {pick.tested ? `${p.label} in scrapingbench v2:` : `${p.label}'s HTTP APIs in scrapingbench v2 (its browser sessions weren't tested):`}
                  </p>
                  <MeasuredLines p={p} />
                </div>
              ) : (
                <p>
                  <KindLabel kind="measured" />
                  Not tested. There are no scrapingbench numbers for {label(pick.id)}.
                </p>
              )}
              {v ? (
                <p>
                  <KindLabel kind="vendor" />
                  {v.fetchPrice}. {v.otherPrices.join(". ")}. Free: {v.free}. {v.billing}
                </p>
              ) : null}
              <p>
                <KindLabel kind="editorial" />
                Watch for: {pick.watch}
              </p>
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                {p ? <TextLink href={`/providers/${p.slug}`}>{p.label} results</TextLink> : null}
                {v?.sources[0] ? (
                  <a href={v.sources[0].url} className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
                    {v.sources[0].label}
                  </a>
                ) : null}
              </p>
            </Prose>
          </Section>
        );
      })}

      <Section title="How we chose the ten">
        <Prose>
          <p>
            For the four jobs scrapingbench measures, an API is on the list if it made the top group on at least one of them: its gap to that job&apos;s leader was too small to rule out chance. That
            rule, applied to the v2 results, gives exactly {numberWord(tested.length)} APIs, and the page checks it against the data every time it&apos;s built.
          </p>
          <p>
            For the jobs we don&apos;t measure, we picked one API each whose public docs and pricing cover that job: {listText(untested.map((u) => `${label(u.id)} for ${u.jobs.join(", ")}`))}. That is
            editorial judgment, and other APIs do those jobs too. Browserbase&apos;s Fetch and Search APIs were measured and finished below the top group; it&apos;s here for its browser sessions, which
            weren&apos;t.
          </p>
          <p>
            Prices are from each vendor&apos;s own pages, read on the date in the byline. No vendor paid for a place or saw this post before it went up, and there are no affiliate links.
          </p>
          <p>
            Crawl costs are left out on purpose. The v2 crawl was re-scored by replaying stored provider responses, and that replay doesn&apos;t measure what a fresh crawl costs end to end. Scrape, search
            and map costs are <TextLink href={COST_PATH}>cost per finished task</TextLink>: all API and model spend, failed tasks included, divided by tasks finished.
          </p>
        </Prose>
      </Section>

      <Section title="Also considered">
        <Prose>
          <p>
            <KindLabel kind="measured" />
            You.com and Jina Reader were tested. You.com finished below the top group on both search and scrape. Jina Reader ran scrape only, under a {JINA_TOKEN_BUDGET ?? "small"}-token budget that made it reject longer pages,
            so its score isn&apos;t a general one.
          </p>
          <p>
            <KindLabel kind="vendor" />
            Exa and Tavily sell search APIs built for agents, and both were left out of the benchmark, so they can&apos;t make a measured search slot. On their pricing pages, Exa charges $7 per 1,000
            searches (up to 10 results) and $1 per 1,000 pages of contents, with $10 of free credit a month; Tavily gives 1,000 free credits a month and charges $0.008 a credit after that.
          </p>
          <p>
            <KindLabel kind="editorial" />
            Also not tested: Perplexity&apos;s search API, Zyte API, ScrapingBee, ZenRows and Crawl4AI. If your shortlist includes one of them, run it on your own tasks first.
          </p>
        </Prose>
      </Section>

      <Section title="What the benchmark covers">
        <Prose>
          <p>
            Every measured number comes from {MODEL} using one API as its only tool, on frozen tasks with answer keys from official sources, graded by a script. The tasks are mostly documentation sites,
            every provider ran on its default settings from one server, and{" "}
            <TextLink href={NOISE_PATH}>most gaps between providers are too small to call</TextLink>. The full rules are on the <TextLink href="/methodology">methodology page</TextLink>.
          </p>
          <p>
            For scraping alone, with page coverage, list price per 1,000 pages and billing rules for each API, see{" "}
            <TextLink href={SCRAPING_APIS_POST.path}>the 7 best web scraping APIs</TextLink>.
          </p>
        </Prose>
      </Section>

      <Section title="Short answers">
        <FaqList faqs={faqs} />
      </Section>

      <Section title="Sources">
        <SourceList sources={sources} />
      </Section>

      <Section title="Related">
        <Prose>
          <p>
            Every provider on every track: <TextLink href="/providers">providers</TextLink>. Pairs people search for: <TextLink href="/compare">comparisons</TextLink>. Per-track results:{" "}
            {tracks.map((t, i) => (
              <span key={t.id}>
                {i > 0 ? ", " : ""}
                <TextLink href={`/${t.id}`}>{lower(t.label)}</TextLink>
              </span>
            ))}
            .
          </p>
        </Prose>
        <div className="mt-6">
          <OtherPosts current={POST} />
        </div>
      </Section>
    </PageShell>
  );
}
