"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
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
 * Rings keep turning under the pointer: the body it is on grows instead
 * (give interactive bodies `orbitClasses.hit`). Wrap rings in
 * `orbitClasses.group` to stop them while the keyboard is on a body, and add
 * `orbitClasses.paused` (see `useIdle` in `shared/lib/use-idle.ts`) when
 * nobody can see them. With reduced motion they never turn.
 */
export function OrbitRing({
  radius,
  period,
  items,
  clockwise = false,
  className,
  style,
}: {
  radius: string;
  /** Seconds per turn. */
  period: number;
  items: OrbitItem[];
  clockwise?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(s.ring, className)}
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
