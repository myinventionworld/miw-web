"use client";

import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import { flushSync } from "react-dom";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import { useMotionValue, type MotionValue } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

import { diveBodyAt, flight, scrollAt, sectionAt, trackAt } from "./flight";
import { runDive, settle, skipTransitionOnInput } from "./landing";
import { useDockSnap } from "./use-dock-snap";
import { CONSOLE_ANCHOR, stationById, type Mode } from "./stations";
import { Navbar } from "./navbar";
import { ProjectDock } from "./project-dock";
import { Fallback } from "./fallback";
import { SignalLost } from "./signal-lost";
import { Stage } from "./stage";
import { TransmissionConsole } from "./transmission-console";
import type { StationId } from "@/shared/station-id";
import { PROJECTS, projectForStation } from "@/modules/work";
import {
  LANDING,
  PAGE_TRANSITION,
  landingMarkFor,
  registerLander,
  rememberDeparture,
  rememberedStation,
  sectionFromHash,
  setLandingMark,
  takeTakeoff,
} from "@/shared/lib/landing";
import { detectHardwareGpu, prefersFlatDeck } from "./webgl-support";

const CosmosScene = dynamic(
  () => import("./scene/cosmos-scene").then((m) => m.CosmosScene),
  { ssr: false },
);

const RUNWAY = "h-[740vh]";

const RECONNECT_MS = 4000;

const DIVE_MS = 520;
const PULL_BACK_MS = 1400;
const PULL_BACK_DELAY_MS = 250;
const DAYLIGHT_MAX_MS = 1500;
const SCENE_MAX_MS = 8000;

/** Set once the scene proved too slow even at its lowest quality, for the rest of the tab's session. */
const TOO_SLOW_KEY = "miw:flat-deck";

