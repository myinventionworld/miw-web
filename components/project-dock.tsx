"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/components/locale-link";
import { Arrow } from "@/components/glyph";

import {
  STATIONS,
  type Mode,
  type ProgramPoint,
  type Spec,
  type Station,
  type StationCopy,
  type StationId,
} from "@/lib/stations";
import { projectForStation, type ProjectCase } from "@/data/projects";
import { ShowcaseFrame, ProjectActions } from "./showcase/frame";
import { cn } from "@/lib/utils";

/**
 * Which side the card parks on. Alternating on purpose: four cards against the
 * same edge read as one column with a moving backdrop, and the eye never has a
 * reason to travel. `FRAME_BIAS` in `lib/flight.ts` is the mirror of this map —
 * it slides each celestial body to the opposite side so the card is never parked
 * on top of its own subject.
 *
 * Station 04 sells a way of working rather than an artifact, so it closes the
 * flight centred and full-width instead of taking a side.
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
  const { t } = useTranslation("stations");
  const specs = t(`${station.id}.specs`, { returnObjects: true }) as Spec[];

  return (
    <dl className="mt-5 border-t border-white/12 pt-3.5">
      {specs.map((s) => (
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

/**
 * The metrics the case study is going to have to defend, stated on the card.
 *
 * Telemetry mode only. In Business mode the same three numbers would be the
 * fourth restatement of the station's claim on one card; a reader in that mode
 * wants the outcome, and the outcome is the sentence above. `basis` is rendered
 * as a suffix rather than dropped: a design budget and a measured number look
 * identical in a monospace row, which is exactly how a page starts lying.
 *
 * Every dimension here is load-bearing. The label wraps to two lines at this
 * width whatever we do, so the only height left to give back is padding — and
 * the card it sits on has none spare on a 13" deck.
 */
