"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/modules/i18n";
import { LocaleSwitch } from "@/modules/layout";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bars, Caret, Cross } from "@/shared/ui/glyph";

import {
  projectsForStations,
  type ProjectCase,
  ScreenCycle,
  THUMBS,
  STATUS_TONE,
} from "@/modules/work";
import { TEAM, initials } from "@/modules/team";
import { CONTACT_EMAIL } from "@/modules/contact";
import { productFocus } from "./product-focus";
import {
  NAV_SECTIONS,
  hasDrawer,
  stationById,
  type NavSection,
  type ProgramPoint,
} from "./stations";
import { cn } from "@/shared/lib/cn";
import type { StationId } from "@/shared/station-id";

/* ── generative thumbnails ────────────────────────────────────────────── */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Deterministic diagram per project. Shipping real thumbnails would mean
 * shipping real screenshots; an abstract that is actually derived from the
 * project's identity is more honest than a stock gradient.
 */
function ProjectThumb({ station, code }: { station: StationId; code: string }) {
  const seed = hash(code);
  // Mixed rather than bit-shifted. `seed >> (i * 3)` runs out of bits by the
  // seventh sample and every project collapses onto the same diagram.
  const rnd = (i: number) => {
    const x = Math.sin(seed * 0.0001 + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  return (
    <svg
      viewBox="0 0 160 96"
      className="h-full w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      <rect width="160" height="96" fill="#09090b" />

      {station === "backend" &&
        (() => {
          // Positions resolved first so the edges land on the nodes. Drawing
          // each edge back to an un-jittered grid slot left every project with
          // the same skeleton and only the dots moving.
          const nodes = Array.from({ length: 7 }, (_, i) => ({
            x: 16 + (i % 4) * 42 + rnd(i) * 16,
            y: 18 + Math.floor(i / 4) * 36 + rnd(i + 7) * 20,
          }));
          return (
            <>
              {nodes.slice(1).map((n, i) => (
                <line
                  key={`e${i}`}
                  x1={n.x}
                  y1={n.y}
                  x2={nodes[i].x}
                  y2={nodes[i].y}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="0.8"
                />
              ))}
              {nodes.map((n, i) => (
                <circle
                  key={i}
                  cx={n.x}
                  cy={n.y}
                  r={2.6}
                  fill="#9db4ff"
                  opacity={0.85}
                />
              ))}
            </>
          );
        })()}

      {station === "commerce" &&
        Array.from({ length: 14 }, (_, i) => {
          const h = 8 + rnd(i) * 62;
          return (
            <rect
              key={i}
              x={10 + i * 10.5}
              y={86 - h}
              width="6"
              height={h}
              fill="#9db4ff"
              opacity={0.35 + rnd(i + 2) * 0.55}
            />
          );
        })}

      {station === "labs" &&
        Array.from({ length: 5 }, (_, i) => (
          <ellipse
            key={i}
            cx="80"
            cy="48"
            rx={14 + i * 13}
            ry={5 + i * 4.4}
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.7"
            opacity={1 - i * 0.16}
          />
        ))}

      {station === "guild" && (
        <>
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="8"
              y1={14 + i * 14}
              x2="152"
              y2={14 + i * 14}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.6"
            />
          ))}
          <rect
            x={18 + rnd(1) * 40}
            y={20 + rnd(2) * 30}
            width={48}
            height={28}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="1.1"
          />
        </>
      )}
    </svg>
  );
}

/* ── mode toggle ──────────────────────────────────────────────────────── */


/* ── mega drawer ──────────────────────────────────────────────────────── */

/**
 * Every card in here is a system that exists and a case study that is written,
 * so every card is a link. The old drawer had sixteen entries, twelve of which
 * were codenames with nothing behind them and a button that just flew the
 * camera somewhere — a menu of names is not a portfolio.
 */
