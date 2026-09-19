"use client";

import { useState } from "react";
import { createInstance, type Resource } from "i18next";
import { I18nextProvider } from "react-i18next";

import { initTranslations } from "@/i18n";

/**
 * Hands the server's strings to `useTranslation` in client components.
 *
 * `resources` is the dictionary the server already read off disk, passed down
 * through the tree, so nothing is fetched again on hydration and the first
 * paint in the browser says exactly what the HTML said.
 *
 * The instance is built once in `useState`'s initialiser rather than in an
 * effect: an effect runs after the first render, which is one frame of English
 * on a Czech page.
 */
export function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources,
}: {
  children: React.ReactNode;
  locale: string;
  namespaces: string[];
  resources: Resource;
}) {
  const [instance] = useState(() => {
    const i18n = createInstance();
    // Synchronous because `resources` is already in memory — i18next only goes
    // async when it has a backend to ask, and this call passes none.
    void initTranslations(locale, namespaces, i18n, resources);
    return i18n;
  });

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
