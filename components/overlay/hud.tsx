"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { flight } from "@/lib/flight";
import { STATIONS, CONSOLE_ANCHOR } from "@/lib/stations";
import { cn } from "@/lib/utils";

const TICKS = [...STATIONS.map((s) => s.anchor), CONSOLE_ANCHOR];

/**
 * Halfway down the final leg the console becomes the destination. `flight.station`
 * can only ever name a STATION, so without this the strip still reads "Products"
 * while the camera is parked on the contact form.
 */
const CONSOLE_FROM =
  (STATIONS[STATIONS.length - 1].anchor + CONSOLE_ANCHOR) / 2;

/**
 * Flight instrumentation strip. Everything here is written straight to the DOM
 * inside rAF — routing 60Hz telemetry through React state would cost the whole
 * frame budget, and none of it affects layout.
 *
 * The navbar owns the top of the screen, so this is footer-only.
 */
export function Hud({ visible }: { visible: boolean }) {
  const { t } = useTranslation(["common", "stations"]);
  const status = useRef<HTMLSpanElement>(null);
  const transit = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    let frame = 0;
    let lastStatus = "";

    const tick = () => {
      frame = requestAnimationFrame(tick);

      const p = flight.eased;
      const station = STATIONS[flight.station];
      const docked = flight.proximity > 0.62;

      const state = docked
        ? t("hud.docked")
        : p >= CONSOLE_FROM
          ? t("hud.approaching")
          : t("hud.inTransit");
      const target =
        p >= CONSOLE_FROM
          ? t("hud.console")
          : `${station.index} ${t(`stations:${station.id}.nav`)}`;
      const next = `${state} · ${target}`;
      if (status.current && next !== lastStatus) {
        status.current.textContent = next;
        lastStatus = next;
      }

      if (transit.current) transit.current.textContent = flight.warp.toFixed(2);
      if (track.current) {
        track.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      }
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, t]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-6 pb-5 transition-opacity duration-500 md:px-10 md:pb-7",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="relative mb-3 h-px w-full bg-white/15">
        <div
          ref={bar}
          className="hairline h-px w-full origin-left"
          style={{ transform: "scaleX(0)" }}
        />
        {TICKS.map((t) => (
          <span
            key={t}
            className="absolute -top-1 h-2 w-px bg-white/35"
            style={{ left: `${t * 100}%` }}
          />
        ))}
      </div>

      <div className="flex items-end justify-between gap-6 font-mono text-[10px] tracking-telemetry uppercase">
        <div className="flex items-center gap-2.5 text-platinum">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          <span ref={status}>
            {t("hud.docked")} · {STATIONS[0].index}{" "}
            {t(`stations:${STATIONS[0].id}.nav`)}
          </span>
        </div>

        <div className="flex gap-6 text-zinc md:gap-10">
          <span className="hidden sm:inline">
            {t("hud.transit")}{" "}
            <span ref={transit} className="text-platinum tabular-nums">
              0.00
            </span>
          </span>
          <span>
            {t("hud.track")}{" "}
            <span ref={track} className="text-white tabular-nums">
              000
            </span>
            <span className="text-steel"> / 100</span>
          </span>
        </div>
      </div>
    </div>
  );
}
