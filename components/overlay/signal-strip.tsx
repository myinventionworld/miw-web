"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { AsciiCanvas, hash, type AsciiField } from "@/components/ascii-canvas";
import { cn } from "@/lib/utils";

export type SignalState = "idle" | "still" | "sending" | "sent";

const COLORS = ["--color-steel", "--color-white", "--color-signal"];
const [NOISE, CARRIER, PULSE_BLUE] = COLORS.map((_, i) => i);
const SIZE = 11;
const PULSE_SECONDS = 1.3;

export function SignalStrip({ state, className }: { state: SignalState; className?: string }) {
  const reduce = useReducedMotion();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setSettled(false);
    if (state !== "sent") return;
    const id = window.setTimeout(() => setSettled(true), (PULSE_SECONDS + 0.4) * 1000);
    return () => window.clearTimeout(id);
  }, [state]);

  const field = useMemo<AsciiField>(() => {
    let stateStartedAt = -1;
    return (x, y, frame, cell) => {
      if (stateStartedAt < 0) stateStartedAt = frame.t;
      const { width, height, cellWidth: cw, cellHeight: ch, t } = frame;
      // On a row's middle, or a flat line is drawn as "_" instead of "-".
      const mid = (Math.floor(height / 2 / ch) + 0.5) * ch;
      const ends = (u: number) => Math.sqrt(Math.max(0, Math.sin((Math.PI * u) / width)));
      let color = CARRIER;
      let line: (u: number) => number;

      if (state === "sending") {
        const jitter = (u: number) => (hash(Math.floor(u / cw), Math.floor(t * 12)) - 0.5) * 0.5;
        line = (u) => mid + height * 0.32 * ends(u) * (Math.sin((u / width) * Math.PI * 9 - t * 7) + jitter(u));
      } else if (state === "sent") {
        const elapsed = reduce ? Infinity : t - stateStartedAt;
        const reach = 0.1 * width;
        const at = (elapsed / PULSE_SECONDS) * (width + 2 * reach) - reach;
        const packet = (u: number) => Math.exp(-(((u - at) / reach) ** 2));
        line = (u) => mid + height * 0.36 * packet(u) * Math.sin(u / 4);
        if (packet(x) > 0.15) color = PULSE_BLUE;
      } else {
        line = (u) => mid + height * 0.26 * ends(u) * Math.sin((u / width) * Math.PI * 4 - t * 1.4);
      }

      const left = line(x - cw / 2);
      const right = line(x + cw / 2);
      const slope = (right - left) / cw;
      const top = y - ch / 2;
      const bottom = y + ch / 2;
      if (Math.abs(slope) < 0.35) {
        const at = (left + right) / 2;
        if (at >= top && at < bottom) {
          cell.glyph = at > y + ch * 0.2 ? "_" : "-";
          cell.color = color;
          return;
        }
      } else if (Math.max(left, right) >= top && Math.min(left, right) < bottom) {
        cell.glyph = Math.abs(slope) > 2.5 ? "|" : slope > 0 ? "\\" : "/";
        cell.color = color;
        return;
      }

      cell.color = NOISE;
      if (Math.abs(y - mid) < ch / 2 && Math.floor(x / cw) % 2 === 0) cell.density = 0.12;
      else if (hash(Math.floor(x), Math.floor(y), Math.floor(t * 3)) > 0.985) cell.density = 0.12;
    };
  }, [state, reduce]);

  return (
    <div aria-hidden className={cn("h-16 w-full", className)}>
      <AsciiCanvas field={field} colors={COLORS} size={SIZE} running={state !== "still" && !settled} />
    </div>
  );
}
