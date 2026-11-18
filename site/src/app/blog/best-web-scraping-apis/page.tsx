import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd, PageIntro, PageShell, Section, TextLink } from "@/components/site/chrome";
import { Byline, FaqJsonLd, FaqList, KindKey, KindLabel, OtherPosts, Prose, ScrollHint, SourceList } from "@/components/site/post";
import { BLOG_PATH, SCRAPING_APIS_POST as POST, WEB_DATA_APIS_POST, blogPostingJsonLd, numberWord } from "@/lib/blog";
import { cheapest, costText, doneText, intervalText, listText, providerById } from "@/lib/catalog";
import type { Run } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { COST_PATH } from "@/lib/cost";
import { zeroApiCaveat } from "@/lib/faq";
import type { Faq } from "@/lib/faq";
import {
  SCRAPE_NOT_PICKED,
  SCRAPE_UNTESTED,
  SCRAPING_PICK_IDS,
  VENDORS,
  belowTop,
  coverageText,
  scrapeMeasured,
  scrapeTopGroup,
  scrapeTrack,
  scrapingCopy,
  scrapingCut,
  scrapingPicks,
  scrapingRest,
} from "@/lib/guides";
import type { Source } from "@/lib/guides";
import { ALTERNATIVES_PATH, JINA_ALTERNATIVES_PATH } from "@/lib/alternatives";
import { MODEL, NOISE_PATH, REPO, SITE_URL, pageMetadata } from "@/lib/site";

const IMAGE = "/og/scrape.png";

export function generateMetadata(): Metadata {
  const base = pageMetadata({ title: POST.metaTitle, description: POST.description, path: POST.path, image: "scrape" });
  return { ...base, openGraph: { ...base.openGraph, type: "article", publishedTime: POST.published, modifiedTime: POST.modified } };
}

const t = scrapeTrack;
const leader = scrapingPicks[0];
const names = (runs: readonly Run[]) => listText(runs.map((r) => r.entry.label));
const below = scrapingPicks.filter(belowTop);

function shortAnswer(): string[] {
  const counts = listText(scrapeTopGroup.map((r) => `${r.agent.successes}`));
  return [
    `${names(scrapeTopGroup)} finished the most scrape tasks in our benchmark: ${counts} of ${t.tasks}. Their gaps to ${leader?.entry.label} are too small to rule out chance, so read them as one top group rather than a ranking.`,
    `${names(below)} complete the seven. Each finished clearly fewer tasks than ${leader?.entry.label}. What each adds is search on the same key (Linkup), the widest set of endpoints (Firecrawl) or a free tier (TinyFish).`,
    `List prices spread far wider than the results. At each vendor's entry price, 1,000 plain page fetches run from $0 (TinyFish, up to 1,000 a day) to $3.80 (Firecrawl's Hobby plan).`,
  ];
}

const cheapestRun = cheapest(t);
const cheapestPick = scrapingPicks
  .filter((r) => r.agent.costPerSuccessUsd !== null && !zeroApiCaveat([r]))
  .sort((a, b) => (a.agent.costPerSuccessUsd ?? 0) - (b.agent.costPerSuccessUsd ?? 0))[0];

const faqs: Faq[] = [
  {
    question: "What is the best web scraping API in 2026?",
    answer: `On scrapingbench's ${t.tasks} scrape tasks, graded by script with ${MODEL} as the agent, ${leader?.entry.label} finished the most, ${leader ? doneText(leader.agent) : ""}. ${names(scrapeTopGroup.slice(1))} were close enough that the gaps could be chance, so any of the ${numberWord(scrapeTopGroup.length)} is a defensible pick on measured results. The tasks are mostly documentation pages, so this says little about sites that block bots.`,
    links: [{ href: "/scrape", label: "All scrape results" }],
  },
  {
    question: "Which web scraping API is cheapest?",
    answer: `Per finished task, counting API and model spend, ${cheapestRun ? `${cheapestRun.entry.label} cost the least at ${costText(cheapestRun.agent)}. ${zeroApiCaveat([cheapestRun])}` : ""}${cheapestPick ? ` Among APIs that charged for calls, ${cheapestPick.entry.label} cost the least at ${costText(cheapestPick.agent)}.` : ""} By list price per page, TinyFish's Fetch API is free up to 1,000 URLs a day, and Spider, Scrapfly's basic request and String's standard fetch cost well under a dollar per 1,000 pages.`,
    links: [{ href: COST_PATH, label: "What cost per finished task means" }],
  },
  {
    question: "Were Bright Data, ScrapingBee, Zyte or ZenRows tested?",
    answer: `No. ${listText([...SCRAPE_UNTESTED])} weren't part of this benchmark, so there are no numbers for them here and none of them could make the measured list.`,
    links: [],
  },
];

const sources: Source[] = [
  ...SCRAPING_PICK_IDS.flatMap((p) => VENDORS[p]?.sources ?? []),
  { label: "scrapingbench results data (results.json)", url: `${REPO}/blob/main/site/src/data/results.json` },
  { label: "scrapingbench v2 methodology and corrections", url: `${REPO}/blob/main/docs/METHODOLOGY.md` },
  { label: "scrapingbench README: String's added run", url: `${REPO}#string` },
];

