import Link from "next/link";
import { costText, doneText, intervalText, providerById, timeText } from "@/lib/catalog";
import type { Run } from "@/lib/catalog";
import { colorOf } from "@/lib/colors";

/** The numbers behind a chart, as a real table: readable without hover, by screen readers and by crawlers. */
export function ScoreTable({ runs, caption, highlight }: { runs: readonly Run[]; caption: string; highlight?: readonly string[] }) {
  return (
    <div className="relative -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[560px] table-fixed text-left text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-4 font-normal">Provider</th>
            <th scope="col" className="py-2 pr-4 font-normal">Tasks done</th>
            <th scope="col" className="py-2 pr-4 font-normal">95% interval</th>
            <th scope="col" className="py-2 pr-4 font-normal">Cost per finished task</th>
            <th scope="col" className="py-2 font-normal">Median time</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const p = providerById(r.entry.id);
            const dim = highlight !== undefined && !highlight.includes(r.entry.id);
            return (
              <tr key={r.entry.id} className={`border-b border-border/60 ${dim ? "text-muted-foreground" : ""}`}>
                <th scope="row" className="py-2.5 pr-4 font-medium">
                  {p ? (
                    <Link href={`/providers/${p.slug}`} className="hover:underline" style={{ color: dim ? undefined : colorOf(r.entry.id) }}>
                      {r.entry.label}
                    </Link>
                  ) : (
                    r.entry.label
                  )}
                </th>
                <td className="py-2.5 pr-4">{doneText(r.agent)}</td>
                <td className="py-2.5 pr-4">{intervalText(r.agent)}</td>
                <td className="py-2.5 pr-4">{costText(r.agent)}</td>
                <td className="py-2.5">{timeText(r.agent)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
