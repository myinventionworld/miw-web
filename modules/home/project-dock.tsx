"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/modules/i18n";

import {
  STATIONS,
  type Mode,
  type ProgramPoint,
  type Station,
  type StationCopy,
} from "./stations";
import {
  projectForStation,
  type ProjectCase,
  ShowcaseFrame,
  ProjectActions,
  DockShots,
  hasScreens,
} from "@/modules/work";
import { cn } from "@/shared/lib/cn";
import { ConsoleKey } from "@/shared/ui/console-key";
import { StationPanel } from "@/shared/ui/station-panel";
import type { StationId } from "@/shared/station-id";

/**
 * Which side the card parks on. Alternating on purpose: four cards against the
 * same edge read as one column with a moving backdrop, and the eye never has a
 * reason to travel. `FRAME_BIAS` in `flight.ts` is the mirror of this map —
 * it slides each celestial body to the opposite side so the card is never parked
 * on top of its own subject.
 *
 * Station 04 is the team rather than an artifact, so it closes the flight
 * centred and full-width instead of taking a side.
 */
const DOCK_SIDE: Record<StationId, "left" | "right" | "center"> = {
  backend: "left",
  commerce: "right",
  labs: "left",
  guild: "center",
};

/**
 * Scroll band each station's panel is visible across. Written out rather than
 * derived as anchor ± n, because station 01 has to clear the hero: its anchor
 * sits at 0.06 and a symmetric band would put the card on screen at rest.
 *
 * These were roughly twice as wide and that was the single worst thing about the
 * scroll. Two reasons to keep them tight:
 *
 * Composition. The camera's `proximity` — and with it the docking frame bias
 * that moves the planet off the card — is only meaningfully non-zero within
 * about 0.04 of an anchor. A wider band put the card on screen while the camera
 * was still flying, so it sat over a planet swinging through it.
 *
 * Docking. The magnet's capture radius has to cover every position where a card
 * is on screen, or the reader can stop somewhere it is half-arrived. A leg is
 * only 0.24 long, so a band of 0.15 forced a radius of nearly half a leg — wide
 * enough that a deliberate flick forward got dragged back to the station it
 * started from. ±0.05 is the widest that leaves a gesture room to leave.
 */
const BANDS: Record<StationId, [number, number]> = {
  backend: [0.035, 0.11],
  commerce: [0.25, 0.35],
  labs: [0.49, 0.59],
  guild: [0.73, 0.83],
};

/**
 * The artifact: its name, one sentence on what it is, and the running frame.
 * Everything else — stack, decisions, figures — is one click away on the case
 * study, which is where a reader who wants it goes anyway.
 */
function ArtifactBody({
  project,
}: {
  project: ProjectCase;
}) {
  const { t } = useTranslation(["stations", "projects"]);

  return (
    <>
      <h3 className="flex items-center gap-2.5 text-title leading-tight font-semibold text-white">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: project.color }}
        />
        {project.name}
      </h3>

      {/* The artifact's own pitch is what a short deck gives up. On a window too
          short for the brief column the card is already carrying the station's
          headline, and the frame below states the same thing by running. Full
          text is one click away at `/work/[slug]`. */}
      <p className="mt-2 hidden text-body leading-relaxed text-platinum deck-wide:block">
        {t(`projects:${project.id}.pitch`)}
      </p>

      {/* Real screenshots where we have them; the working demo stays on the
          case study, in "How it is built". */}
      <div className="mt-3">
        {hasScreens(project) ? (
          <DockShots project={project} t={(key: string) => t(key)} />
        ) : (
          <ShowcaseFrame project={project} />
        )}
      </div>
    </>
  );
}

/**
 * A list card for stations with nothing to open: the services at 02, the
 * people at 04. Faking a product frame for either would be the exact
 * dishonesty the rest of this page is written to avoid.
 */
function ProgramBody({
  station,
  wide,
}: {
  station: Station;
  wide: boolean;
}) {
  const { t } = useTranslation("stations");
  const points = t(`${station.id}.program`, {
    returnObjects: true,
  }) as ProgramPoint[];

  return (
    <dl
      className={cn(
        "grid gap-2",
        wide ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-1",
      )}
    >
      {points.map((p) => (
        <div
          key={p.label}
          className="border border-white/15 bg-white/4 px-3.5 py-2.5"
        >
          <dt className="text-body font-semibold text-white">{p.label}</dt>
          <dd className="mt-0.5 text-small leading-snug text-zinc">{p.body}</dd>
        </div>
      ))}
    </dl>
  );
}

