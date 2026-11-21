"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/modules/i18n";
import { LocaleSwitch, NAV, type NavId } from "@/modules/layout";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bars, Cross } from "@/shared/ui/glyph";
import { Logo } from "@/shared/ui/logo";
import type { StationId } from "@/shared/station-id";

const TAB =
  "relative rounded-md px-4 py-2 text-body font-medium text-platinum transition-colors hover:text-white focus:text-white";

const ROW =
  "-mx-3 flex w-[calc(100%+1.5rem)] items-center border-b border-white/10 px-3 py-4 text-left text-copy font-medium text-white transition-colors last:border-0 hover:bg-white/8";

export function Navbar({
  onNavigate,
  onLaunch,
}: {
  onNavigate: (id: StationId) => void;
  onLaunch: () => void;
}) {
  const { t } = useTranslation("common");
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<NavId | null>(null);
  const [mobile, setMobile] = useState(false);

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
    const hover = {
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
        className={className}
        {...hover}
      >
        {inner}
      </button>
    ) : (
      <LocaleLink key={id} href={href} onClick={close} className={className} {...hover}>
        {inner}
      </LocaleLink>
    );
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 to-transparent" />

        <div className="relative border-b border-white/10 bg-black/45 backdrop-blur">
          <div className="mx-auto flex h-8 max-w-[1400px] items-center justify-between gap-4 px-5 md:px-8">
            <p className="flex min-w-0 items-center gap-2 text-meta text-platinum">
              <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-signal" />
              <span className="truncate">
                {t("availability.prefix")}: {t("availability.status")}
                <span className="hidden text-steel md:inline">
                  {" // "}
                  {t("availability.scope")}
                </span>
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <LocaleSwitch />
            </div>
          </div>
        </div>

        <nav className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
          <button
            type="button"
            onClick={() => {
              setMobile(false);
              onNavigate("backend");
            }}
            className="-my-2 py-2"
            aria-label={t("brand.logoAria")}
          >
            <Logo />
          </button>

          <div
            className="absolute left-1/2 hidden -translate-x-1/2 items-center lg:flex"
            onMouseLeave={() => setHovered(null)}
            onBlur={() => setHovered(null)}
          >
            {NAV.map(({ id, href }) =>
              item(
                id,
                href,
                TAB,
                <>
                  {hovered === id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md bg-white/12"
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
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMobile(false);
                onLaunch();
              }}
              className="hidden items-center gap-2 rounded-full bg-action px-4 py-2 text-small font-semibold text-on-action transition-colors hover:bg-action-hover sm:flex"
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
        </nav>

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
    </div>
  );
}
