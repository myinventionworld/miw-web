"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/shared/lib/cn";
import { PhoneFrame, type Shot } from "./frames";

export function PhoneFan({ left, center, right }: { left: Shot; center: Shot; right: Shot }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto max-w-[440px] pt-[4%] pb-[8%] md:max-w-[720px]">
      <div className="relative z-10 mx-auto w-[48%] md:w-[36%]">
        <PhoneFrame shot={center} />
      </div>
      {[left, right].map((shot, i) => {
        const place = cn("absolute top-[12%] w-[40%] md:w-[30%]", i === 0 ? "left-0" : "right-0");
        if (reduce) {
          return (
            <div key={shot.alt} className={place}>
              <PhoneFrame shot={shot} />
            </div>
          );
        }
        return (
          <motion.div
            key={shot.alt}
            className={place}
            initial={{ x: i === 0 ? "60%" : "-60%", opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
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
