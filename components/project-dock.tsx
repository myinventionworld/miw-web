"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  STATIONS,
  type Mode,
  type Station,
  type StationId,
} from "@/lib/stations";
import { systemForStation } from "@/lib/systems";
import { ShowcaseFrame } from "./showcase/frame";
import { cn } from "@/lib/utils";

/** Which side the card parks on, chosen to sit opposite its celestial body. */
const DOCK_SIDE: Record<StationId, "left" | "right"> = {
  backend: "right",
  ai: "left",
  labs: "right",
  guild: "right",
};

/**
 * Scroll band each station's panel is visible across. Written out rather than
 * derived as anchor ± n, because station 01 has to clear the hero: its anchor
 * sits at 0.06 and a symmetric band would put the card on screen at rest.
 */
const BANDS: Record<StationId, [number, number]> = {
  backend: [0.035, 0.145],
  ai: [0.225, 0.375],
  labs: [0.465, 0.615],
  guild: [0.705, 0.855],
};

/** Proof beats, rendered as chips so they read as facts rather than prose. */
function Proof({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5">
      {items.map((p) => (
        <li
          key={p}
          className="rounded-sm border border-signal/35 bg-signal/10 px-2 py-1 font-mono text-[9.5px] tracking-[0.1em] text-signal uppercase"
        >
          {p}
        </li>
      ))}
    </ul>
  );
}

function Beat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
        {label}
      </div>
      <p className="text-lift mt-1.5 text-[13.5px] leading-relaxed text-platinum">
        {children}
      </p>
    </div>
  );
}

/**
 * Level two, always on. The mode toggle decides which prose a visitor reads,
 * but a CTO who lands mid-scroll should never have to find a control to learn
 * what the thing is built out of.
 */
