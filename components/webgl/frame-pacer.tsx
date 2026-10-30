"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { flight } from "@/lib/flight";

const ACTIVE_FPS = 60;
const IDLE_FPS = 30;

export const pacing = { target: ACTIVE_FPS, floor: ACTIVE_FPS };

const POINTER_SETTLED = 0.965;

function moving() {
  const steering = flight.eased < POINTER_SETTLED;
  return (
    Math.abs(flight.progress - flight.eased) > 1e-4 ||
    Math.abs(flight.velocity) > 0.005 ||
    flight.warp > 0.005 ||
    flight.pulse > 0 ||
    (steering &&
      (Math.abs(flight.pointer.x - flight.pointerEased.x) > 0.002 ||
        Math.abs(flight.pointer.y - flight.pointerEased.y) > 0.002))
  );
}

/**
 * Drives a `frameloop="never"` canvas at no less than 60fps while anything
 * moves and 30 at rest, by drawing every nth display frame.
 */
export function FramePacer() {
  const advance = useThree((s) => s.advance);

  useEffect(() => {
    let raf = 0;
    let prev = -Infinity;
    let refresh = 1000 / 60;
    let waited = 0;
    let drawn = -Infinity;
    let elapsed = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      if (prev > -Infinity) refresh = refresh * 0.9 + Math.min(now - prev, 100) * 0.1;
      prev = now;

      pacing.target = moving() ? ACTIVE_FPS : IDLE_FPS;
      pacing.floor = Math.min(pacing.floor, pacing.target);
      // Whole display frames only: a time-based cap on a 75 or 144Hz screen
      // alternates short and long gaps, which reads as judder.
      const every = Math.max(1, Math.floor(1000 / pacing.target / refresh + 0.1));
      if (++waited < every) return;
      waited = 0;

      if (drawn > -Infinity) elapsed += Math.min((now - drawn) / 1000, 0.1);
      drawn = now;
      advance(elapsed);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [advance]);

  return null;
}
