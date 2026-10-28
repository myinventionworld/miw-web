"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Variant } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * The working part of every product frame. Real widgets rather than a video
 * loop or a screenshot: the visitor gets to poke at the thing, which is the
 * only demo format that survives a sceptical engineer.
 *
 * Each one demonstrates the single mechanism its case study is actually about —
 * the seat lock, the read-and-listen position. An abstract that merely
 * looks technical would be the same decoration the video was, in fewer bytes.
 *
 * Nothing here animates on its own. The old canvas teaser ran a second 60Hz rAF
 * loop alongside the WebGL scene for no informational gain; state changes only
 * when somebody clicks.
 */

/**
 * No fixed height and no scrollbar. This used to be a 196px window with
 * `overflow-y-auto`, which made it a scroll container nested inside the card,
 * which was itself nested inside the page — put the cursor here and the wheel
 * went nowhere. Each widget below is sized to fit instead.
 */
function ProtoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#08080b] p-2.5 deck-short:p-2">{children}</div>
  );
}

function ProtoHead({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-meta text-zinc">{label}</span>
      {children}
    </div>
  );
}

const TOGGLE =
  "shrink-0 rounded-sm border px-2 py-1 text-meta transition-colors";

/** Terminal line under each demo. Mono, one fact, no exclamation marks. */
function Readout({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn";
  children: React.ReactNode;
}) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "mt-2 font-mono text-label leading-[1.5]",
        tone === "good" && "text-signal",
        tone === "warn" && "text-amber-300",
        tone === "neutral" && "text-platinum",
      )}
    >
      {children}
    </p>
  );
}

/* ── booking: the seat lock, contested on purpose ─────────────────────── */

const ROWS = 3;
const COLS = 8;
const PRESOLD = [0, 1, 5, 9, 14, 17, 18, 22];

type Attempt =
  | { kind: "idle" }
  | { kind: "held"; seat: number }
  | { kind: "won"; seat: number }
  | { kind: "lost"; seat: number };

