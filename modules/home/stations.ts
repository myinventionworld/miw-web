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
  /** Track time this station is parked at, 0..1. */
  anchor: number;
  /** A route the station opens onto, labelled `stations:<id>.door`. */
  door?: "/work" | "/about";
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
  { id: "backend", anchor: 0.06 },
  { id: "commerce", anchor: 0.3, program: true },
  { id: "labs", anchor: 0.54, door: "/work" },
];

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
