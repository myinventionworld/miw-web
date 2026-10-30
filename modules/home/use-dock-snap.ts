"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import Snap from "lenis/snap";

import { DOCKS } from "./flight";

/**
 * Magnetic docking for the flight deck.
 *
 * Worth writing down why this is not CSS `scroll-snap`: the page has exactly one
 * element with height — a 900vh spacer — and every station is a `position: fixed`
 * overlay driven off scroll progress. There is nothing for `scroll-snap-align` to
 * align, and Lenis owns `scrollTop` anyway, which it and the native snapper
 * fight over. Lenis ships its own snap plugin that hooks the same virtual-scroll
 * stream Lenis already debounces, so that is the mechanism.
 *
 * `proximity` rather than `mandatory` or `lock`, because a leg is nearly two
 * screens of travel. `lock` would page on a single wheel tick and hold the
 * scroll hostage for the whole flight; `mandatory` has no radius at all, so it
 * would haul the reader somewhere on every twitch. Proximity is the only one of
 * the three that can be told how far to reach, which is the whole design here.
 */

/**
 * Capture radius, as a share of the viewport height.
 *
 * The number is derived, not dialled in. Two constraints:
 *
 * It must reach every position where a card is on screen, because stopping
 * there is the half-arrived state the whole exercise is about. A station's band
 * is ±0.05 of progress, which on a 900vh runway is ±0.4 screens.
 *
 * It must *not* reach half a leg, or a deliberate flick forward is inside the
 * radius of the station it just left and gets dragged home. Legs are 0.24, so
 * half a leg is 0.12 ≈ 0.96 screens.
 *
 * Then add headroom for a quirk that cost an afternoon to find: the plugin tests
 * the threshold against `lenis.scroll + deltaY`, not `lenis.scroll`. The last
 * wheel tick of the gesture is folded in as a look-ahead, so scrolling forward
 * shortens the *forward* reach by one tick — around 140px, a fifth of the
 * viewport. 40% (band) + 20% (a tick) = 60%, comfortably under the 96% ceiling.
 */
const CAPTURE = "60%";

export function useDockSnap(lenis: Lenis | undefined) {
  useEffect(() => {
    if (!lenis) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const snap = new Snap(lenis, {
      type: "proximity",
      distanceThreshold: CAPTURE,
      // Exponential rather than a fixed duration, so a 40px correction does not
      // take as long as a full leg does.
      lerp: reduced ? 0.4 : 0.075,
      // Long enough to sit out trackpad momentum. Fire during the glide and the
      // magnet is arguing with a gesture that has not finished yet.
      debounce: 420,
    });

    /**
     * Snap points are absolute pixels but the docks are fractions of a runway
     * measured in viewport heights, so every one of them moves when the window
     * resizes. `Snap.resize()` only re-measures element-backed snaps, and Lenis
     * recomputes `limit` off its own debounced observer — hence the delay before
     * re-placing rather than reading `limit` on the resize event itself.
     */
    let drop: (() => void)[] = [];
    const place = () => {
      drop.forEach((remove) => remove());
      drop = DOCKS.map((p) => snap.add(Math.round(p * lenis.limit)));
    };

    let pending: ReturnType<typeof setTimeout> | null = null;
    const replace = () => {
      if (pending) clearTimeout(pending);
      pending = setTimeout(place, 320);
    };

    place();
    window.addEventListener("resize", replace);

    return () => {
      if (pending) clearTimeout(pending);
      window.removeEventListener("resize", replace);
      snap.destroy();
    };
  }, [lenis]);
}
