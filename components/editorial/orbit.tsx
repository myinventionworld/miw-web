"use client";

import { type CSSProperties, type ReactNode, type RefObject, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import s from "./orbit.module.css";

export const orbitClasses = s;

export interface OrbitItem {
  key: string;
  /** Degrees from the ring's centre, clockwise from three o'clock. */
  angle: number;
  node: ReactNode;
}

/**
 * One turning ring of bodies, centred on its parent's origin: place the
 * parent's point where the ring's centre should be. `radius` is any CSS
 * length, so a ring can be sized in container units and scale with its box.
 *
 * Pausing is the caller's: wrap rings in `orbitClasses.group` to stop all of
 * them while a body is hovered or focused, give one ring `holdSelf` to stop
 * only that one, and add `orbitClasses.paused` (see `useOrbitIdle`) when the
 * rings should stand still. With reduced motion they never turn.
 */
export function OrbitRing({
  radius,
  period,
  items,
  clockwise = false,
  holdSelf = false,
  className,
  style,
}: {
  radius: string;
  /** Seconds per turn. */
  period: number;
  items: OrbitItem[];
  clockwise?: boolean;
  holdSelf?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(s.ring, holdSelf && s.holdSelf, className)}
      style={
        {
          "--radius": radius,
          "--period": `${period}s`,
          "--ring-dir": clockwise ? "normal" : "reverse",
          "--upright-dir": clockwise ? "reverse" : "normal",
          ...style,
        } as CSSProperties
      }
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={s.slot}
          style={{ "--angle": `${item.angle}deg` } as CSSProperties}
        >
          <div className={s.upright}>
            <div className={s.body}>{item.node}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Whether the rings in `ref` should stand still because nobody can see them:
 * the box is off screen or the tab is hidden. Two events, no per-frame work.
 */
export function useOrbitIdle(ref: RefObject<HTMLElement | null>) {
  const [offScreen, setOffScreen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOffScreen(!e.isIntersecting));
    io.observe(el);
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);

  return offScreen || hidden;
}
