import { cn } from "@/lib/utils";

/**
 * Two short loops that explain the one mechanism each case study is about,
 * without asking the reader to do anything. CSS keyframes only (globals.css,
 * `race-*` and `morph-*`), so they cost nothing and need no JavaScript. With
 * reduced motion they show the end state and every caption at once.
 */

type Translate = (key: string) => string;

const SOLD = [0, 1, 5, 9, 14, 17, 18, 22];
const TARGET = 11; // seat 12

function Pointer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        d="M2 1.5 L13.5 8.6 L8.4 9.6 L11.2 14.4 L9.3 15.4 L6.6 10.6 L2.9 14 Z"
        fill="currentColor"
        stroke="var(--color-void)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Omnibus: two passengers reach for seat 12 at once; one gets it. */
export function SeatRace({ t }: { t: Translate }) {
  const k = (s: string) => t(`projects:omnibus_nss.race.${s}`);
  return (
    <figure className="race mx-auto w-full max-w-[560px]">
      {/* Clipped: the cursors fly in from outside the card, and on a phone
          their start points would otherwise widen the page. */}
      <div className="overflow-hidden rounded-[14px] bg-carbon p-5 sm:p-6">
        <div className="relative">
          <div className="grid grid-cols-8 gap-1.5" aria-hidden>
            {Array.from({ length: 24 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md text-label tabular-nums",
                  SOLD.includes(i)
                    ? "bg-white/8 text-steel"
                    : "border border-comet/35 text-comet",
                  i === TARGET && "race-seat",
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>

          {/* Both cursors sit on seat 12 and travel in from elsewhere. */}
          <span className="race-a pointer-events-none absolute" style={{ left: "43.75%", top: "50%" }}>
            <Pointer className="size-5 text-comet" />
            <span className="ml-3 rounded-full bg-comet px-1.5 text-label font-semibold text-void">A</span>
          </span>
          <span className="race-b pointer-events-none absolute" style={{ left: "43.75%", top: "50%" }}>
            <Pointer className="size-5 text-white" />
            <span className="ml-3 rounded-full bg-white px-1.5 text-label font-semibold text-void">B</span>
            <span className="relative ml-1.5 inline-block h-4 w-20">
              <span className="race-wait absolute inset-y-0 left-0 rounded-sm bg-carbon px-1 text-label font-medium text-zinc">{k("waiting")}</span>
              <span className="race-taken absolute inset-y-0 left-0 rounded-sm bg-carbon px-1 text-label font-semibold text-white">{k("taken")}</span>
            </span>
          </span>
        </div>
      </div>
      <figcaption className="race-caps relative mt-5 min-h-[3.4em] text-body leading-relaxed text-zinc">
        <p className="race-cap race-cap-1">{k("a")}</p>
        <p className="race-cap race-cap-2">{k("b")}</p>
        <p className="race-cap race-cap-3">{k("c")}</p>
      </figcaption>
    </figure>
  );
}

const LINES = [92, 100, 96, 88, 64];
// A fixed, hand-picked waveform: the same every render, so nothing jumps.
const WAVE = [
  34, 52, 40, 66, 48, 72, 58, 44, 62, 80, 54, 38, 60, 74, 50, 42, 68, 56, 46, 64,
  78, 52, 36, 58, 70, 48, 40, 62, 54, 44, 66, 50, 38, 56, 72, 46, 60, 42, 52, 36,
];

/** Boowie: the same place in a chapter, read and then listened. */
export function ReadListen({ t }: { t: Translate }) {
  const k = (s: string) => t(`projects:boowie.morph.${s}`);
  return (
    <figure className="morph mx-auto w-full max-w-[560px]">
      <div className="rounded-[14px] bg-carbon p-5 sm:p-6">
        <div className="relative h-5 text-small">
          <span className="morph-read absolute inset-0 font-medium text-white">{k("read")}</span>
          <span className="morph-listen absolute inset-0 font-medium text-white">{k("listen")}</span>
        </div>

        <div className="relative mt-4 h-32" aria-hidden>
          <div className="morph-read absolute inset-0 flex flex-col justify-center gap-2.5">
            {LINES.map((w, i) => (
              <span
                key={i}
                style={{ width: `${w}%` }}
                className={cn(
                  "block h-2 rounded-full",
                  i === 2 ? "bg-comet" : "bg-white/15",
                )}
              />
            ))}
          </div>
          <div className="morph-listen absolute inset-0 flex items-center gap-[3px]">
            {WAVE.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={cn(
                  "block flex-1 rounded-full",
                  i < WAVE.length * 0.4 ? "bg-comet" : "bg-white/15",
                )}
              />
            ))}
            <span className="absolute inset-y-0 left-[40%] w-0.5 bg-white" />
          </div>
        </div>
      </div>
      <figcaption className="mt-5 text-body leading-relaxed text-zinc">
        {k("caption")}
      </figcaption>
    </figure>
  );
}
