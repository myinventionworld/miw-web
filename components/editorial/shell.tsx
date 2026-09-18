import Link from "next/link";
import type { ReactNode } from "react";
import { Arrow } from "@/components/glyph";
import { cn } from "@/lib/utils";

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
  active?: "work" | "careers";
}) {
  /**
   * The padding is the tap target, not decoration. Bare 13px anchors measured
   * 20px tall, under the 24px WCAG 2.5.8 floor — and these two links are the
   * only site navigation a phone gets on these routes.
   *
   * Vertical growth is free: `-my-2` pulls the margin box back to the height the
   * text had, so a 36px hit area opens inside a 56px row that was mostly dead
   * space anyway and nothing moves. Horizontal growth is not free, so the `gap`
   * on the nav below pays for it — 8px of padding a side against `gap-2` is the
   * same 24px of visible separation the old `gap-6` drew between bare text.
   */
  const link = (href: string, label: string, id: "work" | "careers") => (
    <Link
      href={href}
      className={cn(
        "-my-2 rounded-md px-2 py-2 text-[13px] font-medium",
        active === id
          ? "text-white"
          : "text-zinc transition-colors hover:text-white",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-void/85 backdrop-blur">
        {/* 320px is a real screen — an iPhone SE, and most budget Androids in
            the accessibility zoom levels people actually use. This row used to
            come to 338px against it, so every editorial route scrolled
            sideways: the one class of page whose entire job is to be read.

            The fix is spent where it costs nothing to read: the frame loses
            padding, the row loses gap, and the wordmark loses letter-spacing it
            only ever had for the flight deck's benefit. The type scale is
            untouched, because shrinking text to fit a phone is how a page ends
            up unreadable on the device it was supposedly fixed for. */}
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 md:px-8">
          <Link
            href="/"
            className="group -my-2 flex items-center gap-2.5 py-2"
            aria-label="MIW — back to the flight deck"
          >
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-white/35" />
              <span className="absolute size-1 rounded-full bg-white transition-transform duration-500 group-hover:-translate-x-[5px]" />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.2em] text-white sm:tracking-[0.36em]">
              MIW
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {link("/work", "Work", "work")}
            {link("/careers", "Careers", "careers")}
            <Link
              href="/#transmission"
              className="flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200 sm:ml-2 sm:px-3.5"
            >
              <span className="hidden sm:inline">Book Architecture Call</span>
              <span className="sm:hidden">Contact</span>
              {/* Measured: with the arrow in, the row fits 320px with 3.6px to
                  spare — one font fallback or one longer translation from
                  scrolling sideways again. The arrow is also the weakest mark in
                  the set by this project's own rule, since it annotates an
                  in-page anchor whose label already says where it goes. So it is
                  the first thing to give up when the frame gets tight, and the
                  19px it returns is what makes the fit a margin instead of a
                  coincidence. */}
              <Arrow className="hidden text-[13px] sm:block" weight={1.7} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Matched to the header's frame at every step, so the wordmark stays on
          the same rule as the body copy it sits above. */}
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:px-8 md:py-20">
        {children}
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 md:px-8">
          <p className="font-mono text-[10px] tracking-telemetry text-steel uppercase">
            MIW Labs — Venture Studio &amp; Engineering Guild
          </p>
          <Link
            href="/"
            className="-my-2 rounded-md py-2 font-mono text-[10px] tracking-telemetry text-zinc uppercase transition-colors hover:text-white"
          >
            Back to the flight deck
          </Link>
        </div>
      </footer>
    </div>
  );
}
