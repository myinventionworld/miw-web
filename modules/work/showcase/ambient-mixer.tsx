"use client";

import { useInView, useReducedMotion } from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/cn";
import {
  LOOP_SECONDS,
  loopBuffer,
  renderLoop,
  type SoundId,
} from "./ambient-synth";

const SOUNDS: SoundId[] = ["rain", "fire", "sea", "night"];
const SILENT: Record<SoundId, number> = { rain: 0, fire: 0, sea: 0, night: 0 };

class Mixer {
  ctx: AudioContext;
  analyser: AnalyserNode;
  private master: GainNode;
  private buffers = new Map<SoundId, AudioBuffer>();
  private voices = new Map<
    SoundId,
    { src: AudioBufferSourceNode; gain: GainNode }
  >();
  private sleep = 0;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;
    this.master
      .connect(limiter)
      .connect(this.analyser)
      .connect(this.ctx.destination);
  }

  get playing() {
    return this.voices.size > 0;
  }

  set(id: SoundId, level: number) {
    const now = this.ctx.currentTime;
    const voice = this.voices.get(id);
    if (level <= 0) {
      if (!voice) return;
      voice.gain.gain.setTargetAtTime(0, now, 0.06);
      voice.src.stop(now + 0.4);
      this.voices.delete(id);
      if (!this.voices.size) {
        window.clearTimeout(this.sleep);
        this.sleep = window.setTimeout(() => {
          if (!this.voices.size) void this.ctx.suspend();
        }, 800);
      }
      return;
    }

    window.clearTimeout(this.sleep);
    if (this.ctx.state !== "running") void this.ctx.resume();
    const target = level * level * 0.9;
    if (voice) {
      voice.gain.gain.setTargetAtTime(target, now, 0.05);
      return;
    }
    let buffer = this.buffers.get(id);
    if (!buffer) {
      buffer = loopBuffer(id, this.ctx);
      this.buffers.set(id, buffer);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(target, now, 0.08);
    src.connect(gain).connect(this.master);
    src.start(now, Math.random() * LOOP_SECONDS);
    this.voices.set(id, { src, gain });
  }

  wake() {
    if (this.voices.size && this.ctx.state !== "running")
      void this.ctx.resume();
  }

  pause(hidden: boolean) {
    if (hidden) void this.ctx.suspend();
    else if (this.voices.size) void this.ctx.resume();
  }

  close() {
    window.clearTimeout(this.sleep);
    void this.ctx.close();
  }
}

const ICONS: Record<SoundId, ReactNode> = {
  rain: (
    <>
      <path d="M7 15a4.5 4.5 0 1 1 1.4-8.8A5.5 5.5 0 0 1 19 8.5a3.5 3.5 0 0 1-1 6.5" />
      <path d="M9 18v2M13 17v3M17 18v2" />
    </>
  ),
  fire: (
    <path d="M12 21c3.6 0 6-2.4 6-5.8 0-3.7-3-5.7-4.2-9.2-1 2.6-2.4 3.5-3.3 3.6.2-1.4-.1-2.8-.9-3.9C8 8.2 6 10.6 6 15.2 6 18.6 8.4 21 12 21Z" />
  ),
  sea: (
    <path d="M3 8c1.5 0 1.5-1.5 3-1.5S7.5 8 9 8s1.5-1.5 3-1.5S13.5 8 15 8s1.5-1.5 3-1.5S19.5 8 21 8M3 13c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5M3 18c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5" />
  ),
  night: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
};

function Icon({ id }: { id: SoundId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[id]}
    </svg>
  );
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const UPRIGHT = "(min-width: 640px)";

