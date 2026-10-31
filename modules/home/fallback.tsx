"use client";

import { useTranslation } from "react-i18next";
import { Cover, TeamOrbit, type TeamMember, TEAM } from "@/modules/team";
import { LocaleLink } from "@/modules/i18n";
import { BigFooter, LocaleSwitch } from "@/modules/layout";
import {
  Device,
  ProductShots,
  hasScreens,
  projectForStation,
} from "@/modules/work";
import { EnquiryForm } from "@/modules/contact";

import { STATIONS, type ProgramPoint, type StationCopy } from "./stations";
import { CONTACT_EMAIL } from "@/modules/contact";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/logo";

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
 * The same moving pieces as About: on a phone the cover is a banner under the
 * header; from tablet width up the opening is About's, words beside the cover,
 * in About's 64rem frame.
 */
export function Fallback() {
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
        <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 pt-5 sm:px-8 md:max-w-5xl">
          <Logo />
          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-5 md:flex">
              <LocaleLink href="/work" className="text-body font-medium text-zinc transition-colors hover:text-white">
                {t("nav.work")}
              </LocaleLink>
              <LocaleLink href="/about" className="text-body font-medium text-zinc transition-colors hover:text-white">
                {t("nav.about")}
              </LocaleLink>
            </nav>
            <LocaleSwitch />
          </div>
        </header>

        <div className="md:mt-5 md:grid md:grid-cols-[max(2rem,calc((100%_-_64rem)/2_+_2rem))_minmax(0,1fr)_46%]">
          {/* The cover as a banner between two rules: the body bleeds off the
              top one and the moon rises from the bottom one. */}
          <div className="mt-5 border-y border-line md:col-start-3 md:row-start-1 md:mt-0 md:min-h-[28rem] md:self-stretch md:border-y-0">
            <div className="mx-auto aspect-[3/2] w-full max-w-3xl md:aspect-auto md:h-full md:max-w-none">
              <Cover people={people} />
            </div>
          </div>

          <section className="mx-auto max-w-3xl px-5 pt-12 pb-20 text-center sm:px-8 md:col-start-2 md:row-start-1 md:mx-0 md:max-w-none md:self-center md:px-0 md:py-16 md:pr-12 md:text-left">
            <p className="text-small text-zinc">{t("availability.status")}</p>
            <h1 className="mt-4 text-[clamp(2.4rem,10vw,3.6rem)] leading-[1.02] font-bold tracking-[-0.05em] text-white md:text-[clamp(2.5rem,4.4vw,4rem)]">
              {t("home.titleTop")} {t("home.titleBottom")}
            </h1>
            <p className="mt-5 text-copy-lg leading-relaxed text-zinc">
              {t("home.lede")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:gap-7">
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
        </div>

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
            <section key={s.id} id={s.id} className={cn("scroll-mt-4", i % 2 === 0 && "bg-carbon")}>
              <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 md:max-w-5xl md:py-24">
                <p className="text-small font-semibold text-zinc">
                  {t(`stations:${s.id}.nav`)}
                </p>
                <h2 className="mt-3 text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white md:max-w-3xl md:text-[clamp(2.4rem,4vw,3.2rem)]">
                  {copy.headline}
                </h2>
                <p className="mt-4 text-copy leading-relaxed text-zinc md:max-w-2xl">
                  {copy.lede}
                </p>

                {program.length > 0 && (
                  <dl className="mt-8 md:grid md:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] md:gap-x-10">
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
                    <p className="mt-3 text-body leading-relaxed text-zinc md:max-w-2xl">
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
          className="mx-auto max-w-3xl scroll-mt-8 px-5 py-24 text-center sm:px-8 md:max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-x-16 lg:text-left"
        >
          <div className="lg:pt-10">
            <h2 className="text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white lg:text-[clamp(2.4rem,4vw,3.2rem)]">
              {t("home.transmissionTitle")}
            </h2>
            <p className="mt-4 text-copy leading-relaxed text-zinc">
              {t("home.transmissionBody")}
            </p>
          </div>
          <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-none">
            <EnquiryForm />
            {/* The address stays in plain sight for anyone who would rather
                write from their own mail. */}
            <p className="mt-6 text-small text-zinc">
              {t("console:form.orWrite")}{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-comet hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      <BigFooter />
    </>
  );
}