function ProjectCard({
  project,
  onDismiss,
}: {
  project: ProjectCase;
  onDismiss: () => void;
}) {
  const { t } = useTranslation(["projects", "common"]);

  return (
    <LocaleLink
      href={`/work/${project.slug}`}
      onClick={() => {
        productFocus.slug = null;
        onDismiss();
      }}
      // Brightens this product's moon and orbit in the 3D scene.
      onMouseEnter={() => (productFocus.slug = project.slug)}
      onMouseLeave={() => (productFocus.slug = null)}
      onFocus={() => (productFocus.slug = project.slug)}
      onBlur={() => (productFocus.slug = null)}
      className="group block w-full text-left focus:outline-none"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/12 transition-colors group-hover:border-white/35 group-focus-visible:border-white">
        {THUMBS[project.slug] ? (
          <ScreenCycle frames={THUMBS[project.slug]} />
        ) : (
          <ProjectThumb station={project.station} code={project.codename} />
        )}
        <span
          className={cn(
            "absolute top-2 left-2 rounded-full border bg-black/70 px-2 py-0.5 text-meta font-medium backdrop-blur",
            STATUS_TONE[project.status],
          )}
        >
          {t(`status.${project.status}`)}
        </span>
        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full border border-white/25 bg-black/75 px-2 py-0.5 text-meta font-medium text-white backdrop-blur">
          {t("common:project.caseStudy")}
        </span>
      </div>

      <div className="mt-3 text-copy font-semibold tracking-[-0.01em] text-white">
        {project.name}
      </div>

      <p className="mt-1.5 text-small leading-relaxed text-platinum/80">
        {t(`${project.id}.pitch`)}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {project.stack.map((name) => (
          <span
            key={name}
            className="rounded-full border border-white/15 px-2 py-0.5 text-meta text-zinc"
          >
            {name}
          </span>
        ))}
      </div>
    </LocaleLink>
  );
}

const PILL =
  "flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-small font-medium text-white transition-colors hover:border-white/80 hover:bg-white/10";
const PILL_SOLID =
  "flex items-center gap-2 rounded-full bg-action px-4 py-2 text-small font-semibold text-on-action transition-colors hover:bg-action-hover";

/**
 * What every drawer shares: the section's one line on the left, where to go
 * from here on the right, and the body underneath.
 */
function Drawer({
  blurb,
  actions,
  children,
}: {
  blurb: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -12 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="drawer absolute inset-x-0 top-full"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-9 md:px-10 md:py-11">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
              {blurb}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function MegaDrawer({
  section,
  onNavigate,
  onDismiss,
}: {
  section: NavSection;
  onNavigate: (id: StationId) => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation("stations");
  const stations = section.stations.map(stationById);
  const projects = projectsForStations(section.stations);

  return (
    <Drawer
      blurb={t(`sections.${section.id}.blurb`)}
      actions={stations.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onNavigate(s.id)}
          className={PILL}
        >
          {t(`${s.id}.nav`)}
        </button>
      ))}
    >
      {projects.length > 0 ? (
        // Two or three real systems, not sixteen placeholders, so the grid
        // tops out at three columns. At four they sat in a row with a column
        // of dead space after them, which read as a portfolio with holes.
        <div className="grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDismiss={onDismiss} />
          ))}
        </div>
      ) : (
        /* The Guild sells a way of working and has no artifact to open, so
           its drawer shows the terms instead of pretending to a catalogue. */
        <dl className="grid gap-x-7 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {stations
            .flatMap((s) =>
              s.program
                ? (t(`${s.id}.program`, {
                    returnObjects: true,
                  }) as ProgramPoint[])
                : [],
            )
            .map((p) => (
              <div key={p.label} className="border-t border-white/12 pt-3">
                <dt className="text-body font-semibold text-white">
                  {p.label}
                </dt>
                <dd className="mt-1.5 text-small leading-relaxed text-platinum/80">
                  {p.body}
                </dd>
              </div>
            ))}
        </dl>
      )}
    </Drawer>
  );
}

/**
 * Team: who is behind the work, before anyone has to open a page to find out.
 * Initials until there is a real portrait, the same as on About.
 */
