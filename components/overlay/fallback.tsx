"use client";

import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/components/locale-link";
import { LocaleSwitch } from "@/components/locale-switch";
import { Device } from "@/components/showcase/device";
import { ProductShots, hasScreens } from "@/components/showcase/screens";
import { EnquiryForm } from "./enquiry-form";

import {
  STATIONS,
  type ProgramPoint,
  type StationCopy,
} from "@/lib/stations";
import { projectForStation } from "@/data/projects";
import { CONTACT_EMAIL } from "@/lib/contact";
import { cn } from "@/lib/utils";

/**
 * The flat deck. Served to two audiences that want the same thing: browsers
 * without WebGL, and touch devices, where the scroll-pinned camera has no wheel
 * gesture to read and the station card fills the screen anyway.
 *
 * Same content model as the flight deck — every string here is read from the
 * same locale files, so the two versions of the page cannot drift into
 * disagreeing about what the team does.
 *
 * Laid out like the light pages: white and grey bands instead of cards, one
 * big statement per section, and each product shown in the device it runs on.
 */
export function Fallback({ direct }: { direct: boolean }) {
  const { t } = useTranslation(["common", "stations", "projects", "console"]);

  return (
    <main className="theme-light min-h-screen bg-void">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 pt-5 sm:px-8">
        <span className="flex items-center gap-2.5">
          <span className="relative flex size-4 items-center justify-center" aria-hidden>
            <span className="absolute inset-0 rounded-full border border-white/45" />
            <span className="absolute size-1 rounded-full bg-white" />
          </span>
          <span className="text-body font-semibold tracking-[0.3em] text-white">
            MIW
          </span>
        </span>
        <LocaleSwitch />
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-16 pb-20 text-center sm:px-8">
        <p className="text-small text-zinc">{t("availability.status")}</p>
        <h1 className="mt-4 text-[clamp(2.4rem,10vw,3.6rem)] leading-[1.02] font-bold tracking-[-0.05em] text-white">
          {t("home.titleTop")} {t("home.titleBottom")}
        </h1>
        <p className="mt-5 text-copy-lg leading-relaxed text-zinc">
          {t("home.lede")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <a
            href="#transmission"
            className="flex w-full items-center justify-center rounded-full bg-action px-6 py-3.5 text-lead font-medium text-on-action transition-colors hover:bg-action-hover sm:w-auto"
          >
            {t("home.ctaContact")}
          </a>
          <LocaleLink
            href="/work"
            className="text-lead font-medium text-comet hover:underline"
          >
            {t("home.ctaWork")} ›
          </LocaleLink>
        </div>
      </section>

      {STATIONS.map((s, i) => {
        const copy = t(`stations:${s.id}.business`, {
          returnObjects: true,
        }) as StationCopy;
        const project = projectForStation(s.id);
        const program = s.program
          ? (t(`stations:${s.id}.program`, {
              returnObjects: true,
            }) as ProgramPoint[])
          : [];

        return (
          <section key={s.id} className={cn(i % 2 === 0 && "bg-carbon")}>
            <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
              <p className="text-small font-semibold text-zinc">
                {t(`stations:${s.id}.nav`)}
              </p>
              <h2 className="mt-3 text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white">
                {copy.headline}
              </h2>
              <p className="mt-4 text-copy leading-relaxed text-zinc">
                {copy.lede}
              </p>

              {program.length > 0 && (
                <dl className="mt-8">
                  {program.map((p) => (
                    <div key={p.label} className="border-t border-white/12 py-4">
                      <dt className="text-copy font-semibold text-white">
                        {p.label}
                      </dt>
                      <dd className="mt-1 text-body leading-relaxed text-zinc">
                        {p.body}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {s.ctaHref && (
                <LocaleLink
                  href={s.ctaHref}
                  className="mt-6 inline-block text-lead font-medium text-comet hover:underline"
                >
                  {t(`stations:${s.id}.cta`)} ›
                </LocaleLink>
              )}

              {project && (
                <div className="mt-10">
                  <p className="flex items-center gap-2 text-title font-bold tracking-[-0.02em] text-white">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: project.color }}
                    />
                    {project.name}
                  </p>
                  <p className="mt-1 text-small text-zinc">
                    {t(`projects:environment.${project.environment}`)}
                  </p>
                  <p className="mt-3 text-body leading-relaxed text-zinc">
                    {t(`projects:${project.id}.pitch`)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-lead font-medium">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-comet hover:underline"
                      >
                        {t("project.liveAppOut")}
                      </a>
                    )}
                    <LocaleLink
                      href={`/work/${project.slug}`}
                      className="text-comet hover:underline"
                    >
                      {t("project.readCaseStudy")} ›
                    </LocaleLink>
                  </div>
                  {hasScreens(project) ? (
                    <div className="mt-10">
                      <ProductShots project={project} t={(key: string) => t(key)} />
                    </div>
                  ) : (
                    project.variant && (
                      <div className="mt-10">
                        <Device project={project} />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <section
        id="transmission"
        className="mx-auto max-w-3xl scroll-mt-8 px-5 py-24 text-center sm:px-8"
      >
        <h2 className="text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white">
          {t("home.transmissionTitle")}
        </h2>
        <p className="mt-4 text-copy leading-relaxed text-zinc">
          {t("home.transmissionBody")}
        </p>
        <EnquiryForm direct={direct} />
        {/* The address stays in plain sight for anyone who would rather
            write from their own mail. */}
        <p className="mt-6 text-small text-zinc">
          {t("console:form.orWrite")}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-comet hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </main>
  );
}
