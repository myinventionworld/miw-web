"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";

export interface CycleFrame {
  src: StaticImageData;
  /** A desktop screen fills the box; a phone screen stands in the middle. */
  kind: "window" | "phone";
}

/**
 * A product's screens, one after another, the way the app moves when someone
 * uses it: a cross-fade every few seconds with a slow settle-in zoom. CSS
 * transitions only, so it costs nothing next to the WebGL scene. With reduced
 * motion on it shows the first screen and stays there; in a background tab it
 * stops.
 *
 * Decorative: the card around it carries the product's name and pitch.
 */
export function ScreenCycle({
  frames,
  interval = 2800,
  className,
}: {
  frames: CycleFrame[];
  interval?: number;
  className?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (frames.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setActive((n) => (n + 1) % frames.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [frames.length, interval]);

  return (
    <div
      aria-hidden
      className={cn("relative h-full w-full overflow-hidden bg-[#08080b]", className)}
    >
      {frames.map((f, i) => {
        const on = i === active;
        return (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              on ? "opacity-100" : "opacity-0",
            )}
          >
            {f.kind === "window" ? (
              <Image
                src={f.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 440px, 50vw"
                className={cn(
                  "object-cover object-left-top transition-transform duration-[3200ms] ease-out",
                  on ? "scale-100" : "scale-[1.06]",
                )}
              />
            ) : (
              <div className="flex h-full items-center justify-center py-[5%]">
                <div
                  className={cn(
                    "relative aspect-[9/19.5] h-full overflow-hidden rounded-[12px] border-[3px] border-[#1c1c20] transition-transform duration-[3200ms] ease-out",
                    on ? "translate-y-0" : "translate-y-[4%]",
                  )}
                >
                  <Image
                    src={f.src}
                    alt=""
                    fill
                    sizes="140px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