function TeamDrawer({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation(["stations", "about"]);

  return (
    <Drawer
      blurb={t("sections.guild.blurb")}
      actions={
        <LocaleLink href="/about" onClick={onDismiss} className={PILL}>
          {t("guild.cta")}
        </LocaleLink>
      }
    >
      <ul className="grid gap-x-7 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((person) => (
          <li
            key={person.id}
            className="flex items-center gap-3.5 border-t border-white/12 pt-4"
          >
            {person.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photo}
                alt=""
                className="size-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-small font-semibold text-platinum"
              >
                {initials(person.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-body font-semibold text-white">{person.name}</p>
              <p className="mt-0.5 text-meta leading-snug text-zinc">
                {t(`about:team.roles.${person.id}`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}

/**
 * Contact: the three things people look for before they write — where to,
 * whether anyone is taking work, and how soon they will hear back.
 */
function ContactDrawer({ onLaunch }: { onLaunch: () => void }) {
  const { t } = useTranslation(["common", "stations"]);

  return (
    <Drawer
      blurb={t("stations:sections.transmission.blurb")}
      actions={
        <button type="button" onClick={onLaunch} className={PILL_SOLID}>
          {t("nav.bookCall")}
        </button>
      }
    >
      <dl className="grid gap-x-7 gap-y-5 sm:grid-cols-3">
        <div className="border-t border-white/12 pt-4">
          <dt className="text-meta text-zinc">{t("contact.email")}</dt>
          <dd className="mt-1.5">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-copy font-semibold break-all text-white underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </dd>
        </div>
        <div className="border-t border-white/12 pt-4">
          <dt className="text-meta text-zinc">{t("contact.status")}</dt>
          <dd className="mt-1.5 flex items-center gap-2 text-copy font-semibold text-white">
            <span className="size-1.5 shrink-0 rounded-full bg-signal" />
            {t("availability.status")}
          </dd>
          <dd className="mt-1 text-small text-zinc">{t("availability.scope")}</dd>
        </div>
        <div className="border-t border-white/12 pt-4">
          <dt className="text-meta text-zinc">{t("contact.reply")}</dt>
          <dd className="mt-1.5 text-copy font-semibold text-white">
            {t("contact.replyTime")}
          </dd>
          <dd className="mt-1 text-small text-zinc">{t("contact.replyNote")}</dd>
        </div>
      </dl>
    </Drawer>
  );
}

/* ── bar ──────────────────────────────────────────────────────────────── */

export function Navbar({
  onNavigate,
  onLaunch,
}: {
  onNavigate: (id: StationId) => void;
  /** Jumps to the transmission console at the end of the runway. */
  onLaunch: () => void;
}) {
  const { t } = useTranslation(["common", "stations"]);
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = hovered ?? open;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
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
  // A grace period, or the drawer snaps shut while the pointer crosses the gap
  // between the bar and the panel.
  const release = () => {
    hold();
    closeTimer.current = setTimeout(() => {
      setOpen(null);
      setHovered(null);
    }, 140);
  };

  const dismiss = () => {
    setOpen(null);
    setHovered(null);
    setMobile(false);
  };

  const go = (section: NavSection) => {
    dismiss();
    if (section.go === "console") onLaunch();
    else onNavigate(section.go);
  };

  const goStation = (id: StationId) => {
    dismiss();
    onNavigate(id);
  };

  const openSection = NAV_SECTIONS.find((s) => s.id === open && hasDrawer(s));

  return (
    <div
      className="fixed inset-x-0 top-0 z-50"
      onMouseEnter={hold}
      onMouseLeave={release}
    >
      {/* Recedes the page behind the menu. The drawer cannot carry this alone:
          the hero sets 5rem of pure white directly underneath it, and even a
          0.96 panel lets that ghost through. `pointer-events-none` matters —
          a full-viewport child of this container would otherwise count as the
          navbar for hover purposes and the menu would never close. */}
      <AnimatePresence>
        {openSection && !mobile && (
          <motion.div
            key="scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-0 bg-black/80"
          />
        )}
      </AnimatePresence>

      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 to-transparent" />

        {/* Commercial status. The single most-asked question before anyone
            writes a brief is whether the studio is even taking work. */}
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
            {/* The strip, not the nav row below it: that row is already carrying
                two routes, a toggle, a filled button and a burger, and it is the
                row that has to survive a phone. This one holds a single line of
                status text that truncates, so it can give up the width. */}
            <div className="flex shrink-0 items-center gap-3">
              <LocaleSwitch />
            </div>
          </div>
        </div>

        <nav className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
          {/* logo */}
          <button
            type="button"
            onClick={() => goStation("backend")}
            // 19.5px tall as bare type. The row is h-16, so the height is there
            // for the taking and `-my-2` keeps the mark on the same baseline.
            className="group -my-2 flex items-center gap-2.5 py-2"
            aria-label={t("brand.logoAria")}
          >
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-white/35" />
              <span className="absolute size-1 rounded-full bg-white transition-transform duration-500 group-hover:translate-x-[5px]" />
            </span>
            <span className="text-body font-semibold tracking-[0.36em] text-white">
              MIW
            </span>
          </button>

          {/* centre tabs */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center lg:flex">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseEnter={() => {
                  hold();
                  setHovered(s.id);
                  setOpen(s.id);
                }}
                onFocus={() => {
                  setHovered(s.id);
                  setOpen(s.id);
                }}
                onClick={() => go(s)}
                aria-expanded={hasDrawer(s) ? open === s.id : undefined}
                className="relative px-4 py-2 text-body font-medium text-platinum transition-colors hover:text-white focus:text-white"
              >
                {active === s.id && (
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
                <span className="relative flex items-center gap-1.5">
                  {t(`stations:sections.${s.id}.label`)}
                  {hasDrawer(s) && (
                    <Caret
                      className={cn(
                        "text-[0.7em] opacity-60 transition-transform duration-200",
                        open === s.id && "rotate-180 opacity-100",
                      )}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* right cluster */}
          <div className="flex items-center gap-2">
            {/* Routes, not stations. The centre tabs fly the camera; these two
                go to the pages a visitor with a specific question — what have
                you built, are you hiring — actually wants to read. */}
            <LocaleLink
              href="/work"
              onClick={dismiss}
              className="hidden rounded-full px-3 py-2 text-small font-medium text-platinum transition-colors hover:bg-white/10 hover:text-white sm:block"
            >
              {t("nav.work")}
            </LocaleLink>

            <LocaleLink
              href="/about"
              onClick={dismiss}
              className="hidden rounded-full px-3 py-2 text-small font-medium text-platinum transition-colors hover:bg-white/10 hover:text-white sm:block"
            >
              {t("nav.about")}
            </LocaleLink>

            <button
              type="button"
              onClick={() => {
                dismiss();
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
              {mobile ? (
                <Cross className="text-copy-lg" />
              ) : (
                <Bars className="text-copy-lg" />
              )}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {openSection && !mobile && (
            openSection.panel === "team" ? (
              <TeamDrawer key="team" onDismiss={dismiss} />
            ) : openSection.panel === "contact" ? (
              <ContactDrawer
                key="contact"
                onLaunch={() => {
                  dismiss();
                  onLaunch();
                }}
              />
            ) : (
              <MegaDrawer
                key={openSection.id}
                section={openSection}
                onNavigate={goStation}
                onDismiss={dismiss}
              />
            )
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
                {NAV_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => go(s)}
                    className="-mx-3 flex w-[calc(100%+1.5rem)] items-baseline justify-between gap-4 border-b border-white/10 px-3 py-4 text-left transition-colors last:border-0 hover:bg-white/8"
                  >
                    <span className="text-copy font-medium text-white">
                      {t(`stations:sections.${s.id}.label`)}
                    </span>
                    <span className="truncate text-meta text-zinc">
                      {s.stations
                        .map((id) => stationById(id).index)
                        .join(" · ")}
                    </span>
                  </button>
                ))}

                <LocaleLink
                  href="/work"
                  onClick={dismiss}
                  className="-mx-3 flex w-[calc(100%+1.5rem)] items-baseline justify-between gap-4 border-t border-white/10 px-3 py-4 text-left transition-colors hover:bg-white/8"
                >
                  <span className="text-copy font-medium text-white">
                    {t("nav.work")}
                  </span>
                  <span className="text-meta text-zinc">
                    {t("nav.caseStudies")}
                  </span>
                </LocaleLink>

                <LocaleLink
                  href="/about"
                  onClick={dismiss}
                  className="-mx-3 flex w-[calc(100%+1.5rem)] items-baseline justify-between gap-4 border-t border-white/10 px-3 py-4 text-left transition-colors hover:bg-white/8"
                >
                  <span className="text-copy font-medium text-white">
                    {t("nav.about")}
                  </span>
                  <span className="text-meta text-zinc">
                    {t("stations:sections.guild.blurb")}
                  </span>
                </LocaleLink>

                <button
                  type="button"
                  onClick={() => {
                    dismiss();
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
