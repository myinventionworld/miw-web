"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { Arrow } from "@/components/glyph";
import type { ProjectCase } from "@/data/projects";
import { STATUS_TONE } from "@/lib/stations";
import { cn } from "@/lib/utils";
import { Prototype } from "./prototypes";

/**
 * A product frame instead of a video loop.
 *
 * The chrome is not decoration: it tells the visitor that what they are looking
 * at is a running system at a real address, and the badge says which
 * environment. An internal build says `Internal`, a public repository with no
 * deployment says `Source available` — the frame is only worth anything if the
 * badge can be trusted.
 */
export function ShowcaseFrame({
  project,
  className,
}: {
  project: ProjectCase;
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

          {/* No padlock. Chrome dropped its own in 2023 for the same reason it
              does not belong here: the bar already prints the host, and a lock
              beside it is a claim about transport that this frame is in no
              position to make. */}
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-white/10 bg-black/60 px-2 py-1">
            <span className="truncate font-mono text-[10px] text-zinc">
              {project.host}
            </span>
          </div>

          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.16em] uppercase",
              STATUS_TONE[project.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {project.environment}
          </span>
        </div>

        <Prototype variant={project.variant} />

        {/* Callouts read as annotations on the running thing rather than as a
            feature list floating next to it, so they sit inside the frame. */}
        <div className="border-t border-white/10 bg-white/4 px-3 py-2 deck-short:py-1.5">
          <div className="flex flex-wrap gap-1.5">
            {project.callouts.map((c, i) => (
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
          {/* The callouts name what the thing does; this says what to go and
              try. That is a nice-to-have, and on a short deck it is the
              difference between the card fitting and the card being cropped —
              so it is the first thing to go. The same sentence is on
              `/work/[slug]`, which is where a curious reader ends up anyway. */}
          <p className="mt-2 hidden font-mono text-[10px] leading-relaxed text-zinc deck-wide:block">
            {project.demoHint}
          </p>
        </div>
      </div>
    </div>
  );
}

const ACTION =
  "flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-2 font-mono text-[10px] tracking-telemetry text-white uppercase transition-colors hover:bg-white hover:text-black";

/**
 * Split out of the frame so the station can put these on the same row as its
 * own call to action. Three buttons stacked in three rows was a third of the
 * card's height spent on chrome, on a card that has to fit a 13" deck.
 *
 * `Live app` is rendered only where there is a deployment a stranger can open,
 * and source is labelled as source. A button that says "Live app" and lands on
 * a repository costs more trust than the case study buys back.
 *
 * Only the two outbound links take a mark, and it is the same mark: this leaves
 * the site. The internal link is bare — an arrow on every button is how a row
 * of controls stops distinguishing between them.
 */
export function ProjectActions({ project }: { project: ProjectCase }) {
  return (
    <>
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={ACTION}
        >
          Live app
          <Arrow dir="up-right" className="text-[11px]" />
        </a>
      )}

      {!project.liveUrl && project.repoUrl && (
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={ACTION}
        >
          Source
          <Arrow dir="up-right" className="text-[11px]" />
        </a>
      )}

      <Link href={`/work/${project.slug}`} className={ACTION}>
        Read case study
      </Link>
    </>
  );
}
