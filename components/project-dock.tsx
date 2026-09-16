"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import {
  Activity,
  ArrowUpRight,
  CircuitBoard,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import {
  STATIONS,
  STATUS_TONE,
  type Station,
  type StationId,
  type Variant,
} from "@/lib/stations";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
   Teaser renderer

   No video assets exist for these artifacts, and a stock loop would be a
   lie. The teaser is drawn procedurally instead: `drawTeaser` is a pure
   function of normalised time, which is exactly what makes scrubbing work —
   seeking is just passing a different `t`.
   ──────────────────────────────────────────────────────────────────────── */

const LOOP_SECONDS = 12;

const hashf = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/** 256 deterministic samples, shared by the chart variants. */
const SERIES = Array.from({ length: 256 }, (_, i) => {
  const base = 0.34 + 0.4 * hashf(i * 1.37);
  const swell = 0.22 * Math.sin(i * 0.11) + 0.1 * Math.sin(i * 0.037);
  return Math.min(1, Math.max(0.06, base + swell));
});

function backdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0c0d12");
  g.addColorStop(1, "#050507");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 26) {
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(w, Math.round(y) + 0.5);
    ctx.stroke();
  }
}

const T_NODES: [number, number, string][] = [
  [0.09, 0.5, "edge"],
  [0.32, 0.22, "api"],
  [0.32, 0.78, "auth"],
  [0.57, 0.5, "orders"],
  [0.85, 0.24, "pg"],
  [0.85, 0.76, "bus"],
];
const T_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
];

