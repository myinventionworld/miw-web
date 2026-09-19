import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

import { TranslationsProvider } from "@/components/i18n-provider";
import { initTranslations, NAMESPACES } from "@/i18n";
import { alternates } from "@/lib/locale";
import i18nConfig, { type Locale } from "@/i18nConfig";

/**
 * Cyrillic is not optional here — without it the Russian site falls back to
 * whatever the browser has and stops looking like the same product.
 * `latin-ext` covers the Czech diacritics.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

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
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-void font-sans text-white">
        <TranslationsProvider
          locale={locale}
          namespaces={NAMESPACES}
          resources={resources}
        >
          {props.children}
        </TranslationsProvider>
      </body>
    </html>
  );
}
