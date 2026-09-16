"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, type MotionValue } from "motion/react";
import { ArrowUpRight, Check, Radio } from "lucide-react";

import { firePulse } from "@/lib/flight";
import { cn } from "@/lib/utils";
import { Stage } from "./stage";

/** Scroll band the console occupies — the end of the runway, held open. */
const WINDOW = [0.885, 0.945, 0.995, 1] as const;

const ENGAGEMENTS = [
  "Architecture Audit",
  "Custom Software",
  "BI & Analytics",
  "Venture Incubation",
] as const;

/**
 * Budget bands described by what they buy, not by a fabricated ROI figure.
 * Anyone sizing a programme reads the right-hand column, not the number.
 */
const BUDGETS = [
  { band: "$25K — $50K", note: "Architecture review, written decision record." },
  { band: "$50K — $150K", note: "One squad, one quarter, a shipped subsystem." },
  { band: "$150K — $400K", note: "Platform build with an on-call handover." },
  { band: "$400K — $1M", note: "Multi-team programme, multi-region runtime." },
  { band: "$1M+", note: "Standing engineering partnership." },
];

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-3">
      <span className="font-mono text-[10px] tracking-telemetry text-white uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-white/15" />
      {hint && (
        <span className="font-mono text-[10px] tracking-[0.1em] text-zinc uppercase">
          {hint}
        </span>
      )}
    </div>
  );
}

export function TransmissionConsole({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const [engagements, setEngagements] = useState<string[]>([
    "Custom Software",
  ]);
  const [budget, setBudget] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const toggle = (v: string) =>
    setEngagements((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (engagements.length === 0) {
      setError("Select at least one engagement type.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("A reachable work address is required to reply.");
      return;
    }

    setError(null);
    firePulse();
    setSent(true);
  }

  return (
    <Stage progress={progress} window={WINDOW} lift={60} exit={false}>
      <div className="flex h-full items-center justify-center px-5 py-24 md:px-10">
        <div className="panel-solid pointer-events-auto mx-auto w-full max-w-2xl rounded-2xl p-6 shadow-2xl md:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
            <div className="flex items-center gap-2.5">
              <Radio className="size-3.5 text-signal" strokeWidth={1.8} />
              <span className="font-mono text-[10px] tracking-telemetry text-white uppercase">
                Transmission console
              </span>
            </div>
            <span className="hidden font-mono text-[10px] tracking-telemetry text-zinc uppercase sm:inline">
              Direct to engineering
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="py-10 text-center"
              >
                <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-signal/50 bg-signal/12">
                  <Check className="size-5 text-signal" strokeWidth={2.2} />
                </div>
                <h3 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                  Brief received
                </h3>
                <p className="mt-3 text-lg leading-snug text-platinum">
                  An engineer reads this before anyone books a call. Expect a
                  written response, usually inside two working days.
                </p>

                <dl className="mx-auto mt-9 grid max-w-lg grid-cols-2 gap-x-8 gap-y-4 border-t border-white/15 pt-6 text-left">
                  {[
                    ["Engagement", engagements.join(" · ")],
                    ["Budget", BUDGETS[budget].band],
                    ["Organisation", org || "—"],
                    ["Reply channel", email],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-1.5">
                      <dt className="font-mono text-[10px] tracking-telemetry text-zinc uppercase">
                        {k}
                      </dt>
                      <dd className="truncate font-mono text-[12px] text-white">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-9 font-mono text-[10px] tracking-telemetry text-platinum uppercase underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Amend the brief
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={submit}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-7 pt-7"
              >
                <div>
                  <Label hint="Multi-select">Engagement</Label>
                  <div className="flex flex-wrap gap-2">
                    {ENGAGEMENTS.map((v) => {
                      const active = engagements.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggle(v)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.14em] uppercase transition-all duration-200",
                            active
                              ? "border-white bg-white font-semibold text-black shadow-[0_0_28px_-8px_rgba(255,255,255,0.7)]"
                              : "border-white/25 text-platinum hover:border-white/60 hover:bg-white/8 hover:text-white",
                          )}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Budget &amp; scale</Label>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-2xl font-semibold tracking-[-0.02em] text-white tabular-nums md:text-3xl">
                      {BUDGETS[budget].band}
                    </span>
                    <span className="text-right text-[12px] leading-snug text-zinc">
                      {BUDGETS[budget].note}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={BUDGETS.length - 1}
                    step={1}
                    value={budget}
                    onChange={(e) => setBudget(e.currentTarget.valueAsNumber)}
                    aria-label="Budget and scale"
                    className="range mt-3"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc">
                    {BUDGETS.map((b, i) => (
                      <span
                        key={b.band}
                        className={cn(i === budget && "font-semibold text-white")}
                      >
                        {b.band.split(" ")[0]}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Contact</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      aria-label="Name"
                      autoComplete="name"
                      className="field w-full rounded-lg px-4 py-3 text-[13px]"
                    />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Work email"
                      aria-label="Work email"
                      inputMode="email"
                      autoComplete="email"
                      className="field w-full rounded-lg px-4 py-3 text-[13px]"
                    />
                  </div>
                  <input
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="Organisation"
                    aria-label="Organisation"
                    autoComplete="organization"
                    className="field mt-3 w-full rounded-lg px-4 py-3 text-[13px]"
                  />
                </div>

                <div>
                  <Label hint="Optional">System under discussion</Label>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={3}
                    placeholder="What is the load-bearing part, and what breaks first when it grows?"
                    aria-label="System under discussion"
                    className="field thin-scroll w-full resize-none rounded-lg px-4 py-3 text-[13px] leading-relaxed"
                  />
                </div>

                <div className="space-y-4 border-t border-white/15 pt-6">
                  <p
                    className={cn(
                      "text-[12px] leading-relaxed",
                      error ? "text-amber-300" : "text-zinc",
                    )}
                  >
                    {error ??
                      "Goes to the engineering desk, not a CRM sequence. No newsletter, no drip."}
                  </p>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-black transition-all hover:bg-zinc-200"
                  >
                    Open channel
                    <ArrowUpRight className="size-4" strokeWidth={2.2} />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Stage>
  );
}
