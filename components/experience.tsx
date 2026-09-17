"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ReactLenis, useLenis } from "lenis/react";
import { useScroll, type MotionValue } from "motion/react";
import { ArrowUpRight, ChevronDown } from "lucide-react";

import { clamp01, flight } from "@/lib/flight";
import {
  CONSOLE_ANCHOR,
  stationById,
  type Mode,
  type StationId,
} from "@/lib/stations";
import { detectWebGL } from "@/lib/utils";
import { Navbar } from "./navbar";
import { ProjectDock } from "./project-dock";
import { Fallback } from "./overlay/fallback";
import { Hud } from "./overlay/hud";
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
  return (
    <Stage
      progress={progress}
      window={[0, 0, 0.016, 0.036]}
      enter={false}
      lift={40}
    >
      <div className="mx-auto flex h-full max-w-[1400px] flex-col justify-center px-6 md:px-10">
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-signal uppercase">
          <span className="h-px w-9 bg-signal/55" />
          MIW Labs — Venture Studio &amp; Engineering Guild
        </div>

        <h1 className="text-lift mt-6 text-[clamp(2.1rem,5.2vw,4.4rem)] leading-[0.94] font-semibold tracking-[-0.045em] text-white">
          High-Performance Systems.
          <br className="hidden sm:block" /> Engineered for Scale and Autonomy.
        </h1>

        {/* Only the body copy takes a scrim. The headline is large enough to
            carry itself, and washing the whole block would flatten the planet
            the hero is framed against. */}
        <div className="copy-scrim mt-6 max-w-xl">
          <p className="text-lift relative text-[16px] leading-relaxed text-platinum">
            We design and ship fault-tolerant digital platforms, distributed
            backends and autonomous AI agents — from the architecture diagram
            through to the thing running in production with a pager attached.
          </p>
        </div>

        <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onDiscovery}
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Initiate Project Discovery
            <ArrowUpRight className="size-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={onExplore}
            className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/40 px-6 py-3 text-[14px] font-medium text-white backdrop-blur transition-colors hover:border-white/70 hover:bg-white/10"
          >
            Explore the Transit
            <ChevronDown className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="copy-scrim mt-5 max-w-xl">
          <p className="text-lift relative text-[13px] leading-relaxed text-platinum">
            We don&apos;t just build for hire — we operate our own SaaS products
            under the same uptime standard we sell.
          </p>
        </div>

        <div className="mt-10 flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-steel uppercase">
          <ChevronDown className="size-3.5 animate-bounce" strokeWidth={2} />
          Four stations ahead · Scroll to depart
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
  const { scrollYProgress } = useScroll();
  const [telemetry, setTelemetry] = useState(true);
  // Business first: the visitor who has to be convinced is the one holding the
  // budget, not the one who already reads p99 charts for a living.
  const [mode, setMode] = useState<Mode>("business");

  const lenis = useLenis(({ scroll, limit }) => {
    flight.progress = limit > 0 ? clamp01(scroll / limit) : 0;
  });

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
        telemetry={telemetry}
        onToggleTelemetry={() => setTelemetry((v) => !v)}
        mode={mode}
        onModeChange={setMode}
      />

      <Hero
        progress={scrollYProgress}
        onExplore={() => goStation("backend")}
        onDiscovery={() => travel(CONSOLE_ANCHOR)}
      />
      <ProjectDock
        progress={scrollYProgress}
        mode={mode}
        onAction={() => travel(CONSOLE_ANCHOR)}
      />
      <TransmissionConsole progress={scrollYProgress} />
      <Hud visible={telemetry} />

      {/* The only element with real height — everything else is fixed. */}
      <div aria-hidden className={`${RUNWAY} w-full`} />
    </>
  );
}

export function Experience() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(detectWebGL());

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

  if (webgl === false) return <Fallback />;

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
      <Deck webgl={Boolean(webgl)} />
    </ReactLenis>
  );
}
