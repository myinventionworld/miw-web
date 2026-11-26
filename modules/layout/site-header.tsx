import Link from "next/link";
import { ViewTransition } from "react";
import { localeHref } from "@/modules/i18n";
import { cn } from "@/shared/lib/cn";
import { CROSSFADE } from "@/shared/lib/landing";
import { Logo } from "@/shared/ui/logo";
import { HEADER } from "./header-frame";
import { LocaleSwitch } from "./locale-switch";
import { NAV, START_HREF, type NavId } from "./nav";

export interface SiteHeaderText {
  nav: Record<NavId, string>;
  start: string;
  startShort: string;
  logoAria: string;
}

/**
 * Below `md` the row is the logo, Work, About and the pill, which is what
 * clears 320px; Services and Contact come back where there is room, and the
 * languages from `lg`.
 */
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
  const go = (to: string, props: Omit<React.ComponentProps<typeof Link>, "href">) => (
    <Link href={href(to)} transitionTypes={[CROSSFADE]} {...props} />
  );

  return (
    <ViewTransition name="site-header" share="site-header" default="none">
      <header className={cn("sticky top-0 z-40", HEADER.bar)}>
        <div className={HEADER.row}>
          {go("/", { className: HEADER.logo, "aria-label": text.logoAria, children: <Logo /> })}

          <nav className={HEADER.nav}>
            {NAV.map((item) =>
              go(item.href, {
                key: item.id,
                "aria-current": active === item.id ? "page" : undefined,
                className: cn(
                  HEADER.item,
                  (item.id === "services" || item.id === "contact") && "hidden md:block",
                  active === item.id ? HEADER.current : HEADER.idle,
                ),
                children: text.nav[item.id],
              }),
            )}
          </nav>

          <div className={HEADER.end}>
            <LocaleSwitch className={HEADER.langs} />
            {go(START_HREF, {
              className: cn(HEADER.pill, "ml-1 sm:ml-2 lg:ml-0"),
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
