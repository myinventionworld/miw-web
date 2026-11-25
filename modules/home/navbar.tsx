"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/modules/i18n";
import { HEADER, LocaleSwitch, NAV, navForSection, type NavId } from "@/modules/layout";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { cn } from "@/shared/lib/cn";
import { Bars, Cross } from "@/shared/ui/glyph";
import { Logo } from "@/shared/ui/logo";
import type { StationId } from "@/shared/station-id";

import { sectionAt } from "./flight";

const ROW =
  "-mx-3 flex w-[calc(100%+1.5rem)] items-center border-b border-white/10 px-3 py-4 text-left text-copy font-medium text-white transition-colors last:border-0 hover:bg-white/8";

export function Navbar({
  progress,
  onNavigate,
  onLaunch,
}: {
  progress: MotionValue<number>;
  onNavigate: (id: StationId) => void;
  onLaunch: () => void;
}) {
  const { t } = useTranslation("common");
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<NavId | null>(null);
  const [mobile, setMobile] = useState(false);
  const [section, setSection] = useState(() => sectionAt(progress.get()));
  useMotionValueEvent(progress, "change", (p) => setSection(sectionAt(p)));
  const active = navForSection(section);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fly: Partial<Record<NavId, () => void>> = {
    services: () => onNavigate("backend"),
    contact: onLaunch,
  };

  const item = (id: NavId, href: string, className: string, inner: ReactNode) => {
    const go = fly[id];
    const close = () => setMobile(false);
    const props = {
      className,
      "aria-current": active === id ? ("page" as const) : undefined,
      onMouseEnter: () => setHovered(id),
      onFocus: () => setHovered(id),
    };
    return go ? (
      <button
        key={id}
        type="button"
        onClick={() => {
          close();
          go();
        }}
        {...props}
      >
        {inner}
      </button>
    ) : (
      <LocaleLink key={id} href={href} onClick={close} {...props}>
        {inner}
      </LocaleLink>
    );
  };

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50", HEADER.bar)}>
      <div className={HEADER.row}>
        <button
          type="button"
          onClick={() => {
            setMobile(false);
            onNavigate("backend");
          }}
          className={HEADER.logo}
          aria-label={t("brand.logoAria")}
        >
          <Logo />
        </button>

        <nav
          className={cn(HEADER.nav, "hidden lg:flex")}
          onMouseLeave={() => setHovered(null)}
          onBlur={() => setHovered(null)}
        >
          {NAV.map(({ id, href }) =>
            item(
              id,
              href,
              cn(
                HEADER.item,
                "relative",
                active === id ? HEADER.current : "text-zinc transition-colors hover:text-white",
              ),
              <>
                {hovered === id && active !== id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-md bg-space-800"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }
                    }
                  />
                )}
                <span className="relative">{t(`nav.${id}`)}</span>
              </>,
            ),
          )}
        </nav>

        <div className={HEADER.end}>
          <LocaleSwitch className={HEADER.langs} />
          <button
            type="button"
            onClick={() => {
              setMobile(false);
              onLaunch();
            }}
            className={cn(HEADER.pill, "hidden sm:flex")}
          >
            {t("nav.bookCall")}
          </button>

          <button
            type="button"
            onClick={() => setMobile((v) => !v)}
            aria-label={t("nav.menu")}
            aria-expanded={mobile}
            className="flex size-9 items-center justify-center rounded-md border border-white/15 text-white transition-colors hover:border-white/40 hover:bg-white/10 lg:hidden"
          >
            {mobile ? <Cross className="text-copy-lg" /> : <Bars className="text-copy-lg" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="drawer absolute inset-x-0 top-full lg:hidden"
          >
            <div className="px-5 py-5">
              {NAV.map(({ id, href }) => item(id, href, ROW, t(`nav.${id}`)))}

              <LocaleSwitch className="mt-4" />

              <button
                type="button"
                onClick={() => {
                  setMobile(false);
                  onLaunch();
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-action px-4 py-3 text-body font-semibold text-on-action transition-colors hover:bg-action-hover"
              >
                {t("nav.bookCall")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
