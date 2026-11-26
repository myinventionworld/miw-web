import { STATION_IDS, type StationId } from "@/shared/station-id";

export const LANDING = "landing";
export const TAKEOFF = "takeoff";
export const CROSSFADE = "crossfade";

export type Surface = "flight" | "light";

export function transitionType(from: Surface, to: Surface) {
  if (from === "flight" && to === "light") return LANDING;
  if (from === "light" && to === "flight") return TAKEOFF;
  return CROSSFADE;
}

/**
 * `<ViewTransition>` classes for a page's content. React does not crossfade
 * the root, so each surface fades itself: the flight out and the light page
 * in on a landing, the other way round on a take-off, a plain crossfade
 * between light pages.
 */
export const PAGE_TRANSITION = {
  flight: {
    enter: { [TAKEOFF]: "takeoff-in", [CROSSFADE]: "auto", default: "none" },
    exit: { [LANDING]: "landing-out", [CROSSFADE]: "auto", default: "none" },
  },
  light: {
    enter: { [LANDING]: "landing-in", [TAKEOFF]: "auto", [CROSSFADE]: "auto", default: "none" },
    exit: { [TAKEOFF]: "takeoff-out", [LANDING]: "auto", [CROSSFADE]: "auto", default: "none" },
  },
} as const;

export type Section = StationId | "transmission";

export function sectionFromHash(hash: string): Section | null {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (id === "transmission") return id;
  return (STATION_IDS as readonly string[]).includes(id) ? (id as StationId) : null;
}

/** What the planet turns into on the page it lands on: About's cover, or a product's dot. */
export function landingMarkFor(path: string, product: string | null): string | null {
  const route = path.replace(/^\/(en|ru|cs)(?=\/|$)/, "").replace(/[?#].*$/, "");
  if (route === "/about") return "cover";
  const study = /^\/work\/([^/]+)$/.exec(route);
  if (study) return `product:${study[1]}`;
  if (route === "/work") return product ? `product:${product}` : null;
  return null;
}

let mark: string | null = null;

export function setLandingMark(next: string | null) {
  mark = next;
}

export function landingMark() {
  return mark;
}

type Lander = (href: string) => void;

let lander: Lander | null = null;

/** The flight deck takes over links into the light pages while it is on screen. */
export function registerLander(next: Lander) {
  lander = next;
  return () => {
    if (lander === next) lander = null;
  };
}

export function currentLander() {
  return lander;
}
