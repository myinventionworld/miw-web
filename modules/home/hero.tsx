"use client";

import { useRef } from "react";
import type { MotionValue } from "motion/react";
import { useTranslation } from "react-i18next";

import type { Section } from "@/shared/lib/landing";
import { Stage } from "./stage";
import { useBodyScreen } from "./use-body-screen";

/** The stations as pins along Earth's upper limb, left to right, in degrees from the top. */
const PINS: { to: Section; angle: number }[] = [
  { to: "backend", angle: -35 },
  { to: "commerce", angle: -12 },
  { to: "labs", angle: 12 },
  { to: "transmission", angle: 35 },
];

const LIFT = 1.065;

function Pins({ onFly }: { onFly: (to: Section) => void }) {
  const { t } = useTranslation(["common", "stations"]);
  const layer = useRef<HTMLDivElement>(null);

  useBodyScreen("backend", layer, (s, el) => {
    for (const [i, pin] of PINS.entries()) {
      const node = el.children[i] as HTMLElement | undefined;
      if (!node) continue;
      const a = (pin.angle * Math.PI) / 180;
      const x = s.x + Math.sin(a) * s.r * LIFT;
      const y = s.y - Math.cos(a) * s.r * LIFT;
      node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  });

  return (
    <div
      ref={layer}
      className="absolute inset-0 hidden sm:block"
      style={{ visibility: "hidden" }}
    >
      {PINS.map(({ to }) => (
        <button
          key={to}
          type="button"
          onClick={() => onFly(to)}
          className="group pointer-events-auto absolute top-0 left-0 flex -translate-x-1/2 -translate-y-[calc(100%-6px)] flex-col items-center text-center"
        >
          <span className="text-lift text-small font-semibold whitespace-nowrap text-white">
            {to === "transmission" ? t("nav.contact") : t(`stations:${to}.nav`)}
          </span>
          <span className="text-lift mt-0.5 text-meta whitespace-nowrap text-zinc transition-colors group-hover:text-white">
            {t(`home.pins.${to}`)}
          </span>
          <span aria-hidden className="mt-2 h-5 w-px bg-white/35" />
          <span
            aria-hidden
            className="size-3 rounded-full border-2 border-comet/60 bg-comet shadow-[0_0_12px_var(--color-comet)] transition-transform group-hover:scale-125"
          />
        </button>
      ))}
    </div>
  );
}

export function Hero({
  progress,
  onStart,
  onFly,
}: {
  progress: MotionValue<number>;
  onStart: () => void;
  onFly: (to: Section) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <Stage
      progress={progress}
      window={[0, 0, 0.016, 0.036]}
      enter={false}
      lift={40}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-[calc(88px+min(7vh,64px))] text-center sm:px-6 md:px-8">
        <p className="text-lift font-mono text-label tracking-[0.18em] text-comet uppercase">
          {t("brand.tagline")}
        </p>
        <h1 className="text-lift mt-5 text-[clamp(2.4rem,5.2vw,4.9rem)] leading-[0.98] font-bold tracking-[-0.055em] text-white">
          {t("home.titleTop")} <br className="sm:hidden" />
          {t("home.titleBottom")}
        </h1>
        <p className="text-lift mt-6 max-w-2xl text-copy-lg leading-relaxed text-zinc">
          {t("home.lede")}
        </p>
        <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          <button
            type="button"
            onClick={() => onFly("transmission")}
            className="rounded-full bg-action px-6 py-3 text-lead font-medium text-on-action transition-colors hover:bg-action-hover"
          >
            {t("home.ctaContact")}
          </button>
          <button
            type="button"
            onClick={onStart}
            className="text-lead font-medium text-comet transition-colors hover:text-white"
          >
            {t("home.ctaFlight")}
          </button>
        </div>
      </div>
      <Pins onFly={onFly} />
    </Stage>
  );
}
