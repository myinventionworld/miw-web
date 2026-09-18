/**
 * Single mutable flight-state singleton shared by the WebGL scene and the DOM
 * overlay. Deliberately not React state: every field is read inside `useFrame`
 * or a rAF loop at 60Hz, and routing that through the reconciler would burn the
 * entire frame budget.
 */

import { STATIONS, CONSOLE_ANCHOR, type StationId } from "./stations";

export interface Pointer {
  x: number;
  y: number;
}

export interface FlightState {
  /** Raw document scroll, 0..1. */
  progress: number;
  /** Critically damped `progress` — safe to drive geometry with. */
  eased: number;
  /** Signed scroll velocity, roughly -1..1. */
  velocity: number;
  /** Transit intensity between stations, 0..1. Drives the star streaks. */
  warp: number;
  /** 1 when parked at a station, 0 mid-transit. */
  proximity: number;
  /** Index into STATIONS of whichever station is nearest. */
  station: number;
  /** 1 → 0 decaying impulse fired by the transmission console. */
  pulse: number;
  /** Normalised pointer, -1..1 on both axes. */
  pointer: Pointer;
  /** Damped pointer, used for camera parallax. */
  pointerEased: Pointer;
  reducedMotion: boolean;
}

export const flight: FlightState = {
  progress: 0,
  eased: 0,
  velocity: 0,
  warp: 0,
  proximity: 1,
  station: 0,
  pulse: 0,
  pointer: { x: 0, y: 0 },
  pointerEased: { x: 0, y: 0 },
  reducedMotion: false,
};

export function firePulse() {
  flight.pulse = 1;
}

/* ── math ─────────────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Framerate-independent exponential approach. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * Math.min(dt, 0.1)));
}

/* ── celestial bodies ─────────────────────────────────────────────────── */

export type Vec3 = [number, number, number];

/** The chrome mark sits on the track itself, so the camera flies through it. */
export const LOGO_ORIGIN: Vec3 = [5.6, 3.0, -1.0];

// Keyed by StationId so a station rename fails the build instead of silently
// resolving to `undefined` inside useFrame.
export const BODY: Record<StationId, { pos: Vec3; radius: number }> = {
  backend: { pos: [-18, -11, -64], radius: 19 },
  commerce: { pos: [22, -3, -246], radius: 15 },
  labs: { pos: [-19, 6, -420], radius: 16 },
  guild: { pos: [0, 0, -648], radius: 12 },
};

/**
 * Where the body sits in frame once docked, in half-screens: x +1 is the right
 * edge, y +1 is the top. The dock lock centres the body by construction, so
 * without this every station composes identically — and worse, the info card
 * now alternates sides down the page, which would park three of the four cards
 * directly on top of their own subject.
 *
 * Read it as the mirror of the card: card left, body right.
 */
export const FRAME_BIAS: Record<StationId, { x: number; y: number }> = {
  backend: { x: 0.52, y: -0.06 },
  commerce: { x: -0.54, y: 0.02 },
  labs: { x: 0.52, y: 0.04 },
  // Station 04's card is centred, so the pulsar has nowhere sideways to go and
  // is lifted clear of it instead.
  guild: { x: 0.04, y: 0.5 },
};

/**
 * World offset that moves the aim point one half-screen. Derived from the docked
 * lens (38° vertical) at `LOOK_DISTANCE`, so a bias of 1.0 lands the body on the
 * frame edge rather than at some arbitrary amount of rotation.
 */
export const BIAS_SCALE = { x: 10, y: 5.6 } as const;

/* ── camera track ─────────────────────────────────────────────────────── */

/**
 * Scroll-pinned keyframes. Interpolated with Catmull–Rom, so the camera is
 * exactly on the keyframe at its scroll position — that is what lets each
 * station be framed deliberately instead of approximately.
 */
