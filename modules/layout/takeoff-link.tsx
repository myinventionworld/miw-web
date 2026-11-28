"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

import { markTakeoff, rememberedStation, TAKEOFF } from "@/shared/lib/landing";

/** A link from a light page back into the flight. `back` returns to the station the visitor left from. */
export function TakeoffLink({
  href,
  back = false,
  onClick,
  transitionTypes: _types,
  ...rest
}: ComponentProps<typeof Link> & { href: string; back?: boolean }) {
  const router = useRouter();

  return (
    <Link
      href={href}
      transitionTypes={[TAKEOFF]}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
          return;
        }
        markTakeoff();
        const station = back ? rememberedStation() : null;
        if (!station) return;
        e.preventDefault();
        router.push(`${href}#${station}`, { transitionTypes: [TAKEOFF] });
      }}
      {...rest}
    />
  );
}
