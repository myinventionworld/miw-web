import type { Viewport } from "next";
import { notFound } from "next/navigation";
/**
 * Self-hosted from npm rather than fetched from Google Fonts at build time, for
 * the same reason the translations are committed: a clone has to build without
 * network access, and a font CDN being down should not be able to fail a deploy.
 *
 * Every face carries Cyrillic and Latin Extended, so the Russian and Czech pages
 * render in the same type as the English one. Each package ships one file per
 * script with a `unicode-range`, so a reader only downloads the scripts their
 * page actually uses.
 *
 * - Onest — everything: headlines at 700 with tight tracking, text at 400–600.
 * - JetBrains Mono — code and the product demos only.
 */
import "@fontsource-variable/onest";
import "@fontsource-variable/jetbrains-mono";
import "../globals.css";

import { TranslationsProvider } from "@/components/i18n-provider";
import { LightVeilHost } from "@/components/light-veil";
import { initTranslations, NAMESPACES } from "@/i18n";
import { alternates } from "@/lib/locale";
import i18nConfig, { type Locale } from "@/i18nConfig";

export const viewport: Viewport = {
  themeColor: "#030305",
  colorScheme: "dark",
};

/** Three documents, one per language, all prerendered. */
export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  const { t } = await initTranslations(locale, ["common"]);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates(locale),
  };
}

export default async function RootLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;

  // The proxy only ever writes a supported locale into the path, but the route
  // is public, and without this `/xx` renders the English page under
  // `<html lang="xx">`.
  if (!i18nConfig.locales.includes(locale as Locale)) notFound();

  const { resources } = await initTranslations(locale, NAMESPACES);

  return (
    <html lang={locale} className="antialiased">
      <body className="bg-void font-sans text-white">
        <TranslationsProvider
          locale={locale}
          namespaces={NAMESPACES}
          resources={resources}
        >
          {props.children}
          <LightVeilHost />
        </TranslationsProvider>
      </body>
    </html>
  );
}
