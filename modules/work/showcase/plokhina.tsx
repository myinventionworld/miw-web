"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/cn";

const SHOPPERS = 12;
const PER_PAIR = 3;
const WINNERS = [1, 0, 2, 1];
const SIZES = [37, 38, 38, 39];
const ROW = 18;
const TOP = 26;
const TILE = { x: 356, w: 84, h: 34 };

const shopperY = (i: number) => TOP + i * ROW;
const pairY = (p: number) => shopperY(p * PER_PAIR + 1);
const wins = (i: number) => i % PER_PAIR === WINNERS[Math.floor(i / PER_PAIR)];

/** J.O.Plokhina: twelve shoppers order at once, four pairs are left, four orders go through. */
export function PairRace() {
  const { t } = useTranslation("projects");
  const k = (s: string) => t(`jo_plokhina.race.${s}`);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const shown = reduce ? 2 : phase;

  useEffect(() => {
    if (reduce || !inView) return;
    const steps = [900, 1700, 4200];
    let timer = 0;
    let current = 0;
    const next = () => {
      current = (current + 1) % steps.length;
      setPhase(current);
      timer = window.setTimeout(next, steps[current]);
    };
    setPhase(0);
    timer = window.setTimeout(next, steps[0]);
    return () => window.clearTimeout(timer);
  }, [inView, reduce]);

  return (
    <figure ref={ref} className="mx-auto w-full max-w-[560px]">
      <div className="rounded-[14px] bg-carbon p-5 sm:p-6">
        <div className="flex justify-between text-label text-steel">
          <span>{k("shoppers")}</span>
          <span>{k("pairs")}</span>
        </div>
        <svg
          viewBox="0 0 460 244"
          className="mt-2 block h-auto w-full"
          role="img"
          aria-label={k("alt")}
        >
          {Array.from({ length: SHOPPERS }, (_, i) => {
            const p = Math.floor(i / PER_PAIR);
            const y1 = shopperY(i);
            const y2 = pairY(p) + ((i % PER_PAIR) - 1) * 9;
            const won = wins(i);
            return (
              <path
                key={`line-${i}`}
                d={`M48 ${y1} C200 ${y1} 210 ${y2} ${TILE.x} ${y2}`}
                pathLength={1}
                fill="none"
                strokeDasharray="1"
                style={{
                  strokeDashoffset: shown >= 1 ? 0 : 1,
                  stroke:
                    shown === 2 && won
                      ? "var(--color-comet)"
                      : "var(--color-white)",
                  strokeOpacity: shown === 2 ? (won ? 1 : 0.1) : 0.3,
                  strokeWidth: shown === 2 && won ? 2 : 1.2,
                  transition: `stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.03}s, stroke-opacity 0.5s, stroke 0.5s`,
                }}
              />
            );
          })}
          {Array.from({ length: SHOPPERS }, (_, i) => {
            const won = wins(i);
            return (
              <circle
                key={`shopper-${i}`}
                cx={40}
                cy={shopperY(i)}
                r={6}
                style={{
                  fill:
                    shown === 2 && won
                      ? "var(--color-comet)"
                      : "var(--color-carbon)",
                  stroke:
                    shown === 2 && !won
                      ? "var(--color-steel)"
                      : "var(--color-comet)",
                  strokeOpacity: shown === 2 && !won ? 0.6 : 1,
                  transition: "fill 0.5s, stroke 0.5s",
                }}
                strokeWidth={1.5}
              />
            );
          })}
          {SIZES.map((size, p) => (
            <g key={`pair-${p}`}>
              <rect
                x={TILE.x}
                y={pairY(p) - TILE.h / 2}
                width={TILE.w}
                height={TILE.h}
                rx={6}
                style={{
                  fill: shown === 2 ? "var(--color-comet)" : "transparent",
                  stroke: "var(--color-comet)",
                  strokeOpacity: shown === 2 ? 1 : 0.4,
                  transition: "fill 0.5s, stroke-opacity 0.5s",
                }}
              />
              <text
                x={TILE.x + TILE.w / 2}
                y={pairY(p) + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                style={{
                  fill:
                    shown === 2 ? "var(--color-void)" : "var(--color-comet)",
                  transition: "fill 0.5s",
                }}
              >
                {size}
              </text>
            </g>
          ))}
        </svg>
        <p
          className={cn(
            "mt-2 text-right text-small font-semibold text-white tabular-nums transition-opacity duration-500",
            shown === 2 ? "opacity-100" : "opacity-0",
          )}
        >
          {k("result")}
        </p>
      </div>
      <figcaption className="relative mt-5 min-h-[4.8em] text-body leading-relaxed text-zinc">
        {reduce ? (
          <span className="block space-y-2">
            <span className="block">{k("a")}</span>
            <span className="block">{k("b")}</span>
            <span className="block">{k("c")}</span>
          </span>
        ) : (
          (["a", "b", "c"] as const).map((key, i) => (
            <span
              key={key}
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                phase === i ? "opacity-100" : "opacity-0",
              )}
            >
              {k(key)}
            </span>
          ))
        )}
      </figcaption>
    </figure>
  );
}

