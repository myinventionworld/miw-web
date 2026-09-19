import Link from "next/link";
import { notFound } from "next/navigation";
import { locale as currentLocale } from "next/root-params";
import { ArchDiagram } from "@/components/editorial/arch-diagram";
import { Arrow } from "@/components/glyph";
import { EditorialShell } from "@/components/editorial/shell";
import { PROJECTS, projectBySlug } from "@/data/projects";
import { initTranslations } from "@/i18n";
import { STATUS_TONE } from "@/lib/stations";
import { alternates, localeHref } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * The case study. Five sections in a fixed order, because a reader evaluating a
 * studio is running a checklist whether they say so or not: what is it, what was
 * hard, how is it shaped, what did you decide, what does it hold.
 *
 * Statically rendered from `data/projects.ts` and `projects:<id>` — there are
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
    title: `${project.codename} — ${t(`${project.id}.headline`)} — MIW`,
    description: t(`${project.id}.pitch.executive`),
    alternates: alternates(locale, `/work/${slug}`),
  };
}

/**
 * The rule and the number are decoration; the words are the section heading, so
 * they are marked up as one. Rendering all five as `<span>` left the document
 * with a single `<h2>` — the closing CTA — and the `<h3>`s inside the decision
 * grid hanging off nothing, which is a case study a screen reader cannot skim.
 */
