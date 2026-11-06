"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { flight } from "../flight";
import { createGpuTimer } from "./gpu-timer";
import type { QualityGovernor } from "./quality";

const MOVING_MIN_FPS = 60;
const IDLE_FPS = 30;

/** Draws anyway if shader warm-up never reports back, as on a context lost mid-compile. */
const WARMUP_LIMIT_MS = 8000;

const POINTER_SETTLED = 0.965;

const LOG_SIZE = 240;

/** Recent frame and GPU times and the start-up timeline, read by the diagnostics overlay. */
export const frameLog = {
  intervals: [] as number[],
  gpu: [] as number[],
  mounted: 0,
  warm: 0,
  shown: 0,
};

function log(list: number[], value: number) {
  list.push(value);
  if (list.length > LOG_SIZE) list.shift();
}

export interface Gate {
  open: boolean;
}

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
 * moves, every nth at rest for about 30fps. Nothing is drawn until `gate`
 * opens, once the scene's shaders are compiled. Tells the governor how late
 * each frame arrived against the rate it asked for.
 */
export function FramePacer({ governor, gate }: { governor: QualityGovernor; gate: Gate }) {
  const advance = useThree((s) => s.advance);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const timer = createGpuTimer(gl.getContext() as WebGL2RenderingContext);
    // Reset once per frame below instead of once per render call, so the
    // counts cover every pass of the composer, not just the last one.
    gl.info.autoReset = false;
    const giveUp = performance.now() + WARMUP_LIMIT_MS;

    let raf = 0;
    let prev = -Infinity;
    let refresh = 1000 / 60;
    let fastest = Infinity;
    let waited = 0;
    let drawn = -Infinity;
    let elapsed = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      if (prev > -Infinity) {
        const gap = now - prev;
        refresh = refresh * 0.9 + Math.min(gap, 100) * 0.1;
        if (gap > 2) fastest = Math.min(fastest, gap);
      }
      prev = now;

      const gpu = timer?.read();
      if (gpu !== undefined) {
        governor.gpuTime(gpu);
        log(frameLog.gpu, gpu);
      }

      if (!gate.open) {
        if (now < giveUp) return;
        gate.open = true;
      }

      const active = moving();
      // Whole display frames only: a time-based cap on a 75 or 144Hz screen
      // alternates short and long gaps, which reads as judder.
      const every = active ? 1 : Math.max(1, Math.floor(1000 / IDLE_FPS / refresh + 0.1));
      if (++waited < every) return;
      waited = 0;

      if (drawn > -Infinity) {
        const interval = now - drawn;
        elapsed += Math.min(interval / 1000, 0.1);
        // A 30Hz screen cannot do better than 33 ms, and that is not lateness.
        const floor = Number.isFinite(fastest) ? fastest * every : 0;
        governor.frame(interval, Math.max(1000 / (active ? MOVING_MIN_FPS : IDLE_FPS), floor), active);
        log(frameLog.intervals, interval);
      }
      drawn = now;

      gl.info.reset();
      timer?.begin();
      advance(elapsed);
      timer?.end();
    };

    const interrupt = () => governor.interrupt();
    document.addEventListener("visibilitychange", interrupt);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", interrupt);
      timer?.dispose();
    };
  }, [advance, gl, governor, gate]);

  return null;
}
