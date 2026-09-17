import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EditorialShell } from "@/components/editorial/shell";
import { STATUS_TONE } from "@/lib/stations";
import { HOST_STATE, SYSTEMS } from "@/lib/systems";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Systems — MIW",
  description:
    "The systems MIW designed, built and runs: an event backbone, a governed agent runtime and a deterministic build toolchain. Architecture, decisions and the budgets each one holds.",
};

export default function SystemsIndexPage() {
  return (
    <EditorialShell active="systems">
      <p className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
        Systems
      </p>
      <h1 className="mt-5 text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-white">
        What we built, and why it is shaped that way.
      </h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-platinum">
        These are our own systems, running our own work. Each one is written up
        the way we would hand it to a new engineer: the problem it exists to
        solve, the decisions that were argued about, and the budget it has to
        hold.
      </p>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-zinc">
        Client engagements are covered by NDA and are not listed here. When a
        client agrees to be named, the write-up carries their name — until
        then, the evidence we publish is evidence you can check against a
        system we operate ourselves.
      </p>

      <div className="mt-14 space-y-4">
        {SYSTEMS.map((s) => (
          <Link
            key={s.slug}
            href={`/systems/${s.slug}`}
            className="group block rounded-xl border border-white/12 bg-white/3 p-6 transition-colors hover:border-white/30 hover:bg-white/6 md:p-7"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[13px] font-semibold tracking-[0.12em] text-white">
                {s.codename}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.16em] uppercase",
                  STATUS_TONE[s.status],
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {HOST_STATE[s.status]}
              </span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
                {s.kicker}
              </span>
            </div>

            <h2 className="mt-4 text-[22px] leading-[1.18] font-semibold tracking-[-0.025em] text-white md:text-[26px]">
              {s.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-zinc">
              {s.lede}
            </p>

            <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-telemetry text-white uppercase">
              Read the write-up
              <ArrowRight
                className="size-3 transition-transform group-hover:translate-x-1"
                strokeWidth={2.4}
              />
            </span>
          </Link>
        ))}
      </div>
    </EditorialShell>
  );
}
