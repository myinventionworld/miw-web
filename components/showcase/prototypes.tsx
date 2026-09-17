"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import type { Variant } from "@/lib/stations";
import { cn } from "@/lib/utils";

/**
 * The working part of every product frame. These are real widgets rather than
 * screenshots or a video loop: the visitor gets to poke at the thing, which is
 * the only demo format that survives a sceptical engineer.
 *
 * Nothing here animates on its own. The old canvas teaser ran a second 60Hz
 * rAF loop alongside the WebGL scene for no informational gain — state changes
 * only when somebody clicks.
 */

const hashf = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

function ProtoShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-lenis-prevent
      className="thin-scroll h-[196px] overflow-y-auto bg-[#08080b] p-3"
    >
      {children}
    </div>
  );
}

/* ── topology: where the latency budget goes ──────────────────────────── */

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
              selected === x.id ? "bg-white" : "bg-beam/40 hover:bg-beam/70",
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

/* ── cluster: what a broker loss actually costs ───────────────────────── */

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
        : Math.round(producers * (degraded ? 260 : 120) * hashf(i * 5.7));
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

/* ── query: the governed layer the agent is allowed to emit ───────────── */

const METRICS = [
  { id: "orders", label: "orders" },
  { id: "latency", label: "p99_ms" },
  { id: "errors", label: "error_rate" },
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
            style={{ height: `${v * 100}%` }}
            className={cn(
              "flex-1 rounded-t-[1px] transition-all duration-300",
              v === peak ? "bg-white" : "bg-beam/70 hover:bg-beam",
            )}
          />
        ))}
      </div>

      <div className="mt-3 mb-1 font-mono text-[9px] tracking-telemetry text-zinc uppercase">
        Agent-emitted · governed layer
      </div>
      <pre className="overflow-x-auto rounded-sm border border-white/10 bg-white/4 p-2 font-mono text-[9.5px] leading-relaxed text-platinum">
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

/* ── experiments: cache hit as an equality proof ──────────────────────── */

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
                    done ? (cached ? "bg-signal" : "bg-beam") : "bg-white/20",
                  )}
                />
                {s.name}
              </span>
              <span className="tabular-nums">
                {done ? (cached ? "cache hit" : `${s.ms} ms`) : "—"}
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

export function Prototype({ variant }: { variant: Variant }) {
  if (variant === "topology") return <TopologyProto />;
  if (variant === "cluster") return <ClusterProto />;
  if (variant === "query") return <QueryProto />;
  return <ExperimentsProto />;
}
