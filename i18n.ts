import { createInstance, type i18n, type Resource } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import resourcesToBackend from "i18next-resources-to-backend";

import i18nConfig, { type Locale } from "./i18nConfig";

/**
 * Loaded together at the root layout. The site is one WebGL scene with the
 * stations, the dock and the console all mounted at once, so a per-route split
 * would only mean the same JSON arriving in more requests.
 */
export const NAMESPACES = [
  "common",
  "stations",
  "projects",
  "careers",
  "console",
  // The header's Team drawer lists each person's role from here.
  "about",
];

/**
 * One i18next instance per render. The singleton that i18next ships with is a
 * process-wide object, and a process here serves three languages at once —
 * whoever renders last would decide what the previous request said.
 *
 * Server components call this directly. Client components get the same strings
 * through `TranslationsProvider`, which is handed the `resources` returned here
 * so the browser re-initialises from what the server already loaded instead of
 * fetching the JSON a second time.
 *
 * The import path is a relative template on purpose: bundlers read it statically
 * to decide which files to emit, and a `@/`-aliased template is not something
 * they resolve reliably.
 */
export async function initTranslations(
  locale: Locale | string,
  namespaces: string[],
  instance?: i18n,
  resources?: Resource,
) {
  const i18nInstance = instance ?? createInstance();

  i18nInstance.use(initReactI18next);

  if (!resources) {
    i18nInstance.use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`./locales/${language}/${namespace}.json`),
      ),
    );
  }

  await i18nInstance.init({
    lng: locale,
    resources,
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
    // The requested language plus English, not all three. Whatever is loaded
    // here is what gets handed to the browser, and a Czech reader has no use
    // for the Russian dictionary. English rides along as the fallback so a key
    // that has not come back from translation yet reads as a sentence rather
    // than as `stations.guild.lede`.
    preload: resources
      ? []
      : Array.from(new Set([locale, i18nConfig.defaultLocale])),
    interpolation: { escapeValue: false },
  });

  return {
    i18n: i18nInstance,
    resources: i18nInstance.services.resourceStore.data,
    t: i18nInstance.t,
  };
}
