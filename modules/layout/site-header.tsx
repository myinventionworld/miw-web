import Link from "next/link";
import { localeHref } from "@/modules/i18n";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/logo";
import { NAV, START_HREF, type NavId } from "./nav";

export interface SiteHeaderText {
  nav: Record<NavId, string>;
  start: string;
  startShort: string;
  logoAria: string;
}

/**
 * Below `md` the row is the logo, Work, About and the pill, which is what
 * clears 320px; Services and Contact come back where there is room.
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

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 md:px-8">
        <Link href={href("/")} className="-my-2 py-2" aria-label={text.logoAria}>
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={href(item.href)}
              aria-current={active === item.id ? "page" : undefined}
              className={cn(
                "-my-2 rounded-md px-2 py-2 text-body font-medium",
                (item.id === "services" || item.id === "contact") && "hidden md:block",
                active === item.id
                  ? "bg-space-800 text-white"
                  : "text-zinc transition-colors hover:bg-space-800 hover:text-white",
              )}
            >
              {text.nav[item.id]}
            </Link>
          ))}
          <Link
            href={href(START_HREF)}
            className="flex items-center rounded-full bg-action px-3 py-2 text-small font-semibold text-on-action transition-colors hover:bg-action-hover sm:ml-2 sm:px-3.5"
          >
            <span className="hidden sm:inline">{text.start}</span>
            <span className="sm:hidden">{text.startShort}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
