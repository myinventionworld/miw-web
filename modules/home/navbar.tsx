"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/modules/i18n";
import {
  HEADER,
  NAV,
  StatusStrip,
  navForSection,
  type NavId,
} from "@/modules/layout";
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
import type { Section } from "@/shared/lib/landing";

import { sectionAt } from "./flight";
import { DRAWERS, NavDrawer, type DrawerId } from "./nav-drawer";

const isDrawer = (id: NavId): id is DrawerId =>
  (DRAWERS as readonly string[]).includes(id);

const ROW =
  "-mx-3 flex w-[calc(100%+1.5rem)] items-center border-b border-white/10 px-3 py-4 text-left text-copy font-medium text-white transition-colors last:border-0 hover:bg-white/8";

export function Navbar({
  className,
  progress,
  onFly,
}: {
  className?: string;
  progress: MotionValue<number>;
  /** Null flies back to the hero. */
  onFly: (to: Section | null) => void;
}) {
  const { t } = useTranslation("common");
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<NavId | null>(null);
  const [open, setOpen] = useState<DrawerId | null>(null);
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [section, setSection] = useState(() => sectionAt(progress.get()));
  useMotionValueEvent(progress, "change", (p) => setSection(sectionAt(p)));
  const active = navForSection(section);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMobile(false);
      setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const hold = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  // A grace period, or the drawer shuts while the pointer crosses into it.
  const release = () => {
    hold();
    closeTimer.current = setTimeout(() => {
      setOpen(null);
      setHovered(null);
    }, 140);
  };
  const dismiss = () => {
    hold();
    setOpen(null);
    setHovered(null);
    setMobile(false);
  };
  const point = (id: NavId) => {
    hold();
    setHovered(id);
    setOpen(isDrawer(id) ? id : null);
  };

  const fly: Partial<Record<NavId, () => void>> = {
    services: () => onFly("backend"),
    products: () => onFly("labs"),
    team: () => onFly("team"),
    contact: () => onFly("transmission"),
  };

  const item = (
    id: NavId,
    href: string,
    className: string,
    inner: ReactNode,
    drawer = false,
  ) => {
    const go = fly[id];
    const props = {
      className,
      "aria-current": active === id ? ("page" as const) : undefined,
      onMouseEnter: () => (drawer ? point(id) : setHovered(id)),
      onFocus: () => (drawer ? point(id) : setHovered(id)),
    };
    return go ? (
      <button
        key={id}
        type="button"
        aria-expanded={drawer && isDrawer(id) ? open === id : undefined}
        aria-controls={
          drawer && isDrawer(id) && open === id ? `drawer-${id}` : undefined
        }
        onClick={() => {
          dismiss();
          go();
        }}
        {...props}
      >
        {inner}
      </button>
    ) : (
      <LocaleLink key={id} href={href} onClick={dismiss} {...props}>
        {inner}
      </LocaleLink>
    );
  };

  const pointed = hovered ?? open;

  return (
    <>
      <AnimatePresence>
        {open && !mobile && (
          <motion.div
            key="scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-none fixed inset-0 z-40 hidden bg-black/70 lg:block",
              className,
            )}
          />
        )}
      </AnimatePresence>
      <ViewTransition name="site-header" share="site-header" default="none">
        <header
          className={cn("fixed inset-x-0 top-0 z-50", HEADER.bar, className)}
          onMouseEnter={hold}
          onMouseLeave={release}
        >
          <StatusStrip
            text={{
              prefix: t("availability.prefix"),
              status: t("availability.status"),
              scope: t("availability.scope"),
            }}
          />
          <div className={HEADER.row}>
            <button
              type="button"
              onClick={() => {
                dismiss();
                onFly(null);
              }}
              className={HEADER.logo}
              aria-label={t("brand.logoAria")}
            >
              <Logo />
            </button>

            <nav className={HEADER.nav} onMouseLeave={() => setHovered(null)}>
              {NAV.filter((e) => e.flight).map(({ id, href, label }) =>
                item(
                  id,
                  href,
                  cn(
                    HEADER.item,
                    "relative",
                    active === id
                      ? HEADER.current
                      : "text-zinc transition-colors hover:text-white",
                  ),
                  <>
                    {pointed === id && active !== id && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-md bg-space-800"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 420,
                                damping: 34,
                                mass: 0.7,
                              }
                        }
                      />
                    )}
                    <span className="relative">{t(`nav.${label}`)}</span>
                  </>,
                  true,
                ),
              )}
            </nav>

            <div className={HEADER.end}>
              {NAV.filter((e) => !e.flight).map(({ id, href, label }) =>
                item(id, href, cn(HEADER.item, HEADER.idle), t(`nav.${label}`)),
              )}
              <button
                type="button"
                  onClick={() => {
                  dismiss();
                  onFly("transmission");
                }}
                className={HEADER.pill}
              >
                <span className="hidden sm:inline">{t("nav.bookCall")}</span>
                <span className="sm:hidden">{t("nav.contact")}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobile((v) => !v)}
                aria-label={t("nav.menu")}
                aria-expanded={mobile}
                className="ml-1 flex size-9 shrink-0 items-center justify-center rounded-md border border-white/15 text-white transition-colors hover:border-white/40 hover:bg-white/10 lg:hidden"
              >
                {mobile ? (
                  <Cross className="text-copy-lg" />
                ) : (
                  <Bars className="text-copy-lg" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open && !mobile && (
              <NavDrawer
                key={open}
                id={open}
                onFly={(to) => {
                  dismiss();
                  onFly(to);
                }}
                onDismiss={dismiss}
              />
            )}
          </AnimatePresence>

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
                  {NAV.map(({ id, href, label }) =>
                    item(id, href, ROW, t(`nav.${label}`)),
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMobile(false);
                      onFly("transmission");
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
      </ViewTransition>
    </>
  );
}
