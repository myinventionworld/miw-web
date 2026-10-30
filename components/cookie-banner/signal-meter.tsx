import s from "./cookie-banner.module.css";

const BARS = [0.3, 0.55, 0.8, 1];

export function SignalMeter() {
  return (
    <span aria-hidden className="flex h-2.5 items-end gap-[2px]">
      {BARS.map((h, i) => (
        <span
          key={h}
          style={{ height: `${h * 100}%` }}
          className={`w-[2px] bg-comet ${i === BARS.length - 1 ? s.flicker : ""}`}
        />
      ))}
    </span>
  );
}
