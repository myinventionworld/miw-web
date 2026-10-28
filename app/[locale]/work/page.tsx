import Link from "next/link";
import { locale as currentLocale } from "next/root-params";

import { EditorialShell } from "@/components/editorial/shell";
import { Device } from "@/components/showcase/device";
import { ProductShots, hasScreens } from "@/components/showcase/screens";
import { PROJECTS } from "@/data/projects";
import { initTranslations } from "@/i18n";
import { alternates, localeHref } from "@/lib/locale";
import { cn } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/[locale]/work">) {
  const { locale } = await props.params;
  const { t } = await initTranslations(locale, ["projects"]);

  return {
    title: t("index.metaTitle"),
    description: t("index.metaDescription"),
    alternates: alternates(locale, "/work"),
  };
}

const FRAME = "mx-auto max-w-5xl px-4 sm:px-6 md:px-8";

/**
 * One product per band, the way a product company lays out a line-up: the name,
 * one big promise, the facts in a sentence, where to open it, and the thing
 * itself in the device it runs on. Bands alternate white and grey so the page
 * needs no boxes to tell one product from the next.
 */
export default async function WorkIndexPage() {
  const locale = await currentLocale();
  const { t } = await initTranslations(locale, ["projects", "common"]);
  const tr = (key: string) => t(key);

  return (
    <EditorialShell active="work" bleed>
      <section className={`${FRAME} pt-20 pb-20 text-center md:pt-28 md:pb-24`}>
        <p className="text-small font-medium text-zinc">{t("index.eyebrow")}</p>
        <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(2.5rem,6.4vw,4.75rem)] leading-[1.02] font-bold tracking-[-0.05em] text-white">
          {t("index.title")}
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-[1.25rem] leading-relaxed text-zinc">
          {t("index.lede")}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-body leading-relaxed text-zinc">
          {t("index.body")}
        </p>
      </section>

      {PROJECTS.map((p, i) => (
        <section key={p.slug} className={cn(i % 2 === 0 && "bg-carbon")}>
          <div className={`${FRAME} py-24 text-center md:py-28`}>
            <p className="inline-flex items-center gap-2 text-small font-semibold text-white">
              <span
                className="size-2.5 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-[clamp(2rem,4.8vw,3.6rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white">
              {t(`${p.id}.headline`)}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[1.1875rem] leading-relaxed text-zinc">
              {t(`${p.id}.pitch`)}
            </p>
            <p className="mt-3 text-small text-zinc">
              {t(`environment.${p.environment}`)} · {t(`${p.id}.category`)}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-lead font-medium">
              {p.liveUrl ? (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-comet hover:underline"
                >
                  {t("common:project.liveAppOut")}
                </a>
              ) : (
                p.repoUrl && (
                  <a
                    href={p.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-comet hover:underline"
                  >
                    {t("common:project.sourceOut")}
                  </a>
                )
              )}
              <Link
                href={localeHref(locale, `/work/${p.slug}`)}
                className="text-comet hover:underline"
              >
                {t("common:project.readCaseStudyLong")} ›
              </Link>
            </div>

            {hasScreens(p) ? (
              <div className="mt-14">
                <ProductShots project={p} t={tr} />
              </div>
            ) : (
              p.variant && (
                <div className="mt-14">
                  <Device project={p} />
                </div>
              )
            )}
          </div>
        </section>
      ))}

      <section className={`${FRAME} py-24 text-center md:py-32`}>
        <h2 className="text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white">
          {t("common:home.transmissionTitle")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[1.1875rem] leading-relaxed text-zinc">
          {t("common:home.transmissionBody")}
        </p>
        <Link
          href={localeHref(locale, "/#transmission")}
          className="mt-9 inline-flex rounded-full bg-action px-7 py-3.5 text-lead font-medium text-on-action transition-colors hover:bg-action-hover"
        >
          {t("common:home.ctaContact")}
        </Link>
      </section>
    </EditorialShell>
  );
}
