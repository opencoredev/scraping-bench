import type { Metadata } from "next";
import { BenchPage } from "@/components/bench/bench-page";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { publishable } from "@/lib/results";
import { pageMetadata } from "@/lib/site";
import earlier from "@/data/results-v1.json";

export const metadata: Metadata = pageMetadata({
  title: "Earlier v1 run: web data API benchmark",
  description: "The first, smaller run of the benchmark, with different tasks and providers from v2.",
  path: "/v1",
});

export default function EarlierRun() {
  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <SiteHeader />
      <BenchPage results={publishable(earlier)} />
      <SiteFooter runLine={false} />
    </div>
  );
}
