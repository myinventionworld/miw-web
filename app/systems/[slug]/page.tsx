import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { ArchDiagram } from "@/components/editorial/arch-diagram";
import { EditorialShell } from "@/components/editorial/shell";
import { STATUS_TONE } from "@/lib/stations";
import { HOST_STATE, SYSTEMS, systemBySlug } from "@/lib/systems";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return SYSTEMS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const system = systemBySlug(slug);
  if (!system) return {};

  return {
    title: `${system.codename} — ${system.title} — MIW`,
    description: system.lede,
  };
}

function SectionLabel({ n, children }: { n: string; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-telemetry text-steel">
        {n}
      </span>
      <span className="font-mono text-[10px] tracking-telemetry text-signal uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export default async function SystemCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const system = systemBySlug(slug);
  if (!system) notFound();

  return (
    <EditorialShell active="systems">
      <header>
        <Link
          href="/systems"
          className="font-mono text-[10px] tracking-telemetry text-steel uppercase transition-colors hover:text-white"
        >
          ← All systems
        </Link>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[14px] font-semibold tracking-[0.12em] text-white">
            {system.codename}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.16em] uppercase",
              STATUS_TONE[system.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {HOST_STATE[system.status]}
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
            {system.kicker}
          </span>
        </div>

        <h1 className="mt-5 max-w-3xl text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-white">
          {system.title}
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-platinum">
          {system.lede}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {system.liveUrl ? (
            <a
              href={system.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Launch live app
              <ArrowUpRight className="size-3.5" strokeWidth={2.4} />
            </a>
          ) : null}
          <span className="font-mono text-[10.5px] text-steel">
            {system.host}
          </span>
        </div>
      </header>

      <section className="mt-20">
        <SectionLabel n="01">The challenge</SectionLabel>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {system.challenge.lede}
        </p>
        <ul className="mt-6 max-w-2xl space-y-3">
          {system.challenge.points.map((p) => (
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
        <SectionLabel n="02">The architecture</SectionLabel>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {system.architecture.lede}
        </p>

        <div className="mt-8 rounded-xl border border-white/12 bg-white/3 p-6 md:p-8">
          <ArchDiagram
            nodes={system.architecture.nodes}
            edges={system.architecture.edges}
          />
        </div>

        <h3 className="mt-12 font-mono text-[10px] tracking-telemetry text-steel uppercase">
          Decisions, and what they cost
        </h3>
        <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/12 bg-white/10 md:grid-cols-2">
          {system.architecture.decisions.map((d) => (
            <div key={d.choice} className="bg-carbon p-6">
              <p className="text-[14.5px] leading-snug font-semibold text-white">
                {d.choice}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-zinc">
                {d.why}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionLabel n="03">The outcome</SectionLabel>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-platinum">
          {system.outcome.lede}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {system.outcome.targets.map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-white/12 bg-white/3 p-6"
            >
              <p className="font-mono text-[26px] leading-none font-semibold tracking-[-0.03em] text-white">
                {t.value}
              </p>
              <p className="mt-3 font-mono text-[9.5px] tracking-[0.16em] text-signal uppercase">
                {t.label}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-zinc">
                {t.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-xl border border-white/12 bg-white/3 p-8 md:p-10">
        <h2 className="max-w-xl text-[clamp(1.4rem,2.6vw,1.9rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-white">
          Build a similar system with MIW.
        </h2>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-zinc">
          Tell us what breaks, what it costs when it breaks, and when you need
          it to stop. An engineer answers — not a sales sequence.
        </p>
        <Link
          href="/#transmission"
          className="mt-7 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Build a similar system with MIW
          <ArrowRight className="size-3.5" strokeWidth={2.4} />
        </Link>
      </section>
    </EditorialShell>
  );
}
