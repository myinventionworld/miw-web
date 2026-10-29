import type { MetadataRoute } from "next";

import i18nConfig from "@/i18nConfig";
import { alternates } from "@/lib/locale";
import { PAGES, siteUrl } from "@/lib/site";

/**
 * Every page in every language, each listing its translations, so a search
 * engine files the three as one page in three languages rather than as three
 * near-duplicates. The hreflang set is the one the pages declare in their own
 * metadata (`alternates()`), x-default included.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const absolute = (links: Record<string, string>) =>
    Object.fromEntries(Object.entries(links).map(([l, href]) => [l, base + href]));

  return PAGES.flatMap((path) =>
    i18nConfig.locales.map((locale) => {
      const { canonical, languages } = alternates(locale, path);
      return {
        url: base + canonical,
        changeFrequency: "monthly" as const,
        priority: path === "/" ? 1 : path.startsWith("/work/") ? 0.7 : 0.8,
        alternates: { languages: absolute(languages) },
      };
    }),
  );
}
