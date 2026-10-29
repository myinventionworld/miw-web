import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/** Every page is public, and the sitemap lists them all. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
