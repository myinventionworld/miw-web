"use client";

import { STATIONS, STATUS_TONE } from "@/lib/stations";
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
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-telemetry text-signal uppercase">
          <span className="h-px w-9 bg-signal/55" />
          MIW · My Invention World
        </div>

        <h1 className="mt-8 text-[clamp(2.4rem,7vw,5.2rem)] leading-[0.9] font-semibold tracking-[-0.045em] text-white">
          High-performance software architecture
        </h1>

        <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-platinum">
          MIW designs and operates distributed systems, real-time intelligence
          platforms and the venture R&amp;D that comes out of running them. Small
          senior teams that own the runtime, not just the repository.
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
                  {s.nav}
                </span>
              </div>

              <h2 className="mt-5 text-[clamp(1.7rem,4vw,2.8rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-white">
                {s.title}
              </h2>
              <p className="mt-4 text-xl leading-snug font-medium text-platinum">
                {s.lede}
              </p>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-zinc">
                {s.body}
              </p>

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

        <section className="mt-28 border-t border-white/15 pt-10">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Open a channel
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-platinum">
            An engineer reads the brief before anyone books a call. Goes to the
            engineering desk, not a CRM sequence.
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
