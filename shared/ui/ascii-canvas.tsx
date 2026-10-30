"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/cn";
import { useIdle } from "@/shared/lib/use-idle";

export const RAMP = " .:-=+*#%@";

// JetBrains Mono's advance; the grid only lines up with that face.
const GLYPH_WIDTH = 0.6;

export interface AsciiFrame {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  t: number;
}

export interface AsciiCell {
  density: number;
  color: number;
  glyph: string;
}

export type AsciiField = (x: number, y: number, frame: AsciiFrame, cell: AsciiCell) => void;

export function AsciiCanvas({
  field,
  colors,
  size = 12,
  fps = 12,
  running = true,
  still = 0,
  ramp = RAMP,
  className,
}: {
  field: AsciiField;
  colors: readonly string[];
  size?: number;
  fps?: number;
  running?: boolean;
  still?: number;
  ramp?: string;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const idle = useIdle(canvas);

  const fieldRef = useRef(field);
  const draw = useRef<() => void>(() => {});
  const clock = useRef(0);
  const palette = colors.join("|");

  useEffect(() => {
    fieldRef.current = field;
    draw.current();
  }, [field]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    let width = 0;
    let height = 0;
    let fills: string[] = [];
    const font = `${size}px ${getComputedStyle(el).getPropertyValue("--font-mono").trim() || "monospace"}`;
    const cellW = size * GLYPH_WIDTH;
    const cell: AsciiCell = { density: 0, color: 0, glyph: "" };

    draw.current = () => {
      if (!width || !height) return;
      const frame: AsciiFrame = { width, height, cellWidth: cellW, cellHeight: size, t: clock.current };
      const cols = Math.ceil(width / cellW);
      const rows = Math.ceil(height / size);
      const last = ramp.length - 1;
      ctx.clearRect(0, 0, width, height);
      ctx.font = font;
      let fill = -1;
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * size;
        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) * cellW;
          cell.density = 0;
          cell.color = 0;
          cell.glyph = "";
          fieldRef.current(x, y, frame, cell);
          const glyph = cell.glyph || ramp[Math.round(Math.min(1, Math.max(0, cell.density)) * last)];
          if (glyph === " ") continue;
          if (cell.color !== fill) {
            fill = cell.color;
            ctx.fillStyle = fills[fill] ?? fills[0];
          }
          ctx.fillText(glyph, x, y);
        }
      }
    };

    const resize = () => {
      const box = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const style = getComputedStyle(el);
      fills = palette.split("|").map((c) => (c.startsWith("--") ? style.getPropertyValue(c).trim() : c));
      draw.current();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(el);
    // Canvas text is not redrawn when the web font arrives.
    document.fonts?.load(font).then(() => draw.current(), () => {});
    return () => observer.disconnect();
  }, [palette, size, ramp]);

  useEffect(() => {
    if (!reduce) return;
    clock.current = still;
    draw.current();
  }, [reduce, still]);

  const animate = running && !idle && !reduce;
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    let then = performance.now();
    let since = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - then, 100);
      then = now;
      since += dt;
      if (since < 1000 / fps) return;
      clock.current += since / 1000;
      since = 0;
      draw.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, fps]);

  return <canvas ref={canvas} aria-hidden className={cn("block h-full w-full", className)} />;
}

export function hash(a: number, b: number, c = 0): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
