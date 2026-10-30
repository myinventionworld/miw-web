"use client";

import { AsciiCanvas, hash, type AsciiField } from "@/shared/ui/ascii-canvas";

const COLORS = ["--color-steel", "--color-white", "--color-comet"];
const [NOISE, STAR, PLANET] = COLORS.map((_, i) => i);
const SIZE = 14;
const LIGHT = [-0.55, -0.5, 0.67];

const field: AsciiField = (x, y, frame, cell) => {
  const { width, height, cellWidth, cellHeight, t } = frame;
  const col = Math.floor(x / cellWidth);
  const row = Math.floor(y / cellHeight);

  const tick = Math.floor(t * 8);
  const band = ((t / 2.6) % 1) * (height + 6 * cellHeight) - 3 * cellHeight;
  const inBand = Math.abs(y - band) < 2 * cellHeight;
  if (inBand && hash(col, row, tick) < 0.5) {
    cell.density = 0.15 + 0.5 * hash(row, col, tick);
    cell.color = NOISE;
    return;
  }
  const sx = inBand ? x + (hash(row, tick) - 0.5) * 8 * cellWidth : x;

  const r = 0.36 * Math.min(width, height * 1.4);
  const px = (sx - 0.66 * width) / r;
  const py = (y - 0.56 * height) / r;
  const d2 = px * px + py * py;
  if (d2 < 1) {
    const lambert = Math.max(0, -px * LIGHT[0] - py * LIGHT[1] + Math.sqrt(1 - d2) * LIGHT[2]);
    cell.density = 0.12 + 0.75 * lambert;
    cell.color = PLANET;
    return;
  }

  const drift = Math.floor(col + t * 0.6);
  const star = hash(drift, row, 3);
  if (star > 0.985) {
    cell.density = 0.12 + 0.4 * hash(drift, row, Math.floor(t * 2));
    cell.color = STAR;
    return;
  }

  if (hash(col, row, Math.floor(t * 5)) > 0.992) {
    cell.density = 0.12;
    cell.color = NOISE;
  }
};

export function SignalLost({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 bg-void">
      <AsciiCanvas field={field} colors={COLORS} size={SIZE} fps={10} />
      <p
        role="status"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-void/80 px-4 py-2 font-mono text-label whitespace-nowrap text-zinc"
      >
        {message}
      </p>
    </div>
  );
}
