"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { flight } from "@/lib/flight";

const ACTIVE_FPS = 60;
const IDLE_FPS = 30;

export const pacing = { target: ACTIVE_FPS, floor: ACTIVE_FPS };

function moving() {
  return (
    Math.abs(flight.progress - flight.eased) > 1e-4 ||
    Math.abs(flight.velocity) > 0.005 ||
    flight.warp > 0.005 ||
    flight.pulse > 0 ||
    Math.abs(flight.pointer.x - flight.pointerEased.x) > 0.002 ||
    Math.abs(flight.pointer.y - flight.pointerEased.y) > 0.002
  );
}

/** Drives a `frameloop="never"` canvas: 60fps while anything moves, 30 at rest. */
export function FramePacer() {
  const advance = useThree((s) => s.advance);

  useEffect(() => {
    let raf = 0;
    let last = -Infinity;
    let elapsed = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      pacing.target = moving() ? ACTIVE_FPS : IDLE_FPS;
      pacing.floor = Math.min(pacing.floor, pacing.target);
      if (now - last < 1000 / pacing.target - 1) return;

      if (last > -Infinity) elapsed += Math.min((now - last) / 1000, 0.1);
      last = now;
      advance(elapsed);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [advance]);

  return null;
}
