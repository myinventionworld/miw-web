"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * A device settling into place the first time it scrolls into view: the
 * browser window rises a little, the phone slides in to lean on its corner.
 * Half a second, once. With reduced motion it is simply there.
 *
 * `className` is passed through untouched, so absolute positioning on the
 * phone still works.
 */
export function Reveal({
  children,
  from = "below",
  delay = 0,
  className,
}: {
  children: ReactNode;
  from?: "below" | "right";
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const offset = from === "right" ? { x: 48, y: 12 } : { x: 0, y: 32 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
