"use client";

import { ViewTransition } from "react";
import { useTranslation } from "react-i18next";
import {
  Cover,
  TeamLine,
  TeamOrbit,
  type TeamMember,
  TEAM,
} from "@/modules/team";
import { LocaleLink } from "@/modules/i18n";
import {
  BigFooter,
  SiteHeader,
  navForSection,
  siteHeaderText,
} from "@/modules/layout";
import { EnquiryForm } from "@/modules/contact";

import {
  CommerceBand,
  HeroMap,
  ProductsBand,
  StartupsBand,
} from "./flat-stations";
import { STATIONS } from "./stations";
import { useSectionInView } from "./use-section-in-view";
import { CONTACT_EMAIL } from "@/modules/contact";
import { PAGE_TRANSITION } from "@/shared/lib/landing";

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
const SECTIONS = [...STATIONS.map((s) => s.id), "transmission"];

export function Fallback({ className }: { className?: string }) {
  const { t, i18n } = useTranslation([
    "common",
    "stations",
    "projects",
    "console",
    "about",
  ]);

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

  const section = useSectionInView(SECTIONS);

  return (
    <ViewTransition {...PAGE_TRANSITION.light} default="none">
      <div className={className}>
        <main className="theme-light min-h-screen bg-void">
          <SiteHeader
            locale={i18n.language}
            onHome
            active={navForSection(section)}
            text={siteHeaderText(t)}
          />

          <div className="md:mt-5 md:grid md:grid-cols-[max(2rem,calc((100%_-_64rem)/2_+_2rem))_minmax(0,1fr)_46%]">
            {/* The cover as a banner between two rules: the body bleeds off the
                top one and the moon rises from the bottom one. */}
            <div className="hidden md:col-start-3 md:row-start-1 md:block md:min-h-[28rem] md:self-stretch">
              <div className="mx-auto aspect-[3/2] w-full max-w-3xl md:aspect-auto md:h-full md:max-w-none">
                <Cover people={people} />
              </div>
            </div>

            <section className="mx-auto max-w-3xl px-5 pt-12 pb-4 text-center sm:px-8 md:col-start-2 md:row-start-1 md:mx-0 md:max-w-none md:self-center md:px-0 md:py-16 md:pr-12 md:text-left">
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
                  {t("home.ctaWork")}
                </LocaleLink>
              </div>
            </section>
          </div>
          <HeroMap className="md:hidden" />

          <StartupsBand />
          <CommerceBand />
          <ProductsBand />

          <section>
            <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 md:max-w-5xl md:py-24">
              <p className="text-small font-semibold text-zinc">
                {t("stations:team.nav")}
              </p>
              <h2 className="mt-3 text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white md:max-w-3xl md:text-[clamp(2.4rem,4vw,3.2rem)]">
                {t("stations:team.headline")}
              </h2>
              <p className="mt-4 text-copy leading-relaxed text-zinc md:max-w-2xl">
                {t("stations:team.lede")}
              </p>
              <div className="mt-12">
                <TeamOrbit
                  embedded
                  people={people}
                  title={t("about:team.title")}
                  hintPointer={t("about:team.hint")}
                  hintTouch={t("about:team.hintTouch")}
                />
              </div>
              <LocaleLink
                href="/about"
                className="mt-6 inline-block text-lead font-medium text-comet hover:underline"
              >
                {t("console:team.link")}
              </LocaleLink>
            </div>
          </section>

          <section
            id="transmission"
            className="mx-auto max-w-3xl scroll-mt-14 px-5 py-24 text-center sm:px-8 md:max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-x-16 lg:text-left"
          >
            <div className="lg:pt-10">
              <h2 className="text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white lg:text-[clamp(2.4rem,4vw,3.2rem)]">
                {t("home.transmissionTitle")}
              </h2>
              <p className="mt-4 text-copy leading-relaxed text-zinc">
                {t("home.transmissionBody")}
              </p>
              <TeamLine
                line={t("console:team.line")}
                link={t("console:team.link")}
                className="mt-8 justify-center lg:justify-start"
              />
            </div>
            <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-none">
              <EnquiryForm />
              {/* The address stays in plain sight for anyone who would rather
                  write from their own mail. */}
              <p className="mt-6 text-small text-zinc">
                {t("console:form.orWrite")}{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="break-all text-comet hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>
        </main>

        <BigFooter />
      </div>
    </ViewTransition>
  );
}
