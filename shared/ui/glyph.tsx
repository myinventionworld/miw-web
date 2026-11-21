import type { SVGProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * The mark set, drawn here rather than pulled from an icon library.
 *
 * An off-the-shelf set has a signature — a 24px grid, 2px strokes, round caps — and that signature is the same on every site that installed
 * it. On a page whose whole argument is "we built this ourselves", wearing
 * someone else's drafting hand is the one detail that gives the game away.
 *
 * So: a 12 grid, square terminals, hairline strokes that thicken only where the
 * label they sit next to is bold. Everything is sized in `em` by default, which
 * means a mark tracks the type it annotates instead of being pinned to a
 * `size-4` that was right for one button and wrong for the next.
 *
 * The set is deliberately small: controls with no text (menu, close) and a few
 * status marks. Links carry no mark — the label says where they go.
 */

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Overrides the per-mark default. Raise it next to heavy type, not to shout. */
  weight?: number;
};

function Glyph({
  weight = 1.5,
  className,
  children,
  ...rest
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      focusable="false"
      className={cn("size-[1em] shrink-0", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Menu. Two rules, not three — a third bar is the library hamburger, and the
 *  control is unambiguous without it. */
export function Bars(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M1.4 3.6 H10.6" />
      <path d="M1.4 8.4 H10.6" />
    </Glyph>
  );
}

/** Close. */
export function Cross(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.4 2.4 L9.6 9.6" />
      <path d="M9.6 2.4 L2.4 9.6" />
    </Glyph>
  );
}

/** Confirmation, used once per form and never as an ornament in a list. */
export function Tick(props: GlyphProps) {
  return (
    <Glyph weight={1.7} {...props}>
      <path d="M1.8 6.2 L4.6 9 L10.2 3" />
    </Glyph>
  );
}

/**
 * The telemetry toggle. A single trace with one spike: the button turns a
 * readout on, and a readout is a line that moves. Hand-plotted so the spike is
 * off-centre — a symmetric waveform reads as a logo.
 */
export function Trace(props: GlyphProps) {
  return (
    <Glyph weight={1.3} {...props}>
      <path d="M0.8 6.4 H3.4 L4.8 2.4 L6.9 9.6 L8.1 6.4 H11.2" />
    </Glyph>
  );
}

/**
 * The carrier mark on the console header. Concentric arcs off a filled centre —
 * a signal leaving, which is the one thing that panel does.
 *
 * The arcs are plotted from the dot rather than eyeballed, because an arc in SVG
 * is specified by its endpoints and a radius, not by its apex: the first draft
 * put the emitter at the centre of the box and the outer crown landed at x=12.23
 * in a box that ends at 12, so the viewport sliced the top off the arc and the
 * mark read as a bracket. The emitter now sits left of centre and every radius is
 * measured from it, which both fits the crowns inside the box and balances the
 * mass — the shape points right, so drawing it from the middle left a dead half.
 */
export function Carrier(props: GlyphProps) {
  return (
    <Glyph weight={1.2} {...props}>
      <circle cx="3.8" cy="6" r="1.15" fill="currentColor" stroke="none" />
      <path d="M5.7 3.7 A3 3 0 0 1 5.7 8.3" />
      <path d="M7.4 1.7 A5.6 5.6 0 0 1 7.4 10.3" />
    </Glyph>
  );
}
