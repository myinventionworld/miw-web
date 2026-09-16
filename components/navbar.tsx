"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Activity, ArrowUpRight, Menu, X } from "lucide-react";

import {
  NAV_STATIONS,
  STATUS_TONE,
  type Project,
  type Station,
  type StationId,
} from "@/lib/stations";
import { cn } from "@/lib/utils";

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

      {station === "systems" &&
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
                  fill="#34d399"
                  opacity={0.85}
                />
              ))}
            </>
          );
        })()}

      {station === "intelligence" &&
        Array.from({ length: 14 }, (_, i) => {
          const h = 8 + rnd(i) * 62;
          return (
            <rect
              key={i}
              x={10 + i * 10.5}
              y={86 - h}
              width="6"
              height={h}
              fill="#22d3ee"
              opacity={0.35 + rnd(i + 2) * 0.55}
            />
          );
        })}

      {station === "venture" &&
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

      {station === "studio" && (
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

/* ── mega drawer ──────────────────────────────────────────────────────── */

function ProjectCard({
  project,
  station,
  onOpen,
}: {
  project: Project;
  station: StationId;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left focus:outline-none"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/12 transition-colors group-hover:border-white/35 group-focus-visible:border-white">
        <ProjectThumb station={station} code={project.code} />
        <span
          className={cn(
            "absolute top-2 left-2 border bg-black/70 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.16em] uppercase backdrop-blur",
            STATUS_TONE[project.status],
          )}
        >
          {project.status}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-[9px] tracking-[0.18em] text-zinc">
          {project.code}
        </span>
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">
          {project.name}
        </span>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-platinum/80">
        {project.summary}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {project.stack.map((t) => (
          <span
            key={t}
            className="border border-white/15 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-zinc"
          >
            {t}
          </span>
        ))}
      </div>
    </button>
  );
}

function MegaDrawer({
  station,
  onNavigate,
}: {
  station: Station;
  onNavigate: (id: StationId) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="drawer absolute inset-x-0 top-full"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-9 md:px-10 md:py-11">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
              Station {station.index}
            </span>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
              {station.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(station.id)}
            className="flex items-center gap-2 border border-white/25 px-4 py-2 font-mono text-[10px] tracking-telemetry text-white uppercase transition-colors hover:bg-white hover:text-black"
          >
            Travel to station
            <ArrowUpRight className="size-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {station.projects.map((p) => (
            <ProjectCard
              key={p.code}
              project={p}
              station={station.id}
              onOpen={() => onNavigate(station.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── bar ──────────────────────────────────────────────────────────────── */

export function Navbar({
  onNavigate,
  onLaunch,
  telemetry,
  onToggleTelemetry,
}: {
  onNavigate: (id: StationId) => void;
  /** Jumps to the transmission console at the end of the runway. */
  onLaunch: () => void;
  telemetry: boolean;
  onToggleTelemetry: () => void;
}) {
  const [open, setOpen] = useState<StationId | null>(null);
  const [hovered, setHovered] = useState<StationId | null>(null);
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

  const go = (id: StationId) => {
    setOpen(null);
    setHovered(null);
    setMobile(false);
    onNavigate(id);
  };

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
        {open && !mobile && (
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent" />

        <nav className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
          {/* logo */}
          <button
            type="button"
            onClick={() => go("studio")}
            className="group flex items-center gap-2.5"
            aria-label="MIW — go to station 01"
          >
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-white/35" />
              <span className="absolute size-1 rounded-full bg-white transition-transform duration-500 group-hover:translate-x-[5px]" />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.36em] text-white">
              MIW
            </span>
          </button>

          {/* centre tabs */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center lg:flex">
            {NAV_STATIONS.map((s) => (
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
                onClick={() => go(s.id)}
                aria-expanded={open === s.id}
                className="relative px-4 py-2 text-[13px] font-medium text-platinum transition-colors hover:text-white focus:text-white focus:outline-none"
              >
                {active === s.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-md bg-white/12"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                      mass: 0.7,
                    }}
                  />
                )}
                <span className="relative">{s.nav}</span>
              </button>
            ))}
          </div>

          {/* right cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTelemetry}
              aria-pressed={telemetry}
              aria-label="Toggle telemetry readout"
              className={cn(
                "hidden size-9 items-center justify-center rounded-md border transition-colors sm:flex",
                telemetry
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/15 text-zinc hover:border-white/30 hover:text-white",
              )}
            >
              <Activity className="size-4" strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(null);
                setMobile(false);
                onLaunch();
              }}
              className="hidden items-center gap-2 rounded-md bg-white px-4 py-2 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200 sm:flex"
            >
              Launch Project
              <ArrowUpRight className="size-3.5" strokeWidth={2.4} />
            </button>

            <button
              type="button"
              onClick={() => setMobile((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobile}
              className="flex size-9 items-center justify-center rounded-md border border-white/15 text-white lg:hidden"
            >
              {mobile ? (
                <X className="size-4" strokeWidth={2} />
              ) : (
                <Menu className="size-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && !mobile && (
            <MegaDrawer
              key={open}
              station={NAV_STATIONS.find((s) => s.id === open)!}
              onNavigate={go}
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
                {NAV_STATIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => go(s.id)}
                    className="flex w-full items-baseline justify-between border-b border-white/10 py-4 text-left last:border-0"
                  >
                    <span className="text-[15px] font-medium text-white">
                      {s.nav}
                    </span>
                    <span className="font-mono text-[9px] tracking-telemetry text-zinc">
                      {s.index}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}
