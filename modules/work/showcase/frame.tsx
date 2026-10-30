"use client";

import { LocaleLink } from "@/modules/language";
import { useTranslation } from "react-i18next";

import type { ProjectCase } from "../projects";
import { cn } from "@/shared/lib/cn";
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

const ACTION =
  "flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-2 text-small font-medium text-white transition-colors hover:border-white/80 hover:bg-white/10";

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
  const { t } = useTranslation("common");

  return (
    <>
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={ACTION}
        >
          {t("project.liveApp")}
        </a>
      )}

      {!project.liveUrl && project.repoUrl && (
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={ACTION}
        >
          {t("project.source")}
        </a>
      )}

      <LocaleLink href={`/work/${project.slug}`} className={ACTION}>
        {t("project.readCaseStudy")}
      </LocaleLink>
    </>
  );
}
