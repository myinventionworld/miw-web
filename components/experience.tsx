"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ReactLenis, useLenis } from "lenis/react";
import { useMotionValue, type MotionValue } from "motion/react";
import { useTranslation } from "react-i18next";
import { Arrow } from "@/components/glyph";

import { clamp01, flight } from "@/lib/flight";
import { useDockSnap } from "@/lib/use-dock-snap";
import {
  CONSOLE_ANCHOR,
  stationById,
  type Mode,
  type StationId,
} from "@/lib/stations";
import { detectWebGL, prefersFlatDeck } from "@/lib/utils";
import { Navbar } from "./navbar";
import { ProjectDock } from "./project-dock";
import { Fallback } from "./overlay/fallback";
import { Stage } from "./overlay/stage";
import { TransmissionConsole } from "./overlay/transmission-console";

const CosmosScene = dynamic(
  () => import("./webgl/cosmos-scene").then((m) => m.CosmosScene),
  { ssr: false },
);

/** Total scroll runway. Nine screens of travel across five parking points. */
const RUNWAY = "h-[900vh]";

function Hero({
  progress,
  onExplore,
  onDiscovery,
}: {
  progress: MotionValue<number>;
  onExplore: () => void;
  onDiscovery: () => void;
}) {
  const { t } = useTranslation("common");

  return (
    <Stage
      progress={progress}
      window={[0, 0, 0.016, 0.036]}
      enter={false}
      lift={40}
    >
      <div className="mx-auto flex h-full max-w-[1400px] flex-col justify-center px-6 md:px-10">
        <h1 className="text-lift text-[clamp(2.1rem,5.2vw,4.4rem)] leading-[0.96] font-bold tracking-[-0.05em] text-white">
          {t("home.titleTop")}
          <br className="hidden sm:block" /> {t("home.titleBottom")}
        </h1>

        {/* Only the body copy takes a scrim. The headline is large enough to
            carry itself, and washing the whole block would flatten the planet
            the hero is framed against. */}
        <div className="copy-scrim mt-6 max-w-xl">
          <p className="text-lift relative text-copy-lg leading-relaxed text-platinum">
            {t("home.lede")}
          </p>
        </div>

        <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onDiscovery}
            className="flex items-center gap-2 rounded-full bg-action px-6 py-3 text-lead font-semibold text-on-action transition-colors hover:bg-action-hover"
          >
            {t("home.ctaContact")}
            <Arrow dir="up-right" className="text-copy" weight={1.7} />
          </button>
          <button
            type="button"
            onClick={onExplore}
            className="flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-6 py-3 text-lead font-medium text-white backdrop-blur transition-colors hover:border-white/70 hover:bg-white/10"
          >
            {t("home.ctaStations")}
            <Arrow dir="down" className="text-copy" weight={1.6} />
          </button>
        </div>

      </div>
    </Stage>
  );
}

/**
 * Everything below lives inside `<ReactLenis>` so it can grab the instance —
 * navigation has to drive Lenis rather than `window.scrollTo`, or the smooth
 * scroller and the browser fight each other for the same scrollTop.
 */
function Deck({ webgl }: { webgl: boolean }) {
  // One copy mode. The old Business / Telemetry toggle doubled every station's
  // text for a distinction most visitors never looked for.
  const mode: Mode = "business";

  /**
   * One scroll position, read by everything.
   *
   * This was motion's `useScroll`, which left the page with two clocks: the
   * camera read Lenis's `animatedScroll` while every overlay read a MotionValue
   * that motion promotes to a native `ScrollTimeline` and hands to the
   * compositor. They agree most of the time and that is the problem — when they
   * did not, the HUD and the station card disagreed about which station you were
   * at, and a compositor-owned `opacity` is not readable from JS to check (see
   * the hero fade-back bug recorded in `stage.tsx`).
   *
   * Lenis owns `scrollTop` here, so it is the only defensible source. Driving a
   * plain MotionValue from it costs the compositor offload and buys nothing back
   * — Lenis is already running a rAF loop every frame.
   */
  const progress = useMotionValue(0);

  const lenis = useLenis(({ scroll, limit }) => {
    const p = limit > 0 ? clamp01(scroll / limit) : 0;
    flight.progress = p;
    progress.set(p);
  });

  // Fires on user gestures only, so it never argues with `travel` below.
  useDockSnap(lenis);

  const travel = useCallback(
    (p: number) => {
      if (!lenis) return;
      lenis.scrollTo(p * lenis.limit, {
        duration: 2.2,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
    },
    [lenis],
  );

  const goStation = useCallback(
    (id: StationId) => travel(stationById(id).anchor),
    [travel],
  );

  // The editorial routes link back to `/#transmission`. Lenis owns scrollTop,
  // so the browser's native hash jump lands on nothing — the camera has to be
  // flown there instead, once, after the scroller exists.
  const jumped = useRef(false);
  useEffect(() => {
    if (!lenis || jumped.current) return;
    if (window.location.hash !== "#transmission") return;
    jumped.current = true;
    const id = setTimeout(() => travel(CONSOLE_ANCHOR), 140);
    return () => clearTimeout(id);
  }, [lenis, travel]);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-void">{webgl && <CosmosScene />}</div>

      {/* Filmic grade. Light touch — the panels carry their own contrast now. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,3,5,0.5) 0%, transparent 18%, transparent 62%, rgba(3,3,5,0.72) 100%)",
        }}
      />

      <Navbar
        onNavigate={goStation}
        onLaunch={() => travel(CONSOLE_ANCHOR)}
      />

      <Hero
        progress={progress}
        onExplore={() => goStation("backend")}
        onDiscovery={() => travel(CONSOLE_ANCHOR)}
      />
      <ProjectDock
        progress={progress}
        mode={mode}
        onAction={() => travel(CONSOLE_ANCHOR)}
      />
      <TransmissionConsole progress={progress} />

      {/* The only element with real height — everything else is fixed. */}
      <div aria-hidden className={`${RUNWAY} w-full`} />
    </>
  );
}

export function Experience() {
  /**
   * `null` until the first client effect, because both inputs are runtime
   * capabilities and a server render has neither. Rendering the deck optimistically
   * and swapping it out would mount a WebGL context on a phone just to throw it
   * away.
   */
  const [flight3d, setFlight3d] = useState<boolean | null>(null);

  useEffect(() => {
    setFlight3d(detectWebGL() && !prefersFlatDeck());

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      flight.reducedMotion = motionQuery.matches;
    };
    syncMotion();
    motionQuery.addEventListener("change", syncMotion);

    const onPointer = (e: PointerEvent) => {
      flight.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      flight.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      motionQuery.removeEventListener("change", syncMotion);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // Touch and no-WebGL both land on the same flat route. It is not a downgrade
  // path with missing content — it carries the whole page as a normal document
  // that scrolls the way the device expects.
  if (flight3d === false) return <Fallback />;

  // `null` renders the deck shell with no scene rather than nothing: the server
  // pass lands here, and a blank first paint would cost the LCP on the one device
  // class that does get the deck. The scene mounts on the next commit.

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.085,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
        // The console panel scrolls internally on short viewports; without this
        // Lenis eats the gesture and the submit button stays unreachable.
        allowNestedScroll: true,
      }}
    >
      <Deck webgl={Boolean(flight3d)} />
    </ReactLenis>
  );
}
