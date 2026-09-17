"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";

import { STATUS_TONE } from "@/lib/stations";
import { HOST_STATE, type SystemCase } from "@/lib/systems";
import { cn } from "@/lib/utils";
import { Prototype } from "./prototypes";

/**
 * A product frame instead of a video loop.
 *
 * The chrome is not decoration: it tells the visitor that what they are
 * looking at is a running system at a real address, and the status pill says
 * which environment. An internal MVP says `Internal`, not `Production` — the
 * frame is only worth anything if the badge can be trusted.
 */
export function ShowcaseFrame({
  system,
  className,
}: {
  system: SystemCase;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-lg border border-white/15 bg-black">
        {/* chrome */}
        <div className="flex items-center gap-3 border-b border-white/12 bg-white/5 px-3 py-2">
          <div className="flex shrink-0 gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-white/22" />
            <span className="size-2 rounded-full bg-white/22" />
            <span className="size-2 rounded-full bg-white/22" />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-white/10 bg-black/60 px-2 py-1">
            <Lock className="size-2.5 shrink-0 text-steel" strokeWidth={2.4} />
            <span className="truncate font-mono text-[10px] text-zinc">
              {system.host}
            </span>
          </div>

          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.16em] uppercase",
              STATUS_TONE[system.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {HOST_STATE[system.status]}
          </span>
        </div>

        <Prototype variant={system.variant} />

        {/* Callouts read as annotations on the running thing rather than as a
            feature list floating next to it, so they sit inside the frame. */}
        <div className="border-t border-white/10 bg-white/4 px-3 py-2.5">
          <div className="flex flex-wrap gap-1.5">
            {system.callouts.map((c, i) => (
              <motion.span
                key={c}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: reduced ? 0 : 0.12 + i * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-sm border border-beam/30 bg-beam/10 px-2 py-0.5 font-mono text-[9px] tracking-[0.1em] text-beam uppercase"
              >
                {c}
              </motion.span>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-zinc">
            {system.demoHint}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Rendered only when there is a deployment a stranger can open. A
            dead "Launch app" button costs more trust than a missing one. */}
        {system.liveUrl && (
          <a
            href={system.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-white/25 px-3 py-2 font-mono text-[10px] tracking-telemetry text-white uppercase transition-colors hover:bg-white hover:text-black"
          >
            Launch live app
            <ArrowUpRight className="size-3" strokeWidth={2.4} />
          </a>
        )}

        <Link
          href={`/systems/${system.slug}`}
          className="flex items-center gap-1.5 rounded-md border border-white/25 px-3 py-2 font-mono text-[10px] tracking-telemetry text-white uppercase transition-colors hover:bg-white hover:text-black"
        >
          Inspect architecture
          <ArrowRight className="size-3" strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  );
}
