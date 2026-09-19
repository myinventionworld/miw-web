"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { localeHref } from "@/lib/locale";
import i18nConfig, { type Locale } from "@/i18nConfig";

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

/** `next/link` with the current locale prefixed onto internal hrefs. */
export function LocaleLink({
  href,
  ...rest
}: React.ComponentProps<typeof Link> & { href: string }) {
  const locale = useLocale();
  return <Link href={localeHref(locale, href)} {...rest} />;
}
