"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { PhoneFrame, type Shot } from "./frames";

const TILT = 6;

export function PhoneFan({ left, center, right }: { left: Shot; center: Shot; right: Shot }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto max-w-[440px] pt-[4%] pb-[10%] md:max-w-[720px]">
      <div className="relative z-10 mx-auto w-[48%] md:w-[36%]">
        <PhoneFrame shot={center} />
      </div>
      {[left, right].map((shot, i) => {
        const sign = i === 0 ? -1 : 1;
        const place = cn("absolute top-[16%] w-[40%] md:w-[30%]", i === 0 ? "left-0" : "right-0");
        if (reduce) {
          return (
            <div key={shot.alt} className={place} style={{ transform: `rotate(${sign * TILT}deg)` }}>
              <PhoneFrame shot={shot} />
            </div>
          );
        }
        return (
          <motion.div
            key={shot.alt}
            className={place}
            initial={{ x: `${-sign * 60}%`, rotate: 0, opacity: 0 }}
            whileInView={{ x: 0, rotate: sign * TILT, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhoneFrame shot={shot} />
          </motion.div>
        );
      })}
    </div>
  );
}
