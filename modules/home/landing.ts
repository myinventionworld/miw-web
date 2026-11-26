"use client";

import { flight } from "./flight";

const EASE = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Moves `flight.dive` to `to` over `ms`. A click or a key finishes it at once. */
export function runDive(to: number, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const from = flight.dive;
    const start = performance.now();
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", finish, true);
      window.removeEventListener("keydown", finish, true);
      flight.dive = to;
      resolve();
    };
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      flight.dive = from + (to - from) * EASE(t);
      if (t >= 1) finish();
      else raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointerdown", finish, true);
    window.addEventListener("keydown", finish, true);
    raf = requestAnimationFrame(step);
  });
}

/** Gives the scene a few frames to place the dive body on screen. */
export function settle(): Promise<void> {
  flight.dive = Math.max(flight.dive, 1e-4);
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

/** While a page transition plays, a click or a key jumps to its end. */
export function skipTransitionOnInput(ms: number) {
  const skip = () => {
    for (const a of document.getAnimations()) {
      const target = a.effect as KeyframeEffect | null;
      if (target?.pseudoElement?.startsWith("::view-transition")) a.finish();
    }
  };
  window.addEventListener("pointerdown", skip, true);
  window.addEventListener("keydown", skip, true);
  window.setTimeout(() => {
    window.removeEventListener("pointerdown", skip, true);
    window.removeEventListener("keydown", skip, true);
  }, ms);
}
