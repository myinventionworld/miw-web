"use client";

import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CONTACT_EMAIL } from "@/modules/contact";
import { LocaleLink } from "@/modules/language";
import { cn } from "@/shared/lib/cn";

/** Same tap-target trick as the page shell header: padding, cancelled margin. */
const LINK = "-my-2 rounded-md py-2 transition-colors hover:text-white";

/**
 * The line every page ends on: who runs the site, the legal pages, and where
 * to write.
 *
 * One component for the three places it sits — the end of the flight deck,
 * the flat page and the editorial routes — so a legal link cannot go missing
 * from one version of the site. A new legal page gets its link in the `nav`
 * here and nowhere else. Each caller sets the frame and the rule
 * (`frame`, `className`); the colours come from whichever theme it sits in.
 * `children` go at the end of the row, for what only that page needs.
 */
export function SiteFooter({
  className,
  frame,
  children,
  ...rest
}: ComponentProps<"footer"> & { frame?: string; children?: ReactNode }) {
  const { t } = useTranslation("common");

  return (
    <footer className={className} {...rest}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-meta text-zinc",
          frame,
        )}
      >
        {/* The year is read in the browser too; a page prerendered on 31
            December and hydrated on 1 January keeps the server's year rather
            than warning about it. */}
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} {t("brand.tagline")}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <nav
            aria-label={t("footer.legal")}
            className="flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <LocaleLink href="/terms" className={LINK}>
              {t("footer.terms")}
            </LocaleLink>
          </nav>
          <a href={`mailto:${CONTACT_EMAIL}`} className={cn(LINK, "break-all")}>
            {CONTACT_EMAIL}
          </a>
          {children}
        </div>
      </div>
    </footer>
  );
}
