"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** A silent screen recording of the product, in `public/screens/`. */
export interface LoopVideo {
  mp4: string;
  webm?: string;
}

/**
 * The window plays what the product itself plays. It loads nothing until the
 * window is on screen, starts a moment after the windows have settled, fades
 * in only once frames are actually coming, and pauses when scrolled away.
 *
 * The clip is not looped in place: it runs from the still the screenshot
 * shows (its own first frame) to its end, then fades back to the screenshot
 * and starts again, so the loop is a soft change rather than a cut.
 *
 * With reduced motion there is no video, only the screenshot.
 */
export function WindowVideo({ video }: { video: LoopVideo }) {
  const reduce = useReducedMotion();
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

  if (reduce) return null;

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
      {/* H.264 first: every current browser plays it, and for these screen
          recordings it is the smaller file. */}
      <source src={video.mp4} type="video/mp4" />
      {video.webm && <source src={video.webm} type="video/webm" />}
    </video>
  );
}
