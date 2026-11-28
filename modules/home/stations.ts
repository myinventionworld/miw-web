import type { StationId } from "@/shared/station-id";

/**
 * A headline and two sentences. `headline` is the biggest text on the station
 * and states what the visitor gets; the lede says for whom and points at the
 * work. Read from `stations:<id>.business`.
 */
export interface StationCopy {
  headline: string;
  lede: string;
}

/** A label and a line: the services on the ringed planet, the facts under Omnibus. */
export interface ProgramPoint {
  label: string;
  body: string;
}

export interface Station {
  id: StationId;
  /** Track time this station is parked at, 0..1. */
  anchor: number;
}

export const STATIONS: Station[] = [
  { id: "backend", anchor: 0.06 },
  { id: "commerce", anchor: 0.3 },
  { id: "labs", anchor: 0.54 },
  { id: "team", anchor: 0.78 },
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
