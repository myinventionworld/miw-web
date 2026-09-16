"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ReactLenis, useLenis } from "lenis/react";
import { useScroll, type MotionValue } from "motion/react";
import { ChevronDown } from "lucide-react";

import { clamp01, flight } from "@/lib/flight";
import { CONSOLE_ANCHOR, stationById, type StationId } from "@/lib/stations";
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

function Hero({ progress }: { progress: MotionValue<number> }) {
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
          MIW · My Invention World
        </div>

        <h1 className="text-lift mt-7 max-w-4xl text-[clamp(2.3rem,6.2vw,5rem)] leading-[0.92] font-semibold tracking-[-0.045em] text-white">
          High-performance software architecture
        </h1>

        {/* Only the body copy takes a scrim. The headline is large enough to
            carry itself, and washing the whole block would flatten the planet
            the hero is framed against. */}
        <div className="copy-scrim mt-7 max-w-xl">
          <p className="text-lift relative text-[16px] leading-relaxed text-platinum">
            Distributed systems, real-time intelligence platforms, and the
            venture R&amp;D that falls out of operating them. Four stations
            ahead — each one a system we designed, shipped and still carry the
            pager for.
          </p>
        </div>

        <div className="mt-12 flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-zinc uppercase">
          <ChevronDown className="size-3.5 animate-bounce" strokeWidth={2} />
          Scroll to depart
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
      />

      <Hero progress={scrollYProgress} />
      <ProjectDock
        progress={scrollYProgress}
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
      options={{ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.4 }}
    >
      <Deck webgl={Boolean(webgl)} />
    </ReactLenis>
  );
}
