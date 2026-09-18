import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/glyph";

import { EditorialShell } from "@/components/editorial/shell";
import { PROJECTS } from "@/data/projects";
import { STATUS_TONE } from "@/lib/stations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Work — MIW",
  description:
    "Three systems MIW designed and built: a transactional booking platform, a high-throughput commerce pipeline and an edge-cached media catalogue. Architecture, decisions and the budgets each one holds.",
};

export default function WorkIndexPage() {
  return (
    <EditorialShell active="work">
      <p className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
        Work
      </p>
      <h1 className="mt-5 text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-white">
        Three systems, written up the way we would hand them over.
      </h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-platinum">
        Not a client logo wall. Each of these is a system we designed and built,
        described the way we would brief a new engineer onto it: the problem it
        exists to solve, the shape it ended up, the decisions that were argued
        about, and the budget it has to hold.
      </p>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-zinc">
        Client engagements are under NDA and are not listed here. What we publish
        instead is evidence you can check yourself — one of these has an address
        you can open right now, and one has source you can read.
      </p>

      <div className="mt-14 space-y-4">
        {PROJECTS.map((p) => (
          <Link
            key={p.slug}
            href={`/work/${p.slug}`}
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
                {p.environment}
              </span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
                {p.category}
              </span>
            </div>

            <h2 className="mt-4 text-[22px] leading-[1.18] font-semibold tracking-[-0.025em] text-white md:text-[26px]">
              {p.headline}
            </h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-zinc">
              {p.pitch.executive}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-telemetry text-white uppercase">
                Read the case study
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
