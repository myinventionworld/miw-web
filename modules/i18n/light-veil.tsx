"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The hand-off from the dark 3D home to the light pages.
 *
 * Clicking a link to a light page while the flight is on screen grows a white
 * circle from the click until it covers the window, then navigates. The light
 * page arrives under the white, so there is no dark-to-white cut. The host,
 * mounted once in the layout, lifts the veil as soon as the route changes.
 *
 * Skipped with reduced motion, with modifier keys (new tab), and anywhere the
 * WebGL deck is not running, where the page is light already.
 */

const VEIL_ID = "light-veil";
const LIGHT_ROUTES = ["/work", "/about", "/terms"];

export function isLightRoute(href: string) {
  return LIGHT_ROUTES.some((r) => href === r || href.startsWith(`${r}/`));
}

/** True when the dark flight deck is what the visitor is looking at. */
function onFlightDeck() {
  return document.querySelector("canvas") !== null;
}

/**
 * Covers the window in white from (x, y). Resolves when the window is covered.
 * Returns false (and does nothing) when the transition should be skipped.
 */
export function veilIntoLight(x: number, y: number): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !onFlightDeck() ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.getElementById(VEIL_ID)
  ) {
    return Promise.resolve(false);
  }

  const cx = x || window.innerWidth / 2;
  const cy = y || window.innerHeight / 2;
  const reach = Math.hypot(
    Math.max(cx, window.innerWidth - cx),
    Math.max(cy, window.innerHeight - cy),
  );

  const veil = document.createElement("div");
  veil.id = VEIL_ID;
  veil.setAttribute("aria-hidden", "true");
  Object.assign(veil.style, {
    position: "fixed",
    inset: "0",
    zIndex: "200",
    background: "#ffffff",
    pointerEvents: "none",
  });
  document.body.appendChild(veil);

  const grow = veil.animate(
    [
      { clipPath: `circle(0px at ${cx}px ${cy}px)` },
      { clipPath: `circle(${reach}px at ${cx}px ${cy}px)` },
    ],
    { duration: 520, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
  );
  return grow.finished.then(() => true);
}

export function LightVeilHost() {
  const pathname = usePathname();

  useEffect(() => {
    const veil = document.getElementById(VEIL_ID);
    if (!veil) return;
    // The new page is white under a white veil; fading it out is invisible
    // except for the last moment of the old page, which is gone by now.
    const fade = veil.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 260,
      delay: 60,
      easing: "ease-out",
      fill: "forwards",
    });
    fade.finished.then(() => veil.remove(), () => veil.remove());
  }, [pathname]);

  return null;
}