export const WAYPOINTS: { p: number; pos: Vec3 }[] = [
  { p: 0.0, pos: [7, 3.2, 12] },
  { p: 0.06, pos: [7, 3, -6] }, // station 01
  { p: 0.16, pos: [2, 5, -60] },
  { p: 0.3, pos: [-11, 4, -178] }, // station 02
  { p: 0.42, pos: [0, -2, -262] },
  { p: 0.54, pos: [13, -4, -352] }, // station 03
  { p: 0.66, pos: [4, 2, -452] },
  { p: 0.78, pos: [-9, 4, -545] }, // station 04
  // The last leg passes the pulsar rather than flying into it. Parking the
  // console on the star's face is exactly the washed-out frame this rebuild
  // exists to remove, so the track slides abeam and leaves it astern.
  { p: 0.86, pos: [-19, 6, -604] },
  { p: 0.93, pos: [-30, 8, -672] },
  { p: 0.97, pos: [-34, 9, -708] }, // console
  { p: 1.0, pos: [-36, 10, -722] },
];

function catmull(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * b +
      (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t2 +
      (-a + 3 * b - 3 * c + d) * t3)
  );
}

/** Camera position for a scroll value, written into `out` to avoid garbage. */
export function sampleCamera(p: number, out: Vec3): Vec3 {
  const n = WAYPOINTS.length;
  const x = clamp01(p);

  let i = 0;
  while (i < n - 2 && x > WAYPOINTS[i + 1].p) i++;

  const w0 = WAYPOINTS[Math.max(0, i - 1)];
  const w1 = WAYPOINTS[i];
  const w2 = WAYPOINTS[i + 1];
  const w3 = WAYPOINTS[Math.min(n - 1, i + 2)];

  const span = Math.max(1e-6, w2.p - w1.p);
  const t = clamp01((x - w1.p) / span);

  out[0] = catmull(w0.pos[0], w1.pos[0], w2.pos[0], w3.pos[0], t);
  out[1] = catmull(w0.pos[1], w1.pos[1], w2.pos[1], w3.pos[1], t);
  out[2] = catmull(w0.pos[2], w1.pos[2], w2.pos[2], w3.pos[2], t);
  return out;
}

/* ── station logic ────────────────────────────────────────────────────── */

/** Every point the camera parks at, including the console. */
export const ANCHORS: number[] = [
  ...STATIONS.map((s) => s.anchor),
  CONSOLE_ANCHOR,
];

/**
 * Every position the scroll magnet is allowed to rest at. The hero is a parking
 * point too — it just has no station anchor, because no camera keyframe needs to
 * be locked to it.
 */
export const DOCKS: number[] = [0, ...ANCHORS];

/** Index of the nearest anchor and the normalised gap position around it. */
function segment(p: number) {
  const first = ANCHORS[0];
  const last = ANCHORS[ANCHORS.length - 1];

  if (p <= first) return { u: 0, before: -1, after: 0 };
  if (p >= last) return { u: 0, before: ANCHORS.length - 1, after: -1 };

  let i = 0;
  while (i < ANCHORS.length - 2 && p > ANCHORS[i + 1]) i++;

  const a = ANCHORS[i];
  const b = ANCHORS[i + 1];
  return { u: (p - a) / Math.max(1e-6, b - a), before: i, after: i + 1 };
}

/**
 * Transit intensity. Zero while parked at a station, ramping to full in the
 * middle of a leg — the streaks accelerate out of a station and decelerate
 * into the next one.
 */
export function warpAt(p: number) {
  const { u, before, after } = segment(p);
  if (before < 0 || after < 0) return 0;
  return smootherstep(0.06, 0.4, u) * (1 - smootherstep(0.6, 0.94, u));
}

/** 1 while parked at a station, 0 mid-leg. The inverse shape of `warpAt`. */
export function proximityAt(p: number) {
  const { u, before, after } = segment(p);
  if (before < 0 || after < 0) return 1;
  const away = smootherstep(0, 0.34, u) * (1 - smootherstep(0.66, 1, u));
  return 1 - away;
}

/** Index into STATIONS of the station nearest to a scroll value. */
export function stationIndexAt(p: number) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < STATIONS.length; i++) {
    const d = Math.abs(STATIONS[i].anchor - p);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
