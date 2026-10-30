"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";

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
 * scroll the system and the moon drift apart a little. Pointing at a person
 * grows the face and shows who it is while the orbit keeps turning; a click
 * goes to them in the team block. Off screen, in a hidden tab or with reduced
 * motion nothing turns.
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
  const idle = useIdle(ref);
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
        node: <Face person={p} delay={1.3 + i * 0.22} />,
      })),
  ]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-cover
      className={cn("@container relative h-full w-full overflow-hidden", idle && orbitClasses.paused, className)}
    >
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y: systemY }}>
        <svg
          viewBox={`0 0 ${W} ${h}`}
          preserveAspectRatio="xMaxYMin slice"
          className="absolute inset-0 block h-full w-full"
        >
          {ORBITS.map((o, i) => (
            <path
              key={o.r}
              d={arc(o.r, h)}
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
      <motion.div className="pointer-events-none absolute inset-0" style={reduce ? undefined : { y: moonY }}>
        <svg
          viewBox={`0 0 ${W} ${h}`}
          preserveAspectRatio="xMaxYMin slice"
          className="block h-full w-full"
        >
          <circle className="cover-moon" cx={MOON.cx} cy={h + MOON.sink} r={MOON.r} fill="var(--color-comet)" />
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * A person on the cover. Hidden from screen readers and from Tab: the team
 * block below is the accessible list, and reading seven names twice helps
 * nobody. The pointer gets the name and role, and a click goes to the person
 * there.
 */
function Face({ person, delay }: { person: CoverPerson; delay: number }) {
  // The face moves slowly, so the side is worked out once, when the pointer
  // arrives.
  const [right, setRight] = useState(false);

  return (
    <a
      href={`#team-${person.id}`}
      tabIndex={-1}
      onPointerEnter={(e) => {
        const face = e.currentTarget.getBoundingClientRect();
        const cover = e.currentTarget.closest("[data-cover]")?.getBoundingClientRect();
        if (cover) setRight(face.left + face.width / 2 < cover.left + cover.width / 2);
      }}
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
      <span
        className={cn(
          orbitClasses.label,
          right && orbitClasses.labelRight,
          "rounded-full border border-line bg-void px-3 py-1.5 text-meta font-medium whitespace-nowrap text-white",
        )}
      >
        {person.name} · {person.role}
      </span>
    </a>
  );
}