export function AmbientMixer() {
  const { t } = useTranslation("projects");
  const k = (s: string) => t(`boowie.mixer.${s}`);
  const reduce = useReducedMotion();
  const mixer = useRef<Mixer | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLElement>(null);
  const near = useInView(root, { once: true, margin: "400px 0px" });
  const drag = useRef<{
    id: SoundId;
    at: number;
    from: number;
    size: number;
    upright: boolean;
    moved: boolean;
  } | null>(null);
  const [levels, setLevels] = useState(SILENT);
  const [live, setLive] = useState(false);
  const [upright, setUpright] = useState(true);

  const engine = () => (mixer.current ??= new Mixer());

  const apply = (id: SoundId, level: number) => {
    const v = Math.round(clamp(level) * 100) / 100;
    setLevels((l) => ({ ...l, [id]: v }));
    const m = engine();
    m.set(id, v);
    setLive(m.playing);
  };

  const silence = () => {
    for (const id of SOUNDS) mixer.current?.set(id, 0);
    setLevels(SILENT);
    setLive(false);
  };

  useEffect(() => {
    if (!near) return;
    const idle = window.requestIdleCallback as
      | typeof window.requestIdleCallback
      | undefined;
    let stop = false;
    const next = (i: number) => {
      if (stop || i >= SOUNDS.length) return;
      const run = () => {
        if (stop) return;
        renderLoop(SOUNDS[i]);
        next(i + 1);
      };
      if (idle) idle(run, { timeout: 2000 });
      else window.setTimeout(run, 200);
    };
    next(0);
    return () => {
      stop = true;
    };
  }, [near]);

  useEffect(() => {
    const query = window.matchMedia(UPRIGHT);
    const sync = () => setUpright(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onVisibility = () => mixer.current?.pause(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      mixer.current?.close();
      mixer.current = null;
    };
  }, []);

  useEffect(() => {
    const el = canvas.current;
    const g = el?.getContext("2d");
    if (!el || !g) return;
    const BARS = 40;
    const draw = (bins?: Uint8Array) => {
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (el.width !== Math.round(w * dpr)) el.width = Math.round(w * dpr);
      if (el.height !== Math.round(h * dpr)) el.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const color = getComputedStyle(el).color;
      const gap = 3;
      const bw = (w - gap * (BARS - 1)) / BARS;
      for (let i = 0; i < BARS; i++) {
        let v = 0;
        if (bins) {
          const lo = Math.floor(2 * Math.pow(bins.length / 2, i / BARS));
          const hi = Math.max(
            lo + 1,
            Math.floor(2 * Math.pow(bins.length / 2, (i + 1) / BARS)),
          );
          for (let b = lo; b < hi; b++) v = Math.max(v, bins[b] ?? 0);
          v = (v / 255) ** 1.6;
        }
        const bh = Math.max(2, v * h);
        g.globalAlpha = bins ? 0.35 + 0.65 * v : 0.25;
        g.fillStyle = color;
        g.beginPath();
        g.roundRect(i * (bw + gap), h - bh, bw, bh, Math.min(bw / 2, 2));
        g.fill();
      }
    };

    const m = mixer.current;
    if (!live || reduce || !m) {
      draw();
      return;
    }
    const bins = new Uint8Array(m.analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      m.analyser.getByteFrequencyData(bins);
      draw(bins);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, reduce]);

  return (
    <figure
      ref={root}
      className="grid items-center gap-10 md:grid-cols-[1fr_minmax(0,440px)] md:gap-12"
    >
      <figcaption className="max-w-xl">
        <h3 className="text-title leading-snug font-semibold text-white">
          {k("title")}
        </h3>
        <p className="mt-3 text-copy leading-relaxed text-zinc">{k("body")}</p>
        <p className="mt-3 text-small leading-relaxed text-steel">
          {k("note")}
        </p>
      </figcaption>

      <div className="rounded-[14px] bg-carbon p-5 sm:p-6">
        <div className="flex h-8 items-center justify-between">
          <span className="text-label text-steel">{k("group")}</span>
          <button
            type="button"
            onClick={silence}
            className={cn(
              "rounded-full border border-white/15 px-3 py-1 text-label text-white transition-opacity hover:border-white/35",
              live ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            tabIndex={live ? 0 : -1}
          >
            {k("stop")}
          </button>
        </div>
        <canvas
          ref={canvas}
          aria-hidden
          className="mt-3 block h-12 w-full text-comet"
        />
        <div
          role="group"
          aria-label={k("group")}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4"
        >
          {SOUNDS.map((id) => {
            const level = levels[id];
            const name = k(`sounds.${id}`);
            return (
              <div
                key={id}
                className="flex items-center gap-4 sm:flex-1 sm:flex-col sm:gap-0"
              >
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label={name}
                  aria-orientation={upright ? "vertical" : "horizontal"}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(level * 100)}
                  aria-valuetext={`${Math.round(level * 100)}%`}
                  onPointerDown={(e) => {
                    const up = window.matchMedia(UPRIGHT).matches;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    engine();
                    drag.current = {
                      id,
                      at: up ? e.clientY : e.clientX,
                      from: level,
                      size: up
                        ? e.currentTarget.clientHeight
                        : e.currentTarget.clientWidth,
                      upright: up,
                      moved: false,
                    };
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d || d.id !== id) return;
                    const shift = d.upright
                      ? d.at - e.clientY
                      : e.clientX - d.at;
                    if (Math.abs(shift) > 3) d.moved = true;
                    if (d.moved) apply(id, d.from + shift / d.size);
                  }}
                  onPointerUp={() => {
                    const d = drag.current;
                    drag.current = null;
                    if (d && d.id === id && !d.moved)
                      apply(id, level > 0 ? 0 : 0.5);
                    else mixer.current?.wake();
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                  onKeyDown={(e) => {
                    const step: Record<string, number> = {
                      ArrowUp: 0.1,
                      ArrowRight: 0.1,
                      ArrowDown: -0.1,
                      ArrowLeft: -0.1,
                      PageUp: 0.25,
                      PageDown: -0.25,
                    };
                    if (e.key in step) apply(id, level + step[e.key]);
                    else if (e.key === "Home") apply(id, 0);
                    else if (e.key === "End") apply(id, 1);
                    else return;
                    e.preventDefault();
                  }}
                  style={{ "--level": level } as CSSProperties}
                  className="relative h-12 flex-1 cursor-ew-resize touch-pan-y overflow-hidden rounded-[16px] bg-white/8 outline-none select-none focus-visible:ring-2 focus-visible:ring-comet sm:h-48 sm:w-full sm:max-w-[76px] sm:flex-none sm:cursor-ns-resize sm:touch-none sm:rounded-[22px]"
                >
                  <span className="absolute inset-y-0 left-4 flex items-center text-zinc sm:inset-x-0 sm:top-auto sm:bottom-4 sm:justify-center">
                    <Icon id={id} />
                  </span>
                  <span className="absolute inset-y-0 left-0 w-[calc(var(--level)*100%)] overflow-hidden bg-comet sm:inset-x-0 sm:top-auto sm:bottom-0 sm:h-[calc(var(--level)*100%)] sm:w-auto">
                    <span className="absolute inset-y-0 left-4 flex items-center text-void sm:inset-x-0 sm:top-auto sm:bottom-4 sm:justify-center">
                      <Icon id={id} />
                    </span>
                  </span>
                </div>
                <span
                  className={cn(
                    "w-24 text-small whitespace-nowrap transition-colors sm:mt-3 sm:w-auto",
                    level > 0 ? "font-medium text-white" : "text-steel",
                  )}
                >
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
