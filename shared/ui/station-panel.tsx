import { cn } from "@/shared/lib/cn";

import { Corners } from "./console-key";
import { SignalMeter } from "./signal-meter";
import s from "./station-panel.module.css";

export function StationFrame({
  label,
  channel,
  station,
  children,
  animated = true,
  className,
}: {
  label: string;
  channel: string;
  station: string;
  children: React.ReactNode;
  animated?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "relative flex flex-col overflow-hidden border border-white/15 bg-black/95 text-platinum backdrop-blur",
        s.starfield,
        animated && s.dock,
        className,
      )}
    >
      <Corners />

      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/15 px-4 py-2 font-mono text-label tracking-wider text-white/45 uppercase">
        <span className="flex min-w-0 items-center gap-2">
          <SignalMeter />
          <span className="truncate">{channel}</span>
        </span>
        <span className="shrink-0 tabular-nums">{station}</span>
      </div>

      {children}
    </section>
  );
}

export function StationPanel({
  actions,
  children,
  bodyClassName,
  ...frame
}: Omit<React.ComponentProps<typeof StationFrame>, "children"> & {
  actions: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <StationFrame {...frame}>
      <div className={cn("px-4 pt-4", bodyClassName)}>{children}</div>

      <div className="mt-4 -ml-px flex flex-wrap font-mono text-label tracking-wider uppercase">
        {actions}
      </div>
    </StationFrame>
  );
}