function PickName({ run }: { run: Run }) {
  const p = providerById(run.entry.id);
  return p ? (
    <Link href={`/providers/${p.slug}`} className="hover:underline" style={{ color: colorOf(p.id) }}>
      {run.entry.label}
    </Link>
  ) : (
    <>{run.entry.label}</>
  );
}

function GlanceTable() {
  return (
    <>
      <ScrollHint />
      <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[760px] text-left text-sm tabular-nums">
        <caption className="sr-only">The seven web scraping APIs: measured scrape results and list price per 1,000 plain fetches</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 font-normal">#</th>
            <th scope="col" className="py-2 pr-4 font-normal">API</th>
            <th scope="col" className="py-2 pr-4 font-normal">Tasks done</th>
            <th scope="col" className="py-2 pr-4 font-normal">95% interval</th>
            <th scope="col" className="py-2 pr-4 font-normal">Group</th>
            <th scope="col" className="py-2 pr-4 font-normal">Cost per finished task</th>
            <th scope="col" className="py-2 pr-4 font-normal">Page coverage</th>
            <th scope="col" className="py-2 font-normal">1,000 plain fetches, list price</th>
          </tr>
        </thead>
        <tbody>
          {scrapingPicks.map((r, i) => (
            <tr key={r.entry.id} className="border-b border-border/60">
              <td className="py-2.5 pr-3 text-muted-foreground">{i + 1}</td>
              <th scope="row" className="py-2.5 pr-4 font-medium">
                <PickName run={r} />
              </th>
              <td className="py-2.5 pr-4">{doneText(r.agent)}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{intervalText(r.agent)}</td>
              <td className="py-2.5 pr-4">{belowTop(r) ? "below top" : "top"}</td>
              <td className="py-2.5 pr-4">
                {costText(r.agent)}
                {zeroApiCaveat([r]) ? <span className="text-muted-foreground">*</span> : null}
              </td>
              <td className="py-2.5 pr-4">{coverageText(r)}</td>
              <td className="py-2.5">{VENDORS[r.entry.id]?.perThousand}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

export default function BestWebScrapingApisPage() {
  const [first, ...rest] = shortAnswer();
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Blog", path: BLOG_PATH }, { name: "Best web scraping APIs", path: POST.path }]} />
      <JsonLd data={blogPostingJsonLd(POST, IMAGE)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: POST.title,
          numberOfItems: scrapingPicks.length,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: scrapingPicks.map((r, i) => {
            const p = providerById(r.entry.id);
            return { "@type": "ListItem", position: i + 1, name: r.entry.label, url: p ? `${SITE_URL}/providers/${p.slug}` : VENDORS[r.entry.id]?.site };
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

      <Section title="The seven at a glance" note={`${t.tasks} scrape tasks, one agent, same limits`}>
        <GlanceTable />
        <div className="mt-5">
          <Prose>
            <p>
              Tasks done, the interval, group, cost per finished task and page coverage are measured. &quot;Top&quot; means the gap to {leader?.entry.label} could be chance; &quot;below top&quot; means it
              couldn&apos;t. Cost per finished task is all API and model spend, failed tasks included, divided by tasks finished. Page coverage is the share of sampled sentences from each page&apos;s own
              text that reached the agent.
            </p>
            <p>
              The last column is our arithmetic from each vendor&apos;s list price on its entry paid plan, for fetches with no JavaScript rendering. Plans differ in size, so higher tiers cost less per page.
            </p>
            {scrapingPicks.some((r) => zeroApiCaveat([r])) ? <p>* {zeroApiCaveat(scrapingPicks)}</p> : null}
          </Prose>
        </div>
      </Section>

      {scrapingPicks.map((r, i) => {
        const v = VENDORS[r.entry.id];
        const copy = scrapingCopy(r);
        const p = providerById(r.entry.id);
        return (
          <Section key={r.entry.id} id={p?.slug} title={`${i + 1}. ${r.entry.label}`} note={belowTop(r) ? "below the top group" : "top group"}>
            <Prose>
              <p className="text-foreground">{copy.what}</p>
              <p>
                <KindLabel kind="measured" />
                {scrapeMeasured(r).join(" ")}
              </p>
              {v ? (
                <p>
                  <KindLabel kind="vendor" />
                  {v.fetchPrice}. Free: {v.free}. {v.billing}
                </p>
              ) : null}
              {copy.judgment.map((j) => (
                <p key={j}>
                  <KindLabel kind="editorial" />
                  {j}
                </p>
              ))}
              <p className="text-foreground">Pick it if {copy.pickIf}</p>
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                {p ? <TextLink href={`/providers/${p.slug}`}>{r.entry.label} results on every track</TextLink> : null}
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

      <Section title="How to choose between them">
        <Prose>
          <p>
            <KindLabel kind="editorial" />
            <strong>Highest measured success on documentation-style pages.</strong> Any of {names(scrapeTopGroup)}. The benchmark can&apos;t separate them, so decide on price, billing rules and the other jobs
            you need.
          </p>
          <p>
            <KindLabel kind="editorial" />
            <strong>Lowest price per page at volume.</strong> Spider, a basic Scrapfly request or a standard String fetch. Check what your pages need first: JavaScript rendering multiplies Scrapfly&apos;s
            price by six and String&apos;s by almost five.
          </p>
          <p>
            <KindLabel kind="editorial" />
            <strong>Free, for a prototype.</strong> TinyFish&apos;s Fetch API costs nothing up to 1,000 URLs a day. Context.dev, Firecrawl and Scrapfly each give 1,000 credits a month, and Linkup gives $20
            of credit to a work-email account and tops eligible accounts back up each month.
          </p>
          <p>
            <KindLabel kind="editorial" />
            <strong>One key for scrape, search, map and crawl.</strong> Context.dev or Firecrawl. They are the only two that ran all four tracks.
          </p>
          <p>
            <KindLabel kind="editorial" />
            <strong>Sites that block bots or need a login.</strong> Nothing here measures that. Try Scrapfly&apos;s Unblocker or String&apos;s premium proxies on your own targets, or a browser API for
            logins. The <TextLink href={WEB_DATA_APIS_POST.path}>web data API guide</TextLink> covers those jobs.
          </p>
        </Prose>
      </Section>

      <Section title="How we picked the seven">
        <Prose>
          <p>
            We started from the {scrapingPicks.length + scrapingRest.length} APIs that ran the scrape track in scrapingbench v2. An API we didn&apos;t test can&apos;t be on a list built from measured
            results, so untested ones are named further down without numbers.
          </p>
          <p>
            The order is the one the <TextLink href="/scrape">scrape results page</TextLink> uses: the top group first, then tasks done. We cut the list at seven.
            {scrapingCut
              ? ` The next API, ${scrapingCut.entry.label}, finished ${doneText(scrapingCut.agent)}, ${(scrapingPicks[scrapingPicks.length - 1]?.agent.successes ?? 0) - scrapingCut.agent.successes} task${(scrapingPicks[scrapingPicks.length - 1]?.agent.successes ?? 0) - scrapingCut.agent.successes === 1 ? "" : "s"} fewer than ${scrapingPicks[scrapingPicks.length - 1]?.entry.label}. That cut is a judgment call, not a measured difference.`
              : ""}
          </p>
          <p>
            Prices come from each vendor&apos;s pricing or docs page, read on the date in the byline. The per-1,000 figures are our arithmetic. No vendor paid for a place or saw this post before it went up,
            and there are no affiliate links.
          </p>
        </Prose>
      </Section>

      <Section title="What this test covers, and what it doesn't">
        <Prose>
          <p>
            Each of the {t.tasks} core tasks gave {MODEL} one scraping API as its only tool, up to {t.limits.calls} calls, {t.limits.seconds} seconds and ${t.limits.usd.toFixed(2)}, and asked for specific
            facts from one page. A script checked every answer against a key taken from an official source. No model graded anything.
          </p>
          <p>
            The pages are mostly documentation, and most tasks ask for a heading. So this measures whether an API keeps a page&apos;s headings and structure intact for an agent. It doesn&apos;t measure
            sites behind anti-bot systems, logged-in pages, product catalogs, throughput, or extraction to a schema.
          </p>
          <p>
            Every provider ran on its default settings and a free plan, from one server. One run with one model is a narrow sample, which is why the intervals are wide and{" "}
            <TextLink href={NOISE_PATH}>most gaps are too small to call</TextLink>. These are v2 results, published on the site as the current edition.
          </p>
        </Prose>
      </Section>

      <Section title="Measured, but not in the seven">
        <ul className="max-w-prose space-y-3 text-sm text-pretty text-muted-foreground">
          {scrapingRest.map((r) => (
            <li key={r.entry.id}>
              <span className="font-medium text-foreground">
                <PickName run={r} />
              </span>
              : {doneText(r.agent)} tasks, {belowTop(r) ? "below the top group" : "top group"}. {SCRAPE_NOT_PICKED[r.entry.id]}
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-sm text-pretty text-muted-foreground">
          Not tested, so no numbers: {listText([...SCRAPE_UNTESTED])}. If you&apos;ve picked one of these, run it on your own pages before you rely on it.
        </p>
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
            Every scrape result with charts is on the <TextLink href="/scrape">scrape page</TextLink>. Head-to-head pages: <TextLink href={ALTERNATIVES_PATH}>Firecrawl alternatives</TextLink> and{" "}
            <TextLink href={JINA_ALTERNATIVES_PATH}>Jina Reader alternatives</TextLink>. How the cost figure works: <TextLink href={COST_PATH}>cost per finished task</TextLink>.
          </p>
        </Prose>
        <div className="mt-6">
          <OtherPosts current={POST} />
        </div>
      </Section>
    </PageShell>
  );
}
