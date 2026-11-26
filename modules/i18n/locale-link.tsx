"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CROSSFADE, currentLander } from "@/shared/lib/landing";

import { localeHref } from "./locale";
import i18nConfig, { type Locale } from "./config";

const LIGHT_ROUTES = ["/work", "/about", "/terms"];

function isLightRoute(href: string) {
  return LIGHT_ROUTES.some((r) => href === r || href.startsWith(`${r}/`));
}

/**
 * The locale of the page being rendered.
 *
 * Read off the route rather than the `NEXT_LOCALE` cookie, which is what
 * `next-i18n-router`'s own hook prefers: the cookie records the last language
 * somebody chose, and a reader who followed a link to `/cs/work` is looking at
 * a Czech page whatever their cookie says.
 */
export function useLocale(): Locale {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale;
  return i18nConfig.locales.includes(locale as Locale)
    ? (locale as Locale)
    : i18nConfig.defaultLocale;
}

/**
 * `next/link` with the current locale prefixed onto internal hrefs. While the
 * 3D home is on screen, a link to a light page lands there instead.
 */
export function LocaleLink({
  href,
  onClick,
  ...rest
}: React.ComponentProps<typeof Link> & { href: string }) {
  const locale = useLocale();
  const to = localeHref(locale, href);

  return (
    <Link
      href={to}
      transitionTypes={[CROSSFADE]}
      onClick={(e) => {
        onClick?.(e);
        const land = currentLander();
        if (
          !land ||
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          rest.target === "_blank" ||
          !isLightRoute(href)
        ) {
          return;
        }
        e.preventDefault();
        land(to);
      }}
      {...rest}
    />
  );
}
