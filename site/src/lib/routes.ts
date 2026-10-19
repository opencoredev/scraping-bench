import { comparisons, providers, tracks } from "@/lib/catalog";

/** Every indexable path, for the sitemap, llms.txt and IndexNow. /export is left out on purpose. */
export const indexablePaths: readonly string[] = [
  "/",
  ...tracks.map((t) => `/${t.id}`),
  "/providers",
  ...providers.map((p) => `/providers/${p.slug}`),
  "/compare",
  ...comparisons.map((c) => `/compare/${c.slug}`),
  "/methodology",
  "/faq",
];
