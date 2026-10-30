import type { Config } from "next-i18n-router/dist/types";

/**
 * Read by `proxy.ts` for routing and by `translations.ts` for the i18next instance, so
 * adding a language is one edit here plus a folder under `locales/`.
 *
 * `prefixDefault` is on: English lives at `/en` like the other two rather than
 * at the bare root. It costs one redirect on the first visit and buys a URL
 * space where every page has exactly one address per language — with the
 * default unprefixed, `/work` and `/en/work` are the same page at two URLs and
 * the canonical tag becomes the only thing holding search results together.
 */
const i18nConfig = {
  locales: ["en", "ru", "cs"],
  defaultLocale: "en",
  prefixDefault: true,
  // The cookie is written client-side, and only after the reader accepts it.
  serverSetCookie: "never",
} satisfies Config;

export type Locale = (typeof i18nConfig.locales)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  cs: "Čeština",
};

export default i18nConfig;
