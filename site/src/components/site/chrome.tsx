import Link from "next/link";
import { comparisons, providers, tracks } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";
import { results } from "@/lib/results";
import { NOT_TESTED, REPO, RESULTS_JSON, SITE_URL } from "@/lib/site";

/** Header, footer, breadcrumbs and JSON-LD shared by every page. Server components: no client JS. */

export function Wordmark() {
  return (
    <>
      scraping<span className="text-muted-foreground">bench</span>
    </>
  );
}

const NAV = [
  { href: "/providers", label: "Providers", mobile: true },
  { href: "/compare", label: "Compare", mobile: false },
  { href: "/methodology", label: "Methodology", mobile: false },
  { href: "/faq", label: "FAQ", mobile: true },
] as const;

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <Link href="/" className="text-lg font-medium tracking-[-0.03em] outline-none focus-visible:ring-2 focus-visible:ring-foreground/40">
        <Wordmark />
      </Link>
      <nav aria-label="Site" className="flex items-center gap-4 text-sm text-muted-foreground md:gap-5">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`${n.mobile ? "" : "hidden sm:inline"} hover:text-foreground`}>
            {n.label}
          </Link>
        ))}
        <a className="hover:text-foreground" href={REPO}>
          GitHub
        </a>
      </nav>
    </header>
  );
}

export const ranOn = new Date(results.generatedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-medium text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link href={href} className="hover:text-foreground">
      {children}
    </Link>
  </li>
);

export function SiteFooter() {
  return (
    <footer className="border-t border-border pt-10 pb-8 text-xs text-muted-foreground">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <FooterColumn title="Tracks">
          {tracks.map((t) => (
            <FooterLink key={t.id} href={`/${t.id}`}>
              {t.label} <span className="text-muted-foreground/70">· {t.tasks} tasks</span>
            </FooterLink>
          ))}
        </FooterColumn>
        <FooterColumn title="Providers">
          {providers.map((p) => (
            <li key={p.id}>
              <Link href={`/providers/${p.slug}`} className="inline-flex items-center gap-2 hover:text-foreground">
                <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: colorOf(p.id) }} />
                {p.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Compare">
          {comparisons.slice(0, 7).map((c) => (
            <FooterLink key={c.slug} href={`/compare/${c.slug}`}>
              {c.a.label} vs {c.b.label}
            </FooterLink>
          ))}
          <FooterLink href="/compare">All {comparisons.length} comparisons</FooterLink>
        </FooterColumn>
        <FooterColumn title="About">
          <FooterLink href="/methodology">How it was graded</FooterLink>
          <FooterLink href="/faq">FAQ</FooterLink>
          <li>
            <a href={RESULTS_JSON} className="hover:text-foreground">
              Results data (JSON)
            </a>
          </li>
          <li>
            <a href={REPO} className="hover:text-foreground">
              Source on GitHub
            </a>
          </li>
        </FooterColumn>
      </div>
      <div className="mt-10 flex flex-wrap justify-between gap-2 border-t border-border pt-6">
        <span>
          Run {results.runId}, {ranOn}, all from one server
        </span>
        <span>Not tested: {NOT_TESTED}. Parallel was tested, but its terms need written consent to publish results.</span>
      </div>
    </footer>
  );
}

/** Page frame for every subpage: same width and gutters as the home page. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <SiteHeader />
      <main className="pb-16">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // `<` is escaped so no string in the data can close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export type Crumb = { name: string; path: string };

/** Visible breadcrumb plus its BreadcrumbList. The last crumb is the current page. */
export function Breadcrumbs({ trail }: { trail: readonly Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", path: "/" }, ...trail];
  return (
    <>
      <nav aria-label="Breadcrumb" className="pt-6 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-foreground">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="hover:text-foreground">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.path === "/" ? SITE_URL : `${SITE_URL}${c.path}` })),
        }}
      />
    </>
  );
}

/** Heading and lead paragraph at the top of a subpage. */
export function PageIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h1 className="pt-6 pb-3 text-2xl font-medium tracking-[-0.02em] text-balance md:text-3xl">{title}</h1>
      <div className="max-w-prose space-y-3 pb-8 text-sm text-pretty text-muted-foreground">{children}</div>
    </>
  );
}

/** A titled block with the same top rule and rhythm as the home page's charts. */
export function Section({ title, note, id, children }: { title: string; note?: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-border py-10">
      <h2 className="text-base font-medium">
        {title} {note ? <span className="ml-1 text-sm font-normal text-muted-foreground">{note}</span> : null}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export const TextLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
    {children}
  </Link>
);
