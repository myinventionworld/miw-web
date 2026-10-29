"use client";

import Image, { type StaticImageData } from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * A browser window whose page scrolls while you scroll past it: a full-length
 * screenshot moves up inside a fixed 16:10 viewport, top to bottom over the
 * time the window takes to cross the screen. With reduced motion the top of
 * the page shows and stays.
 */
export function ScrollingWindow({
  src,
  alt,
  host,
}: {
  src: StaticImageData;
  alt: string;
  host: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // How much of the screenshot is hidden below the viewport, as a share of
  // its own height: 1 - viewport height / image height.
  const hidden = Math.max(0, 1 - src.width / (1.6 * src.height));
  const y = useTransform(scrollYProgress, [0.2, 0.8], ["0%", `-${hidden * 100}%`]);

  return (
    <div
      ref={ref}
      className="device-shadow overflow-hidden rounded-[14px] border border-line bg-void"
    >
      <div className="flex h-9 items-center gap-2 border-b border-line px-4" aria-hidden>
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="ml-3 truncate text-meta text-zinc">{host}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
        <motion.div style={reduce ? undefined : { y }}>
          <Image
            src={src}
            alt={alt}
            sizes="(min-width: 1024px) 880px, 90vw"
            className="block h-auto w-full"
          />
        </motion.div>
      </div>
    </div>
  );
}
