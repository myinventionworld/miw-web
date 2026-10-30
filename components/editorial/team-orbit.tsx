"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { initials } from "@/data/team";
import { cn } from "@/lib/utils";
import { OrbitRing, orbitClasses, useOrbitIdle } from "./orbit";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** One line in their own words, when they have written one. */
  line?: string;
  photo?: string;
  orbit: "inner" | "outer";
}

/** How long each person stays on the card while the block runs by itself. */
const STEP_MS = 3000;
/** How long a person opened from a link (`#team-<id>`) stays. */
const LINK_HOLD_MS = 8000;

const pad = (n: number) => String(n).padStart(2, "0");

/** `#team-ivan` → `ivan`. */
const fromHash = (hash: string) => (hash.startsWith("#team-") ? hash.slice(6) : null);

/**
 * The team on About: everyone on two slow orbits around the studio, and a card
 * for one person at a time. The card moves on by itself every few seconds;
 * pointing at a face grows it and shows that person while the orbits keep
 * turning, Tab reaches each face (and stops the orbits so the focused one
 * holds still), and a tap keeps a person on the card until the next tap. The avatars are the
 * accessible list of the team, as buttons named after the person.
 *
 * `#team-<id>` (the cover links there) selects that person and keeps them for
 * a few seconds, so `/about#team-ivan` is a link to Ivan.
 *
 * On About it is a section of its own with a heading. `embedded` drops the
 * heading and the page frame and stacks the orbit over the card, for a page
 * that already introduces the team (the phone home).
 */
