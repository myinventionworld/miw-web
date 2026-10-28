import Link from "next/link";
import { locale as currentLocale } from "next/root-params";

import { EditorialShell } from "@/components/editorial/shell";
import { HeroShots } from "@/components/showcase/screens";
import { PROJECTS } from "@/data/projects";
import { TEAM, initials } from "@/data/team";
import { initTranslations } from "@/i18n";
import { alternates, localeHref } from "@/lib/locale";

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
  const { t } = await initTranslations(locale, [
    "about",
    "projects",
    "stations",
    "common",
  ]);

  const what = t("what.items", { returnObjects: true }) as Point[];
  const values = t("values.items", { returnObjects: true }) as Point[];
  // The station headlines are the strongest single sentence we have for each
  // audience, so the About page reuses them rather than inventing a third.
  const whatHeadlines = [
    t("stations:commerce.business.headline"),
    t("stations:backend.business.headline"),
  ];

  return (
    <EditorialShell active="about" bleed>
      <section className={`${FRAME} pt-20 pb-24 text-center md:pt-28 md:pb-28`}>
        <p className="text-small font-medium text-zinc">{t("eyebrow")}</p>
        <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(2.5rem,6.4vw,4.75rem)] leading-[1.02] font-bold tracking-[-0.05em] text-white">
          {t("title")}
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-[1.25rem] leading-relaxed text-zinc">
          {t("lede")}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
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
      </section>

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

      <section className={`${FRAME} py-24 text-center md:py-32`}>
        <h2 className={SECTION_TITLE}>{t("team.title")}</h2>
        <p className="mx-auto mt-5 max-w-xl text-[1.1875rem] leading-relaxed text-zinc">
          {t("team.lede")}
        </p>
        <ul className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-12">
          {TEAM.map((person) => (
            <li key={person.id} className="w-[calc(50%-12px)] sm:w-52">
              {person.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.photo}
                  alt=""
                  className="mx-auto size-28 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="mx-auto flex size-28 items-center justify-center rounded-full bg-space-800 text-heading font-semibold tracking-[-0.02em] text-zinc"
                >
                  {initials(person.name)}
                </span>
              )}
              <p className="mt-5 text-lead leading-snug font-semibold text-white">
                {person.name}
              </p>
              <p className="mt-1 text-small leading-snug text-zinc">
                {t(`team.roles.${person.id}`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

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
    </EditorialShell>
  );
}
