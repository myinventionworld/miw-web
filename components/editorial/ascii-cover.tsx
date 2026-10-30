"use client";

import { AsciiCanvas, hash, type AsciiCell, type AsciiField } from "@/components/ascii-canvas";

const COLORS = ["--color-white", "--color-comet", "--color-omnibus", "--color-boowie", "--color-wovie"];
const [INK, MOON_BLUE, OMNIBUS, BOOWIE, WOVIE] = COLORS.map((_, i) => i);

// Must match the composition in cover.tsx, in its 480-wide units.
const W = 480;
const BASE_H = 320;
const CX = W;
const BODY_R = 256;
const MOON = { cx: 136, r: 128, sink: 40 };
const ORBITS = [
  { r: 320, period: 120, size: 32, angle: 120, color: BOOWIE },
  { r: 384, period: 160, size: 16, angle: 170, color: WOVIE },
  { r: 448, period: 200, size: 24, angle: 152, color: OMNIBUS },
] as const;

const SIZE = 10;
const ASSEMBLE_SECONDS = 1.2;
const LIGHT = [-0.5, -0.62, 0.6];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function moon(ux: number, uy: number, h: number, px: number, cell: AsciiCell) {
  const mx = (ux - MOON.cx) / MOON.r;
  const my = (uy - (h + MOON.sink)) / MOON.r;
  const m2 = mx * mx + my * my;
  if (m2 >= 1) return false;
  const lambert = Math.max(0, -mx * LIGHT[0] - my * LIGHT[1] + Math.sqrt(1 - m2) * LIGHT[2]);
  cell.density = clamp01(((1 - Math.sqrt(m2)) * MOON.r) / px + 0.3) * (0.45 + 0.55 * lambert);
  cell.color = MOON_BLUE;
  return true;
}

function product(ux: number, uy: number, t: number, px: number, cell: AsciiCell) {
  for (const o of ORBITS) {
    const a = ((o.angle - (360 * t) / o.period) * Math.PI) / 180;
    const d = Math.hypot(ux - (CX + o.r * Math.cos(a)), uy - o.r * Math.sin(a));
    const radius = Math.max(o.size / 2, 1.1 * px);
    if (d < radius) {
      cell.density = 0.6 + 0.4 * clamp01((radius - d) / px);
      cell.color = o.color;
      return true;
    }
  }
  return false;
}

function bodyAndOrbits(ux: number, uy: number, px: number, cell: AsciiCell) {
  const d = Math.hypot(ux - CX, uy);
  if (d < BODY_R) {
    const grain = 0.5 + 0.5 * Math.sin(ux * 0.09 + uy * 0.05) * Math.sin(uy * 0.07 - ux * 0.02);
    cell.density = clamp01((BODY_R - d) / px + 0.4) * (0.78 + 0.1 * grain);
    cell.color = INK;
    return;
  }
  if (ORBITS.some((o) => Math.abs(d - o.r) < 0.45 * px)) cell.density = 0.2;
}

const SIGNALS = {
  weak: { bandEvery: 9, bandFor: 2.4, firstBandAt: 5, bandRows: 1.5, torn: 0.3, droppedRows: 0, staticAbove: 0.994 },
  lost: { bandEvery: 3.2, bandFor: 1.6, firstBandAt: 1.4, bandRows: 3, torn: 0.55, droppedRows: 0.07, staticAbove: 0.982 },
};

type Signal = keyof typeof SIGNALS;

const stillAt = (signal: Signal) => {
  const { firstBandAt, bandFor } = SIGNALS[signal];
  return signal === "lost" ? firstBandAt + bandFor / 2 : ASSEMBLE_SECONDS + 0.4;
};

const fieldFor = (signal: Signal): AsciiField => {
  const { bandEvery, bandFor, firstBandAt, bandRows, torn, droppedRows, staticAbove } = SIGNALS[signal];
  return (x, y, frame, cell) => {
    const s = frame.width / W;
    const h = Math.max(BASE_H, frame.height / s);
    const px = SIZE / s;
    const { t } = frame;
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    if (droppedRows && hash(iy, Math.floor(t * 3), 11) < droppedRows) return;

    let sx = x;
    const phase = (t - firstBandAt + bandEvery) % bandEvery;
    if (phase < bandFor) {
      const band = (phase / bandFor) * (frame.height + 8 * SIZE) - 4 * SIZE;
      if (Math.abs(y - band) < bandRows * SIZE) {
        const tick = Math.floor(t * 10);
        sx += (hash(iy, tick) - 0.5) * 7 * SIZE;
        if (hash(ix, iy, tick) < torn) {
          cell.density = 0.15 + 0.5 * hash(iy, ix, tick);
          return;
        }
      }
    }

    const ux = sx / s;
    const uy = y / s;
    if (!moon(ux, uy, h, px, cell) && !product(ux, uy, t, px, cell)) bodyAndOrbits(ux, uy, px, cell);

    if (t < ASSEMBLE_SECONDS && cell.density > 0 && t < hash(ix, iy, 7) * ASSEMBLE_SECONDS) {
      cell.density = hash(ix, iy, Math.floor(t * 20));
    }

    if (cell.density === 0 && hash(ix, iy, Math.floor(t * 4)) > staticAbove) cell.density = 0.12;
  };
};

const FIELDS = { weak: fieldFor("weak"), lost: fieldFor("lost") };

export function AsciiCover({ signal = "weak" }: { signal?: Signal }) {
  return <AsciiCanvas field={FIELDS[signal]} colors={COLORS} size={SIZE} still={stillAt(signal)} />;
}