function SpecStrip({ station }: { station: Station }) {
  return (
    <dl className="mt-5 border-t border-white/12 pt-3.5">
      {station.specs.map((s) => (
        <div key={s.label} className="flex gap-3 py-[3px]">
          <dt className="w-[62px] shrink-0 font-mono text-[9px] tracking-[0.14em] text-steel uppercase">
            {s.label}
          </dt>
          <dd className="font-mono text-[10.5px] leading-[1.5] text-zinc">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ArtifactBody({
  station,
  featured,
}: {
  station: Station;
  featured: NonNullable<Station["featured"]>;
}) {
  const system = systemForStation(station.id);

  return (
    <>
      <div className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
        Station {station.index} · Live artifact
      </div>
      <h3 className="mt-1.5 font-mono text-xl leading-none font-semibold text-white">
        {featured.codename}
      </h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {featured.stack.map((s) => (
          <span
            key={s}
            className="rounded-sm border border-white/20 bg-white/6 px-2 py-0.5 font-mono text-[9.5px] text-platinum"
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-platinum">
        {featured.blurb}
      </p>

      {system && <ShowcaseFrame system={system} className="mt-4" />}
    </>
  );
}

/**
 * Station 04 sells a way of working. There is no artifact to open, and faking
 * a product frame for a people programme would be the exact dishonesty the
 * rest of this page is written to avoid.
 */
function ProgramBody({
  station,
  program,
}: {
  station: Station;
  program: NonNullable<Station["program"]>;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
            Station {station.index} · Programme
          </div>
          <h3 className="mt-1.5 font-mono text-xl leading-none font-semibold text-white">
            THE GUILD
          </h3>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-signal/60 px-2.5 py-1 font-mono text-[9px] tracking-telemetry text-signal uppercase">
          <span className="size-1.5 rounded-full bg-current" />
          Intake open
        </span>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-platinum">
        {program.headline}
      </p>

      <dl className="mt-4 space-y-2">
        {program.points.map((p) => (
          <div
            key={p.label}
            className="rounded-lg border border-white/12 bg-white/4 px-3.5 py-2.5"
          >
            <dt className="font-mono text-[9.5px] tracking-telemetry text-white uppercase">
              {p.label}
            </dt>
            <dd className="mt-1.5 text-[12.5px] leading-relaxed text-zinc">
              {p.body}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function StationCta({
  station,
  onAction,
}: {
  station: Station;
  onAction?: (station: Station) => void;
}) {
  const style =
    "mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200";

  if (station.cta.href) {
    return (
      <Link href={station.cta.href} className={style}>
        {station.cta.label}
        <ArrowUpRight className="size-4" strokeWidth={2.4} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onAction?.(station)} className={style}>
      {station.cta.label}
      <ArrowUpRight className="size-4" strokeWidth={2.4} />
    </button>
  );
}

/**
 * Wherever the brief column is hidden the card has to carry the pitch itself —
 * otherwise a visitor sees an artifact with no idea what it is for.
 *
 * Gated on `deck-wide`, not `lg`: the brief needs height as much as width, and
 * on a short window it was overflowing its column and crossing the navbar.
 */
function CardBrief({ station, mode }: { station: Station; mode: Mode }) {
  const copy = station.copy[mode];
  return (
    <div className="mb-5 border-b border-white/12 pb-5 deck-wide:hidden">
      <div className="flex items-center gap-2.5 font-mono text-[9px] tracking-telemetry text-beam uppercase">
        <span className="h-px w-6 bg-beam/55" />
        {station.index} / {station.pillar}
      </div>
      <h2 className="mt-2 text-[21px] leading-[1.14] font-semibold tracking-[-0.025em] text-white">
        {copy.headline}
      </h2>
      <p className="mt-2.5 text-[13px] leading-relaxed text-platinum">
        {copy.lede}
      </p>
      {mode === "business" && <Proof items={copy.proof} />}
      <SpecStrip station={station} />
    </div>
  );
}

function Card({
  station,
  mode,
  onAction,
}: {
  station: Station;
  mode: Mode;
  onAction?: (station: Station) => void;
}) {
  return (
    /* The dock is a fixed viewport, so a card taller than the deck gets
       clipped rather than scrolled. `max-h-full` cannot resolve against the
       auto-height wrapper, so the deck's own padding is subtracted instead. */
    <div
      data-lenis-prevent
      className="panel thin-scroll pointer-events-auto max-h-[calc(100dvh-9.75rem)] w-[min(92vw,460px)] overflow-y-auto rounded-2xl p-5 lg:max-h-[calc(100dvh-9.25rem)] xl:w-[560px]"
    >
      <CardBrief station={station} mode={mode} />

      {station.program ? (
        <ProgramBody station={station} program={station.program} />
      ) : station.featured ? (
        <ArtifactBody station={station} featured={station.featured} />
      ) : null}

      <StationCta station={station} onAction={onAction} />
    </div>
  );
}

/**
 * Value first, tech proof second. The outcome is the biggest thing on the
 * station; the stack sits underneath it in monospace where the reader who
 * cares will go looking and the reader who does not can skip it.
 */
function Brief({ station, mode }: { station: Station; mode: Mode }) {
  const copy = station.copy[mode];

  return (
    <div className="copy-scrim pointer-events-none hidden max-w-md deck-wide:block">
      <div className="relative">
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-beam uppercase">
          <span className="h-px w-9 bg-beam/55" />
          {station.index} / {station.pillar}
        </div>

        {/* Keyed on mode so flipping the toggle re-enters rather than swapping
            four paragraphs in place, which reads as a glitch. */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-lift mt-4 text-[1.9rem] leading-[1.08] font-semibold tracking-[-0.03em] text-white xl:text-[2.4rem]">
            {copy.headline}
          </h2>

          <p className="text-lift mt-4 text-[15.5px] leading-relaxed text-platinum">
            {copy.lede}
          </p>

          <div className="mt-5 space-y-4 border-l border-white/15 pl-4">
            <Beat label="The problem">{copy.problem}</Beat>
            <Beat label="What we build">{copy.solution}</Beat>
          </div>

          {/* In Specs mode the chips just restate the strip below. */}
          {mode === "business" && <Proof items={copy.proof} />}
          <SpecStrip station={station} />
        </motion.div>
      </div>
    </div>
  );
}

export function ProjectDock({
  progress,
  mode,
  onAction,
}: {
  progress: MotionValue<number>;
  mode: Mode;
  onAction?: (station: Station) => void;
}) {
  const [active, setActive] = useState<Station | null>(null);

  const resolve = useCallback((p: number) => {
    let next: Station | null = null;
    for (const s of STATIONS) {
      const [a, b] = BANDS[s.id];
      if (p >= a && p <= b) {
        next = s;
        break;
      }
    }
    // Identity compare is enough: STATIONS entries are module singletons, and
    // this only flips eight times across the whole runway.
    setActive((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => resolve(progress.get()), [progress, resolve]);
  useMotionValueEvent(progress, "change", resolve);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              // The nav is 97px tall at every width, so the top clearance is
              // too — it used to drop to 80px at `lg` and the dock slid under.
              "mx-auto flex h-full max-w-[1500px] items-center gap-10 px-6 pt-[108px] pb-8 lg:px-10 lg:pb-10",
              DOCK_SIDE[active.id] === "left" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div className="hidden flex-1 deck-wide:block">
              <Brief station={active} mode={mode} />
            </div>
            {/* Stacked above the brief: its scrim bleeds past the column to
                keep the copy legible over the planet, and the card has to win
                that overlap rather than be washed by it. */}
            <div className="relative z-10 ml-auto min-h-0 deck-wide:ml-0">
              <Card station={active} mode={mode} onAction={onAction} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
