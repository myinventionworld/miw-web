/**
 * The shape of the journey. The navbar, the mega-drawer, the floating dock, the
 * console, the /careers route and the 3D scene all read from here.
 *
 * Four stations: 01 is work for startups and tech teams, 02 is work for small
 * businesses, 03 is the team's own products, 04 introduces the team and links
 * to `/about`, where the people are listed. The contact
 * console is the fifth and final parking point.
 *
 * The ids are older than that split (`backend`, `commerce`, `guild`) and are
 * kept because the camera spline, the 3D bodies and every locale key are
 * addressed by them. What a station is about lives in the locale files.
 *
 * What is left in this file is structure — scroll anchors and the header's
 * sections. The ids are in `shared/station-id.ts`, the console's options in
 * `modules/enquiry/options.ts`. The words moved to
 * `locales/<lang>/stations.json` and `console.json` when the site went
 * trilingual, because three copies of this file kept in step by hand is not a
 * content model. Every
 * id below is a key over there; the interfaces near each export describe what
 * the JSON is expected to hold.
 *
 * Positioning lives in `.agents/product-marketing.md`.
 */

import type { StationId } from "@/shared/station-id";

/**
 * Copy mode. There used to be two (business and telemetry) behind a toggle;
 * there is one now, and the type stays so the locale shape does not change.
 */
export type Mode = "business";

/**
 * A headline and two sentences. `headline` is the biggest text on the station
 * and states what the visitor gets; the lede says for whom and points at the
 * work. Read from `stations:<id>.business`.
 */
export interface StationCopy {
  headline: string;
  lede: string;
}

/** `stations:<id>.program` — a label and a line per item (the services at 02). */
export interface ProgramPoint {
  label: string;
  body: string;
}

export interface Station {
  id: StationId;
  index: string;
  /** Scroll position this station is parked at, 0..1. */
  anchor: number;
  /**
   * Where the call to action goes when it is a route. Stations without one fly
   * the camera to the console instead.
   */
  ctaHref?: string;
  /** Shows a list card (`stations:<id>.program`) in place of a product frame. */
  program?: true;
}

/**
 * Deliberately no `featured` field and no project list.
 *
 * Both used to live here, which meant the deck carried a codename, a stack and
 * a blurb per station that had to be kept in step with the case study by hand —
 * and sixteen invented project names that existed only to fill a nav drawer.
 * The artifact a station shows is now looked up from `modules/work/projects.ts` by
 * station id, so there is exactly one place where a product's name, status and
 * links are written down. A station with no real system shows no frame.
 */
export const STATIONS: Station[] = [
  { id: "backend", index: "01", anchor: 0.06 },
  // No finished small-business project to show yet, so this station lists
  // what is on offer instead of a product frame.
  { id: "commerce", index: "02", anchor: 0.3, program: true },
  { id: "labs", index: "03", anchor: 0.54 },
  { id: "guild", index: "04", anchor: 0.78, ctaHref: "/about" },
];

/* ── navigation ───────────────────────────────────────────────────────── */

/**
 * The top bar has four items, which is not the same as four stations:
 * "Services" spans the two client stations, and "Contact" is the console
 * rather than a station at all.
 *
 * Label and blurb are at `stations:sections.<id>`.
 *
 * Every item opens a drawer on hover or focus. Two of them used to open
 * nothing, and a row where half the items answer the pointer and half do not
 * reads as broken rather than as two kinds of item.
 */
export interface NavSection {
  id: string;
  /** Stations listed in the drawer, with their products. */
  stations: StationId[];
  /** A drawer that is not about stations: the people, or how to reach them. */
  panel?: "team" | "contact";
  /** Where clicking the label takes you. */
  go: StationId | "console";
}

export const NAV_SECTIONS: NavSection[] = [
  { id: "studio", stations: ["backend", "commerce"], go: "backend" },
  { id: "labs", stations: ["labs"], go: "labs" },
  { id: "guild", stations: [], panel: "team", go: "guild" },
  { id: "transmission", stations: [], panel: "contact", go: "console" },
];

export function hasDrawer(section: NavSection): boolean {
  return section.stations.length > 0 || section.panel !== undefined;
}

export const CONSOLE_ANCHOR = 0.97;

/* ── commercial availability ──────────────────────────────────────────── */

/**
 * `common:availability` says whether the team is taking work, and nothing it
 * cannot back up: no invented slot counts, no average scope without a history
 * to average. `common:facts` are checkable facts about the team. Both are prose
 * and live in the locale files; change them in all three languages at once.
 */
export interface Availability {
  status: string;
  scope: string;
}

export interface Fact {
  value: string;
  label: string;
}

/* ── lookups ──────────────────────────────────────────────────────────── */

export function stationById(id: StationId): Station {
  return STATIONS.find((s) => s.id === id)!;
}

/** Index of the station whose anchor is nearest to a scroll position. */
export function nearestStation(p: number): Station {
  let best = STATIONS[0];
  let bestDist = Infinity;
  for (const s of STATIONS) {
    const d = Math.abs(s.anchor - p);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}
