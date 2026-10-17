"use client";

import { useState } from "react";
import { colorOf } from "@/lib/colors";
import { fillStyle } from "@/lib/dither";
import { cn } from "@/lib/utils";

export type BarRow = {
  id: string;
  label: string;
  sub: string;
  value: number;
  text: string;
  /** Secondary figure printed after the value, such as the cost of each finished task. */
  extra: string;
  /** Shown in the readout line when the row is hovered or focused. */
  detail: string;
};

/** Ranked horizontal bars. Each bar is a dither in its provider's colour, densest at the value. */
/** `scaleMax` fixes the full-width value, so a tiny number can't fill the chart just by being the largest. */
export function Bars({ rows, empty, scaleMax }: { rows: readonly BarRow[]; empty: string; scaleMax?: number }) {
  const [active, setActive] = useState<string | null>(null);
  const max = scaleMax ?? Math.max(...rows.map((r) => r.value), 0);
  const shown = rows.find((r) => r.id === active);
  const pctOf = (v: number) => (max > 0 ? Math.min(100, Math.max((v / max) * 100, 0)) : 0);

  if (rows.length === 0) return <p className="py-16 text-sm text-muted-foreground">{empty}</p>;

  return (
    <div>
      <div role="list" className="grid grid-cols-[max-content_1fr] gap-x-5 gap-y-2.5">
        {rows.map((row) => {
          // The longest bar stops short of the edge so its value fits beside it.
          const pct = max > 0 ? Math.max(pctOf(row.value), 0.5) : 0;
          return (
            <div
              key={row.id}
              role="listitem"
              tabIndex={0}
              aria-label={row.detail}
              onPointerEnter={() => setActive(row.id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(row.id)}
              onBlur={() => setActive(null)}
              className={cn(
                "col-span-2 grid grid-cols-subgrid items-center rounded-sm transition-opacity duration-150 outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
                active !== null && active !== row.id && "opacity-45",
              )}
            >
              <span className="whitespace-nowrap">
                <span className="text-[15px] font-medium" style={{ color: colorOf(row.id) }}>
                  {row.label}
                </span>
                {row.sub ? <span className="ml-1.5 hidden text-xs text-muted-foreground sm:inline">{row.sub}</span> : null}
              </span>
              {/* Right padding reserves room for the longest value, so it never runs past the screen. */}
              <span className={cn("relative flex h-4 min-w-0 items-center md:h-5", rows.some((r) => r.extra) ? "mr-32 md:mr-36" : "mr-20")}>
                <span aria-hidden="true" className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, ...fillStyle("gradient", { color: colorOf(row.id), edge: "right", length: 18, to: 0.25 }) }} />
                <span aria-hidden="true" className="absolute inset-y-0 w-[3px]" style={{ left: `calc(${pct}% - 3px)`, background: colorOf(row.id) }} />
                <span className="absolute text-sm whitespace-nowrap tabular-nums" style={{ left: `calc(${pct}% + 10px)` }}>
                  {row.text}
                  {row.extra ? <span className="ml-2 text-xs text-muted-foreground">{row.extra}</span> : null}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 min-h-4 text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {shown?.detail}
      </p>
    </div>
  );
}
