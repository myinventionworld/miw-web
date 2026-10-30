"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { flight } from "../flight";

const MOVING_MIN_FPS = 60;
const IDLE_FPS = 30;

export const pacing = { target: MOVING_MIN_FPS, floor: MOVING_MIN_FPS };

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
 * Drives a `frameloop="never"` canvas: every display frame while anything
 * moves, every nth at rest for about 30fps.
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

      const active = moving();
      pacing.target = active ? MOVING_MIN_FPS : IDLE_FPS;
      pacing.floor = Math.min(pacing.floor, pacing.target);
      // Whole display frames only: a time-based cap on a 75 or 144Hz screen
      // alternates short and long gaps, which reads as judder.
      const every = active ? 1 : Math.max(1, Math.floor(1000 / IDLE_FPS / refresh + 0.1));
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
