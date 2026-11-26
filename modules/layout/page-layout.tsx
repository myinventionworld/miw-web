import { locale as currentLocale } from "next/root-params";
import { type ReactNode, ViewTransition } from "react";
import { PAGE_TRANSITION } from "@/shared/lib/landing";
import { initTranslations } from "@/modules/i18n";
import { BigFooter } from "./big-footer";
import { SiteHeader } from "./site-header";

/**
 * Chrome for the 2D routes.
 *
 * Deliberately not the flight deck: no WebGL, no smooth-scroll hijack, no
 * fixed viewport. Someone who followed a link to read about a system wants
 * typography and a scrollbar that behaves, and a case study rendered behind a
 * camera flight is a case study nobody finishes.
 */
export async function PageLayout({
  children,
  active,
  bleed = false,
}: {
  children: ReactNode;
  active?: "work" | "about";
  /** Full-width sections that set their own frame (About, Work). Without it
   *  the page sits in the reading column (case studies). */
  bleed?: boolean;
}) {
  const locale = await currentLocale();
  const { t } = await initTranslations(locale, ["common"]);

  return (
    <ViewTransition {...PAGE_TRANSITION.light} default="none">
      <div className="theme-light min-h-screen bg-void">
        <SiteHeader
          locale={locale}
          active={active}
          text={{
            nav: {
              services: t("nav.services"),
              work: t("nav.work"),
              about: t("nav.about"),
              contact: t("nav.contact"),
            },
            start: t("nav.bookCall"),
            startShort: t("nav.contact"),
            logoAria: t("brand.deckAria"),
          }}
        />

        {/* Matched to the header's frame at every step, so the wordmark stays on
            the same rule as the body copy it sits above. */}
        {bleed ? (
          <main>{children}</main>
        ) : (
          <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:px-8 md:py-20">
            {children}
          </main>
        )}

        {/* The language switcher lives in the footer rather than the header: the
            header row clears 320px by 3.6px, and a third control up there puts
            every editorial route back into horizontal scroll. */}
        <BigFooter />
      </div>
    </ViewTransition>
  );
}
