"use client";

import { type RefObject, useEffect, useRef } from "react";

import { flight, type BodyScreen } from "./flight";
import type { StationId } from "@/shared/station-id";

export function useBodyScreen(
  id: StationId,
  ref: RefObject<HTMLElement | null>,
  place: (screen: BodyScreen, el: HTMLElement) => void,
) {
  const latest = useRef(place);
  useEffect(() => {
    latest.current = place;
  });

  useEffect(() => {
    let raf = 0;
    let last = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = ref.current;
      if (!el) return;
      const s = flight.bodyScreen;
      if (!s || s.id !== id || !s.visible || flight.dive > 0.02) {
        if (last !== "off") el.style.visibility = "hidden";
        last = "off";
        return;
      }
      const key = `${Math.round(s.x * 2)},${Math.round(s.y * 2)},${Math.round(s.r * 2)},${window.innerWidth},${window.innerHeight}`;
      if (key === last) return;
      if (last === "off" || last === "") el.style.visibility = "inherit";
      last = key;
      latest.current(s, el);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [id, ref]);
}
