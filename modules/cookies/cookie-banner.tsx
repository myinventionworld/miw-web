"use client";

import { useTranslation } from "react-i18next";

import { useLocale } from "@/modules/i18n";
import { setConsent, useConsent } from "./consent";

import { Alien } from "./alien";
import { ConsoleKey } from "./console-key";
import { StationPanel } from "./station-panel";

export function CookieBanner() {
  const locale = useLocale();
  const { t } = useTranslation("common");
  const consent = useConsent();

  if (consent !== null) return null;

  return (
    <StationPanel
      label={t("cookies.label")}
      channel={t("cookies.channel")}
      station="DOCK-03"
      className="fixed inset-x-4 bottom-4 z-[100] sm:bottom-6 sm:left-auto sm:right-6 sm:w-[25rem]"
      actions={
        <>
          <ConsoleKey
            code="01"
            tone="primary"
            onClick={() => setConsent("accepted", locale)}
          >
            {t("cookies.accept")}
          </ConsoleKey>
          <ConsoleKey code="00" onClick={() => setConsent("declined", locale)}>
            {t("cookies.decline")}
          </ConsoleKey>
        </>
      }
    >
      <div className="flex gap-4">
        <Alien />
        <div className="min-w-0">
          <h2 className="text-lead font-semibold text-white">
            {t("cookies.title")}
          </h2>
          <p className="mt-1.5 text-small leading-relaxed text-platinum">{t("cookies.body")}</p>
        </div>
      </div>
    </StationPanel>
  );
}
