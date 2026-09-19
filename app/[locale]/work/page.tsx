import Link from "next/link";
import { locale as currentLocale } from "next/root-params";
import { Arrow } from "@/components/glyph";

import { EditorialShell } from "@/components/editorial/shell";
import { PROJECTS } from "@/data/projects";
import { initTranslations } from "@/i18n";
import { STATUS_TONE } from "@/lib/stations";
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

export default async function WorkIndexPage() {
  const locale = await currentLocale();
  const { t } = await initTranslations(locale, ["projects", "common"]);

  return (
    <EditorialShell active="work">
      <p className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
        {t("index.eyebrow")}
      </p>
      <h1 className="mt-5 text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-white">
        {t("index.title")}
      </h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-platinum">
        {t("index.lede")}
      </p>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-zinc">
        {t("index.body")}
      </p>

      <div className="mt-14 space-y-4">
        {PROJECTS.map((p) => (
          <Link
            key={p.slug}
            href={localeHref(locale, `/work/${p.slug}`)}
            className="group block rounded-xl border border-white/12 bg-white/3 p-6 transition-colors hover:border-white/30 hover:bg-white/6 md:p-7"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[13px] font-semibold tracking-[0.12em] text-white">
                {p.codename}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.16em] uppercase",
                  STATUS_TONE[p.status],
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {t(`environment.${p.environment}`)}
              </span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
                {t(`${p.id}.category`)}
              </span>
            </div>

            <h2 className="mt-4 text-[22px] leading-[1.18] font-semibold tracking-[-0.025em] text-white md:text-[26px]">
              {t(`${p.id}.headline`)}
            </h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-zinc">
              {t(`${p.id}.pitch.executive`)}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-telemetry text-white uppercase">
                {t("common:project.readCaseStudy")}
                <Arrow
                  className="text-[11px] transition-transform group-hover:translate-x-1"
                  weight={1.8}
                />
              </span>
              <span className="font-mono text-[9.5px] tracking-[0.1em] text-steel">
                {p.stack.slice(0, 4).join(" · ")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </EditorialShell>
  );
}
