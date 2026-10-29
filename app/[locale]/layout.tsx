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
import { CONTACT_EMAIL } from "@/lib/contact";
import { alternates } from "@/lib/locale";
import { siteUrl } from "@/lib/site";
import i18nConfig, { type Locale } from "@/i18nConfig";

/** Open Graph wants a region with the language. */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  ru: "ru_RU",
  cs: "cs_CZ",
};

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

  // Only what every page shares. Each page keeps its own title and
  // description, and Open Graph and Twitter take theirs from those; the share
  // image is the `opengraph-image` file next to this layout.
  return {
    metadataBase: new URL(siteUrl()),
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates(locale),
    openGraph: {
      type: "website",
      siteName: "MIW Labs",
      locale: OG_LOCALE[locale as Locale] ?? OG_LOCALE.en,
      alternateLocale: i18nConfig.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
    },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * Who publishes the site, for search engines: schema.org Organization. `<`
 * is escaped so nothing in the strings can close the script tag.
 */
function organizationJsonLd(description: string) {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MIW Labs",
    url: `${base}/`,
    logo: `${base}/logo.png`,
    email: CONTACT_EMAIL,
    description,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Prague",
      addressCountry: "CZ",
    },
    sameAs: ["https://github.com/myinventionworld"],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function RootLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;

  // The proxy only ever writes a supported locale into the path, but the route
  // is public, and without this `/xx` renders the English page under
  // `<html lang="xx">`.
  if (!i18nConfig.locales.includes(locale as Locale)) notFound();

  const { resources, t } = await initTranslations(locale, NAMESPACES);

  return (
    <html lang={locale} className="antialiased">
      <body className="bg-void font-sans text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: organizationJsonLd(t("meta.description")),
          }}
        />
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
