"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useLocale } from "@/components/locale-link";
import { swapLocale } from "@/lib/locale";
import i18nConfig, { LOCALE_NAMES, type Locale } from "@/i18nConfig";
import { cn } from "@/lib/utils";

/**
 * Three links, not a dropdown. With three options a select costs a tap to open
 * and hides two of them behind it, and — more to the point — a `<select>` cannot
 * be a link, so the choice would have to be a client-side navigation that a
 * reader cannot middle-click, bookmark or hand to a colleague.
 *
 * Each one points at the same page in another language, so switching on a case
 * study keeps you on that case study. The `NEXT_LOCALE` cookie follows, which is
 * what `next-i18n-router` reads when somebody later arrives at a bare `/` — the
 * choice made here is the one an unprefixed URL should honour.
 */
export function LocaleSwitch({ className }: { className?: string }) {
  const active = useLocale();
  const pathname = usePathname();
  const { t } = useTranslation("common");

  return (
    <nav
      aria-label={t("nav.language")}
      className={cn("flex items-center gap-1", className)}
    >
      {i18nConfig.locales.map((locale) => (
        <Link
          key={locale}
          href={swapLocale(pathname, locale as Locale)}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === active ? "true" : undefined}
          onClick={() => {
            // `max-age` rather than a session cookie: the point is to be
            // remembered on the next visit, which is the visit where the reader
            // types the bare domain.
            document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;
          }}
          // Bare 10px text measured 13px tall. `py-2` against the cancelled
          // margin lifts each one over the 24px floor without moving the row.
          className={cn(
            "-my-2 rounded-md px-1.5 py-2 font-mono text-[10px] tracking-telemetry uppercase transition-colors",
            locale === active
              ? "text-white"
              : "text-steel hover:text-white",
          )}
        >
          <span className="sr-only">{LOCALE_NAMES[locale as Locale]}</span>
          <span aria-hidden>{locale}</span>
        </Link>
      ))}
    </nav>
  );
}
