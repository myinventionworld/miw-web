"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector2 } from "three";

import { frameLog } from "./frame-pacer";
import type { QualityGovernor } from "./quality";

const SPIKE_MS = 50;

const pct = (sorted: number[], p: number) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : NaN;
const ms = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "–");

/**
 * Frame and renderer statistics in a corner of the page, in development or
 * with `?gfxstats` in the URL. Written straight to the DOM twice a second so
 * it never re-renders React or the scene it is measuring.
 */
export function Diagnostics({ governor }: { governor: QualityGovernor }) {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    let resizes = 0;
    const setSize = gl.setSize;
    gl.setSize = function (...args: Parameters<typeof setSize>) {
      resizes++;
      return setSize.apply(this, args);
    };

    const el = document.createElement("pre");
    el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, {
      position: "fixed",
      right: "8px",
      bottom: "8px",
      zIndex: "2147483647",
      margin: "0",
      padding: "8px 10px",
      borderRadius: "6px",
      font: "11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
      color: "#d8f3ff",
      background: "rgba(0, 0, 0, 0.75)",
      pointerEvents: "none",
      whiteSpace: "pre",
    });
    document.body.appendChild(el);

    const size = new Vector2();
    const paint = () => {
      const frames = [...frameLog.intervals].sort((a, b) => a - b);
      const gpu = [...frameLog.gpu].sort((a, b) => a - b);
      const mean = frames.reduce((s, x) => s + x, 0) / Math.max(1, frames.length);
      const spikes = frames.filter((x) => x > SPIKE_MS).length;
      const { render, memory, programs } = gl.info;
      gl.getDrawingBufferSize(size);
      const s = governor.stats();
      const { mounted, warm, shown } = frameLog;
      el.textContent = [
        `tier ${s.tier} · max ${s.ceiling}${governor.locked ? " (locked)" : ""} · changes ${s.changes}`,
        `dpr ${gl.getPixelRatio()} · ${size.x}×${size.y} · ${((size.x * size.y) / 1e6).toFixed(2)} Mpx · resizes ${resizes}`,
        `fps ${frames.length ? (1000 / mean).toFixed(0) : "–"} · frame p50 ${ms(pct(frames, 0.5))} p95 ${ms(pct(frames, 0.95))} p99 ${ms(pct(frames, 0.99))} ms`,
        `spikes >${SPIKE_MS} ms ${spikes}/${frames.length} · late ${(s.lateShare * 100).toFixed(0)}% of last window`,
        `gpu ${gpu.length ? `p50 ${ms(pct(gpu, 0.5))} p95 ${ms(pct(gpu, 0.95))} ms` : "timer unavailable"}`,
        `draws ${render.calls} · triangles ${render.triangles.toLocaleString("en")}`,
        `geometries ${memory.geometries} · textures ${memory.textures} · programs ${programs?.length ?? 0}`,
        `warm-up ${warm ? (warm - mounted).toFixed(0) : "…"} ms · first frame ${shown ? (shown - mounted).toFixed(0) : "…"} ms`,
      ].join("\n");
    };
    const id = window.setInterval(paint, 500);
    paint();

    return () => {
      window.clearInterval(id);
      el.remove();
      gl.setSize = setSize;
    };
  }, [gl, governor]);

  return null;
}
