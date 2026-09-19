"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Variant } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * The working part of every product frame. Real widgets rather than a video
 * loop or a screenshot: the visitor gets to poke at the thing, which is the
 * only demo format that survives a sceptical engineer.
 *
 * Each one demonstrates the single mechanism its case study is actually about —
 * the seat lock, the idempotency key, the edge cache. An abstract that merely
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
      <span className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

const TOGGLE =
  "shrink-0 rounded-sm border px-2 py-1 font-mono text-[9px] tracking-telemetry uppercase transition-colors";

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
        "mt-2 font-mono text-[10px] leading-[1.5]",
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
                "h-5 rounded-sm border font-mono text-[8px] transition-colors",
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

/* ── checkout: redelivery is a no-op, cache absorbs the sale ───────────── */

function CheckoutProto() {
  const { t } = useTranslation("projects");
  const [deliveries, setDeliveries] = useState(0);
  const [sale, setSale] = useState(false);

  // Two tiers plus the floor that reaches Postgres. The sale does not change the
  // ratio much — that is the whole claim being demonstrated.
  const tiers = sale
    ? { l1: 71, l2: 24, db: 5 }
    : { l1: 58, l2: 37, db: 5 };
  const hit = tiers.l1 + tiers.l2;

  return (
    <ProtoShell>
      <ProtoHead label={t("prototype.checkout.cacheHit", { hit })}>
        <button
          type="button"
          onClick={() => setSale((v) => !v)}
          className={cn(
            TOGGLE,
            sale
              ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
              : "border-white/20 text-zinc hover:border-white/50 hover:text-white",
          )}
        >
          {t(
            sale ? "prototype.checkout.sale" : "prototype.checkout.baseline",
          )}
        </button>
      </ProtoHead>

      <div className="flex h-4 overflow-hidden rounded-sm border border-white/15">
        <div
          style={{ width: `${tiers.l1}%` }}
          className="h-full bg-white/85"
          title={t("prototype.checkout.l1")}
        />
        <div
          style={{ width: `${tiers.l2}%` }}
          className="h-full bg-beam/70"
          title="L2 · Redis"
        />
        <div
          style={{ width: `${tiers.db}%` }}
          className="h-full bg-white/12"
          title="Postgres"
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-steel">
        <span>{t("prototype.checkout.l1Legend", { pct: tiers.l1 })}</span>
        <span>{t("prototype.checkout.l2Legend", { pct: tiers.l2 })}</span>
        <span>{t("prototype.checkout.dbLegend", { pct: tiers.db })}</span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
        <span className="font-mono text-[9px] tracking-telemetry text-zinc uppercase">
          {t("prototype.checkout.charges", {
            charges: Math.min(deliveries, 1),
            deliveries,
          })}
        </span>
        <button
          type="button"
          onClick={() => setDeliveries((d) => d + 1)}
          className={cn(
            TOGGLE,
            "border-white/25 text-white hover:bg-white hover:text-black",
          )}
        >
          {t("prototype.checkout.deliver")}
        </button>
      </div>

      {deliveries === 0 ? (
        <Readout>{t("prototype.checkout.idle")}</Readout>
      ) : deliveries === 1 ? (
        <Readout tone="good">{t("prototype.checkout.first")}</Readout>
      ) : (
        <Readout tone="good">
          {t("prototype.checkout.duplicate", { n: deliveries - 1 })}
        </Readout>
      )}
    </ProtoShell>
  );
}

/* ── streaming: where the route budget goes, warm and cold ────────────── */

const ROUTES = [
  { id: "home", path: "/", warm: [6, 8, 0], cold: [6, 41, 26] },
  { id: "browse", path: "/browse", warm: [7, 11, 0], cold: [7, 58, 38] },
  { id: "title", path: "/title/[id]", warm: [6, 9, 0], cold: [6, 47, 31] },
  // Per-viewer data cannot be cached at the edge, and pretending otherwise
  // would be the one dishonest row in the table.
  { id: "library", path: "/library", warm: [7, 22, 19], cold: [7, 24, 21] },
] as const;

const LEGS = ["edge", "render", "data"] as const;
const LEG_TONE = ["bg-white/85", "bg-beam/70", "bg-signal/70"];

function StreamingProto() {
  const { t } = useTranslation("projects");
  const [warm, setWarm] = useState(true);
  const [route, setRoute] = useState<(typeof ROUTES)[number]["id"]>("browse");

  const rows = useMemo(
    () =>
      ROUTES.map((r) => {
        // Widened out of the `as const` literal union: the tuple's element type
        // is the set of millisecond values that happen to appear in the table,
        // and a sum of them is not a member of it.
        const legs: number[] = [...(warm ? r.warm : r.cold)];
        return { ...r, legs, total: legs.reduce((a, b) => a + b, 0) };
      }),
    [warm],
  );

  const worst = Math.max(...rows.map((r) => r.total));
  const active = rows.find((r) => r.id === route)!;

  return (
    <ProtoShell>
      <ProtoHead label={t("prototype.streaming.budget")}>
        <button
          type="button"
          onClick={() => setWarm((v) => !v)}
          className={cn(
            TOGGLE,
            warm
              ? "border-signal/70 bg-signal/12 text-signal"
              : "border-amber-400/70 bg-amber-400/15 text-amber-300",
          )}
        >
          {t(
            warm ? "prototype.streaming.warm" : "prototype.streaming.cold",
          )}
        </button>
      </ProtoHead>

      <div className="space-y-1">
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRoute(r.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-1.5 py-[3px] text-left transition-colors",
              route === r.id ? "bg-white/10" : "hover:bg-white/6",
            )}
          >
            <span
              className={cn(
                "w-[74px] shrink-0 truncate font-mono text-[9.5px]",
                route === r.id ? "text-white" : "text-zinc",
              )}
            >
              {r.path}
            </span>
            <span className="flex h-2 flex-1 overflow-hidden rounded-sm bg-white/8">
              {r.legs.map((ms, i) => (
                <span
                  key={LEGS[i]}
                  style={{ width: `${(ms / worst) * 100}%` }}
                  className={cn("h-full", LEG_TONE[i])}
                />
              ))}
            </span>
            <span className="w-[42px] shrink-0 text-right font-mono text-[9.5px] text-platinum tabular-nums">
              {r.total} ms
            </span>
          </button>
        ))}
      </div>

      <Readout>
        {active.id === "library"
          ? t("prototype.streaming.perViewer", {
              path: active.path,
              data: active.legs[2],
              total: active.total,
            })
          : warm
            ? t("prototype.streaming.servedWarm", {
                path: active.path,
                edge: active.legs[0],
                render: active.legs[1],
              })
            : t("prototype.streaming.servedCold", {
                path: active.path,
                data: active.legs[2],
              })}
      </Readout>
    </ProtoShell>
  );
}

export function Prototype({ variant }: { variant: Variant }) {
  if (variant === "booking") return <BookingProto />;
  if (variant === "checkout") return <CheckoutProto />;
  return <StreamingProto />;
}
