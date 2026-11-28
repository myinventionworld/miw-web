"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { CONTACT_EMAIL } from "@/modules/contact";
import { LocaleLink } from "@/modules/i18n";
import { TEAM, initials } from "@/modules/team";
import {
  PROJECTS,
  ProjectThumb,
  STATUS_TONE,
  projectForStation,
  type ProjectCase,
} from "@/modules/work";
import { cn } from "@/shared/lib/cn";
import type { Section } from "@/shared/lib/landing";

import type { ProgramPoint } from "./stations";

export type DrawerId = "services" | "products" | "team" | "contact";

export const DRAWERS: readonly DrawerId[] = [
  "services",
  "products",
  "team",
  "contact",
];

const PILL =
  "flex items-center rounded-full border border-white/25 px-4 py-2 text-small font-medium text-white transition-colors hover:border-white/80 hover:bg-white/10";

function Shell({
  id,
  line,
  actions,
  children,
}: {
  id: DrawerId;
  line: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      id={`drawer-${id}`}
      initial={reduce ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0 } }
          : { opacity: 0, y: -12 }
      }
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="drawer absolute inset-x-0 top-full hidden lg:block"
      style={{ background: "rgb(7 10 24)" }}
    >
      <div className="px-8 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-xl text-heading font-semibold tracking-[-0.03em] text-white">
            {line}
          </p>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function ProjectCard({
  project,
  onDismiss,
}: {
  project: ProjectCase;
  onDismiss: () => void;
}) {
  const { t } = useTranslation(["projects", "common"]);

  return (
    <LocaleLink
      href={`/work/${project.slug}`}
      onClick={onDismiss}
      className="group block"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/12 bg-black transition-colors group-hover:border-white/35">
        <ProjectThumb project={project} t={(key: string) => t(key)} />
        <span
          className={cn(
            "absolute top-2 left-2 rounded-full border bg-black/70 px-2 py-0.5 text-meta font-medium backdrop-blur",
            STATUS_TONE[project.status],
          )}
        >
          {t(`status.${project.status}`)}
        </span>
        <span className="absolute right-2 bottom-2 rounded-full border border-white/25 bg-black/75 px-2 py-0.5 text-meta font-medium text-white backdrop-blur">
          {t("common:project.caseStudy")}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-copy font-semibold tracking-[-0.01em] text-white">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ background: project.color }}
        />
        {project.name}
      </p>
      <p className="mt-1.5 line-clamp-3 text-small leading-relaxed text-platinum/80">
        {t(`${project.id}.pitch`)}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {project.stack.map((name) => (
          <span
            key={name}
            className="rounded-full border border-white/15 px-2 py-0.5 text-meta text-zinc"
          >
            {name}
          </span>
        ))}
      </div>
    </LocaleLink>
  );
}

function Services({
  onFly,
  onDismiss,
}: {
  onFly: (to: Section) => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation(["common", "stations"]);
  const startup = projectForStation("backend");
  const program = t("stations:commerce.program", {
    returnObjects: true,
  }) as ProgramPoint[];

  return (
    <Shell
      id="services"
      line={t("nav.drawer.services")}
      actions={(["backend", "commerce"] as const).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onFly(id)}
          className={PILL}
        >
          {t(`stations:${id}.nav`)}
        </button>
      ))}
    >
      <div className="grid grid-cols-3 gap-x-7">
        {startup && <ProjectCard project={startup} onDismiss={onDismiss} />}
        <div className="col-span-2">
          <p className="text-small font-semibold text-comet">
            {t("stations:commerce.nav")}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-7">
            {program.map((p) => (
              <div key={p.label} className="border-t border-white/12 py-3">
                <dt className="text-body font-semibold text-white">
                  {p.label}
                </dt>
                <dd className="mt-1 text-small leading-relaxed text-platinum/80">
                  {p.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Shell>
  );
}

function Products({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation("common");
  const products = PROJECTS.filter((p) => p.station === "labs");

  return (
    <Shell
      id="products"
      line={t("nav.drawer.products")}
      actions={
        <LocaleLink href="/work" onClick={onDismiss} className={PILL}>
          {t("footer.allWork")}
        </LocaleLink>
      }
    >
      <div className="grid grid-cols-3 gap-x-7">
        {products.map((p) => (
          <ProjectCard key={p.slug} project={p} onDismiss={onDismiss} />
        ))}
      </div>
    </Shell>
  );
}

function Team({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation(["common", "stations", "about"]);

  return (
    <Shell
      id="team"
      line={t("nav.drawer.team")}
      actions={
        <LocaleLink href="/about" onClick={onDismiss} className={PILL}>
          {t("stations:team.link")}
        </LocaleLink>
      }
    >
      <ul className="grid grid-cols-4 gap-x-7 gap-y-5">
        {TEAM.map((person) => (
          <li
            key={person.id}
            className="flex items-center gap-3.5 border-t border-white/12 pt-4"
          >
            {person.photo ? (
              <Image
                src={person.photo}
                alt=""
                width={88}
                height={88}
                sizes="44px"
                className="size-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-small font-semibold text-platinum"
              >
                {initials(person.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-body font-semibold text-white">
                {person.name}
              </p>
              <p className="mt-0.5 text-meta leading-snug text-zinc">
                {t(`about:team.roles.${person.id}`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Contact() {
  const { t } = useTranslation("common");

  return (
    <Shell id="contact" line={t("nav.drawer.contact")} actions={null}>
      <dl className="grid grid-cols-3 gap-x-7">
        <div className="border-t border-white/12 pt-4">
          <dt className="text-meta text-zinc">{t("contact.email")}</dt>
          <dd className="mt-1.5">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-copy font-semibold break-all text-white underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </dd>
        </div>
        <div className="border-t border-white/12 pt-4">
          <dt className="text-meta text-zinc">{t("contact.status")}</dt>
          <dd className="mt-1.5 flex items-center gap-2 text-copy font-semibold text-white">
            <span className="size-1.5 shrink-0 rounded-full bg-comet" />
            {t("availability.status")}
          </dd>
          <dd className="mt-1 text-small text-zinc">
            {t("availability.scope")}
          </dd>
        </div>
        <div className="border-t border-white/12 pt-4">
          <dt className="text-meta text-zinc">{t("contact.reply")}</dt>
          <dd className="mt-1.5 text-copy font-semibold text-white">
            {t("contact.replyTime")}
          </dd>
          <dd className="mt-1 text-small text-zinc">
            {t("contact.replyNote")}
          </dd>
        </div>
      </dl>
    </Shell>
  );
}

export function NavDrawer({
  id,
  onFly,
  onDismiss,
}: {
  id: DrawerId;
  onFly: (to: Section) => void;
  onDismiss: () => void;
}) {
  if (id === "services")
    return <Services onFly={onFly} onDismiss={onDismiss} />;
  if (id === "products") return <Products onDismiss={onDismiss} />;
  if (id === "team") return <Team onDismiss={onDismiss} />;
  return <Contact />;
}
