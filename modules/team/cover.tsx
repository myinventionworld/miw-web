"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { initials } from "./team";
import { cn } from "@/shared/lib/cn";
import { OrbitRing, orbitClasses, type OrbitItem } from "./orbit";
import { useIdle } from "@/shared/lib/use-idle";

/**
 * The MIW Labs cover from the design system, as a live picture: one ink body
 * bled off the top-right corner, three hairline orbits around its centre, the
 * products and the people of the studio travelling on them, and the blue moon
 * rising from the bottom edge.
 *
 * The composition is drawn on a 480-wide box. At 3:2 it is exactly the cover;
 * when the box is taller (a long headline beside it) the box grows downwards
 * and the moon stays on the bottom edge, so the picture never letterboxes or
 * crops the body.
 *
 * Each orbit is a ring with four places, products and people mixed, turning
 * at its own slow pace (CSS only, see `orbit.tsx`); a quarter of each ring is
 * in view, so a body drifts in from the top edge, crosses and leaves. The
 * still frame is the design system's cover: the three products where it puts
 * them. The orbits draw in once, the moon rises the last few units, and on
 * scroll (not on touch screens) the system and the moon drift apart a little.
 * Pointing at a person grows the face and shows who it is while the orbit
 * keeps turning; a click goes to them in the team block. Off screen, in a
 * hidden tab or with reduced motion nothing turns.
 *
 * On a phone there is no pointer: a tap on a face goes straight to the team
 * block. Without `people` the cover is products only.
 *
 * Colours are the theme's: ink (`--color-white` is black on the light pages),
 * the link blue and the three product colours. Flat, no glow.
 */

const W = 480;
const BASE_H = 320;
/** The ink body's centre: the top-right corner. */
const CX = W;
const BODY_R = 256;
const MOON = { cx: 136, r: 128, sink: 40 };

/** Composition units as a share of the cover's width. */
const u = (n: number) => `calc(${n} / ${W} * 100cqw)`;

/** Radius, seconds per turn, and the product that sits where the design
 *  system's cover has it (degrees from the body's centre, clockwise). */
const ORBITS = [
  { r: 320, period: 120, product: { id: "boowie", size: 32, angle: 120 } },
  { r: 384, period: 160, product: { id: "wovie", size: 16, angle: 170 } },
  { r: 448, period: 200, product: { id: "omnibus", size: 24, angle: 152 } },
] as const;

const PLACES = 4;
const PERSON = 40;
const DRIFT_PX = 48;
const TOUCH = "(hover: none) and (pointer: coarse)";

const onTouchChange = (cb: () => void) => {
  const q = window.matchMedia(TOUCH);
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};

export interface CoverPerson {
  id: string;
  name: string;
  role: string;
  photo?: string;
}

/** The visible arc of an orbit, top edge to where it leaves the box. */
function arc(orbit: number, h: number) {
  const x0 = CX - orbit;
  if (orbit <= h) return `M${x0} 0 A${orbit} ${orbit} 0 0 0 ${CX} ${orbit}`;
  const x1 = CX - Math.sqrt(orbit * orbit - h * h);
  return `M${x0} 0 A${orbit} ${orbit} 0 0 0 ${x1.toFixed(1)} ${h}`;
}