function SectionLabel({ n, children }: { n: string; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="font-mono text-[10px] tracking-telemetry text-steel">
        {n}
      </span>
      <h2 className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-white/10" />
    </div>
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

  // Only print the half of the legend the table actually uses. A "measured"
  // footnote under three budgets is a footnote that reads as a hedge.
  const bases = Array.from(new Set(project.metrics.map((m) => m.basis)));

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
    <EditorialShell active="work">
      <header>
        {/* The only way back out of a case study, and it measured 95x13 — a
            target you have to aim at with a thumb. `inline-block` plus the
            cancelled vertical margin buys 29px of height without moving the
            baseline the heading below is spaced from. */}
        <Link
          href={localeHref(locale, "/work")}
          className="-my-2 inline-block rounded-md py-2 font-mono text-[10px] tracking-telemetry text-steel uppercase transition-colors hover:text-white"
        >
          {t("case.back")}
        </Link>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[14px] font-semibold tracking-[0.12em] text-white">
            {project.codename}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.16em] uppercase",
              STATUS_TONE[project.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {t(`environment.${project.environment}`)}
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
            {t(`${project.id}.category`)}
          </span>
        </div>

        <h1 className="mt-5 max-w-3xl text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-white">
          {t(`${project.id}.headline`)}
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-platinum">
          {t(`${project.id}.pitch.executive`)}
        </p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc">
          {t(`${project.id}.pitch.telemetry`)}
        </p>

        {/* Links, labelled for what they open. A repository behind a button that
            says "live app" is the cheapest way to lose an engineer's trust. */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              {t("case.launch")}
              <Arrow dir="up-right" className="text-[13px]" weight={1.7} />
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-white/25 px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:border-white/60 hover:bg-white/8"
            >
              {t("case.readSource")}
              <Arrow dir="up-right" className="text-[13px]" weight={1.7} />
            </a>
          )}
          <span className="font-mono text-[10.5px] text-steel">
            {project.host}
          </span>
        </div>

        <dl className="mt-8 flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <dd
              key={s}
              className="rounded-sm border border-white/15 px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-zinc"
            >
              {s}
            </dd>
          ))}
        </dl>
      </header>

      <section className="mt-20">
        <SectionLabel n="01">{t("case.sections.problem")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {t(`${project.id}.problem.lede`)}
        </p>
        <ul className="mt-6 max-w-2xl space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3.5">
              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-white/35" />
              <span className="text-[14.5px] leading-relaxed text-zinc">
                {p}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <SectionLabel n="02">{t("case.sections.design")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {t(`${project.id}.design.lede`)}
        </p>

        {/* Hand-laid SVG rather than a rendered Mermaid graph: the diagram is
            part of the argument, so which box sits next to which is a decision,
            not a layout engine's opinion. */}
        <div className="mt-8 rounded-xl border border-white/12 bg-white/3 p-6 md:p-8">
          <ArchDiagram
            nodes={nodes}
            edges={edges}
            label={t("case.diagramAlt")}
          />
        </div>
      </section>

      <section className="mt-20">
        <SectionLabel n="03">{t("case.sections.solutions")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {t("case.sections.solutionsNote")}
        </p>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-white/12 bg-white/10 md:grid-cols-2">
          {solutions.map((s) => (
            <div key={s.choice} className="bg-carbon p-6">
              <p className="text-[14.5px] leading-snug font-semibold text-white">
                {s.choice}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-zinc">
                {s.why}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionLabel n="04">{t("case.sections.results")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {t(`${project.id}.results.lede`)}
        </p>

        {/* A table rather than three hero numbers, because the basis column is
            the point. Read across: figure, what it measures, where it comes
            from. A budget and a measurement look identical in monospace until
            something says which is which. */}
        <div className="mt-8 overflow-hidden rounded-xl border border-white/12">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/12 bg-white/4">
                <th className="px-5 py-3 font-mono text-[9px] tracking-telemetry text-steel uppercase">
                  {t("case.table.figure")}
                </th>
                <th className="px-5 py-3 font-mono text-[9px] tracking-telemetry text-steel uppercase">
                  {t("case.table.measures")}
                </th>
                <th className="hidden px-5 py-3 font-mono text-[9px] tracking-telemetry text-steel uppercase sm:table-cell">
                  {t("case.table.basis")}
                </th>
              </tr>
            </thead>
            <tbody>
              {project.metrics.map((m) => (
                <tr key={m.id} className="border-b border-white/8 last:border-0">
                  <td className="px-5 py-4 align-top">
                    <span className="font-mono text-[17px] leading-none font-semibold tracking-[-0.02em] text-white tabular-nums">
                      {m.value}
                    </span>
                    <span className="mt-2 block font-mono text-[9px] tracking-[0.14em] text-signal uppercase">
                      {t(`${project.id}.metrics.${m.id}.label`)}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-[13.5px] leading-relaxed text-zinc">
                    {t(`${project.id}.metrics.${m.id}.note`)}
                    <span className="mt-2 block font-mono text-[9px] tracking-[0.12em] text-steel uppercase sm:hidden">
                      {t(`basis.${m.basis}.label`)}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 align-top sm:table-cell">
                    <span
                      className={cn(
                        "rounded-sm border px-2 py-1 font-mono text-[9px] tracking-[0.12em] uppercase",
                        m.basis === "observed"
                          ? "border-signal/45 bg-signal/10 text-signal"
                          : "border-white/20 bg-white/5 text-zinc",
                      )}
                    >
                      {t(`basis.${m.basis}.label`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-4 space-y-1">
          {bases.map((b) => (
            <div key={b} className="flex gap-2">
              <dt className="font-mono text-[9.5px] tracking-[0.12em] text-steel uppercase">
                {t(`basis.${b}.label`)}
              </dt>
              <dd className="font-mono text-[9.5px] leading-[1.6] text-steel">
                — {t(`basis.${b}.note`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20 rounded-xl border border-white/12 bg-white/3 p-8 md:p-10">
        <h2 className="max-w-xl text-[clamp(1.4rem,2.6vw,1.9rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-white">
          {t("case.cta.title")}
        </h2>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-zinc">
          {t("case.cta.body")}
        </p>
        <Link
          href={localeHref(locale, "/#transmission")}
          className="mt-7 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          {t("case.cta.action")}
          <Arrow className="text-[13px]" weight={1.7} />
        </Link>
      </section>
    </EditorialShell>
  );
}
