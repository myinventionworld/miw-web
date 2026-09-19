import { locale as currentLocale } from "next/root-params";
import { Arrow } from "@/components/glyph";
import { EditorialShell } from "@/components/editorial/shell";
import { GuildApplicationForm } from "@/components/guild/application-form";
import { initTranslations } from "@/i18n";
import { alternates } from "@/lib/locale";
import { CAREERS_FAQ, GUILD_OPENINGS, HIRING_STEPS } from "@/lib/stations";

/** `careers:tracks` and `careers:readiness` — a heading and a paragraph each. */
interface Pair {
  label: string;
  body: string;
}

export async function generateMetadata(props: PageProps<"/[locale]/careers">) {
  const { locale } = await props.params;
  const { t } = await initTranslations(locale, ["careers"]);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates(locale, "/careers"),
  };
}

/** Same reasoning as the case study: the words are the heading, so mark them up
 *  as one. Without this the `<h3>` on every open direction sits under no `<h2>`. */
function SectionLabel({ n, children }: { n: string; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="font-mono text-[10px] tracking-telemetry text-steel"
      >
        {n}
      </span>
      <h2 className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

/**
 * Recruiting lives on its own route rather than on the flight deck. The landing
 * page sells to the person signing the contract; this one talks to the person
 * who wants to build under supervision, and mixing the two audiences on one
 * scroll is what made the old page unreadable.
 *
 * This is the one route that addresses the reader informally in Russian and
 * Czech — «ты», not «вы». Everything client-facing stays formal.
 */
export default async function CareersPage() {
  const locale = await currentLocale();
  const { t } = await initTranslations(locale, ["careers"]);

  const tracks = t("tracks", { returnObjects: true }) as Pair[];
  const expectations = t("expectations", { returnObjects: true }) as string[];
  const readiness = t("readiness", { returnObjects: true }) as Pair[];

  return (
    <EditorialShell active="careers">
      <p className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-5 max-w-3xl text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-white">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-platinum">
        {t("lede")}
      </p>
      <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-zinc">
        {t("body")}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="#apply"
          className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          {t("cta")}
          <Arrow className="text-[13px]" weight={1.7} />
        </a>
        <a
          href="#roles"
          className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:border-white/60 hover:bg-white/8"
        >
          {t("seeDirections", { count: GUILD_OPENINGS.length })}
        </a>
      </div>

      <section className="mt-20">
        <SectionLabel n="01">{t("sections.tracks")}</SectionLabel>
        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
          {tracks.map((track) => (
            <div
              key={track.label}
              className="rounded-xl border border-white/12 bg-white/3 p-5"
            >
              <dt className="text-[15px] font-semibold text-white">
                {track.label}
              </dt>
              <dd className="mt-2 text-[13.5px] leading-relaxed text-zinc">
                {track.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="roles" className="mt-20 scroll-mt-20">
        <SectionLabel n="02">{t("sections.openings")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-zinc">
          {t("sections.openingsNote")}
        </p>

        <div className="mt-7 space-y-4">
          {GUILD_OPENINGS.map((o) => (
            <article
              key={o.id}
              className="rounded-xl border border-white/12 bg-white/3 p-6 md:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-[20px] leading-snug font-semibold tracking-[-0.02em] text-white">
                  {t(`openings.${o.id}.label`)}
                </h3>
                <span className="font-mono text-[9.5px] tracking-[0.14em] text-steel uppercase">
                  {t("opening.crewOn", { system: o.system })}
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc">
                {t(`openings.${o.id}.body`)}
              </p>

              <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <h4 className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
                    {t("opening.work")}
                  </h4>
                  <ul className="mt-3 space-y-2.5">
                    {(
                      t(`openings.${o.id}.work`, {
                        returnObjects: true,
                      }) as string[]
                    ).map((w) => (
                      <li key={w} className="flex gap-3">
                        <span className="mt-[9px] size-1 shrink-0 rounded-full bg-white/35" />
                        <span className="text-[13.5px] leading-relaxed text-platinum">
                          {w}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
                      {t("opening.stack")}
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.stack.map((s) => (
                        <span
                          key={s}
                          className="rounded border border-white/15 px-2 py-0.5 font-mono text-[10px] text-platinum"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
                      {t("opening.level")}
                    </h4>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-zinc">
                      {t(`openings.${o.id}.level`)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-5">
                <p className="max-w-lg text-[13.5px] leading-relaxed text-signal">
                  {t(`openings.${o.id}.signal`)}
                </p>
                <a
                  href="#apply"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/25 px-3.5 py-2 font-mono text-[10px] tracking-telemetry text-white uppercase transition-colors hover:border-white/60 hover:bg-white/8"
                >
                  {t("opening.apply")}
                  <Arrow className="text-[11px]" weight={1.8} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionLabel n="03">{t("sections.hiring")}</SectionLabel>
        <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-zinc">
          {t("sections.hiringNote")}
        </p>
        <ol className="mt-7 grid gap-px overflow-hidden rounded-xl border border-white/12 bg-white/10 md:grid-cols-2">
          {HIRING_STEPS.map((s) => (
            <li key={s} className="bg-carbon p-6">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] tracking-telemetry text-steel">
                  {s}
                </span>
                <span className="font-mono text-[9px] tracking-[0.14em] text-signal uppercase">
                  {t(`hiring.${s}.meta`)}
                </span>
              </div>
              <h3 className="mt-3 text-[16px] font-semibold text-white">
                {t(`hiring.${s}.label`)}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-zinc">
                {t(`hiring.${s}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <SectionLabel n="04">{t("sections.expectations")}</SectionLabel>
        <ul className="mt-7 space-y-3.5">
          {expectations.map((e) => (
            <li key={e} className="flex gap-3.5">
              <span className="mt-[11px] h-px w-5 shrink-0 bg-signal/60" />
              <span className="text-[15px] leading-relaxed text-platinum">
                {e}
              </span>
            </li>
          ))}
        </ul>

        {/* Readiness, printed after the expectations rather than above them.
            Leading with a stack list is how a page that wants first-year
            students talks them out of applying. */}
        <dl className="mt-9 grid gap-4 md:grid-cols-3">
          {readiness.map((r) => (
            <div
              key={r.label}
              className="rounded-xl border border-white/12 bg-white/3 p-5"
            >
              <dt className="text-[14.5px] leading-snug font-semibold text-white">
                {r.label}
              </dt>
              <dd className="mt-2.5 text-[13.5px] leading-relaxed text-zinc">
                {r.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20">
        <SectionLabel n="05">{t("sections.faq")}</SectionLabel>
        <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
          {CAREERS_FAQ.map((f) => (
            <div
              key={f}
              className="grid gap-2 py-5 md:grid-cols-[1fr_1.6fr] md:gap-8"
            >
              <dt className="text-[14.5px] font-semibold text-white">
                {t(`faq.${f}.q`)}
              </dt>
              <dd className="text-[14px] leading-relaxed text-zinc">
                {t(`faq.${f}.a`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="apply" className="mt-20 scroll-mt-20">
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-white">
          {t("apply.title")}
        </h2>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-platinum">
          {t("apply.lede")}
        </p>
        <div className="mt-8">
          <GuildApplicationForm />
        </div>
      </section>
    </EditorialShell>
  );
}