export function Cover({
  className,
  people = [],
}: {
  className?: string;
  people?: CoverPerson[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Scroll-linked motion trails the finger on touch screens and lifts the
  // orbits' ends into view, so there the picture stays put.
  const touch = useSyncExternalStore(onTouchChange, () => window.matchMedia(TOUCH).matches, () => false);
  const still = reduce || touch;
  const idle = useIdle(ref);
  /** Height of the drawing in composition units; 320 is the 3:2 cover. */
  const [h, setH] = useState(BASE_H);
  /** Composition units per CSS pixel. */
  const [unit, setUnit] = useState(1);
  const label = useRef<HTMLDivElement>(null);
  const [pointed, setPointed] = useState<HTMLElement | null>(null);
  const [named, setNamed] = useState<CoverPerson | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) {
        setH(Math.max(BASE_H, Math.round((W * height) / width)));
        setUnit(W / width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The label lives above every layer, so the moon never covers it. Its side
  // is chosen once, when the pointer arrives, and it wraps only when neither
  // side has room for one line. Each frame moves it with the face, unrounded:
  // whole-pixel steps beside a face gliding on the compositor read as a jitter.
  useEffect(() => {
    const box = ref.current;
    const el = label.current;
    if (!pointed || !box || !el) return;
    const gap = 10;
    const pad = 8;
    Object.assign(el.style, { whiteSpace: "nowrap", maxWidth: "none", borderRadius: "9999px" });
    const b0 = box.getBoundingClientRect();
    const f0 = pointed.getBoundingClientRect();
    const roomRight = b0.right - f0.right - gap - pad;
    const roomLeft = f0.left - b0.left - gap - pad;
    const oneLine = el.offsetWidth;
    let side: "right" | "left" | "below";
    if (roomRight >= oneLine) side = "right";
    else if (roomLeft >= oneLine) side = "left";
    else {
      const room = Math.max(roomRight, roomLeft);
      side = room >= 140 ? (roomRight >= roomLeft ? "right" : "left") : "below";
      Object.assign(el.style, {
        whiteSpace: "normal",
        maxWidth: `${side === "below" ? b0.width - 2 * pad : room}px`,
        borderRadius: "16px",
      });
    }
    let raf = 0;
    const place = () => {
      const b = box.getBoundingClientRect();
      const f = pointed.getBoundingClientRect();
      const w = el.offsetWidth;
      const lh = el.offsetHeight;
      let x =
        side === "right" ? f.right - b.left + gap : side === "left" ? f.left - b.left - gap - w : f.left - b.left + f.width / 2 - w / 2;
      let y = side === "below" ? f.bottom - b.top + gap : f.top - b.top + f.height / 2 - lh / 2;
      if (side === "below" && y + lh > b.height - pad) y = f.top - b.top - gap - lh;
      x = Math.min(Math.max(x, pad), b.width - w - pad);
      y = Math.min(Math.max(y, pad), b.height - lh - pad);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(raf);
  }, [pointed, named]);

  const point = (person: CoverPerson, el: HTMLElement | null) => {
    setPointed(el);
    if (el) setNamed(person);
  };

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const systemY = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const moonY = useTransform(scrollYProgress, [0, 1], [0, 72]);

  // Person k rides orbit k % 3, in the places after that orbit's product.
  const rings: OrbitItem[][] = ORBITS.map((o, i) => [
    {
      key: o.product.id,
      angle: o.product.angle,
      node: (
        <span
          className={cn("cover-planet block rounded-full", orbitClasses[o.product.id])}
          style={{ width: u(o.product.size), height: u(o.product.size), animationDelay: `${1 + i * 0.22}s` }}
        />
      ),
    },
    ...people
      .map((p, k) => ({ p, k }))
      .filter(({ k }) => k % ORBITS.length === i)
      .slice(0, PLACES - 1)
      .map(({ p, k }) => ({
        key: p.id,
        angle: o.product.angle + (360 / PLACES) * (1 + Math.floor(k / ORBITS.length)),
        node: <Face person={p} delay={1.3 + i * 0.22} onPoint={point} />,
      })),
  ]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-cover
      className={cn("@container relative h-full w-full overflow-hidden", idle && orbitClasses.paused, className)}
    >
      {/* Taller than the box by the drift, so rising on scroll never shows
          where the orbits end. */}
      <motion.div
        className="absolute inset-x-0 top-0"
        style={{ bottom: -DRIFT_PX, ...(still ? undefined : { y: systemY }) }}
      >
        <svg
          viewBox={`0 0 ${W} ${h + DRIFT_PX * unit}`}
          preserveAspectRatio="xMaxYMin slice"
          className="absolute inset-0 block h-full w-full"
        >
          {ORBITS.map((o, i) => (
            <path
              key={o.r}
              d={arc(o.r, h + DRIFT_PX * unit)}
              pathLength={1}
              className="cover-orbit"
              style={{ animationDelay: `${0.15 + i * 0.22}s` }}
              fill="none"
              stroke="var(--color-white)"
              strokeWidth={1.2}
            />
          ))}
          <path
            d={`M${CX} 0 H${CX - BODY_R} A${BODY_R} ${BODY_R} 0 0 0 ${CX} ${BODY_R} Z`}
            fill="var(--color-white)"
          />
        </svg>
        {/* The rings turn about the body's centre, the top-right corner. */}
        <div className="absolute top-0 right-0">
          {ORBITS.map((o, i) => (
            <OrbitRing key={o.r} radius={u(o.r)} period={o.period} items={rings[i]} />
          ))}
        </div>
      </motion.div>

      {/* Above the bodies: Omnibus's orbit, and whoever rides it, passes
          behind the moon. */}
      <motion.div className="pointer-events-none absolute inset-0" style={still ? undefined : { y: moonY }}>
        <svg
          viewBox={`0 0 ${W} ${h}`}
          preserveAspectRatio="xMaxYMin slice"
          className="block h-full w-full"
        >
          <circle className="cover-moon" cx={MOON.cx} cy={h + MOON.sink} r={MOON.r} fill="var(--color-comet)" />
        </svg>
      </motion.div>

      <div
        ref={label}
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-10 rounded-full border border-line bg-void px-3 py-1.5 text-meta leading-snug font-medium whitespace-nowrap text-white transition-opacity duration-200 will-change-transform",
          pointed ? "opacity-100" : "opacity-0",
        )}
      >
        {named && `${named.name} · ${named.role}`}
      </div>
    </div>
  );
}

/**
 * A person on the cover. Hidden from screen readers and from Tab: the team
 * block below is the accessible list, and reading seven names twice helps
 * nobody. The pointer gets the name and role, and a click goes to the person
 * there.
 */
function Face({
  person,
  delay,
  onPoint,
}: {
  person: CoverPerson;
  delay: number;
  onPoint: (person: CoverPerson, el: HTMLElement | null) => void;
}) {
  return (
    <a
      href={`#team-${person.id}`}
      tabIndex={-1}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onPoint(person, e.currentTarget);
      }}
      onPointerLeave={() => onPoint(person, null)}
      onClick={(e) => {
        e.preventDefault();
        history.replaceState(null, "", `#team-${person.id}`);
        window.dispatchEvent(new CustomEvent("team:show", { detail: person.id }));
      }}
      className={cn(
        orbitClasses.hit,
        "cover-planet relative flex items-center justify-center rounded-full bg-space-800 font-semibold text-zinc hover:bg-white hover:text-void",
      )}
      style={
        {
          width: `max(30px, ${u(PERSON)})`,
          height: `max(30px, ${u(PERSON)})`,
          fontSize: `max(10px, ${u(13)})`,
          animationDelay: `${delay}s`,
        } as CSSProperties
      }
    >
      {person.photo ? (
        <Image
          src={person.photo}
          alt=""
          width={160}
          height={160}
          sizes="80px"
          // Not lazy: a face clipped outside the cover counts as off screen, so
          // it would load only as it drifted in, an empty circle first.
          loading="eager"
          fetchPriority="low"
          className="size-full rounded-full object-cover"
        />
      ) : (
        initials(person.name)
      )}
    </a>
  );
}
