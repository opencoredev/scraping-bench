import type { Metadata } from "next";
import { BenchPage } from "@/components/bench/bench-page";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { providers, tracks } from "@/lib/catalog";
import { results } from "@/lib/results";
import { AUTHOR, HOME_TITLE, MODEL, REPO, RESULTS_JSON, RESULTS_JSON_RAW, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";

const description = `${providers.length} web data APIs graded on whether an agent got the right answer: task success, cost per finished task and time, with confidence intervals.`;

export const metadata: Metadata = pageMetadata({ title: HOME_TITLE, description, path: "/", absoluteTitle: true });

const organization = { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, sameAs: [REPO, AUTHOR.url] };

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    organization,
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description, inLanguage: "en", publisher: { "@id": organization["@id"] } },
    {
      "@type": "Dataset",
      "@id": `${SITE_URL}/#dataset`,
      name: "scraping-bench results: web data APIs for AI agents",
      description: `Pass or fail results for ${providers.map((p) => p.label).join(", ")} on ${tracks.map((t) => `${t.tasks} ${t.label.toLowerCase()}`).join(", ")} tasks. Every provider gets the same tasks, the same model (${MODEL}) and the same limits, and a script checks every answer. Includes tasks done, 95% intervals from a bootstrap over sites, cost per finished task and median time, plus no-tool and correct-page controls.`,
      url: SITE_URL,
      sameAs: RESULTS_JSON,
      version: results.runId,
      dateModified: results.generatedAt,
      license: "https://opensource.org/licenses/MIT",
      isAccessibleForFree: true,
      creator: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      publisher: { "@id": organization["@id"] },
      keywords: ["web scraping API", "web search API", "AI agents", "benchmark", "crawl", "site map", ...providers.map((p) => p.label)],
      measurementTechnique: "Each task is pass or fail, decided by a script that compares every answer field with a verified key",
      variableMeasured: ["Tasks done (share of tasks passed)", "95% interval from a site-level bootstrap", "Cost per finished task in US dollars", "Median time per finished task"],
      distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: RESULTS_JSON_RAW }],
    },
  ],
};

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <BenchPage results={results} />
      <SiteFooter />
    </div>
  );
}
