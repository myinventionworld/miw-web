"use client";

import Link from "next/link";

import {
  AVAILABILITY,
  STANDARDS,
  STATIONS,
  STATUS_TONE,
} from "@/lib/stations";
import { systemForStation } from "@/lib/systems";
import { cn } from "@/lib/utils";

/**
 * Static document served when WebGL is missing or blocked. Same content model
 * as the flight deck, so the copy can never drift between the two.
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
          High-Performance Systems.
          <br className="hidden sm:block" /> Engineered for Scale and Autonomy.
        </h1>

        <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-platinum">
          We design and ship fault-tolerant digital platforms, distributed
          backends and autonomous AI agents — from the architecture diagram
          through to the thing running in production with a pager attached.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="mailto:signal@miw.studio"
            className="rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Initiate Project Discovery
          </a>
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

        <p className="mt-6 font-mono text-[10px] tracking-telemetry text-zinc uppercase">
          WebGL unavailable — interactive flight deck disabled
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

              {(() => {
                const study = systemForStation(s.id);
                return study ? (
                  <Link
                    href={`/systems/${study.slug}`}
                    className="mt-5 inline-block font-mono text-[10px] tracking-telemetry text-white uppercase underline-offset-4 hover:underline"
                  >
                    {study.codename} — read the write-up →
                  </Link>
                ) : null;
              })()}

              <ul className="mt-9 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {s.projects.map((p) => (
                  <li key={p.code}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-telemetry text-steel">
                        {p.code}
                      </span>
                      <span className="text-[15px] font-semibold text-white">
                        {p.name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-telemetry uppercase",
                          STATUS_TONE[p.status],
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-platinum">
                      {p.summary}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-zinc">
                      {p.stack.join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
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