function rememberedTooSlow() {
  try {
    return sessionStorage.getItem(TOO_SLOW_KEY) === "1";
  } catch {
    return false;
  }
}

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
      <div className="mx-auto flex h-full max-w-5xl flex-col justify-center px-4 sm:px-6 md:px-8">
        <p className="text-lift text-small text-zinc">{t("availability.status")}</p>
        <h1 className="text-lift mt-4 text-[clamp(2.1rem,5.2vw,4.4rem)] leading-[0.96] font-bold tracking-[-0.05em] text-white">
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
          </button>
          <button
            type="button"
            onClick={onExplore}
            className="flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-6 py-3 text-lead font-medium text-white backdrop-blur transition-colors hover:border-white/90 hover:bg-white/10"
          >
            {t("home.ctaStations")}
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
function Deck({
  webgl,
  gpu,
  shell,
  onSceneLost,
  onTooSlow,
}: {
  webgl: boolean;
  gpu: string;
  shell?: string;
  onSceneLost: () => void;
  onTooSlow: () => void;
}) {
  const { t } = useTranslation("common");
  const scene = useRef<HTMLDivElement>(null);
  const [lost, setLost] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  // WebGL context events do not bubble; the capture phase still reaches the
  // canvas's parent. A restored context comes back without the scene's
  // procedural textures, so the scene is mounted again from scratch.
  useEffect(() => {
    const el = scene.current;
    if (!el || !webgl) return;
    let giveUp = 0;
    const onLost = () => {
      setLost(true);
      window.clearTimeout(giveUp);
      giveUp = window.setTimeout(onSceneLost, RECONNECT_MS);
    };
    const onRestored = () => {
      window.clearTimeout(giveUp);
      setLost(false);
      setSceneKey((k) => k + 1);
    };
    el.addEventListener("webglcontextlost", onLost, true);
    el.addEventListener("webglcontextrestored", onRestored, true);
    return () => {
      window.clearTimeout(giveUp);
      el.removeEventListener("webglcontextlost", onLost, true);
      el.removeEventListener("webglcontextrestored", onRestored, true);
    };
  }, [webgl, onSceneLost]);

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
    const p = limit > 0 ? trackAt(scroll / limit) : 0;
    flight.progress = p;
    progress.set(p);
  });

  // Fires on user gestures only, so it never argues with `travel` below.
  useDockSnap(lenis);

  const travel = useCallback(
    (p: number) => {
      if (!lenis) return;
      lenis.scrollTo(scrollAt(p) * lenis.limit, {
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

  const router = useRouter();
  const landing = useRef(false);
  const [planet, setPlanet] = useState<{ x: number; y: number; r: number } | null>(null);
  const [diving, setDiving] = useState(false);
  const [daylight, setDaylight] = useState<"on" | "fading" | null>(null);

  useEffect(() => {
    flight.dive = 0;
    flight.diveBody = null;
    flight.diveScreen = null;
  }, []);

  const land = useCallback(
    (to: string) => {
      if (landing.current) return;
      landing.current = true;
      lenis?.stop();
      router.prefetch(to);

      const section = sectionAt(flight.eased);
      const station = section && section !== "transmission" ? section : null;
      const product = (station && projectForStation(station)?.slug) ?? PROJECTS[0].slug;
      const path = new URL(to, window.location.href).pathname;
      const mark = landingMarkFor(path, product);
      rememberDeparture(section);
      window.history.replaceState(
        null,
        "",
        section ? `#${section}` : window.location.pathname + window.location.search,
      );
      if (/\/work$/.test(path) && product !== PROJECTS[0].slug) to = `${path}#${product}`;

      const go = () => {
        setLandingMark(flight.reducedMotion ? null : mark);
        skipTransitionOnInput(2000);
        router.push(to, { transitionTypes: [LANDING] });
        window.setTimeout(() => setLandingMark(null), 2000);
      };

      if (flight.reducedMotion || !webgl) {
        go();
        return;
      }

      flight.diveBody = diveBodyAt(flight.eased);
      flight.diveScreen = null;
      setDiving(true);
      void settle()
        .then(() => (flight.diveScreen?.visible ? runDive(1, DIVE_MS) : undefined))
        .then(() => {
          const s = flight.diveScreen;
          const w = window.innerWidth;
          const h = window.innerHeight;
          flushSync(() =>
            setPlanet(
              s?.visible && s.r > 4
                ? { x: s.x, y: s.y, r: Math.min(s.r, Math.hypot(w, h)) }
                : { x: w / 2, y: h / 2, r: Math.min(w, h) * 0.14 },
            ),
          );
          go();
        });
    },
    [lenis, router, webgl],
  );

  useEffect(() => registerLander(land), [land]);

  // The editorial routes link back to `/#transmission` and to a station
  // (`/#commerce`). Lenis owns scrollTop, so the browser's native hash jump
  // lands on nothing — the camera has to be flown there instead, once, after
  // the scroller exists.
  //
  // Coming back from a light page (a header link or the browser's Back) is a
  // take-off instead: parked at once where the visitor left, under daylight
  // that fades as the camera pulls back from the planet.
  const jumped = useRef(false);
  useEffect(() => {
    if (!lenis || jumped.current) return;
    jumped.current = true;
    const returning = takeTakeoff();
    const section = sectionFromHash(window.location.hash) ?? (returning ? rememberedStation() : null);
    const anchor =
      section === "transmission" ? CONSOLE_ANCHOR : section ? stationById(section).anchor : 0;

    if (!returning) {
      if (!section) return;
      const id = setTimeout(() => travel(anchor), 140);
      return () => clearTimeout(id);
    }

    lenis.scrollTo(scrollAt(anchor) * lenis.limit, { immediate: true, force: true });
    flight.progress = anchor;
    flight.eased = anchor;
    setDaylight("on");
    if (flight.reducedMotion || section === "transmission") {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setDaylight("fading")));
      return () => cancelAnimationFrame(id);
    }

    flight.diveBody = diveBodyAt(anchor);
    flight.dive = 1;
    const start = performance.now();
    let faded = false;
    let later = 0;
    let raf = requestAnimationFrame(function wait() {
      const drawn = flight.diveScreen !== null;
      const waited = performance.now() - start;
      if (!faded && (drawn || waited > DAYLIGHT_MAX_MS)) {
        faded = true;
        setDaylight("fading");
      }
      if (drawn) later = window.setTimeout(() => void runDive(0, PULL_BACK_MS), PULL_BACK_DELAY_MS);
      else if (waited > SCENE_MAX_MS) flight.dive = 0;
      else raf = requestAnimationFrame(wait);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(later);
    };
  }, [lenis, travel]);

  return (
    <>
      <ViewTransition {...PAGE_TRANSITION.flight} default="none">
        <div className={cn("fixed inset-0", shell)}>
          <div ref={scene} className="fixed inset-0 z-0 bg-void">
            {webgl && <CosmosScene key={sceneKey} gpu={gpu} onTooSlow={onTooSlow} />}
            {lost && <SignalLost message={t("signalLost")} />}
          </div>

          {/* Filmic grade. Light touch — the panels carry their own contrast now. */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(3,3,5,0.5) 0%, transparent 18%, transparent 62%, rgba(3,3,5,0.72) 100%)",
            }}
          />

          {daylight && (
            <div
              aria-hidden
              onTransitionEnd={() => setDaylight(null)}
              className={cn(
                "pointer-events-none fixed inset-0 z-40 bg-white transition-opacity duration-700 ease-out motion-reduce:duration-200",
                daylight === "fading" && "opacity-0",
              )}
            />
          )}

          <div className={cn("transition-opacity duration-300 ease-out", diving && "opacity-0")}>
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
          </div>
        </div>
      </ViewTransition>

      {planet && (
        <ViewTransition name="landing-body" share="landing-morph" default="none">
          <div
            aria-hidden
            className="pointer-events-none fixed z-[60] rounded-full"
            style={{
              left: planet.x - planet.r,
              top: planet.y - planet.r,
              width: planet.r * 2,
              height: planet.r * 2,
            }}
          />
        </ViewTransition>
      )}

      <Navbar
        className={shell}
        progress={progress}
        onNavigate={goStation}
        onLaunch={() => travel(CONSOLE_ANCHOR)}
      />

      {/* The only element with real height — everything else is fixed. */}
      <div aria-hidden className={cn(RUNWAY, "w-full", shell)} />
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
  const [gpu, setGpu] = useState("");
  const toFlatPage = useCallback(() => {
    setFlight3d(false);
    window.scrollTo(0, 0);
  }, []);
  const tooSlow = useCallback(() => {
    try {
      sessionStorage.setItem(TOO_SLOW_KEY, "1");
    } catch {}
    toFlatPage();
  }, [toFlatPage]);

  useEffect(() => {
    const renderer = detectHardwareGpu();
    // `?gfx=` is for testing a machine, so it gets the scene whatever happened before.
    const pinned = new URLSearchParams(window.location.search).has("gfx");
    setGpu(renderer ?? "");
    setFlight3d(renderer !== null && !prefersFlatDeck() && (pinned || !rememberedTooSlow()));

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

  // Touch and no GPU both land on the same flat page. It is not a downgrade
  // path with missing content — it carries the whole page as a normal document
  // that scrolls the way the device expects.
  const deck = (
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
      <Deck
        webgl={Boolean(flight3d)}
        gpu={gpu}
        shell={flight3d === true ? undefined : "[@media(pointer:coarse)_and_(hover:none)]:hidden"}
        onSceneLost={toFlatPage}
        onTooSlow={tooSlow}
      />
    </ReactLenis>
  );

  // `null` is the server render and the first paint, before anyone knows which
  // page this device gets. Both are in that HTML and CSS shows one: the flat
  // page on a touch screen (the same media query `prefersFlatDeck` reads), the
  // deck shell elsewhere. A phone used to paint the dark deck first and swap to
  // the flat page only after the script ran, which put its largest paint a
  // second or more behind the first. Once known, the other one is dropped; the
  // slots stay where they are, so the one that stays is not mounted twice.
  return (
    <>
      {flight3d !== true && (
        <Fallback
          className={flight3d === false ? undefined : "hidden [@media(pointer:coarse)_and_(hover:none)]:block"}
        />
      )}
      {flight3d !== false && deck}
    </>
  );
}
