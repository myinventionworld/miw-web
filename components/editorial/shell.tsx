import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Chrome for the 2D routes.
 *
 * Deliberately not the flight deck: no WebGL, no smooth-scroll hijack, no
 * fixed viewport. Someone who followed a link to read about a system wants
 * typography and a scrollbar that behaves, and a case study rendered behind a
 * camera flight is a case study nobody finishes.
 */
export function EditorialShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "systems" | "careers";
}) {
  const link = (href: string, label: string, id: "systems" | "careers") => (
    <Link
      href={href}
      className={
        active === id
          ? "text-[13px] font-medium text-white"
          : "text-[13px] font-medium text-zinc transition-colors hover:text-white"
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-void/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-6 px-6 md:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            aria-label="MIW — back to the flight deck"
          >
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-white/35" />
              <span className="absolute size-1 rounded-full bg-white transition-transform duration-500 group-hover:-translate-x-[5px]" />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.36em] text-white">
              MIW
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            {link("/systems", "Systems", "systems")}
            {link("/careers", "Careers", "careers")}
            <Link
              href="/#transmission"
              className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              <span className="hidden sm:inline">Book Architecture Call</span>
              <span className="sm:hidden">Contact</span>
              <ArrowUpRight className="size-3.5" strokeWidth={2.4} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 md:px-8 md:py-20">
        {children}
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 md:px-8">
          <p className="font-mono text-[10px] tracking-telemetry text-steel uppercase">
            MIW Labs — Venture Studio &amp; Engineering Guild
          </p>
          <Link
            href="/"
            className="font-mono text-[10px] tracking-telemetry text-zinc uppercase transition-colors hover:text-white"
          >
            Back to the flight deck
          </Link>
        </div>
      </footer>
    </div>
  );
}
