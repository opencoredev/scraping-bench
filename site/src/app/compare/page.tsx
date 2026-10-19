import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageIntro, PageShell } from "@/components/site/chrome";
import { comparisons, listText, runOn } from "@/lib/catalog";
import { formatPct } from "@/lib/results";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Web data API comparisons: head-to-head results",
  description: `${comparisons.length} head-to-head comparisons of web data APIs for AI agents, such as ${listText(comparisons.slice(0, 3).map((c) => `${c.a.label} vs ${c.b.label}`))}, on the tracks both ran.`,
  path: "/compare",
});

export default function CompareIndex() {
  return (
    <PageShell>
      <Breadcrumbs trail={[{ name: "Compare", path: "/compare" }]} />
      <PageIntro title="Head-to-head comparisons">
        <p>Pairs that ran at least one track together. Each page puts both on the same tasks and says whether the gap between them is one the data supports.</p>
      </PageIntro>
      <ul className="border-t border-border">
        {comparisons.map((c) => (
          <li key={c.slug} className="border-b border-border/60">
            <Link href={`/compare/${c.slug}`} className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-medium group-hover:underline">
                {c.a.label} vs {c.b.label}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {c.shared
                  .map((t) => {
                    const a = runOn(c.a, t.id);
                    const b = runOn(c.b, t.id);
                    return a && b ? `${t.label} ${formatPct(a.agent.rate)} vs ${formatPct(b.agent.rate)}` : t.label;
                  })
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
