"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ErrorScreen } from "@/components/editorial/error-screen";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const { t, i18n } = useTranslation("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      locale={i18n.language}
      retry={retry}
      text={{
        label: t("error.label"),
        title: t("error.title"),
        body: t("error.body"),
        retry: t("error.retry"),
        back: t("footer.back"),
        homeAria: t("brand.logoAria"),
      }}
    />
  );
}
