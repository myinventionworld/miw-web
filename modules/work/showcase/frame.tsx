"use client";

import { LocaleLink } from "@/modules/i18n";
import { useTranslation } from "react-i18next";

import type { ProjectCase } from "../projects";
import { cn } from "@/shared/lib/cn";
import { ConsoleKey } from "@/shared/ui/console-key";
import { Prototype } from "./prototypes";
import { STATUS_TONE } from "../status";

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
  const { t } = useTranslation("projects");

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
            <span className="truncate font-mono text-label text-zinc">
              {project.host}
            </span>
          </div>

          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-meta font-medium",
              STATUS_TONE[project.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {t(`environment.${project.environment}`)}
          </span>
        </div>

        {project.variant && <Prototype variant={project.variant} />}
      </div>
    </div>
  );
}

export function ProjectActions({
  project,
  start = 1,
}: {
  project: ProjectCase;
  start?: number;
}) {
  const { t } = useTranslation("common");
  const code = (offset: number) => String(start + offset).padStart(2, "0");
  const outbound = project.liveUrl ?? project.repoUrl;

  return (
    <>
      {outbound && (
        <ConsoleKey
          as="a"
          code={code(0)}
          href={outbound}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t(project.liveUrl ? "project.liveApp" : "project.source")}
        </ConsoleKey>
      )}

      <ConsoleKey
        as={LocaleLink}
        code={code(outbound ? 1 : 0)}
        href={`/work/${project.slug}`}
      >
        {t("project.readCaseStudy")}
      </ConsoleKey>
    </>
  );
}
