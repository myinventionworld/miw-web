import Link from "next/link";
import { notFound } from "next/navigation";
import { locale as currentLocale } from "next/root-params";
import {
  ArchDiagram,
  Device,
  ReadListen,
  SeatRace,
  BuiltShot,
  ProductShots,
  hasBuiltShot,
  hasScreens,
  PROJECTS,
  projectBySlug,
  STATUS_TONE,
} from "@/modules/work";
import { PageLayout } from "@/modules/layout/server";
import { JsonLd, breadcrumbs, caseStudy } from "@/modules/seo";
import { initTranslations, alternates, localeHref } from "@/modules/i18n";
import { clsx } from "clsx";

/**
 * The case study. Five sections in a fixed order, because a reader evaluating a
 * studio is running a checklist whether they say so or not: what is it, what was
 * hard, how is it shaped, what did you decide, what does it hold.
 *
 * Statically rendered from `modules/work/projects.ts` and `projects:<id>` — there are
 * three of these in three languages and they change when the systems change, so
 * a build is the right cache.
 */
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/work/[slug]">,
) {
  const { locale, slug } = await props.params;
  const project = projectBySlug(slug);
  if (!project) return {};

  const { t } = await initTranslations(locale, ["projects"]);

  return {
    title: `${project.name} — ${t(`${project.id}.headline`)}`,
    description: t(`${project.id}.pitch`),
    alternates: alternates(locale, `/work/${slug}`),
  };
}

/**
 * The rule and the number are decoration; the words are the section heading, so
 * they are marked up as one. Rendering all five as `<span>` left the document
 * with a single `<h2>` — the closing CTA — and the `<h3>`s inside the decision
 * grid hanging off nothing, which is a case study a screen reader cannot skim.
 */
function SectionLabel({ children }: { n?: string; children: string }) {
  return (
    <h2 className="text-heading-lg leading-tight font-bold tracking-[-0.03em] text-white">
      {children}
    </h2>
  );
}

