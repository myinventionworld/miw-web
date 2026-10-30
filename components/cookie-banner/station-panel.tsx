import { cn } from "@/lib/utils";

import { SignalMeter } from "./signal-meter";
import s from "./cookie-banner.module.css";

const CORNER = "pointer-events-none absolute size-2.5 border-comet";

export function StationPanel({
  label,
  channel,
  station,
  actions,
  children,
  className,
}: {
  label: string;
  channel: string;
  station: string;
  actions: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={label} className={cn(s.dock, className)}>
      <div
        className={cn(
          "relative overflow-hidden border border-line bg-carbon/95 text-platinum backdrop-blur",
          s.starfield,
        )}
      >
        <span className={`${CORNER} top-0 left-0 border-t border-l`} />
        <span className={`${CORNER} top-0 right-0 border-t border-r`} />
        <span className={`${CORNER} bottom-0 left-0 border-b border-l`} />
        <span className={`${CORNER} right-0 bottom-0 border-r border-b`} />

        <div className="flex items-center justify-between border-b border-line px-4 py-2 font-mono text-label tracking-wider text-steel uppercase">
          <span className="flex items-center gap-2">
            <SignalMeter />
            {channel}
          </span>
          <span className="tabular-nums">{station}</span>
        </div>

        <div className="px-4 pt-4">{children}</div>

        <div className="mt-4 grid grid-cols-2 divide-x divide-line border-t border-line font-mono text-label tracking-wider uppercase">
          {actions}
        </div>
      </div>
    </section>
  );
}
