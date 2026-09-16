"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import {
  clamp01,
  damp,
  flight,
  proximityAt,
  stationIndexAt,
  warpAt,
} from "@/lib/flight";

/**
 * Single writer for the derived flight fields. Runs at negative priority so
 * every other `useFrame` in the scene reads values settled this same frame.
 */
export function FlightDriver() {
  const last = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    flight.eased = damp(flight.eased, flight.progress, 8.5, dt);

    const rate = (flight.eased - last.current) / Math.max(dt, 1e-4);
    last.current = flight.eased;
    const signed = Math.max(-1, Math.min(1, rate * 2.4));
    flight.velocity = damp(flight.velocity, signed, 7, dt);

    // Streaks accelerate out of a station and decelerate into the next one.
    flight.warp = clamp01(warpAt(flight.eased) + Math.abs(flight.velocity) * 0.1);
    if (flight.reducedMotion) flight.warp *= 0.45;

    flight.proximity = proximityAt(flight.eased);
    flight.station = stationIndexAt(flight.eased);

    flight.pointerEased.x = damp(flight.pointerEased.x, flight.pointer.x, 4, dt);
    flight.pointerEased.y = damp(flight.pointerEased.y, flight.pointer.y, 4, dt);
  }, -10);

  return null;
}
