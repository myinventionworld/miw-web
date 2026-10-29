"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { BrowserFrame, type Shot } from "./frames";
import { ScrollingWindow } from "./scrolling-window";

/** A silent screen recording of the product, laid over its screenshot. */
export interface LoopVideo {
  mp4: string;
  webm?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;
/** How far each window below the top one peeks out above it, in px. */
const PEEK = 22;
/** How much smaller each window below the top one is. */
const SHRINK = 0.05;
/** Time between two windows landing on the pile, in seconds. */
const STAGGER = 0.16;
const FIRST = 0.25;
const LAND = 0.85;

/**
 * The window plays what the product itself plays. It loads nothing until the
 * window is on screen, starts a moment after the windows have settled, fades
 * in only once frames are actually coming, and pauses when scrolled away.
 *
 * The clip is not looped in place: it runs from the still the screenshot
 * shows to the trailer, then fades back to the screenshot and starts again,
 * so the loop is the same soft change the site makes rather than a cut.
 */
function WindowVideo({ video }: { video: LoopVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [shown, setShown] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!inView) {
      v.pause();
      return;
    }
    const wait = started.current ? 0 : 1600;
    const id = window.setTimeout(() => {
      started.current = true;
      v.play().catch(() => {});
    }, wait);
    return () => window.clearTimeout(id);
  }, [inView]);

  useEffect(() => {
    if (shown) return;
    const v = ref.current;
    if (!v || !v.ended) return;
    const id = window.setTimeout(() => {
      v.currentTime = 0;
      if (inView) v.play().catch(() => {});
    }, 2600);
    return () => window.clearTimeout(id);
  }, [shown, inView]);

  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      onPlaying={() => setShown(true)}
      onEnded={() => setShown(false)}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000 ease-out"
      style={{ opacity: shown ? 1 : 0 }}
    >
      {video.webm && <source src={video.webm} type="video/webm" />}
      <source src={video.mp4} type="video/mp4" />
    </video>
  );
}

/**
 * A desktop-only product on a large screen: the main window, and the other
 * screens as a pile of windows leaning on its corner.
 *
 * The first time it scrolls into view the pile builds itself: the windows fly
 * in from the right one after another, deepest first, and settle with only
 * their title bars showing above the top one. While the page scrolls the pile
 * moves faster than the main window, so the two read as layers. Pointing at
 * the pile fans it out.
 *
 * With reduced motion the pile is simply there, nothing moves and no video
 * plays.
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
  /** Top of the pile first. */
  stack: Shot[];
  host: string;
  video?: LoopVideo;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [landed, setLanded] = useState(false);
  const [fanned, setFanned] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const mainY = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const pileY = useTransform(scrollYProgress, [0, 1], [110, -110]);

  const n = stack.length;
  useEffect(() => {
    if (!inView || landed) return;
    const id = window.setTimeout(
      () => setLanded(true),
      (FIRST + (n - 1) * STAGGER + LAND) * 1000,
    );
    return () => window.clearTimeout(id);
  }, [inView, landed, n]);

  const state = reduce ? "rest" : !inView ? "away" : fanned && landed ? "fan" : "rest";

  return (
    <div ref={ref} className="relative mx-auto max-w-[1000px] pb-[16%] text-left">
      <motion.div className="w-[80%]" style={reduce ? undefined : { y: mainY }}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {full ? (
            <ScrollingWindow src={full.src} alt={full.alt} host={host} />
          ) : (
            <BrowserFrame
              shot={main}
              host={host}
              overlay={video && !reduce ? <WindowVideo video={video} /> : undefined}
            />
          )}
        </motion.div>
      </motion.div>

      {n > 0 && (
        <motion.div
          className="absolute right-0 bottom-0 w-[50%]"
          style={reduce ? undefined : { y: pileY }}
          onHoverStart={() => setFanned(true)}
          onHoverEnd={() => setFanned(false)}
        >
          {stack
            .map((shot, depth) => ({ shot, depth }))
            .reverse()
            .map(({ shot, depth }) => {
              const order = n - 1 - depth; // the deepest window lands first
              const scale = 1 - depth * SHRINK;
              return (
                <motion.div
                  key={shot.alt}
                  className={depth === 0 ? "relative" : "absolute inset-x-0 top-0"}
                  style={{ transformOrigin: "50% 0%", zIndex: n - depth }}
                  initial={reduce ? false : "away"}
                  animate={state}
                  variants={{
                    away: { opacity: 0, x: "35%", y: 60 + depth * 10, rotate: 2.5, scale },
                    rest: {
                      opacity: 1,
                      x: 0,
                      y: -depth * PEEK,
                      rotate: 0,
                      scale,
                      transition: {
                        duration: landed ? 0.45 : LAND,
                        delay: landed ? 0 : FIRST + order * STAGGER,
                        ease: EASE,
                      },
                    },
                    fan: {
                      opacity: 1,
                      x: `${-depth * 7}%`,
                      y: -depth * 72,
                      rotate: 0,
                      scale,
                      transition: { duration: 0.45, ease: EASE },
                    },
                  }}
                >
                  {/* Only the top window names the site; three identical
                      addresses in a row read as noise. */}
                  <BrowserFrame shot={shot} host={depth === 0 ? host : ""} />
                </motion.div>
              );
            })}
        </motion.div>
      )}
    </div>
  );
}