export default async function WorkCasePage(
  props: PageProps<"/[locale]/work/[slug]">,
) {
  const { slug } = await props.params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  const locale = await currentLocale();
  const { t } = await initTranslations(locale, ["projects", "common"]);
  const tr = (key: string) => t(key);
  const href = localeHref(locale, `/work/${project.slug}`);
  const structured = [
    caseStudy(
      project,
      {
        headline: t(`${project.id}.headline`),
        pitch: t(`${project.id}.pitch`),
        category: t(`${project.id}.category`),
      },
      locale,
      href,
    ),
    breadcrumbs([
      { name: "MIW Labs", href: localeHref(locale, "/") },
      { name: t("common:nav.work"), href: localeHref(locale, "/work") },
      { name: project.name, href },
    ]),
  ];
  const explainer =
    project.slug === "omnibus" ? (
      <SeatRace t={tr} />
    ) : project.slug === "boowie" ? (
      <ReadListen t={tr} />
    ) : null;

  const points = t(`${project.id}.problem.points`, {
    returnObjects: true,
  }) as string[];
  const solutions = t(`${project.id}.solutions`, {
    returnObjects: true,
  }) as { choice: string; why: string }[];

  // The diagram is a pure renderer: it owns the grid and knows nothing about
  // languages, so the labels are resolved here and handed to it.
  const nodes = project.design.nodes.map((n) => ({
    ...n,
    label: t(`${project.id}.design.nodes.${n.id}`),
  }));
  const edges = project.design.edges.map((e) => ({
    ...e,
    label: t(`${project.id}.design.edges.${e.from}-${e.to}`, {
      defaultValue: "",
    }),
  }));

  return (
    <PageLayout active="work">
      <JsonLd graph={structured} />
      <header>
        {/* The only way back out of a case study, and it measured 95x13 — a
            target you have to aim at with a thumb. `inline-block` plus the
            cancelled vertical margin buys 29px of height without moving the
            baseline the heading below is spaced from. */}
        <Link
          href={localeHref(locale, "/work")}
          className="-my-2 inline-block rounded-md py-2 text-label text-steel transition-colors hover:text-white"
        >
          {t("case.back")}
        </Link>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-copy-lg font-semibold text-white">
            <span
              className="size-2.5 rounded-full"
              style={{ background: project.color }}
            />
            {project.name}
          </span>
          <span
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-label",
              STATUS_TONE[project.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {t(`environment.${project.environment}`)}
          </span>
          <span className="text-label text-steel">
            {t(`${project.id}.category`)}
          </span>
        </div>

        <h1 className="mt-5 max-w-3xl text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white">
          {t(`${project.id}.headline`)}
        </h1>
        <p className="mt-6 max-w-2xl text-copy-lg leading-relaxed text-platinum">
          {t(`${project.id}.pitch`)}
        </p>
        <p className="mt-3 max-w-2xl text-copy leading-relaxed text-zinc">
          {t(`${project.id}.credit`)}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-action px-4 py-2 text-small font-semibold text-on-action transition-colors hover:bg-action-hover"
            >
              {t("case.launch")}
            </a>
          )}
          <span className="text-label text-steel">
            {project.host}
          </span>
        </div>

        <p className="mt-8 text-small text-zinc">
          {project.stack.join(" · ")}
        </p>
      </header>

      {/* The product itself: real screenshots where we have them, the working
          demo where we do not. */}
      {hasScreens(project) ? (
        <div className="mt-16">
          <ProductShots project={project} t={(key: string) => t(key)} gallery />
        </div>
      ) : (
        project.variant && (
          <div className="mt-16">
            <Device project={project} />
          </div>
        )
      )}

      <section className="mt-20">
        <SectionLabel n="01">{t("case.sections.problem")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-copy-lg leading-relaxed text-platinum">
          {t(`${project.id}.problem.lede`)}
        </p>
        <ul className="mt-6 max-w-2xl space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3.5">
              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-white/35" />
              <span className="text-lead leading-relaxed text-zinc">
                {p}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <SectionLabel n="02">{t("case.sections.design")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-copy-lg leading-relaxed text-platinum">
          {t(`${project.id}.design.lede`)}
        </p>

        {/* The mechanism this section describes, shown rather than told:
            Omnibus's seat race, Boowie's reader next to its read/listen
            switch. Projects without one keep the working demo. */}
        {explainer || hasBuiltShot(project) ? (
          <div
            className={clsx(
              "mt-12 grid items-center gap-12",
              hasBuiltShot(project) && explainer && "md:grid-cols-[minmax(0,300px)_1fr]",
            )}
          >
            {hasBuiltShot(project) && (
              <BuiltShot project={project} t={tr} />
            )}
            {explainer}
          </div>
        ) : (
          hasScreens(project) &&
          project.variant && (
            <div className="mt-10">
              <Device project={project} compact />
            </div>
          )
        )}

        {/* Hand-laid SVG rather than a rendered Mermaid graph: the diagram is
            part of the argument, so which box sits next to which is a decision,
            not a layout engine's opinion. */}
        <div className="mt-10">
          <ArchDiagram
            nodes={nodes}
            edges={edges}
            label={t("case.diagramAlt")}
          />
        </div>
      </section>

      <section className="mt-20">
        <SectionLabel n="03">{t("case.sections.solutions")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-copy-lg leading-relaxed text-platinum">
          {t("case.sections.solutionsNote")}
        </p>
        <div className="mt-8 grid gap-x-12 md:grid-cols-2">
          {solutions.map((s) => (
            <div key={s.choice} className="border-t border-white/12 py-6">
              <p className="text-copy leading-snug font-semibold text-white">
                {s.choice}
              </p>
              <p className="mt-2.5 text-body leading-relaxed text-zinc">
                {s.why}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionLabel n="04">{t("case.sections.results")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-copy-lg leading-relaxed text-platinum">
          {t(`${project.id}.results.lede`)}
        </p>

        {/* A target is marked under its figure: a budget and a measurement
            look identical until something says which is which. */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-3 pr-5 text-label text-steel">
                  {t("case.table.figure")}
                </th>
                <th className="py-3 pr-5 text-label text-steel">
                  {t("case.table.measures")}
                </th>
              </tr>
            </thead>
            <tbody>
              {project.metrics.map((m) => (
                <tr key={m.id} className="border-b border-white/12">
                  <td className="py-5 pr-5 align-top">
                    <span className="text-copy-lg leading-none font-semibold tracking-[-0.02em] text-white tabular-nums">
                      {m.value}
                    </span>
                    <span className="mt-2 block text-label text-signal">
                      {t(`${project.id}.metrics.${m.id}.label`)}
                    </span>
                    {m.basis === "target" && (
                      <span className="mt-1 block text-label text-steel">
                        {t("basis.target.label")}
                      </span>
                    )}
                  </td>
                  <td className="py-5 pr-5 align-top text-body leading-relaxed text-zinc">
                    {t(`${project.id}.metrics.${m.id}.note`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>

      <section className="mt-24 border-t border-white/12 pt-16">
        <h2 className="max-w-xl text-[clamp(1.9rem,3.6vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white">
          {t("case.cta.title")}
        </h2>
        <p className="mt-4 max-w-xl text-lead leading-relaxed text-zinc">
          {t("case.cta.body")}
        </p>
        <Link
          href={localeHref(locale, "/#transmission")}
          className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-action px-6 py-3 text-lead font-medium text-on-action transition-colors hover:bg-action-hover"
        >
          {t("case.cta.action")}
        </Link>
      </section>
    </PageLayout>
  );
}
