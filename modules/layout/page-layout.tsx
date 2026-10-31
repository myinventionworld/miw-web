import Link from "next/link";
import { locale as currentLocale } from "next/root-params";
import type { ReactNode } from "react";
import { initTranslations } from "@/modules/i18n";
import { localeHref } from "@/modules/i18n";
import { cn } from "@/shared/lib/cn";
import { BigFooter } from "./big-footer";

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

  /**
   * The padding is the tap target, not decoration. Bare 13px anchors measured
   * 20px tall, under the 24px WCAG 2.5.8 floor — and these two links are the
   * only site navigation a phone gets on these routes.
   *
   * Vertical growth is free: `-my-2` pulls the margin box back to the height the
   * text had, so a 36px hit area opens inside a 56px row that was mostly dead
   * space anyway and nothing moves. Horizontal growth is not free, so the `gap`
   * on the nav below pays for it — 8px of padding a side against `gap-2` is the
   * same 24px of visible separation the old `gap-6` drew between bare text.
   */
  const link = (href: string, label: string, id: "work" | "about") => (
    <Link
      href={localeHref(locale, href)}
      className={cn(
        "-my-2 rounded-md px-2 py-2 text-body font-medium",
        active === id
          ? "text-white"
          : "text-zinc transition-colors hover:bg-white/8 hover:text-white",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="theme-light min-h-screen bg-void">
      <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
        {/* 320px is a real screen — an iPhone SE, and most budget Androids in
            the accessibility zoom levels people actually use. This row used to
            come to 338px against it, so every editorial route scrolled
            sideways: the one class of page whose entire job is to be read.

            The fix is spent where it costs nothing to read: the frame loses
            padding, the row loses gap, and the wordmark loses letter-spacing it
            only ever had for the flight deck's benefit. The type scale is
            untouched, because shrinking text to fit a phone is how a page ends
            up unreadable on the device it was supposedly fixed for. */}
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 md:px-8">
          <Link
            href={localeHref(locale, "/")}
            className="group -my-2 flex items-center gap-2.5 py-2"
            aria-label={t("brand.deckAria")}
          >
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-white/35" />
              <span className="absolute size-1 rounded-full bg-white transition-transform duration-500 group-hover:-translate-x-[5px]" />
            </span>
            <span className="text-body font-semibold tracking-[0.2em] text-white sm:tracking-[0.36em]">
              MIW
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {link("/work", t("nav.work"), "work")}
            {link("/about", t("nav.about"), "about")}
            <Link
              href={localeHref(locale, "/#transmission")}
              className="flex items-center gap-1.5 rounded-full bg-action px-3 py-2 text-small font-semibold text-on-action transition-colors hover:bg-action-hover sm:ml-2 sm:px-3.5"
            >
              <span className="hidden sm:inline">{t("nav.bookCall")}</span>
              <span className="sm:hidden">{t("nav.contact")}</span>
            </Link>
          </nav>
        </div>
      </header>

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
  );
}
