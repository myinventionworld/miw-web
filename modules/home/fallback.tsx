"use client";

import { useTranslation } from "react-i18next";
import { Cover, TeamOrbit, type TeamMember, TEAM } from "@/modules/team";
import { LocaleLink } from "@/modules/i18n";
import { LocaleSwitch } from "@/modules/language";
import { SiteFooter } from "@/modules/footer";
import {
  Device,
  ProductShots,
  hasScreens,
  projectForStation,
} from "@/modules/work";
import { EnquiryForm } from "@/modules/enquiry";

import { STATIONS, type ProgramPoint, type StationCopy } from "./stations";
import { CONTACT_EMAIL } from "@/modules/enquiry";
import { cn } from "@/shared/lib/cn";

/**
 * The flat deck. Served to two audiences that want the same thing: browsers
 * without a GPU behind WebGL, and touch devices, where the scroll-pinned
 * camera has no wheel gesture to read and the station card fills the screen
 * anyway.
 *
 * Same content model as the flight deck — every string here is read from the
 * same locale files, so the two versions of the page cannot drift into
 * disagreeing about what the team does.
 *
 * Laid out like the light pages: white and grey bands instead of cards, one
 * big statement per section, and each product shown in the device it runs on.
 * The same moving pieces as About, made for a phone: the cover as a banner
 * under the header, and the team on its orbits in the team section.
 */
export function Fallback({ direct }: { direct: boolean }) {
  const { t, i18n } = useTranslation(["common", "stations", "projects", "console", "about"]);

  const people: TeamMember[] = TEAM.map((p) => {
    const lineKey = `about:team.lines.${p.id}`;
    return {
      id: p.id,
      name: p.name,
      role: t(`about:team.roles.${p.id}`),
      line: i18n.exists(lineKey) ? t(lineKey) || undefined : undefined,
      photo: p.photo,
      orbit: p.orbit,
    };
  });

  return (
    <>
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

        {/* The cover as a banner between two rules: the body bleeds off the top
            one and the moon rises from the bottom one. */}
        <div className="mt-5 border-y border-line">
          <div className="mx-auto aspect-[3/2] w-full max-w-3xl">
            <Cover people={people} />
          </div>
        </div>

        <section className="mx-auto max-w-3xl px-5 pt-12 pb-20 text-center sm:px-8">
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

                {s.id === "guild" && (
                  <div className="mt-12">
                    <TeamOrbit
                      embedded
                      people={people}
                      title={t("about:team.title")}
                      hintPointer={t("about:team.hint")}
                      hintTouch={t("about:team.hintTouch")}
                    />
                  </div>
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
                          {/* Every product has these two links; the name tells
                              them apart for a screen reader. */}
                          <span className="sr-only"> {project.name}</span>
                        </a>
                      )}
                      <LocaleLink
                        href={`/work/${project.slug}`}
                        className="text-comet hover:underline"
                      >
                        {t("project.readCaseStudy")}
                        <span className="sr-only">: {project.name}</span> ›
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

      {/* A phone reaches this after the form, so the language switch is here
          again rather than only at the top of a very long page. */}
      <SiteFooter
        className="theme-light border-t border-line bg-void"
        frame="mx-auto max-w-3xl px-5 py-8 sm:px-8"
      >
        <LocaleSwitch />
      </SiteFooter>
    </>
  );
}
