import Link from "next/link";
import { locale as currentLocale } from "next/root-params";

import { CoverHero } from "@/modules/layout";
import { PageLayout } from "@/modules/layout/server";
import { JsonLd, breadcrumbs, teamMembers } from "@/modules/seo";
import { TeamOrbit, type TeamMember, TEAM } from "@/modules/team";
import { HeroShots, PROJECTS } from "@/modules/work";
import { initTranslations, alternates, localeHref } from "@/modules/language";

/** `about:what.items` and `about:values.items` — a label and one sentence. */
interface Point {
  label: string;
  body: string;
}

export async function generateMetadata(props: PageProps<"/[locale]/about">) {
  const { locale } = await props.params;
  const { t } = await initTranslations(locale, ["about"]);

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates(locale, "/about"),
  };
}

/** One frame for every section, so the edges line up down the page. */
const FRAME = "mx-auto max-w-5xl px-4 sm:px-6 md:px-8";

const SECTION_TITLE =
  "text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white";

/**
 * Who the team is, set out the way a product company sets out a page: a white
 * page, one big statement per section, grey bands to separate them instead of
 * boxes, and nothing on the page that is not true.
 */
export default async function AboutPage() {
  const locale = await currentLocale();
  const { t, i18n } = await initTranslations(locale, [
    "about",
    "projects",
    "stations",
    "common",
  ]);

  // One list for the team block and the cover. A line someone has not written
  // yet is left out, never shown as a placeholder.
  const people: TeamMember[] = TEAM.map((p) => {
    const lineKey = `team.lines.${p.id}`;
    const line = i18n.exists(lineKey, { ns: "about" }) ? t(lineKey) : "";
    return {
      id: p.id,
      name: p.name,
      role: t(`team.roles.${p.id}`),
      line: line || undefined,
      photo: p.photo,
      orbit: p.orbit,
    };
  });

  const what = t("what.items", { returnObjects: true }) as Point[];
  const values = t("values.items", { returnObjects: true }) as Point[];
  // The station headlines are the strongest single sentence we have for each
  // audience, so the About page reuses them rather than inventing a third.
  const whatHeadlines = [
    t("stations:commerce.business.headline"),
    t("stations:backend.business.headline"),
  ];

  return (
    <PageLayout active="about" bleed>
      <JsonLd
        graph={[
          breadcrumbs([
            { name: "MIW Labs", href: localeHref(locale, "/") },
            { name: t("common:nav.about"), href: localeHref(locale, "/about") },
          ]),
          ...teamMembers(
            Object.fromEntries(people.map((p) => [p.id, p.role])),
          ),
        ]}
      />
      {/* Drop `people` to keep only the products on the cover. */}
      <CoverHero people={people}>
        <p className="text-small font-medium text-zinc">{t("eyebrow")}</p>
        <h1 className="mt-5 text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.02] font-bold tracking-[-0.05em] text-white">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-xl text-copy-lg leading-relaxed text-zinc md:text-[1.1875rem]">
          {t("lede")}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link
            href={localeHref(locale, "/#transmission")}
            className="rounded-full bg-action px-6 py-3 text-lead font-medium text-on-action transition-colors hover:bg-action-hover"
          >
            {t("cta.action")}
          </Link>
          <Link
            href={localeHref(locale, "/work")}
            className="text-lead font-medium text-comet hover:underline"
          >
            {t("work.action")} ›
          </Link>
        </div>
      </CoverHero>

      <section className="bg-carbon">
        <div className={`${FRAME} grid gap-14 py-24 md:grid-cols-2 md:gap-16 md:py-28`}>
          {what.map((p, i) => (
            <div key={p.label}>
              <p className="text-small font-semibold text-zinc">{p.label}</p>
              <p className="mt-3 text-[clamp(1.6rem,2.8vw,2rem)] leading-[1.14] font-bold tracking-[-0.03em] text-white">
                {whatHeadlines[i]}
              </p>
              <p className="mt-4 text-copy leading-relaxed text-zinc">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <TeamOrbit
        people={people}
        title={t("team.title")}
        lede={t("team.lede")}
        hintPointer={t("team.hint")}
        hintTouch={t("team.hintTouch")}
      />

      <section className="bg-carbon">
        <div className={`${FRAME} py-24 md:py-28`}>
          <h2 className={`${SECTION_TITLE} text-center`}>{t("values.title")}</h2>
          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            {values.map((p) => (
              <div key={p.label}>
                <h3 className="text-title leading-snug font-bold tracking-[-0.02em] text-white">
                  {p.label}
                </h3>
                <p className="mt-3 text-copy leading-relaxed text-zinc">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${FRAME} py-24 md:py-32`}>
        <div className="text-center">
          <h2 className={SECTION_TITLE}>{t("work.title")}</h2>
          <Link
            href={localeHref(locale, "/work")}
            className="mt-5 inline-block text-lead font-medium text-comet hover:underline"
          >
            {t("work.action")} ›
          </Link>
        </div>
        <div className="mt-14 md:mt-16">
          <HeroShots
            t={(key: string) => t(key)}
            omnibusHost={PROJECTS.find((p) => p.slug === "omnibus")?.host ?? ""}
          />
        </div>
        <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10">
          {PROJECTS.map((p) => (
            <Link
              key={p.slug}
              href={localeHref(locale, `/work/${p.slug}`)}
              className="group block"
            >
              <p className="flex items-center gap-2.5 text-title font-bold tracking-[-0.02em] text-white">
                <span
                  className="size-3 rounded-full"
                  style={{ background: p.color }}
                />
                {p.name}
              </p>
              <p className="mt-3 text-body leading-relaxed text-zinc">
                {t(`projects:${p.id}.pitch`)}
              </p>
              <span className="mt-4 inline-block text-body font-medium text-comet group-hover:underline">
                {t("common:project.readCaseStudy")} ›
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-carbon">
        <div className={`${FRAME} py-24 text-center md:py-32`}>
          <h2 className={SECTION_TITLE}>{t("cta.title")}</h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.1875rem] leading-relaxed text-zinc">
            {t("cta.body")}
          </p>
          <Link
            href={localeHref(locale, "/#transmission")}
            className="mt-9 inline-flex rounded-full bg-action px-7 py-3.5 text-lead font-medium text-on-action transition-colors hover:bg-action-hover"
          >
            {t("cta.action")}
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
