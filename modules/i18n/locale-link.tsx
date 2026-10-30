"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { isLightRoute, veilIntoLight } from "./light-veil";

import { localeHref } from "./locale";
import i18nConfig, { type Locale } from "./config";

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
 * `next/link` with the current locale prefixed onto internal hrefs.
 *
 * From the dark 3D home, a link to one of the light pages opens through a
 * white reveal (`light-veil.tsx`) instead of a hard cut.
 */
export function LocaleLink({
  href,
  onClick,
  ...rest
}: React.ComponentProps<typeof Link> & { href: string }) {
  const locale = useLocale();
  const router = useRouter();
  const to = localeHref(locale, href);

  return (
    <Link
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (
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
        veilIntoLight(e.clientX, e.clientY).then(() => router.push(to));
      }}
      {...rest}
    />
  );
}