const SIZE_RANGE = [36, 37, 38, 39, 40, 41];
const FITS = [
  { id: "small", fit: -1 },
  { id: "true", fit: 0 },
  { id: "large", fit: 1 },
] as const;
const SCALE = { min: 21, max: 27.5 };
const FOOT = { min: 22, max: 27, start: 23, rest: 24.6 };

const insole = (size: number, fit: number) =>
  23.5 + (size - 36) * 0.5 + 0.5 * fit;
const pct = (cm: number) => ((cm - SCALE.min) / (SCALE.max - SCALE.min)) * 100;

/** J.O.Plokhina: the shop's own size rule, the smallest size whose insole is at least the foot. */
export function SizeFinder() {
  const { t, i18n } = useTranslation("projects");
  const k = (s: string, o?: Record<string, unknown>) =>
    t(`jo_plokhina.fit.${s}`, o);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [foot, setFoot] = useState(FOOT.rest);
  const [fit, setFit] = useState(0);
  const touched = useRef(false);

  useEffect(() => {
    if (!inView || reduce || touched.current) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      if (touched.current) return;
      const p = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - p, 3);
      setFoot(
        Math.round((FOOT.start + (FOOT.rest - FOOT.start) * eased) * 10) / 10,
      );
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce]);

  const cm = new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const pick = SIZE_RANGE.find((s) => insole(s, fit) >= foot - 1e-9);

  return (
    <figure ref={ref} className="mx-auto w-full max-w-[560px]">
      <div className="rounded-[14px] bg-carbon p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <label
            htmlFor="jo-foot"
            className="text-small font-medium text-white"
          >
            {k("foot")}
          </label>
          <span className="text-copy font-semibold text-white tabular-nums">
            {cm.format(foot)} cm
          </span>
        </div>
        <input
          id="jo-foot"
          type="range"
          min={FOOT.min}
          max={FOOT.max}
          step={0.1}
          value={foot}
          onChange={(e) => {
            touched.current = true;
            setFoot(Number(e.target.value));
          }}
          className="mt-3 w-full accent-[var(--color-comet)]"
        />

        <div
          role="radiogroup"
          aria-label={k("model")}
          className="mt-4 flex flex-wrap gap-px overflow-hidden rounded-lg border border-white/12 bg-white/12"
        >
          {FITS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={fit === f.fit}
              onClick={() => {
                touched.current = true;
                setFit(f.fit);
              }}
              className={cn(
                "flex-auto px-3 py-2 text-small font-medium whitespace-nowrap transition-colors",
                fit === f.fit
                  ? "bg-space-800 text-white shadow-[inset_0_-2px_0_var(--color-comet)]"
                  : "bg-carbon text-zinc hover:text-white",
              )}
            >
              {k(f.id)}
            </button>
          ))}
        </div>

        <div className="relative mt-5 space-y-1.5" aria-hidden>
          {SIZE_RANGE.map((s) => {
            const len = insole(s, fit);
            const chosen = s === pick;
            return (
              <div
                key={s}
                className="grid grid-cols-[2.25rem_1fr] items-center gap-2"
              >
                <span
                  className={cn(
                    "text-small tabular-nums",
                    chosen ? "font-semibold text-comet" : "text-steel",
                  )}
                >
                  {s}
                </span>
                <span className="relative h-5 overflow-hidden rounded-md bg-white/6">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-md transition-[width,background-color] duration-300 ease-out",
                      chosen
                        ? "bg-comet"
                        : len >= foot
                          ? "bg-white/25"
                          : "bg-white/12",
                    )}
                    style={{ width: `${pct(len)}%` }}
                  />
                  {chosen && (
                    <span className="absolute inset-y-0 left-2 flex items-center text-label font-semibold text-void">
                      {k("yours")}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          <span
            className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded-full bg-white transition-[left] duration-150"
            style={{
              left: `calc(2.75rem + (100% - 2.75rem) * ${pct(foot) / 100})`,
            }}
          />
        </div>
      </div>
      <figcaption className="mt-5 text-body leading-relaxed text-zinc">
        <span aria-live="polite" className="block text-white">
          {pick
            ? k("result", {
                foot: cm.format(foot),
                size: pick,
                insole: cm.format(insole(pick, fit)),
              })
            : k("none")}
        </span>
        <span className="mt-2 block">{k("note")}</span>
      </figcaption>
    </figure>
  );
}