export function TeamOrbit({
  people,
  title,
  lede,
  hintPointer,
  hintTouch,
  embedded = false,
}: {
  people: TeamMember[];
  /** The heading, and the name of the list of people. */
  title: string;
  lede?: string;
  hintPointer: string;
  hintTouch: string;
  embedded?: boolean;
}) {
  const reduce = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const system = useRef<HTMLDivElement>(null);
  const idle = useOrbitIdle(system);

  const [index, setIndex] = useState(0);
  /** A pointer or the keyboard is on a face. */
  const [pointing, setPointing] = useState(false);
  /** Held by a tap or a click, until the next one. */
  const [held, setHeld] = useState(false);
  /** Opened from a link: held for a while, then the card runs on. */
  const [linked, setLinked] = useState(false);
  /** The card moved because someone asked: announce it. */
  const [userMoved, setUserMoved] = useState(false);

  const running = !reduce && !idle && !pointing && !held && !linked;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setUserMoved(false);
      setIndex((i) => (i + 1) % people.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [running, people.length]);

  const show = useCallback(
    (id: string, scroll: boolean) => {
      const i = people.findIndex((p) => p.id === id);
      if (i < 0) return;
      setIndex(i);
      setUserMoved(true);
      setLinked(true);
      if (scroll) {
        section.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "center",
        });
      }
    },
    [people],
  );

  useEffect(() => {
    if (!linked) return;
    const id = window.setTimeout(() => setLinked(false), LINK_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [linked, index]);

  // The link that opened the page, later hash changes, and the cover's links
  // (which also fire when the hash is already the same).
  useEffect(() => {
    const initial = fromHash(window.location.hash);
    if (initial) show(initial, true);
    const onHash = () => {
      const id = fromHash(window.location.hash);
      if (id) show(id, true);
    };
    const onShow = (e: Event) => show((e as CustomEvent<string>).detail, true);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("team:show", onShow);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("team:show", onShow);
    };
  }, [show]);

  const pick = (i: number) => {
    setIndex(i);
    setUserMoved(true);
  };

  const person = people[index];
  const inner = people.filter((p) => p.orbit === "inner");
  const outer = people.filter((p) => p.orbit === "outer");

  const avatar = (p: TeamMember) => {
    const i = people.indexOf(p);
    const selected = i === index;
    return (
      <button
        type="button"
        aria-label={`${p.name}, ${p.role}`}
        aria-pressed={selected}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          setPointing(true);
          pick(i);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setPointing(false);
        }}
        onFocus={(e) => {
          // Keyboard focus only. A tap focuses the button too, and that must
          // not count as pointing, or the second tap could never let go.
          if (!e.currentTarget.matches(":focus-visible")) return;
          setPointing(true);
          pick(i);
        }}
        onBlur={() => setPointing(false)}
        onClick={() => {
          if (held && selected) {
            setHeld(false);
          } else {
            pick(i);
            setHeld(true);
          }
        }}
        className={cn(
          orbitClasses.hit,
          "flex size-(--avatar) items-center justify-center overflow-hidden rounded-full font-semibold tracking-[-0.01em]",
          selected ? "bg-white text-void" : "bg-space-800 text-zinc hover:bg-line",
          // A photo covers the fill, so the chosen one gets a ring instead.
          selected && p.photo && "ring-2 ring-white ring-offset-[3px] ring-offset-void",
        )}
        style={{ fontSize: "calc(var(--avatar) * 0.32)" }}
      >
        {p.photo ? (
          // Sized for the avatar grown under the pointer, at 2x.
          <Image
            src={p.photo}
            alt=""
            width={240}
            height={240}
            sizes="(min-width: 768px) 112px, 56px"
            className="size-full object-cover"
          />
        ) : (
          // Drawn by CSS, so the button's name is the person's full name and
          // the letters on it are not a second, different label.
          <span aria-hidden data-initials={initials(p.name)} className="before:content-[attr(data-initials)]" />
        )}
      </button>
    );
  };

  const ringItems = (list: TeamMember[], start: number) =>
    list.map((p, k) => ({
      key: p.id,
      angle: start + (360 / list.length) * k,
      node: avatar(p),
    }));

  return (
    <section
      ref={section}
      id="team"
      aria-label={embedded ? title : undefined}
      aria-labelledby={embedded ? undefined : "team-title"}
      className={cn(
        "grid scroll-mt-20 items-center gap-y-10",
        embedded
          ? "[grid-template-areas:'orbit'_'card']"
          : "mx-auto max-w-6xl gap-x-12 px-4 py-24 [grid-template-areas:'head'_'orbit'_'card'] sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] md:gap-y-12 md:px-8 md:py-32 md:[grid-template-areas:'head_orbit'_'card_orbit']",
      )}
    >
      {!embedded && (
        <div className="[grid-area:head] md:self-end">
          <h2
            id="team-title"
            className="text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white"
          >
            {title}
          </h2>
          {lede && (
            <p className="mt-5 max-w-md text-[1.1875rem] leading-relaxed text-zinc">{lede}</p>
          )}
        </div>
      )}

      <div
        // Read out only when someone changed it; a card that moves on its own
        // every few seconds would talk over everything else.
        aria-live={userMoved ? "polite" : "off"}
        aria-atomic
        className={cn("[grid-area:card]", !embedded && "md:self-start")}
      >
        <p className="text-small font-semibold text-zinc tabular-nums">
          {pad(index + 1)} / {pad(people.length)}
        </p>
        <p className="mt-2 text-[clamp(1.6rem,2.8vw,2rem)] leading-[1.12] font-bold tracking-[-0.03em] text-white">
          {person.name}
        </p>
        <p className="mt-1.5 text-copy text-zinc">{person.role}</p>
        {person.line && (
          <p className="mt-4 max-w-sm text-copy leading-relaxed text-platinum">{person.line}</p>
        )}
        <p className="mt-8 text-meta text-steel [@media(hover:none)]:hidden">{hintPointer}</p>
        <p className="mt-8 hidden text-meta text-steel [@media(hover:none)]:block">{hintTouch}</p>
      </div>

      <div className={cn("mx-auto w-full max-w-[460px] [grid-area:orbit]", !embedded && "md:max-w-none")}>
        <div
          ref={system}
          className={cn(
            orbitClasses.group,
            idle && orbitClasses.paused,
            "@container relative aspect-square w-full",
          )}
          style={{ "--avatar": "max(44px, 11.5cqw)" } as CSSProperties}
        >
          {/* The two orbits and the studio at the centre. */}
          <div aria-hidden className="absolute inset-[calc(var(--avatar)/2)] rounded-full border border-white/80" />
          <div aria-hidden className="absolute inset-[20%] rounded-full border border-white/80" />
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 flex size-[22cqw] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[1.6cqw] rounded-full bg-white text-void"
          >
            <span className="relative flex size-[2.6cqw] min-h-2.5 min-w-2.5 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-void/70" />
              <span className="absolute size-[30%] rounded-full bg-void" />
            </span>
            <span className="text-[max(10px,2.6cqw)] font-semibold tracking-[0.3em]">MIW</span>
          </div>

          {/* A group, not a list: the rings and slots between this box and
              the buttons would each have to be list items for a list. */}
          <div role="group" aria-label={title} className="absolute top-1/2 left-1/2">
            <OrbitRing
              radius="30cqw"
              period={70}
              clockwise
              items={ringItems(inner, -90)}
            />
            <OrbitRing
              radius="calc(50cqw - var(--avatar) / 2)"
              period={110}
              items={ringItems(outer, -135)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
