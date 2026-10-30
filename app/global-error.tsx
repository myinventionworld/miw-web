"use client";

import "@fontsource-variable/onest";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { ErrorScreen } from "@/modules/shell";
import cs from "@/locales/cs/common.json";
import en from "@/locales/en/common.json";
import ru from "@/locales/ru/common.json";

const COMMON = { en, ru, cs };

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale && params.locale in COMMON ? (params.locale as keyof typeof COMMON) : "en";
  const common = COMMON[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="bg-void font-sans text-white">
        <title>{`${common.error.title} · MIW`}</title>
        <ErrorScreen
          locale={locale}
          retry={retry}
          text={{
            label: common.error.label,
            title: common.error.title,
            body: common.error.body,
            retry: common.error.retry,
            back: common.footer.back,
            homeAria: common.brand.logoAria,
          }}
        />
      </body>
    </html>
  );
}
