"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The MIW Labs cover from the design system, as a live picture: one ink body
 * bled off the top-right corner, three hairline orbits around its centre with
 * a product on each, and the blue moon rising from the bottom edge.
 *
 * The composition is drawn on a 480-wide box. At 3:2 it is exactly the cover;
 * when the box is taller (a long headline beside it) the box grows downwards
 * and the moon stays on the bottom edge, so the picture never letterboxes or
 * crops the body.
 *
 * Motion, all of it slow: the orbits draw in once, the moon rises into place,
 * the planets travel along their orbits and re-enter from the top edge after
 * leaving at the bottom, and while the page scrolls the system and the moon
 * drift apart a little. Planets stop while the cover is off screen. With
 * reduced motion it is the still cover.
 *
 * Colours are the theme's: ink (`--color-white` is black on the light pages),
 * the link blue and the three product colours. Flat, no glow.
 */

const W = 480;
const BASE_H = 320;
/** The ink body's centre: the top-right corner. */
const CX = W;
const CY = 0;
const BODY_R = 256;
const MOON = { cx: 136, r: 128, sink: 40 };

/** Distance travelled along an orbit, in composition units per second. */
const SPEED = 6.5;

const PLANETS = [
  // Angles are where each planet sits on the still cover, in degrees from
  // the body's centre (clockwise, y down).
  { id: "boowie", orbit: 320, r: 16, start: 120 },
  { id: "wovie", orbit: 384, r: 8, start: 170 },
  { id: "omnibus", orbit: 448, r: 12, start: 152 },
] as const;

const ORBITS = [320, 384, 448];

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * The stretch of an orbit that is inside a 480 x `h` box, as angles: where a
 * planet of radius `pr` enters at the top edge and where it has fully left,
 * through the bottom edge or the right one.
 */
function visibleSpan(orbit: number, pr: number, h: number) {
  const enter = 180 + deg(Math.asin(Math.min(1, (pr + 1) / orbit)));
  const exit =
    orbit > h + pr
      ? 180 - deg(Math.asin((h + pr) / orbit))
      : 90 - deg(Math.asin(Math.min(1, (pr + 1) / orbit)));
  return { enter, exit };
}

/** The visible arc of an orbit, top edge to where it leaves the box. */
function arc(orbit: number, h: number) {
  const x0 = CX - orbit;
  if (orbit <= h) return `M${x0} 0 A${orbit} ${orbit} 0 0 0 ${CX} ${orbit}`;
  const x1 = CX - Math.sqrt(orbit * orbit - h * h);
  return `M${x0} 0 A${orbit} ${orbit} 0 0 0 ${x1.toFixed(1)} ${h}`;
}

export function Cover({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const planets = useRef<(SVGGElement | null)[]>([]);
  const reduce = useReducedMotion();
  const onScreen = useInView(ref);
  /** Height of the drawing in composition units; 320 is the 3:2 cover. */
  const [h, setH] = useState(BASE_H);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) setH(Math.max(BASE_H, Math.round((W * height) / width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Each planet keeps its own clock, so pausing off screen and coming back
  // resumes where it was instead of jumping.
  const travelled = useRef(PLANETS.map(() => 0));
  useEffect(() => {
    if (reduce || !onScreen) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      PLANETS.forEach((p, i) => {
        const { enter, exit } = visibleSpan(p.orbit, p.r, h);
        const span = enter - exit;
        travelled.current[i] += deg(SPEED / p.orbit) * dt;
        const along = (enter - p.start + travelled.current[i]) % span;
        planets.current[i]?.setAttribute(
          "transform",
          `rotate(${(enter - along).toFixed(3)} ${CX} ${CY})`,
        );
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, onScreen, h]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const systemY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const moonY = useTransform(scrollYProgress, [0, 1], [0, 56]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("h-full w-full overflow-hidden", className)}
    >
      <svg
        viewBox={`0 0 ${W} ${h}`}
        preserveAspectRatio="xMaxYMin slice"
        className="block h-full w-full"
      >
        <motion.g style={reduce ? undefined : { y: systemY }}>
          {ORBITS.map((orbit, i) => (
            <path
              key={orbit}
              d={arc(orbit, h)}
              pathLength={1}
              className="cover-orbit"
              style={{ animationDelay: `${0.15 + i * 0.22}s` }}
              fill="none"
              stroke="var(--color-white)"
              strokeWidth={1.2}
            />
          ))}
          <path
            d={`M${CX} ${CY} H${CX - BODY_R} A${BODY_R} ${BODY_R} 0 0 0 ${CX} ${BODY_R} Z`}
            fill="var(--color-white)"
          />
          {PLANETS.map((p, i) => (
            <g
              key={p.id}
              ref={(el) => {
                planets.current[i] = el;
              }}
              transform={`rotate(${p.start} ${CX} ${CY})`}
            >
              <circle
                className={`cover-planet cover-${p.id}`}
                style={{ animationDelay: `${1 + i * 0.22}s` }}
                cx={CX + p.orbit}
                cy={CY}
                r={p.r}
              />
            </g>
          ))}
        </motion.g>
        {/* After the planets: Omnibus's orbit runs behind the moon, and the
            planet goes the same way. */}
        <motion.g style={reduce ? undefined : { y: moonY }}>
          <circle
            className="cover-moon"
            cx={MOON.cx}
            cy={h + MOON.sink}
            r={MOON.r}
            fill="var(--color-comet)"
          />
        </motion.g>
      </svg>
    </div>
  );
}
