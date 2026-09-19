"use client";

import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/components/locale-link";
import { LocaleSwitch } from "@/components/locale-switch";

import {
  STATIONS,
  STATUS_TONE,
  type Spec,
  type Standard,
  type StationCopy,
} from "@/lib/stations";
import { projectForStation } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * The flat deck. Served to two audiences that want the same thing: browsers
 * without WebGL, and touch devices, where the scroll-pinned camera has no wheel
 * gesture to read and the station card fills the screen anyway.
 *
 * Same content model as the flight deck — every string here is read from the
 * same locale files, so the two versions of the page cannot drift into
 * disagreeing about what the studio does.
 *
 * It is not a stripped-down page. It is the whole argument as a document, which
 * is what a phone was always better at rendering.
 */
export function Fallback() {
  const { t } = useTranslation(["common", "stations", "projects"]);
  const standards = t("standards", { returnObjects: true }) as Standard[];

  return (
    <main className="relative min-h-screen overflow-hidden bg-void">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 118%, rgba(24,86,180,0.34) 0%, rgba(8,16,38,0.55) 42%, transparent 70%), radial-gradient(60% 40% at 78% 8%, rgba(120,90,220,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-24 md:px-10">
        {/* This document is the phone's whole site — there is no navbar above
            it to carry the switcher, so it opens the page beside the status
            line. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] tracking-telemetry text-platinum uppercase">
            {t("availability.prefix")}: {t("availability.status")} //{" "}
            {t("availability.scope")}
          </p>
          <LocaleSwitch />
        </div>

        <div className="mt-6 flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-signal uppercase">
          <span className="h-px w-9 bg-signal/55" />
          {t("brand.tagline")}
        </div>

        <h1 className="mt-8 text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.94] font-semibold tracking-[-0.045em] text-white">
          {t("home.titleTop")}
          <br className="hidden sm:block" /> {t("home.titleBottom")}
        </h1>

        <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {t("home.lede")}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#transmission"
            className="rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            {t("home.ctaContact")}
          </a>
          <LocaleLink
            href="/work"
            className="rounded-lg border border-white/30 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:border-white/70 hover:bg-white/10"
          >
            {t("home.ctaWork")}
          </LocaleLink>
          <LocaleLink
            href="/careers"
            className="rounded-lg border border-white/30 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:border-white/70 hover:bg-white/10"
          >
            {t("home.ctaGuild")}
          </LocaleLink>
        </div>

        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-y border-white/12 py-5">
          {standards.map((s) => (
            <div key={s.value}>
              <dt className="font-mono text-[19px] leading-none font-semibold text-white tabular-nums">
                {s.value}
              </dt>
              <dd className="mt-2 font-mono text-[9px] tracking-[0.12em] text-zinc uppercase">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 font-mono text-[9.5px] tracking-[0.1em] text-steel uppercase">
          {t("standardsNote")}
        </p>

        {/* Stated, not hidden. Someone who has seen the flight deck on a desktop
            and then opens the same URL on a phone should know the difference is
            a decision rather than a broken page. */}
        <p className="mt-6 font-mono text-[10px] tracking-telemetry text-zinc uppercase">
          {t("home.flightDeckOff")}
        </p>

        <div className="mt-24 space-y-20">
          {STATIONS.map((s) => {
            const copy = t(`stations:${s.id}.business`, {
              returnObjects: true,
            }) as StationCopy;
            const specs = t(`stations:${s.id}.specs`, {
              returnObjects: true,
            }) as Spec[];

            return (
              <section key={s.id} className="border-t border-white/15 pt-8">
                <div className="flex items-baseline gap-5">
                  <span className="font-mono text-4xl font-bold text-white/25">
                    {s.index}
                  </span>
                  <span className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
                    {t(`stations:${s.id}.pillar`)} · {t(`stations:${s.id}.nav`)}
                  </span>
                </div>

                <h2 className="mt-5 text-[clamp(1.7rem,4vw,2.8rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-white">
                  {copy.headline}
                </h2>
                <p className="mt-4 text-xl leading-snug font-medium text-platinum">
                  {copy.lede}
                </p>

                {/* The static document always speaks business. A visitor without
                  WebGL has no toggle to reach, and the outcome framing is the
                  one that has to land first either way. */}
                <div className="mt-6 max-w-2xl space-y-5 border-l border-white/15 pl-5">
                  <div>
                    <div className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
                      {t("stations:ui.problem")}
                    </div>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-zinc">
                      {copy.problem}
                    </p>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
                      {t("stations:ui.solution")}
                    </div>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-zinc">
                      {copy.solution}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {copy.proof.map((p) => (
                    <li
                      key={p}
                      className="rounded-sm border border-signal/35 bg-signal/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-signal uppercase"
                    >
                      {p}
                    </li>
                  ))}
                </ul>

                {/* Level two. No toggle exists here, so the engineering readout is
                  simply printed under the business case rather than hidden. */}
                <dl className="mt-7 max-w-2xl border-t border-white/12 pt-4">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex gap-4 py-1">
                      <dt className="w-[70px] shrink-0 font-mono text-[9px] tracking-[0.14em] text-steel uppercase">
                        {spec.label}
                      </dt>
                      <dd className="font-mono text-[11px] leading-[1.5] text-zinc">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* The artifact, where there is one. No interactive prototype:
                  that widget exists to be poked at with a cursor, and a card
                  that only works on the device this page is not being served to
                  would be decoration. The numbers and the link are the part that
                  travels. */}
                {(() => {
                  const project = projectForStation(s.id);
                  if (!project) return null;
                  return (
                    <div className="mt-9 rounded-xl border border-white/12 bg-white/3 p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[13px] font-semibold tracking-[0.12em] text-white">
                          {project.codename}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-telemetry uppercase",
                            STATUS_TONE[project.status],
                          )}
                        >
                          {t(`projects:environment.${project.environment}`)}
                        </span>
                      </div>

                      <p className="mt-3 text-[14px] leading-relaxed text-platinum">
                        {t(`projects:${project.id}.pitch.executive`)}
                      </p>

                      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                        {project.metrics.map((m) => (
                          <div
                            key={m.id}
                            className="rounded-md border border-white/12 px-3 py-2.5"
                          >
                            <dt className="font-mono text-[14px] leading-none text-white tabular-nums">
                              {m.value}
                            </dt>
                            <dd className="mt-1.5 font-mono text-[8.5px] leading-[1.4] tracking-[0.1em] text-steel uppercase">
                              {t(
                                `projects:${project.id}.metrics.${m.id}.label`,
                              )}
                              {" · "}
                              {m.basis === "target"
                                ? t("project.budget")
                                : t("project.measured")}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <p className="mt-4 font-mono text-[11px] text-zinc">
                        {project.stack.join(" · ")}
                      </p>

                      {/* This document is what a phone gets — it is the whole
                        reason the flat deck exists — so these three are touch
                        targets, not desktop footnotes. They measured 15px tall.
                        `py-2` against a cancelled `-my-2` lifts them to 31px
                        and leaves the row's spacing exactly where it was; the
                        row keeps 16px between columns and gains its own
                        row-gap so a wrapped line does not butt hit areas. */}
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                        <LocaleLink
                          href={`/work/${project.slug}`}
                          className="-my-2 rounded-md py-2 font-mono text-[10px] tracking-telemetry text-white uppercase underline-offset-4 hover:underline"
                        >
                          {t("project.readCaseStudyLong")}
                        </LocaleLink>
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="-my-2 rounded-md py-2 font-mono text-[10px] tracking-telemetry text-zinc uppercase underline-offset-4 hover:text-white hover:underline"
                          >
                            {t("project.liveAppOut")}
                          </a>
                        )}
                        {!project.liveUrl && project.repoUrl && (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="-my-2 rounded-md py-2 font-mono text-[10px] tracking-telemetry text-zinc uppercase underline-offset-4 hover:text-white hover:underline"
                          >
                            {t("project.sourceOut")}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </section>
            );
          })}
        </div>

        <section
          id="transmission"
          className="mt-28 scroll-mt-10 border-t border-white/15 pt-10"
        >
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            {t("home.transmissionTitle")}
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-platinum">
            {t("home.transmissionBody")}
          </p>
          <a
            href="mailto:signal@miw.studio"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-zinc-200"
          >
            signal@miw.studio
          </a>
        </section>
      </div>
    </main>
  );
}
