import type { MetadataRoute } from "next";
import { results } from "@/lib/results";
import { indexablePaths } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Every page is rebuilt from the same run, so the run date is when its content last changed.
  return indexablePaths.map((path) => ({ url: absoluteUrl(path), lastModified: results.generatedAt }));
}
