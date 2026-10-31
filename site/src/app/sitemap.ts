import type { MetadataRoute } from "next";
import { results } from "@/lib/results";
import { COPY_CHANGED, RUN_PUBLISHED, indexablePaths } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Every page is rebuilt from the same run, so the day that run went live is when its content last changed, unless its copy changed later.
  const day = (date: string): Date => new Date(`${date}T00:00:00Z`);
  const published = RUN_PUBLISHED[results.runId];
  const run = published ? day(published) : new Date(results.generatedAt);
  return indexablePaths.map((path) => {
    const copy = COPY_CHANGED[path];
    const changed = copy ? day(copy) : undefined;
    return { url: absoluteUrl(path), lastModified: changed && changed > run ? changed : run };
  });
}
