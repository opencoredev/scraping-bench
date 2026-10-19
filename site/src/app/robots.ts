import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // /export is a page of cards for screenshots, not something to land on from search.
    rules: { userAgent: "*", allow: "/", disallow: "/export" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
