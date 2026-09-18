"use client";

import type { ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";

export type ScrollWindow = readonly [number, number, number, number];

const EPS = 1e-4;

/**
 * Scroll progress only ever spans 0..1. Feeding `useTransform` stops outside
 * that range crashes the renderer, so windows are clamped into it and kept
 * strictly increasing (equal stops would divide by zero).
 */
function sanitizeWindow(win: ScrollWindow): [number, number, number, number] {
  const s = win.map((v) => Math.min(1, Math.max(0, v)));

  for (let i = 1; i < s.length; i++) {
    if (s[i] <= s[i - 1]) s[i] = s[i - 1] + EPS;
  }
  for (let i = s.length - 1; i > 0; i--) {
    if (s[i] > 1) s[i - 1] = Math.min(s[i - 1], s[i] - EPS);
  }

  return [s[0], s[1], s[2], Math.min(s[3], 1)];
}

/**
 * A fixed, full-viewport panel that fades in and out across a scroll window.
 * Driven by MotionValues so nothing here re-renders while scrolling.
 */
export function Stage({
  progress,
  window: win,
  children,
  className,
  lift = 46,
  enter = true,
  exit = true,
}: {
  progress: MotionValue<number>;
  window: ScrollWindow;
  children: ReactNode;
  className?: string;
  lift?: number;
  /** False for stages already on screen at load, so they skip the entry fade. */
  enter?: boolean;
  /** False for the final stage, so it holds instead of fading past the end. */
  exit?: boolean;
}) {
  const [a, b, c, d] = sanitizeWindow(win);

  /**
   * Holds the end values out to 0 and 1 so the ramp spans the whole scroll.
   *
   * `useTransform` clamps outside its range, so these extra stops are redundant
   * — today. They were not always: when `progress` came from `useScroll`, motion
   * handed the resulting `opacity` to a native `ScrollTimeline` and Chrome
   * filled whatever slice of the timeline the keyframes left uncovered by
   * interpolating back toward the element's underlying style. A window ending at
   * 0.036 faded the hero out on cue and then quietly faded it *back in* across
   * the remaining 96% of the page.
   *
   * `progress` is now a plain MotionValue driven by Lenis, so there is no
   * timeline to leave uncovered. Kept because it costs two array pushes and the
   * failure it prevents took a long time to find.
   */
  const ramp = (values: number[]): [number[], number[]] => {
    const input = [a, b, c, d];
    const output = [...values];
    if (a > 0) {
      input.unshift(0);
      output.unshift(values[0]);
    }
    if (d < 1) {
      input.push(1);
      output.push(values[values.length - 1]);
    }
    return [input, output];
  };

  const opacity = useTransform(progress, ...ramp([enter ? 0 : 1, 1, 1, exit ? 0 : 1]));
  const y = useTransform(progress, ...ramp([enter ? lift : 0, 0, 0, exit ? -lift : 0]));
  const scale = useTransform(progress, ...ramp([enter ? 0.975 : 1, 1, 1, exit ? 1.045 : 1]));

  // Culled when fully outside the window, so a faded stage never eats a pointer
  // event. Derived from `progress` rather than from `opacity` so it stays true
  // regardless of who ends up owning the opacity animation.
  const visibility = useTransform(progress, (p) =>
    (enter && p <= a) || (exit && p >= d) ? "hidden" : "visible",
  );

  return (
    <motion.section
      style={{ opacity, y, scale, visibility }}
      className={cn(
        "pointer-events-none fixed inset-0 z-20 will-change-transform",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}