function MetricStrip({ project }: { project: ProjectCase }) {
  const { t } = useTranslation(["projects", "common"]);

  // Telemetry-only, and the block that made Telemetry the taller of the two
  // modes — so it is where the last 12px of a short deck come from. Trimming the
  // chips' own padding keeps all three metrics and their basis labels, which is
  // the whole point of the mode.
  return (
    <dl className="mt-2.5 grid grid-cols-3 gap-2 deck-short:mt-2 deck-short:gap-1.5">
      {project.metrics.map((m) => (
        <div
          key={m.id}
          title={t(`${project.id}.metrics.${m.id}.note`)}
          className="rounded-md border border-white/12 bg-white/4 px-2.5 py-1.5 deck-short:py-1"
        >
          <dt className="font-mono text-[12px] leading-none text-white tabular-nums">
            {m.value}
          </dt>
          <dd className="mt-1 font-mono text-[8.5px] leading-[1.25] tracking-[0.08em] text-steel uppercase">
            {t(`${project.id}.metrics.${m.id}.label`)}
            <span className="text-steel/70">
              {" · "}
              {m.basis === "target"
                ? t("common:project.budget")
                : t("common:project.measured")}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Two levels of the same artifact, chosen by the toggle: Business gets the
 * outcome a buyer is paying for, Telemetry gets the mechanism and the numbers.
 * Both always get the codename, the stack and the running frame — the stack line
 * is not a mode, it is the reason to believe either sentence.
 */
function ArtifactBody({
  station,
  project,
  mode,
}: {
  station: Station;
  project: ProjectCase;
  mode: Mode;
}) {
  const { t } = useTranslation(["stations", "projects"]);

  return (
    <>
      <div className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
        {t("ui.station", { index: station.index })} · {project.name}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-xl leading-none font-semibold text-white">
          {project.codename}
        </h3>
        <span className="shrink-0 font-mono text-[9px] tracking-telemetry text-steel uppercase">
          {project.stack.slice(0, 3).join(" · ")}
        </span>
      </div>

      {/* The artifact's own pitch is what a short deck gives up. On a window too
          short for the brief column the card is already carrying the station's
          headline, and the frame below states the same thing by running. Full
          text is one click away at `/work/[slug]`. */}
      <p className="mt-3 hidden text-[13px] leading-relaxed text-platinum deck-wide:block">
        {t(
          mode === "business"
            ? `projects:${project.id}.pitch.executive`
            : `projects:${project.id}.pitch.telemetry`,
        )}
      </p>

      {mode === "telemetry" && <MetricStrip project={project} />}

      <ShowcaseFrame project={project} className="mt-3" />
    </>
  );
}

/**
 * Station 04 sells a way of working. There is no artifact to open, and faking
 * a product frame for a people programme would be the exact dishonesty the
 * rest of this page is written to avoid.
 */
function ProgramBody({ station }: { station: Station }) {
  const { t } = useTranslation("stations");
  const points = t(`${station.id}.program`, {
    returnObjects: true,
  }) as ProgramPoint[];

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
            {t("ui.station", { index: station.index })} · {t("ui.programme")}
          </div>
          <h3 className="mt-1.5 font-mono text-xl leading-none font-semibold text-white">
            {t("ui.programmeName")}
          </h3>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-signal/60 px-2.5 py-1 font-mono text-[9px] tracking-telemetry text-signal uppercase">
          <span className="size-1.5 rounded-full bg-current" />
          {t("ui.intakeOpen")}
        </span>
      </div>

      {/* Two columns, because this card closes the flight centred and full
          width — a single column of four would run past the fold. */}
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {points.map((p) => (
          <div
            key={p.label}
            className="rounded-lg border border-white/12 bg-white/4 px-3.5 py-2.5"
          >
            <dt className="font-mono text-[9.5px] tracking-telemetry text-white uppercase">
              {p.label}
            </dt>
            <dd className="mt-1.5 text-[12.5px] leading-[1.5] text-zinc">
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
  // Sits in a row with the artifact's links rather than on its own line. Still
  // the only filled button on the card, so it still reads as the primary path —
  // fill and weight carry that, not size. Sized to match `ACTION` in
  // `showcase/frame.tsx` to the pixel: a 39px button next to a 33px link left
  // the row visibly ragged, and on a 13" deck those 6px were not free.
  const style =
    "flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200";

  const { t } = useTranslation("stations");
  const label = t(`${station.id}.cta`);

  if (station.ctaHref) {
    return (
      <LocaleLink href={station.ctaHref} className={style}>
        {label}
        <Arrow className="text-[14px]" weight={1.7} />
      </LocaleLink>
    );
  }

  return (
    <button type="button" onClick={() => onAction?.(station)} className={style}>
      {label}
      <Arrow className="text-[14px]" weight={1.7} />
    </button>
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
        "mb-3.5 border-b border-white/12 pb-3.5 deck-short:mb-2.5 deck-short:pb-2.5",
        !always && "deck-wide:hidden",
      )}
    >
      <div className="flex items-center gap-2.5 font-mono text-[9px] tracking-telemetry text-beam uppercase">
        <span className="h-px w-6 bg-beam/55" />
        {station.index} / {t(`${station.id}.pillar`)}
      </div>
      <h2
        className={cn(
          "mt-2 leading-[1.16] font-semibold tracking-[-0.025em] text-white",
          always ? "text-[21px] deck-wide:text-[27px]" : "text-[19px]",
        )}
      >
        {copy.headline}
      </h2>
      {/* The lede is the first thing Telemetry mode gives up on a short deck.
          It is the business framing of a claim the reader has just toggled
          away from, and its three lines are almost exactly the height the
          metric strip needs — carrying both is what put the card under the
          navbar at 1280×720. The headline stays, because without it the card
          is a widget with no station attached.

          Business mode used to keep the lede whole on the stated grounds that
          it has no strip and therefore fits. Measured, that was checked at the
          wrong height: at 1280×720 the band is 592px and the tallest card is
          544px, so it did fit — but a 1366x768 laptop only yields ~640px of
          viewport, which is a 512px band, and stations 02 and 03 came to 544px
          and 529px. Both overflowed, and because the row is `items-center` the
          overflow splits: half the excess went *under the navbar*.

          So on a short deck the lede is clamped rather than dropped. Two lines
          still carry the promise — it is written outcome-first — and clamping
          keeps a stranger from meeting an artifact with no framing at all,
          which is what hiding it outright would do. */}
      {/* The clamp and the hide are mutually exclusive branches, not two classes
          on one element. `line-clamp-2` compiles to `display: -webkit-box`, so
          written as a bare `deck-short:` utility alongside `hidden` it *wins* on
          a short deck and un-hides the very paragraph Telemetry mode gives up —
          adding 47px to the card in the one place there was none to spare. */}
      <p
        className={cn(
          "mt-2 max-w-2xl text-[12.5px] leading-[1.55] text-platinum",
          !always && mode === "telemetry"
            ? "hidden"
            : "deck-short:line-clamp-2",
        )}
      >
        {copy.lede}
      </p>
      {always && mode === "business" && <Proof items={copy.proof} />}
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
  // registered against it in `data/projects.ts`, and shows none when there is
  // nothing a stranger could open.
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
    <div
      className={cn(
        "panel pointer-events-auto rounded-2xl p-4 lg:p-5 deck-short:p-3.5",
        centred
          ? "w-full"
          : "w-[min(92vw,440px)] xl:w-[540px] deck-short:w-[min(92vw,660px)]",
      )}
    >
      <CardBrief station={station} mode={mode} always={centred} />

      {station.program ? (
        <ProgramBody station={station} />
      ) : project ? (
        <ArtifactBody station={station} project={project} mode={mode} />
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 deck-short:mt-2">
        <StationCta station={station} onAction={onAction} />
        {project && <ProjectActions project={project} />}
      </div>
    </div>
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
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-beam uppercase">
          <span className="h-px w-9 bg-beam/55" />
          {station.index} / {t(`${station.id}.pillar`)}
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
            <Beat label={t("ui.problem")}>{copy.problem}</Beat>
            <Beat label={t("ui.solution")}>{copy.solution}</Beat>
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
                  "relative z-10 mx-auto w-full max-w-[880px]",
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