function StationCta({
  station,
  onAction,
}: {
  station: Station;
  onAction?: (station: Station) => void;
}) {
  const { t } = useTranslation("stations");
  const label = t(`${station.id}.cta`);

  if (station.ctaHref) {
    return (
      <ConsoleKey as={LocaleLink} code="01" tone="primary" href={station.ctaHref}>
        {label}
      </ConsoleKey>
    );
  }

  return (
    <ConsoleKey code="01" tone="primary" onClick={() => onAction?.(station)}>
      {label}
    </ConsoleKey>
  );
}

/**
 * Wherever the brief column is hidden the card has to carry the pitch itself —
 * otherwise a visitor sees an artifact with no idea what it is for.
 *
 * Gated on `deck-wide`, not `lg`: the brief needs height as much as width, and
 * on a short window it was overflowing its column and crossing the navbar. The
 * centred station has no brief column at any size, so it opts out of the gate.
 *
 * The proof chips and the spec strip used to live here too. They are the first
 * thing to go on a short deck: the frame below carries its own callouts, and two
 * more rows of chips above it was the same fact stated three times in the space
 * the card did not have.
 */
function CardBrief({
  station,
  mode,
  always = false,
}: {
  station: Station;
  mode: Mode;
  always?: boolean;
}) {
  const { t } = useTranslation("stations");
  const copy = t(`${station.id}.${mode}`, {
    returnObjects: true,
  }) as StationCopy;

  return (
    <div
      className={cn(
        "mb-3.5 border-b border-white/15 pb-3.5 deck-short:mb-2.5 deck-short:pb-2.5",
        !always && "deck-wide:hidden",
      )}
    >
      <h2
        className={cn(
          "leading-[1.16] font-semibold tracking-[-0.025em] text-white",
          always ? "text-heading deck-wide:text-heading-xl" : "text-title",
        )}
      >
        {copy.headline}
      </h2>
      {/* On a short deck the lede is clamped rather than dropped: two lines
          still carry the point, and a stranger never meets an artifact with no
          framing at all. A 1366x768 laptop leaves a ~512px band, which is where
          an unclamped lede pushed the card under the navbar. */}
      <p className="mt-2 max-w-2xl text-small leading-[1.55] text-platinum deck-short:line-clamp-2">
        {copy.lede}
      </p>
    </div>
  );
}

/**
 * Deliberately not `data-lenis-prevent`: that attribute makes Lenis bail
 * unconditionally, so a reader whose cursor happened to rest on a card already
 * scrolled to its end would find the wheel dead and no way on down the runway.
 * `overscroll-contain` plus `allowNestedScroll` gives the handover in one
 * direction and hands it straight back at the end of travel.
 */
const CAP = "max-h-full overflow-y-auto overscroll-contain thin-scroll";

function Card({
  station,
  mode,
  onAction,
}: {
  station: Station;
  mode: Mode;
  onAction?: (station: Station) => void;
}) {
  // No `featured` flag any more: a station shows a frame when a real system is
  // registered against it in `modules/work/projects.ts`, and shows none when there is
  // nothing a stranger could open.
  const { t } = useTranslation("stations");
  const project = projectForStation(station.id);
  const centred = DOCK_SIDE[station.id] === "center";

  return (
    /*
     * A card that does not fit is a content problem first, and that is still
     * where it is solved: the heavy blocks are gated on `deck-wide`, the copy
     * gives up padding and clamps on `deck-short`, the card trades width for
     * height once the brief column is gone, and the detail lives at
     * `/work/[slug]`. Measured, that is enough for every laptop this page is
     * actually opened on — see the cap on the wrapper for the rest.
     *
     * This used to say "no inner scroller, deliberately", on the grounds that a
     * second scroll container under the cursor steals the wheel from the page.
     * That was true and is no longer: `allowNestedScroll` is on in
     * `experience.tsx`, and Lenis only defers to a nested element while that
     * element can still scroll in the gesture's direction, then takes the wheel
     * back. The objection was to unconditional capture, which is what
     * `data-lenis-prevent` does and what this deliberately does not use.
     */
    <StationPanel
      label={t(`${station.id}.nav`)}
      channel={t(`${station.id}.nav`)}
      station={`ST-${station.index}`}
      animated={false}
      bodyClassName="deck-short:px-3.5 deck-short:pt-3.5"
      className={cn(
        "pointer-events-auto",
        centred
          ? "w-full"
          : "w-[min(92vw,440px)] xl:w-[540px] deck-short:w-[min(92vw,660px)]",
      )}
      actions={
        <>
          <StationCta station={station} onAction={onAction} />
          {project && <ProjectActions project={project} start={2} />}
        </>
      }
    >
      <CardBrief station={station} mode={mode} always={centred} />

      {station.program ? (
        <ProgramBody station={station} wide={centred} />
      ) : project ? (
        <ArtifactBody project={project} />
      ) : null}
    </StationPanel>
  );
}