function BookingProto() {
  const { t } = useTranslation("projects");
  const [sold, setSold] = useState<number[]>(PRESOLD);
  const [attempt, setAttempt] = useState<Attempt>({ kind: "idle" });

  const held = attempt.kind === "held" ? attempt.seat : null;
  const contested = attempt.kind === "held";

  /** The second passenger reaches for the same row the first one is holding. */
  const race = () => {
    if (attempt.kind !== "held") return;
    const seat = attempt.seat;
    setSold((s) => (s.includes(seat) ? s : [...s, seat]));
    setAttempt({ kind: "won", seat });
  };

  return (
    <ProtoShell>
      <ProtoHead
        label={t("prototype.booking.seatsSold", {
          sold: sold.length,
          total: ROWS * COLS,
        })}
      >
        <button
          type="button"
          onClick={race}
          disabled={!contested}
          className={cn(
            TOGGLE,
            contested
              ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
              : "border-white/15 text-steel",
          )}
        >
          {t("prototype.booking.race")}
        </button>
      </ProtoHead>

      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const taken = sold.includes(i);
          const mine = held === i;
          return (
            <button
              key={i}
              type="button"
              disabled={taken}
              aria-label={t(
                taken ? "prototype.booking.seatSold" : "prototype.booking.seat",
                { n: i + 1 },
              )}
              onClick={() => setAttempt({ kind: "held", seat: i })}
              className={cn(
                "h-5 rounded-sm border font-mono text-label transition-colors",
                taken
                  ? "cursor-not-allowed border-white/10 bg-white/8 text-steel"
                  : mine
                    ? "border-signal bg-signal/25 text-white"
                    : "border-beam/40 bg-beam/10 text-beam hover:border-beam hover:bg-beam/25",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {attempt.kind === "won" ? (
        <Readout tone="good">
          {t("prototype.booking.won", { seat: attempt.seat + 1 })}
          <br />
          {t("prototype.booking.wonBlocked")}
        </Readout>
      ) : attempt.kind === "held" ? (
        <Readout tone="warn">
          {t("prototype.booking.held", { seat: attempt.seat + 1 })}
        </Readout>
      ) : (
        <Readout>{t("prototype.booking.idle")}</Readout>
      )}
    </ProtoShell>
  );
}

/* ── reader: one book, read or listened, same place ─────────────────── */

/**
 * Boowie's "Read / Listen" switch. A book with a companion audio edition keeps
 * one position: switching maps it by chapter and by the fraction read, so the
 * listener starts where the reader stopped. That mapping is the whole demo —
 * the page and the timeline are drawn, not real text or audio.
 */
const CHAPTERS = [
  { pages: 14, seconds: 700 },
  { pages: 12, seconds: 680 },
] as const;

const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function ReaderProto() {
  const { t } = useTranslation("projects");
  const [mode, setMode] = useState<"read" | "listen">("read");
  const [chapter, setChapter] = useState(0);
  const [fraction, setFraction] = useState(0.4);
  const [switched, setSwitched] = useState(false);

  const ch = CHAPTERS[chapter];
  const page = Math.max(1, Math.round(fraction * ch.pages));
  const at = fraction * ch.seconds;

  const flip = (next: "read" | "listen") => {
    if (next === mode) return;
    setMode(next);
    setSwitched(true);
  };

  return (
    <ProtoShell>
      <ProtoHead label={t("prototype.reader.book", { n: chapter + 1 })}>
        <div className="flex gap-1">
          {(["read", "listen"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => flip(m)}
              aria-pressed={mode === m}
              className={cn(
                TOGGLE,
                mode === m
                  ? "border-signal/70 bg-signal/12 text-signal"
                  : "border-white/20 text-zinc hover:border-white/50 hover:text-white",
              )}
            >
              {t(`prototype.reader.${m}`)}
            </button>
          ))}
        </div>
      </ProtoHead>

      {mode === "read" ? (
        <div className="rounded-sm border border-white/10 bg-[#f6f1e9]/[0.06] px-3 py-2.5" aria-hidden>
          {[92, 100, 96, 88, 64].map((w, i) => (
            <span
              key={i}
              style={{ width: `${w}%` }}
              className="mb-1.5 block h-1.5 rounded-full bg-white/20 last:mb-0"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-white/10 bg-white/4 px-3 py-3" aria-hidden>
          <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
            <span
              style={{ width: `${fraction * 100}%` }}
              className="block h-full bg-signal/70"
            />
          </span>
          <span className="mt-2 flex justify-between font-mono text-label text-zinc tabular-nums">
            <span>{clock(at)}</span>
            <span>{clock(ch.seconds)}</span>
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        {CHAPTERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setChapter(i)}
            aria-pressed={chapter === i}
            className={cn(
              TOGGLE,
              chapter === i
                ? "border-white/60 text-white"
                : "border-white/15 text-zinc hover:text-white",
            )}
          >
            {t("prototype.reader.chapter", { n: i + 1 })}
          </button>
        ))}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(fraction * 100)}
          onChange={(e) => setFraction(Number(e.target.value) / 100)}
          aria-label={t("prototype.reader.position")}
          className="range flex-1"
        />
      </div>

      <Readout tone={switched ? "good" : "neutral"}>
        {!switched
          ? t("prototype.reader.idle")
          : mode === "listen"
            ? t("prototype.reader.toListen", {
                n: chapter + 1,
                page,
                pages: ch.pages,
                at: clock(at),
                total: clock(ch.seconds),
              })
            : t("prototype.reader.toRead", {
                n: chapter + 1,
                page,
                pages: ch.pages,
                at: clock(at),
              })}
      </Readout>
    </ProtoShell>
  );
}

export function Prototype({ variant }: { variant: Variant }) {
  if (variant === "booking") return <BookingProto />;
  return <ReaderProto />;
}
