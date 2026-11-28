import Link from "next/link";
import { ViewTransition } from "react";
import { localeHref } from "@/modules/i18n";
import { cn } from "@/shared/lib/cn";
import { CROSSFADE } from "@/shared/lib/landing";
import { Logo } from "@/shared/ui/logo";
import { HEADER } from "./header-frame";
import { NAV, START_HREF, type NavId, type NavLabel } from "./nav";
import { StatusStrip, type StatusText } from "./status-strip";
import { TakeoffLink } from "./takeoff-link";

export interface SiteHeaderText {
  nav: Record<NavLabel, string>;
  start: string;
  startShort: string;
  logoAria: string;
  status: StatusText;
}

export function siteHeaderText(t: (key: string) => string): SiteHeaderText {
  return {
    nav: {
      services: t("nav.services"),
      products: t("nav.products"),
      team: t("nav.team"),
      contact: t("nav.contact"),
      work: t("nav.work"),
      aboutUs: t("nav.aboutUs"),
    },
    start: t("nav.bookCall"),
    startShort: t("nav.contact"),
    logoAria: t("brand.deckAria"),
    status: {
      prefix: t("availability.prefix"),
      status: t("availability.status"),
      scope: t("availability.scope"),
    },
  };
}

/** `-top-8` is minus the strip's height: the strip scrolls away and the row stays. */
export function SiteHeader({
  locale,
  text,
  active,
  onHome = false,
}: {
  locale: string;
  text: SiteHeaderText;
  active?: NavId;
  onHome?: boolean;
}) {
  const href = (to: string) =>
    onHome && to.startsWith("/#") ? to.slice(1) : localeHref(locale, to);
  const flies = (to: string) => !onHome && (to === "/" || to.startsWith("/#"));
  const go = (to: string, props: Omit<React.ComponentProps<typeof Link>, "href">) =>
    flies(to) ? (
      <TakeoffLink href={href(to)} back={to === "/"} {...props} />
    ) : (
      <Link href={href(to)} transitionTypes={[CROSSFADE]} {...props} />
    );
  const item = (entry: (typeof NAV)[number]) =>
    go(entry.href, {
      key: entry.id,
      "aria-current": active === entry.id ? "page" : undefined,
      className: cn(HEADER.item, active === entry.id ? HEADER.current : HEADER.idle),
      children: text.nav[entry.label],
    });

  return (
    <ViewTransition name="site-header" share="site-header" default="none">
      <header className={cn("sticky -top-8 z-40", HEADER.bar)}>
        <StatusStrip text={text.status} />
        <div className={HEADER.row}>
          {go("/", { className: HEADER.logo, "aria-label": text.logoAria, children: <Logo /> })}

          <nav className={HEADER.nav}>{NAV.filter((e) => e.flight).map(item)}</nav>

          <div className={HEADER.end}>
            {NAV.filter((e) => !e.flight).map(item)}
            {go(START_HREF, {
              className: HEADER.pill,
              children: (
                <>
                  <span className="hidden sm:inline">{text.start}</span>
                  <span className="sm:hidden">{text.startShort}</span>
                </>
              ),
            })}
          </div>
        </div>
      </header>
    </ViewTransition>
  );
}