/**
 * Value first, tech proof second. The outcome is the biggest thing on the
 * station; the stack sits underneath it in monospace where the reader who
 * cares will go looking and the reader who does not can skip it.
 */
function Brief({ station, mode }: { station: Station; mode: Mode }) {
  const { t } = useTranslation("stations");
  const copy = t(`${station.id}.${mode}`, {
    returnObjects: true,
  }) as StationCopy;

  return (
    <div className="copy-scrim pointer-events-none hidden max-w-md deck-wide:block">
      <div className="relative">
        {/* Keyed on mode so flipping the toggle re-enters rather than swapping
            four paragraphs in place, which reads as a glitch. */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-lift text-heading-xl leading-[1.1] font-bold tracking-[-0.035em] text-white xl:text-[2.15rem]">
            {copy.headline}
          </h2>

          <p className="text-lift mt-4 text-copy leading-relaxed text-platinum">
            {copy.lede}
          </p>

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

  const side = active ? DOCK_SIDE[active.id] : "right";

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            // Scale in with the fade so the card arrives rather than appears.
            // The magnet holds the scroll at the anchor, so this plays out at a
            // standstill instead of halfway through a transit.
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              // The nav is 97px tall at every width, so the top clearance is
              // too — it used to drop to 80px at `lg` and the dock slid under.
              "mx-auto flex h-full max-w-[1500px] items-center gap-6 px-5 pt-[104px] pb-6 lg:gap-12 lg:px-10",
              // `justify-end` reads against the main axis: on a reversed row it
              // packs left. That is what keeps the card on its own side once the
              // brief column drops out on a short window.
              side === "center" && "justify-center",
              side === "left" && "flex-row-reverse justify-end",
              side === "right" && "flex-row justify-end",
            )}
          >
            {/* `CAP` is the guarantee behind the `deck-short` trims, not the
                normal path. The band is `viewport - 128` and shrinks without a
                floor, while the card cannot: the product frame alone is 250px.
                So at some height the card must lose — and the failure mode
                without a cap is the bad one, because the row is `items-center`,
                so half the excess goes *up*, behind a 97px navbar.

                `max-h-full` resolves against the row's content box, which is
                definite (`h-full` minus the 128px of padding), so the card can
                never exceed the band. It goes on this wrapper rather than on the
                panel itself: as a flex item the wrapper has the definite parent
                a percentage max-height needs, which the panel — inside an
                auto-height box — does not. */}
            {side === "center" ? (
              <div
                className={cn(
                  "relative z-10 mx-auto w-full",
                  active.program ? "max-w-[880px]" : "max-w-[680px]",
                  CAP,
                )}
              >
                <Card station={active} mode={mode} onAction={onAction} />
              </div>
            ) : (
              <>
                <div className="hidden flex-1 deck-wide:block">
                  <Brief station={active} mode={mode} />
                </div>
                {/* Stacked above the brief: its scrim bleeds past the column to
                    keep the copy legible over the planet, and the card has to
                    win that overlap rather than be washed by it. */}
                <div className={cn("relative z-10 shrink-0", CAP)}>
                  <Card station={active} mode={mode} onAction={onAction} />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
