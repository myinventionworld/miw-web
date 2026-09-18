"use client";

import Link from "next/link";

import {
  AVAILABILITY,
  STANDARDS,
  STATIONS,
  STATUS_TONE,
} from "@/lib/stations";
import { projectForStation } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * The flat deck. Served to two audiences that want the same thing: browsers
 * without WebGL, and touch devices, where the scroll-pinned camera has no wheel
 * gesture to read and the station card fills the screen anyway.
 *
 * Same content model as the flight deck — every string here is read from
 * `lib/stations.ts` and `data/projects.ts`, so the two versions of the page
 * cannot drift into disagreeing about what the studio does.
 *
 * It is not a stripped-down page. It is the whole argument as a document, which
 * is what a phone was always better at rendering.
 */
export function Fallback() {
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
        <p className="font-mono text-[10px] tracking-telemetry text-platinum uppercase">
          Status: {AVAILABILITY.status} // {AVAILABILITY.scope}
        </p>

        <div className="mt-6 flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-signal uppercase">
          <span className="h-px w-9 bg-signal/55" />
          MIW Labs — Venture Studio &amp; Engineering Guild
        </div>

        <h1 className="mt-8 text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.94] font-semibold tracking-[-0.045em] text-white">
          High-Performance
          <br className="hidden sm:block" /> Software Architecture.
        </h1>

        <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-platinum">
          Engineered for scale, resilience and autonomy. We build systems that
          don&apos;t fail under load — from the architecture diagram through to
          the thing running in production with a pager attached.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#transmission"
            className="rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Initiate Technical Discovery
          </a>
          <Link
            href="/work"
            className="rounded-lg border border-white/30 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:border-white/70 hover:bg-white/10"
          >
            Read the case studies
          </Link>
          <Link
            href="/careers"
            className="rounded-lg border border-white/30 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:border-white/70 hover:bg-white/10"
          >
            Apply to the Guild
          </Link>
        </div>

        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-y border-white/12 py-5">
          {STANDARDS.map((s) => (
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
          The standard we design to — not a claim about past results
        </p>

        {/* Stated, not hidden. Someone who has seen the flight deck on a desktop
            and then opens the same URL on a phone should know the difference is
            a decision rather than a broken page. */}
        <p className="mt-6 font-mono text-[10px] tracking-telemetry text-zinc uppercase">
          Flight deck off — this device gets the document
        </p>

        <div className="mt-24 space-y-20">
          {STATIONS.map((s) => (
            <section key={s.id} className="border-t border-white/15 pt-8">
              <div className="flex items-baseline gap-5">
                <span className="font-mono text-4xl font-bold text-white/25">
                  {s.index}
                </span>
                <span className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
                  {s.pillar} · {s.nav}
                </span>
              </div>

              <h2 className="mt-5 text-[clamp(1.7rem,4vw,2.8rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-white">
                {s.copy.business.headline}
              </h2>
              <p className="mt-4 text-xl leading-snug font-medium text-platinum">
                {s.copy.business.lede}
              </p>

              {/* The static document always speaks business. A visitor without
                  WebGL has no toggle to reach, and the outcome framing is the
                  one that has to land first either way. */}
              <div className="mt-6 max-w-2xl space-y-5 border-l border-white/15 pl-5">
                <div>
                  <div className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
                    The problem
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-zinc">
                    {s.copy.business.problem}
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-telemetry text-steel uppercase">
                    What we build
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-zinc">
                    {s.copy.business.solution}
                  </p>
                </div>
              </div>

              <ul className="mt-6 flex flex-wrap gap-2">
                {s.copy.business.proof.map((p) => (
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
                {s.specs.map((spec) => (
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
                        {project.environment}
                      </span>
                    </div>

                    <p className="mt-3 text-[14px] leading-relaxed text-platinum">
                      {project.pitch.executive}
                    </p>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                      {project.metrics.map((m) => (
                        <div
                          key={m.label}
                          className="rounded-md border border-white/12 px-3 py-2.5"
                        >
                          <dt className="font-mono text-[14px] leading-none text-white tabular-nums">
                            {m.value}
                          </dt>
                          <dd className="mt-1.5 font-mono text-[8.5px] leading-[1.4] tracking-[0.1em] text-steel uppercase">
                            {m.label}
                            {m.basis === "target" ? " · budget" : " · measured"}
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
                      <Link
                        href={`/work/${project.slug}`}
                        className="-my-2 rounded-md py-2 font-mono text-[10px] tracking-telemetry text-white uppercase underline-offset-4 hover:underline"
                      >
                        Read the case study →
                      </Link>
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="-my-2 rounded-md py-2 font-mono text-[10px] tracking-telemetry text-zinc uppercase underline-offset-4 hover:text-white hover:underline"
                        >
                          Live app ↗
                        </a>
                      )}
                      {!project.liveUrl && project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="-my-2 rounded-md py-2 font-mono text-[10px] tracking-telemetry text-zinc uppercase underline-offset-4 hover:text-white hover:underline"
                        >
                          Source ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
            </section>
          ))}
        </div>

        <section
          id="transmission"
          className="mt-28 scroll-mt-10 border-t border-white/15 pt-10"
        >
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Ready to build something that holds?
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-platinum">
            Bring the architecture of your platform, the system you want
            audited, or — if you write code — yourself. An engineer reads the
            brief before anyone books a call: it goes to the engineering desk,
            not a CRM sequence.
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
