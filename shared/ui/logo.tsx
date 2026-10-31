"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/cn";
import { useIdle } from "@/shared/lib/use-idle";

/**
 * The brand mark: a planet drawn as a halftone, in the same dot language as the
 * ASCII covers, lit from the top left like the Earth on the flight deck.
 *
 * It lives at rest — continents drift under the light, one turn every ~14s,
 * and the specular dots flash blue as land passes beneath them. Hovering the
 * logo (or reaching it by keyboard) swings the light round to face the viewer,
 * turns the core blue and spins the planet up; leaving lets it settle back.
 * Under reduced motion the planet holds still and the hover is a plain fade.
 *
 * A 7×7 lattice is as dense as the dots stay legible at header size; anything
 * finer melts into grey at 22px on a 1× screen.
 */

const N = 7;
const CELL = 24 / N;
const SPIN = 0.45; // rad/s at rest
const SPIN_HOVER = 3.6; // added on full hover
const EASE = 0.24; // s, the hover's time constant
const AMBIENT_FPS = 24;

type Vec = [number, number, number];
const unit = (v: Vec): Vec => {
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const DOTS = Array.from({ length: N * N }, (_, k) => {
  const x = CELL * ((k % N) + 0.5);
  const y = CELL * (Math.floor(k / N) + 0.5);
  const nx = (x - 12) / 12;
  const ny = (y - 12) / 12;
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  return { x, y, nx, ny, nz, lon: Math.atan2(nx, nz), lat: Math.asin(-ny) };
}).filter((p) => Math.hypot(p.x - 12, p.y - 12) <= 11.6);

// Four soft blobs on the sphere; enough to read as land drifting past, too few
// to read as any particular coastline.
const CONTINENTS = (
  [
    [0.2, 0.35, 0.75],
    [2.1, -0.25, 0.65],
    [3.6, 0.55, 0.6],
    [4.9, -0.45, 0.55],
  ] as const
).map(([lon, lat, size]) => ({
  v: [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)] as Vec,
  k: 2 / (size * size),
}));

function land(lon: number, lat: number) {
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  let v = 0;
  for (const c of CONTINENTS) v += Math.exp(-(1 - (x * c.v[0] + y * c.v[1] + z * c.v[2])) * c.k);
  return Math.min(1, Math.max(0, (v - 0.35) / 0.3));
}

const REST = unit([-0.55, -0.62, 0.56]);
const FACING = unit([-0.2, -0.26, 1]);

/** Radius, ink opacity and how blue each dot is, for a given spin and hover. */
function shade(spin: number, hover: number) {
  const e = smooth(0, 1, hover);
  const light = unit([0, 1, 2].map((i) => REST[i] + (FACING[i] - REST[i]) * e) as Vec);
  return DOTS.map((p) => {
    const d = Math.max(0, p.nx * light[0] + p.ny * light[1] + p.nz * light[2]);
    const g = land(p.lon + spin, p.lat);
    const blue = smooth(0.84 - 0.2 * e, 0.95 - 0.2 * e, d) * smooth(0.3, 0.7, g);
    return { r: CELL * 0.48 * (0.34 + 0.66 * d) * (0.6 + 0.4 * g), ink: 0.5 + 0.5 * d, blue };
  });
}

const STILL = shade(0, 0);
const fixed = (n: number) => n.toFixed(2);

export function PlanetMark({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const idle = useIdle(svg);
  const motion = useRef({ spin: 0, hover: 0, target: 0 });

  useEffect(() => {
    const el = svg.current;
    if (!el || idle) return;
    const [inkLayer, blueLayer] = el.children;
    const ink = [...inkLayer.children];
    const blue = [...blueLayer.children];
    const m = motion.current;
    // The whole logo is the hover target, not just the 22px of planet.
    const host = el.closest("a, button") ?? el.parentElement ?? el;

    let raf = 0;
    let last = 0;
    let since = 0;

    const paint = () => {
      shade(m.spin, m.hover).forEach((s, i) => {
        const r = fixed(s.r);
        ink[i].setAttribute("r", r);
        ink[i].setAttribute("fill-opacity", fixed(s.ink * (1 - s.blue)));
        blue[i].setAttribute("r", r);
        blue[i].setAttribute("fill-opacity", fixed(s.blue));
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      m.hover += (m.target - m.hover) * (1 - Math.exp(-dt / EASE));
      if (!reduce) m.spin += (SPIN + SPIN_HOVER * m.hover * m.hover) * dt;
      const settling = Math.abs(m.target - m.hover) > 0.002 || m.hover > 0.002;
      since += dt;
      // At rest the drift is slow enough that 24fps is indistinguishable from
      // 60; while the hover is live every frame counts.
      if (settling || since >= 1 / AMBIENT_FPS) {
        paint();
        since = 0;
      }
      raf = settling || !reduce ? requestAnimationFrame(tick) : 0;
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const aim = (target: number) => () => {
      m.target = target;
      start();
    };
    const enter = aim(1);
    const leave = aim(0);
    const focus = () => {
      if (host.matches(":focus-visible")) enter();
    };

    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("focusin", focus);
    host.addEventListener("focusout", leave);
    if (!reduce || m.hover > 0.002) start();

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focusin", focus);
      host.removeEventListener("focusout", leave);
    };
  }, [reduce, idle]);

  return (
    <svg
      ref={svg}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={cn("size-5 shrink-0 overflow-visible sm:size-[22px]", className)}
    >
      <g fill="currentColor">
        {DOTS.map((p, i) => (
          <circle
            key={i}
            cx={fixed(p.x)}
            cy={fixed(p.y)}
            r={fixed(STILL[i].r)}
            fillOpacity={fixed(STILL[i].ink * (1 - STILL[i].blue))}
          />
        ))}
      </g>
      <g className="fill-comet">
        {DOTS.map((p, i) => (
          <circle
            key={i}
            cx={fixed(p.x)}
            cy={fixed(p.y)}
            r={fixed(STILL[i].r)}
            fillOpacity={fixed(STILL[i].blue)}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Mark and wordmark together, for the header of every surface. The caller
 * owns the wrapper (a link, the deck's button, a plain span) and its label.
 */
export function Logo({ className }: { className?: string }) {
  return (
    // A step smaller under `sm`, so the 320px header row is no wider than it
    // was with the old ring and spaced-out type.
    <span className={cn("flex items-center gap-2 sm:gap-2.5", className)}>
      <PlanetMark />
      <span className="text-lg leading-none font-bold tracking-[-0.035em] text-white sm:text-xl">
        M<span className="text-comet">I</span>W
      </span>
    </span>
  );
}
