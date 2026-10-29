"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type TargetAndTransition,
  type Transition,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { BrowserFrame, type Shot } from "./frames";
import { ScrollingWindow } from "./scrolling-window";
import { type LoopVideo, WindowVideo } from "./window-video";

export type { LoopVideo };

const EASE = [0.22, 1, 0.36, 1] as const;

/** One shape for the windows on the carousel (most of the screenshots are
 *  about 1.92:1), so they line up as they swap places. */
const DECK_ASPECT = 1.92;

/** Time each window spends at the front, in seconds. */
const DWELL = 4;
/** When the first window starts to fly in, and the gap between two. */
const FIRST = 0.25;
const STAGGER = 0.18;

type Slot = "front" | "left" | "right";

/**
 * Where a window sits on the carousel. The front one is whole; the two
 * behind it are smaller and set out to either side, so about seventy per
 * cent of each still shows. `x` is a share of the window's own width.
 */
const SLOTS: Record<Slot, TargetAndTransition> = {
  front: { x: "0%", y: "0%", scale: 1, rotate: 0, opacity: 1 },
  left: { x: "-67%", y: "-10%", scale: 0.82, rotate: 0, opacity: 1 },
  right: { x: "67%", y: "-10%", scale: 0.82, rotate: 0, opacity: 1 },
};

/** The ring a window travels each turn: right comes to the front, the front
 *  steps back to the left, and the left one goes round behind to the right. */
const RING: Slot[] = ["front", "left", "right"];

const Z: Record<Slot, number> = { front: 3, left: 2, right: 1 };

/** Coming forward: a spring with a little overshoot, so the window arrives
 *  rather than slides. Stepping back: the same spring, damped flat. */
const FORWARD: Transition = { type: "spring", stiffness: 150, damping: 15, mass: 1 };
const BACK: Transition = { type: "spring", stiffness: 130, damping: 24, mass: 1 };
/** First landing: stiffer and bouncier, so the windows knock into place. */
const LAND: Transition = { type: "spring", stiffness: 210, damping: 13, mass: 0.9 };

/**
 * A desktop-only product on a large screen: the main window, and the other
 * screens on a carousel below it, every one of them in view.
 *
 * The first time it scrolls into view the windows fly in from the right one
 * after another and knock into their places. Then the carousel turns slowly:
 * every few seconds the window on the right springs forward, the front one
 * steps back, and the one on the left goes round behind. It turns only while
 * it is on screen and holds still while the pointer is over it. While the
 * page scrolls the carousel moves faster than the main window, so the two
 * read as layers.
 *
 * Large screens only; phones get a row to swipe (`ProductShots`). With
 * reduced motion the carousel is laid out and nothing moves.
 */
export function WindowStack({
  main,
  full,
  stack,
  host,
  video,
}: {
  main: Shot;
  /** A full-length screenshot: the main window then scrolls through it. */
  full?: Shot;
  /** The carousel; the first one starts at the front. */
  stack: Shot[];
  host: string;
  video?: LoopVideo;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const arrived = useInView(ref, { once: true, amount: 0.3 });
  const onScreen = useInView(deck, { amount: 0.4 });
  const [landed, setLanded] = useState(false);
  const [held, setHeld] = useState(false);
  const [turn, setTurn] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const mainY = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const deckY = useTransform(scrollYProgress, [0, 1], [70, -70]);

  const windows = stack.slice(0, RING.length);
  const n = windows.length;
  const ring = n === 2 ? (["front", "right"] as Slot[]) : RING.slice(0, n);

  useEffect(() => {
    if (!arrived || landed) return;
    const id = window.setTimeout(
      () => setLanded(true),
      (FIRST + (n - 1) * STAGGER + 1.2) * 1000,
    );
    return () => window.clearTimeout(id);
  }, [arrived, landed, n]);

  const turning = !reduce && landed && onScreen && !held && n > 1;
  useEffect(() => {
    if (!turning) return;
    const id = window.setInterval(() => setTurn((t) => t + 1), DWELL * 1000);
    return () => window.clearInterval(id);
  }, [turning]);

  const slotOf = (i: number, t: number) => ring[(i + t) % n];

  return (
    <div ref={ref} className="relative mx-auto max-w-[1000px] pb-6 text-left">
      <motion.div
        className="mx-auto w-[84%]"
        style={reduce ? undefined : { y: mainY }}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={reduce || arrived ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {full ? (
            <ScrollingWindow src={full.src} alt={full.alt} host={host} />
          ) : (
            <BrowserFrame
              shot={main}
              host={host}
              overlay={video ? <WindowVideo video={video} /> : undefined}
            />
          )}
        </motion.div>
      </motion.div>

      {n > 0 && (
        <motion.div
          ref={deck}
          className="relative -mt-[4%]"
          style={reduce ? undefined : { y: deckY }}
          onHoverStart={() => setHeld(true)}
          onHoverEnd={() => setHeld(false)}
        >
          {/* Holds the carousel's height: one front window, chrome included. */}
          <div
            aria-hidden
            style={{ paddingBottom: `calc(46% / ${DECK_ASPECT} + 2.3rem)` }}
          />
          {windows.map((shot, i) => {
            const slot = slotOf(i, turn);
            const before = slotOf(i, turn - 1 + n);
            // The deepest windows land first.
            const order = Z[slotOf(i, 0)] - 1;

            if (reduce) {
              const { x, y, scale } = SLOTS[slot];
              return (
                <motion.div
                  key={shot.alt}
                  className="absolute top-0 left-[27%] w-[46%]"
                  style={{ x, y, scale, zIndex: Z[slot] } as never}
                >
                  <BrowserFrame shot={shot} host={host} aspect={DECK_ASPECT} />
                </motion.div>
              );
            }

            let animate: TargetAndTransition;
            if (!landed) {
              animate = arrived
                ? {
                    ...SLOTS[slot],
                    zIndex: Z[slot],
                    transition: { ...LAND, delay: FIRST + order * STAGGER },
                  }
                : { opacity: 0, x: "90%", y: "24%", rotate: 3, scale: 0.9, zIndex: Z[slot] };
            } else if (turn === 0 || slot === before) {
              animate = { ...SLOTS[slot], zIndex: Z[slot] };
            } else if (before === "left" && slot === "right") {
              // Round the back: under everything, a little smaller on the way.
              animate = {
                x: ["-67%", "0%", "67%"],
                y: ["-10%", "-14%", "-10%"],
                scale: [0.82, 0.7, 0.82],
                opacity: 1,
                rotate: 0,
                zIndex: [0, 0, Z.right],
                transition: { duration: 1.2, ease: "easeInOut" },
              };
            } else {
              // Swap depth once the two windows have started to pass, so the
              // one coming forward does not jump over the other at the start.
              animate = {
                ...SLOTS[slot],
                zIndex: Z[slot],
                transition: {
                  ...(slot === "front" ? FORWARD : BACK),
                  zIndex: { delay: 0.2, duration: 0 },
                },
              };
            }

            return (
              <motion.div
                key={shot.alt}
                className="absolute top-0 left-[27%] w-[46%]"
                initial={false}
                animate={animate}
              >
                <BrowserFrame shot={shot} host={host} aspect={DECK_ASPECT} />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
