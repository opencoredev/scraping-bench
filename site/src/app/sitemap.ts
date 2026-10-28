import type { MetadataRoute } from "next";
import { results } from "@/lib/results";
import { COPY_CHANGED, indexablePaths } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Every page is rebuilt from the same run, so the run date is when its content last changed, unless its copy changed later.
  const run = new Date(results.generatedAt);
  return indexablePaths.map((path) => {
    const copy = COPY_CHANGED[path];
    const changed = copy ? new Date(`${copy}T00:00:00Z`) : undefined;
    return { url: absoluteUrl(path), lastModified: changed && changed > run ? changed : run };
  });
}
