import i18nConfig, { type Locale } from "./config";

/**
 * Every internal link carries its locale. The alternative — linking to `/work`
 * and letting the proxy sort it out — costs a redirect on every navigation, and
 * on a site whose whole premise is that moving through it feels like one
 * continuous flight, a round trip to the edge between stations is the one thing
 * the design cannot absorb.
 *
 * Hashes and query strings survive: `/#transmission` becomes `/en#transmission`,
 * not `/en/#transmission`.
 */
export function localeHref(locale: string, href: string) {
  if (href === "/") return `/${locale}`;
  if (href.startsWith("/#") || href.startsWith("/?"))
    return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}

/**
 * `canonical` plus one `hreflang` per language, for one route.
 *
 * Without it each translation looks to a crawler like a near-duplicate
 * competing with the other two, and the three of them split whatever the page
 * would otherwise have ranked for. `x-default` points at English because that is
 * what an unprefixed URL resolves to — the honest answer to "which of these for
 * a reader whose language we do not publish".
 */
export function alternates(locale: string, path = "/") {
  return {
    canonical: localeHref(locale, path),
    languages: {
      ...Object.fromEntries(
        i18nConfig.locales.map((l) => [l, localeHref(l, path)]),
      ),
      "x-default": localeHref(i18nConfig.defaultLocale, path),
    },
  };
}

/**
 * Rewrites the first path segment for the language switcher, so a reader
 * switching on `/ru/work/omnibus` lands on the English version of the same case
 * study rather than back at the top of the deck.
 */
export function swapLocale(pathname: string, next: Locale) {
  const segments = pathname.split("/");
  // `"/ru/work".split("/")` is `["", "ru", "work"]`, so the locale is at 1.
  if (i18nConfig.locales.includes(segments[1] as Locale)) {
    segments[1] = next;
    return segments.join("/");
  }
  return localeHref(next, pathname);
}
