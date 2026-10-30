"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useOrbitIdle } from "@/components/editorial/orbit";
import { cn } from "@/lib/utils";
import type { Shot } from "./frames";

export function PhoneSwitch({
  shots,
  interval = 3200,
  className,
}: {
  shots: Shot[];
  interval?: number;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const idle = useOrbitIdle(frame);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (idle || reduce || shots.length < 2) return;
    const id = window.setInterval(() => setActive((n) => (n + 1) % shots.length), interval);
    return () => window.clearInterval(id);
  }, [idle, reduce, shots.length, interval]);

  return (
    <div
      ref={frame}
      className={cn(
        "device-shadow relative overflow-hidden rounded-[2.6rem] border-[7px] border-[#111214] bg-[#111214]",
        className,
      )}
    >
      {shots.map((s, i) => (
        <Image
          key={s.alt}
          src={s.src}
          alt={i === active ? s.alt : ""}
          aria-hidden={i !== active}
          sizes="(min-width: 768px) 300px, 64vw"
          className={cn(
            "block h-auto w-full rounded-[2.1rem] transition-opacity duration-700 ease-out",
            i === 0 ? "relative" : "absolute inset-0",
            i === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
