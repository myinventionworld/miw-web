"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";

export interface StoryStep {
  src: StaticImageData;
  alt: string;
  title: string;
  body: string;
}

/**
 * The phone stays put while the steps scroll past it, and its screen follows
 * whichever step is in the middle of the window. Large screens only; a phone
 * gets the swipeable row instead.
 *
 * The step nearest the middle of the viewport is the active one
 * (IntersectionObserver on a thin band across the centre), so there is no
 * scroll listener and nothing runs while the section is off screen.
 */
export function PhoneStory({ steps }: { steps: StoryStep[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = refs.current.indexOf(e.target as HTMLDivElement);
            if (i >= 0) setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [steps.length]);

  return (
    <div className="grid grid-cols-2 gap-16 text-left">
      <div>
        <div className="sticky top-[14vh]">
          <div className="device-shadow relative mx-auto w-[300px] overflow-hidden rounded-[2.6rem] border-[7px] border-[#111214] bg-[#111214]">
            {/* The first screen sets the frame's height; the rest stack on it. */}
            {steps.map((s, i) => (
              <Image
                key={s.alt}
                src={s.src}
                alt={i === active ? s.alt : ""}
                aria-hidden={i !== active}
                sizes="300px"
                quality={90}
                className={cn(
                  "block h-auto w-full rounded-[2.1rem] transition-opacity duration-500 ease-out",
                  i === 0 ? "relative" : "absolute inset-0",
                  i === active ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        {steps.map((s, i) => (
          <div
            key={s.title}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cn(
              "flex min-h-[52vh] flex-col justify-center transition-opacity duration-500",
              i === active ? "opacity-100" : "opacity-35",
            )}
          >
            <p className="text-small font-semibold text-zinc tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-[clamp(1.7rem,2.6vw,2.4rem)] leading-[1.08] font-bold tracking-[-0.035em] text-white">
              {s.title}
            </h3>
            <p className="mt-4 max-w-md text-copy-lg leading-relaxed text-zinc">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