function drawTopology(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const px = (n: number) => 16 + n * (w - 32);
  const py = (n: number) => 18 + n * (h - 36);

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  for (const [a, b] of T_EDGES) {
    ctx.beginPath();
    ctx.moveTo(px(T_NODES[a][0]), py(T_NODES[a][1]));
    ctx.lineTo(px(T_NODES[b][0]), py(T_NODES[b][1]));
    ctx.stroke();
  }

  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(34,211,238,0.9)";
  for (let e = 0; e < T_EDGES.length; e++) {
    const [a, b] = T_EDGES[e];
    for (let k = 0; k < 2; k++) {
      const u = (t * 1.7 + e * 0.163 + k * 0.5) % 1;
      const x = px(T_NODES[a][0] + (T_NODES[b][0] - T_NODES[a][0]) * u);
      const y = py(T_NODES[a][1] + (T_NODES[b][1] - T_NODES[a][1]) * u);
      ctx.fillStyle = k === 0 ? "#22d3ee" : "#e4e4e7";
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "center";
  for (let i = 0; i < T_NODES.length; i++) {
    const x = px(T_NODES[i][0]);
    const y = py(T_NODES[i][1]);

    const pulse = (t * 1.4 + i * 0.17) % 1;
    ctx.strokeStyle = `rgba(228,228,231,${(1 - pulse) * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 5.5 + pulse * 11, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#0a0a0d";
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();

    ctx.fillStyle = "rgba(228,228,231,0.75)";
    ctx.fillText(T_NODES[i][2], x, y + 18);
  }
  ctx.textAlign = "left";
}

function drawCluster(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const lanes = 6;
  const top = 20;
  const gap = (h - 38) / (lanes - 1);
  const commit = w * 0.8;

  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(52,211,153,0.5)";
  ctx.beginPath();
  ctx.moveTo(commit, 8);
  ctx.lineTo(commit, h - 8);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "9px ui-monospace, SFMono-Regular, monospace";

  for (let i = 0; i < lanes; i++) {
    const y = top + i * gap;

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(161,161,170,0.9)";
    ctx.fillText(`p${i}`, 8, y + 3);

    const speed = 0.42 + i * 0.07;
    for (let j = 0; j < 5; j++) {
      const u = (t * speed + j * 0.2 + hashf(i * 3.1) * 0.3) % 1;
      const x = 30 + u * (w - 44);
      const past = x > commit;
      ctx.fillStyle = past ? "rgba(52,211,153,0.9)" : "rgba(34,211,238,0.85)";
      ctx.fillRect(x, y - 3.5, 13, 7);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x, y - 3.5, 2, 7);
    }
  }
}

function drawQuery(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const bars = 30;
  const pad = 14;
  const bw = (w - pad * 2) / bars;
  const base = h - 20;
  const span = h - 40;
  const offset = t * SERIES.length;
  const shift = (offset % 1) * bw;

  for (let i = 0; i < bars; i++) {
    const v = SERIES[(Math.floor(offset) + i) % SERIES.length];
    const x = pad + i * bw - shift;
    const bh = v * span;
    const g = ctx.createLinearGradient(0, base - bh, 0, base);
    g.addColorStop(0, "rgba(34,211,238,0.95)");
    g.addColorStop(1, "rgba(34,211,238,0.14)");
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, base - bh, Math.max(1, bw - 2.5), bh);
  }

  // Seven-sample moving average, drawn over the raw bars.
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < bars; i++) {
    let sum = 0;
    for (let k = -3; k <= 3; k++) {
      sum += SERIES[(Math.floor(offset) + i + k + SERIES.length) % SERIES.length];
    }
    const v = sum / 7;
    const x = pad + i * bw - shift + bw / 2;
    const y = base - v * span;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, base + 0.5);
  ctx.lineTo(w - pad, base + 0.5);
  ctx.stroke();

  ctx.fillStyle = "rgba(161,161,170,0.9)";
  ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
  ctx.fillText("events/s", pad, 14);
}

const STAGES = ["resolve", "fetch", "compile", "link", "sign"];

function drawExperiments(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const pad = 16;
  const gap = 8;
  const bw = (w - pad * 2 - gap * (STAGES.length - 1)) / STAGES.length;
  const bh = 34;
  const y = h / 2 - bh / 2;

  ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "center";

  for (let i = 0; i < STAGES.length; i++) {
    const x = pad + i * (bw + gap);
    const p = Math.min(1, Math.max(0, t * (STAGES.length + 1) - i));

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);

    ctx.fillStyle =
      p >= 1 ? "rgba(52,211,153,0.28)" : "rgba(34,211,238,0.28)";
    ctx.fillRect(x + 1, y + 1, (bw - 2) * p, bh - 2);

    ctx.fillStyle = p > 0 ? "#ffffff" : "rgba(161,161,170,0.6)";
    ctx.fillText(STAGES[i], x + bw / 2, y + bh / 2 + 3);

    if (p >= 1) {
      ctx.fillStyle = "rgba(52,211,153,0.95)";
      ctx.fillText("cached", x + bw / 2, y + bh + 14);
    }
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(161,161,170,0.9)";
  ctx.fillText(
    `hash 0x${Math.floor(hashf(Math.floor(t * 24)) * 0xffffff)
      .toString(16)
      .padStart(6, "0")}`,
    pad,
    h - 10,
  );
}

function drawTeaser(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  variant: Variant,
) {
  backdrop(ctx, w, h);

  if (variant === "topology") drawTopology(ctx, w, h, t);
  else if (variant === "cluster") drawCluster(ctx, w, h, t);
  else if (variant === "query") drawQuery(ctx, w, h, t);
  else drawExperiments(ctx, w, h, t);

  // Sensor sweep, so the frame never reads as a static diagram.
  const sweep = ((t * 1.3) % 1) * h;
  const g = ctx.createLinearGradient(0, sweep - 30, 0, sweep + 30);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.07)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, sweep - 30, w, 60);
}

const clock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
    Math.floor(s % 60),
  ).padStart(2, "0")}`;

function Teaser({ variant }: { variant: Variant }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scrub = useRef<HTMLInputElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const time = useRef(0);
  const dragging = useRef(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    // Cached so the frame loop never reads layout.
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      el.width = Math.max(1, Math.round(w * dpr));
      el.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (playing && !dragging.current) {
        time.current = (time.current + dt / LOOP_SECONDS) % 1;
        if (scrub.current) scrub.current.valueAsNumber = time.current * 1000;
      }
      if (w > 0 && h > 0) drawTeaser(ctx, w, h, time.current, variant);
      if (readout.current) {
        readout.current.textContent = `${clock(
          time.current * LOOP_SECONDS,
        )} / ${clock(LOOP_SECONDS)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [playing, variant]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg border border-white/15 bg-black">
        <canvas ref={canvas} className="block h-[178px] w-full" />
        {/* Scrim, or the badge collides with whatever the loop draws up there. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-9 bg-gradient-to-b from-black/85 to-transparent" />
        <div className="pointer-events-none absolute top-2.5 left-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          <span className="font-mono text-[9px] tracking-telemetry text-white/85 uppercase">
            Teaser · loop
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause teaser" : "Play teaser"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/20 text-white transition-colors hover:border-white/50 hover:bg-white/10"
        >
          {playing ? (
            <Pause className="h-3 w-3" fill="currentColor" />
          ) : (
            <Play className="h-3 w-3" fill="currentColor" />
          )}
        </button>

        <input
          ref={scrub}
          type="range"
          min={0}
          max={1000}
          defaultValue={0}
          aria-label="Scrub teaser"
          className="range h-5 flex-1"
          onPointerDown={() => {
            dragging.current = true;
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onInput={(e) => {
            time.current = e.currentTarget.valueAsNumber / 1000;
          }}
        />

        <span
          ref={readout}
          className="w-[76px] shrink-0 text-right font-mono text-[10px] text-zinc tabular-nums"
        >
          00:00 / 00:12
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Interactive prototypes — real widgets, not screenshots.
   ──────────────────────────────────────────────────────────────────────── */

function ProtoShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-lenis-prevent
      className="thin-scroll h-[178px] overflow-y-auto rounded-lg border border-white/15 bg-black/70 p-3"
    >
      {children}
    </div>
  );
}

const HOPS = [
  { id: "edge", label: "edge / tls", ms: 4, p99: 9 },
  { id: "api", label: "api gateway", ms: 11, p99: 26 },
  { id: "auth", label: "auth verify", ms: 6, p99: 14 },
  { id: "orders", label: "orders svc", ms: 23, p99: 61 },
  { id: "pg", label: "postgres", ms: 9, p99: 38 },
  { id: "bus", label: "event emit", ms: 3, p99: 7 },
];

function TopologyProto() {
  const [selected, setSelected] = useState("orders");
  const total = HOPS.reduce((s, x) => s + x.ms, 0);
  const hop = HOPS.find((x) => x.id === selected)!;

  return (
    <ProtoShell>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
          Latency budget
        </span>
        <span className="font-mono text-[11px] text-white tabular-nums">
          {total} ms p50
        </span>
      </div>

      <div className="flex h-5 overflow-hidden rounded-sm border border-white/15">
        {HOPS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setSelected(x.id)}
            aria-label={x.label}
            style={{ width: `${(x.ms / total) * 100}%` }}
            className={cn(
              "h-full border-r border-black/60 transition-colors last:border-r-0",
              selected === x.id
                ? "bg-white"
                : "bg-beam/40 hover:bg-beam/70",
            )}
          />
        ))}
      </div>

      <div className="mt-3 space-y-1">
        {HOPS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setSelected(x.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-1 text-left font-mono text-[10px] transition-colors",
              selected === x.id
                ? "bg-white/12 text-white"
                : "text-zinc hover:bg-white/6 hover:text-platinum",
            )}
          >
            <span>{x.label}</span>
            <span className="tabular-nums">
              {x.ms} / {x.p99} ms
            </span>
          </button>
        ))}
      </div>

      <p className="mt-2 font-mono text-[10px] leading-relaxed text-platinum">
        {hop.label} owns {Math.round((hop.ms / total) * 100)}% of p50 and blows
        to {hop.p99} ms at p99.
      </p>
    </ProtoShell>
  );
}

function ClusterProto() {
  const [producers, setProducers] = useState(6);
  const [degraded, setDegraded] = useState(false);

  const partitions = useMemo(() => {
    const live = degraded ? 5 : 6;
    return Array.from({ length: 6 }, (_, i) => {
      const down = degraded && i === 2;
      const share = down ? 0 : 1 / live;
      const throughput = Math.round(producers * 14200 * share);
      const lag = down
        ? 0
        : Math.round((producers * (degraded ? 260 : 120) * hashf(i * 5.7)) / 1);
      return { i, down, throughput, lag };
    });
  }, [producers, degraded]);

  const worst = Math.max(1, ...partitions.map((p) => p.lag));

  return (
    <ProtoShell>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
          Producers {producers}
        </span>
        <input
          type="range"
          min={1}
          max={12}
          value={producers}
          aria-label="Producer count"
          onChange={(e) => setProducers(e.currentTarget.valueAsNumber)}
          className="range h-5 flex-1"
        />
        <button
          type="button"
          onClick={() => setDegraded((v) => !v)}
          className={cn(
            "shrink-0 rounded-sm border px-2 py-1 font-mono text-[9px] tracking-telemetry uppercase transition-colors",
            degraded
              ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
              : "border-white/20 text-zinc hover:border-white/50 hover:text-white",
          )}
        >
          {degraded ? "broker down" : "kill broker"}
        </button>
      </div>

      <div className="space-y-1.5">
        {partitions.map((p) => (
          <div key={p.i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 font-mono text-[10px] text-zinc">
              p{p.i}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-white/8">
              <div
                className={cn(
                  "h-full transition-[width] duration-300",
                  p.down ? "bg-white/15" : "bg-beam/80",
                )}
                style={{ width: `${(p.lag / worst) * 100}%` }}
              />
            </div>
            <span className="w-[86px] shrink-0 text-right font-mono text-[10px] text-platinum tabular-nums">
              {p.down ? "— offline" : `${p.throughput.toLocaleString()}/s`}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-platinum">
        {degraded
          ? "Leadership moved off p2. Remaining partitions absorb the write path; lag is bounded by the replay budget, not by luck."
          : "Six partitions, one leader each. Consumer offsets commit after the side effect, so replay is idempotent."}
      </p>
    </ProtoShell>
  );
}

const METRICS = [
  { id: "orders", label: "orders", unit: "" },
  { id: "latency", label: "p99_ms", unit: " ms" },
  { id: "errors", label: "error_rate", unit: "%" },
] as const;

const GRAINS = ["1m", "5m", "1h"] as const;

function QueryProto() {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["id"]>("orders");
  const [grain, setGrain] = useState<(typeof GRAINS)[number]>("5m");

  const seed = METRICS.findIndex((m) => m.id === metric) * 31 + grain.length * 7;
  const bars = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => 0.18 + 0.78 * hashf(i * 2.3 + seed)),
    [seed],
  );
  const peak = Math.max(...bars);

  return (
    <ProtoShell>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMetric(m.id)}
            className={cn(
              "rounded-sm border px-2 py-0.5 font-mono text-[9px] tracking-telemetry uppercase transition-colors",
              metric === m.id
                ? "border-white bg-white font-semibold text-black"
                : "border-white/20 text-zinc hover:border-white/50 hover:text-white",
            )}
          >
            {m.label}
          </button>
        ))}
        <span className="mx-1 h-3 w-px bg-white/15" />
        {GRAINS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGrain(g)}
            className={cn(
              "rounded-sm border px-2 py-0.5 font-mono text-[9px] transition-colors",
              grain === g
                ? "border-white bg-white font-semibold text-black"
                : "border-white/20 text-zinc hover:border-white/50 hover:text-white",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex h-[58px] items-end gap-[3px]">
        {bars.map((v, i) => (
          <div
            key={i}
            title={`${(v * 100).toFixed(1)}`}
            style={{ height: `${v * 100}%` }}
            className={cn(
              "flex-1 rounded-t-[1px] transition-all duration-300",
              v === peak ? "bg-white" : "bg-beam/70 hover:bg-beam",
            )}
          />
        ))}
      </div>

      <pre className="mt-3 overflow-x-auto rounded-sm border border-white/10 bg-white/4 p-2 font-mono text-[9.5px] leading-relaxed text-platinum">
        {`SELECT toStartOfInterval(ts, INTERVAL ${grain.replace(
          /(\d+)(\w)/,
          "$1 $2",
        )}) AS t,
       ${metric}
FROM  tidewater.metrics_governed
WHERE t > now() - INTERVAL 2 HOUR
ORDER BY t`}
      </pre>
    </ProtoShell>
  );
}

const BUILD_STEPS = [
  { name: "resolve graph", ms: 120 },
  { name: "fetch inputs", ms: 340 },
  { name: "compile crate", ms: 1180 },
  { name: "link artifact", ms: 260 },
  { name: "sign + attest", ms: 90 },
];

function ExperimentsProto() {
  const [step, setStep] = useState(BUILD_STEPS.length);
  const [warm, setWarm] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const run = useCallback(
    (i: number) => {
      if (i >= BUILD_STEPS.length) return;
      setStep(i + 1);
      timer.current = setTimeout(() => run(i + 1), warm ? 110 : 260);
    },
    [warm],
  );

  const start = () => {
    if (timer.current) clearTimeout(timer.current);
    setStep(0);
    timer.current = setTimeout(() => run(0), 80);
  };

  const total = BUILD_STEPS.reduce(
    (s, x, i) => s + (warm && i < 3 ? Math.round(x.ms * 0.04) : x.ms),
    0,
  );

  return (
    <ProtoShell>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-1.5 rounded-sm border border-white/25 px-2 py-1 font-mono text-[9px] tracking-telemetry text-white uppercase transition-colors hover:bg-white hover:text-black"
        >
          <RotateCcw className="h-2.5 w-2.5" />
          Run build
        </button>
        <button
          type="button"
          onClick={() => setWarm((v) => !v)}
          className={cn(
            "rounded-sm border px-2 py-1 font-mono text-[9px] tracking-telemetry uppercase transition-colors",
            warm
              ? "border-signal/70 bg-signal/12 text-signal"
              : "border-white/20 text-zinc hover:border-white/50 hover:text-white",
          )}
        >
          {warm ? "cache warm" : "cache cold"}
        </button>
      </div>

      <div className="space-y-1">
        {BUILD_STEPS.map((s, i) => {
          const done = i < step;
          const cached = warm && i < 3;
          return (
            <div
              key={s.name}
              className={cn(
                "flex items-center justify-between rounded-sm px-2 py-1 font-mono text-[10px] transition-colors duration-200",
                done ? "bg-white/10 text-white" : "text-steel",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    done
                      ? cached
                        ? "bg-signal"
                        : "bg-beam"
                      : "bg-white/20",
                  )}
                />
                {s.name}
              </span>
              <span className="tabular-nums">
                {done
                  ? cached
                    ? "cache hit"
                    : `${s.ms} ms`
                  : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 font-mono text-[10px] text-platinum tabular-nums">
        wall {total} ms · artifact digest stable across machines
      </p>
    </ProtoShell>
  );
}

function Prototype({ variant }: { variant: Variant }) {
  if (variant === "topology") return <TopologyProto />;
  if (variant === "cluster") return <ClusterProto />;
  if (variant === "query") return <QueryProto />;
  return <ExperimentsProto />;
}

/* ────────────────────────────────────────────────────────────────────────
   Dock
   ──────────────────────────────────────────────────────────────────────── */

/** Which side the card parks on, chosen to sit opposite its celestial body. */
const DOCK_SIDE: Record<StationId, "left" | "right"> = {
  studio: "right",
  systems: "left",
  intelligence: "right",
  venture: "right",
};

/**
 * Scroll band each station's panel is visible across. Written out rather than
 * derived as anchor ± n, because station 01 has to clear the hero: its anchor
 * sits at 0.06 and a symmetric band would put the card on screen at rest.
 */
const BANDS: Record<StationId, [number, number]> = {
  studio: [0.035, 0.145],
  systems: [0.225, 0.375],
  intelligence: [0.465, 0.615],
  venture: [0.705, 0.855],
};

function Card({
  station,
  onAction,
}: {
  station: Station;
  onAction?: (station: Station) => void;
}) {
  const [tab, setTab] = useState<"teaser" | "prototype">("teaser");
  const { featured } = station;

  return (
    <div className="panel pointer-events-auto w-[min(92vw,460px)] rounded-2xl p-5 xl:w-[560px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
            Station {station.index} · Artifact
          </div>
          <h3 className="mt-1.5 font-mono text-xl leading-none font-semibold text-white">
            {featured.codename}
          </h3>
        </div>

        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-telemetry uppercase",
            STATUS_TONE[featured.status],
          )}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {featured.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {featured.stack.map((s) => (
          <span
            key={s}
            className="rounded-sm border border-white/20 bg-white/6 px-2 py-0.5 font-mono text-[9.5px] text-platinum"
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-platinum">
        {featured.blurb}
      </p>

      <div className="mt-4 flex gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
        {(
          [
            ["teaser", "Video teaser", Activity],
            ["prototype", "Interactive prototype", CircuitBoard],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "relative flex-1 rounded-md px-3 py-1.5 font-mono text-[10px] tracking-telemetry uppercase transition-colors",
              tab === id ? "text-black" : "text-zinc hover:text-white",
            )}
          >
            {/* Painted as a sibling rather than a negative z-index: the track
                behind it has its own background, and -z-10 drops the pill
                underneath that instead of on top of it. */}
            {tab === id && (
              <motion.span
                layoutId={`dock-tab-${station.id}`}
                className="absolute inset-0 rounded-md bg-white"
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              <Icon className="h-3 w-3" />
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === "teaser" ? (
          <Teaser variant={featured.variant} />
        ) : (
          <Prototype variant={featured.variant} />
        )}
      </div>

      <button
        type="button"
        onClick={() => onAction?.(station)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-[13px] font-medium text-black transition-all hover:bg-zinc-200"
      >
        {featured.action}
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Brief({ station }: { station: Station }) {
  return (
    <div className="copy-scrim pointer-events-none hidden max-w-md lg:block">
      <div className="relative">
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-beam uppercase">
          <span className="h-px w-9 bg-beam/55" />
          Station {station.index}
        </div>
        <h2 className="text-lift mt-4 text-4xl leading-[1.05] font-semibold text-white xl:text-5xl">
          {station.title}
        </h2>
        <p className="text-lift mt-4 text-lg leading-snug text-platinum">
          {station.lede}
        </p>
        <p className="text-lift mt-4 text-[14px] leading-relaxed text-platinum">
          {station.body}
        </p>
      </div>
    </div>
  );
}

export function ProjectDock({
  progress,
  onAction,
}: {
  progress: MotionValue<number>;
  onAction?: (station: Station) => void;
}) {
  const [active, setActive] = useState<Station | null>(null);

  const resolve = useCallback((p: number) => {
    let next: Station | null = null;
    for (const s of STATIONS) {
      const [a, b] = BANDS[s.id];
      if (p >= a && p <= b) {
        next = s;
        break;
      }
    }
    // Identity compare is enough: STATIONS entries are module singletons, and
    // this only flips eight times across the whole runway.
    setActive((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => resolve(progress.get()), [progress, resolve]);
  useMotionValueEvent(progress, "change", resolve);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "mx-auto flex h-full max-w-[1500px] items-center gap-10 px-6 pt-20 pb-10 lg:px-10",
              DOCK_SIDE[active.id] === "left"
                ? "flex-row-reverse"
                : "flex-row",
            )}
          >
            <div className="hidden flex-1 lg:block">
              <Brief station={active} />
            </div>
            <div className="ml-auto lg:ml-0">
              <Card station={active} onAction={onAction} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
