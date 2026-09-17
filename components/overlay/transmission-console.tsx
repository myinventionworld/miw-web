"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type MotionValue } from "motion/react";
import { ArrowUpRight, Check, Radio } from "lucide-react";

import { firePulse } from "@/lib/flight";
import {
  BUDGETS,
  CONSOLE_TABS,
  ENGAGEMENTS,
  GUILD_OPENINGS,
  STAGES,
  STANDARDS,
  TIMELINES,
  type ConsoleTab,
  type EngagementId,
} from "@/lib/stations";
import { cn } from "@/lib/utils";
import { Stage } from "./stage";

/** Scroll band the console occupies — the end of the runway, held open. */
const WINDOW = [0.885, 0.945, 0.995, 1] as const;

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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[9px] tracking-[0.14em] text-steel uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field w-full appearance-none rounded-lg px-3 py-2.5 text-[12.5px]"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-carbon">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "sending" }
  | { kind: "sent" };

export function TransmissionConsole({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const [tab, setTab] = useState<ConsoleTab>("studio");
  const [engagement, setEngagement] = useState<EngagementId>("mvp");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<string>(STAGES[0]);
  const [budget, setBudget] = useState<string>(BUDGETS[0]);
  const [timeline, setTimeline] = useState<string>(TIMELINES[0]);
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const selectedTab = CONSOLE_TABS.find((t) => t.id === tab)!;
  const selectedEngagement = ENGAGEMENTS.find((e) => e.id === engagement)!;
  const sending = status.kind === "sending";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    if (name.trim().length < 2) {
      setStatus({ kind: "error", message: "err: operator name required." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus({
        kind: "error",
        message: "err: a reachable address is required to reply.",
      });
      return;
    }

    // Held for a beat so the status line is legible as a state change rather
    // than a flicker. No network call exists yet — the receipt is the contract.
    setStatus({ kind: "sending" });
    timer.current = setTimeout(() => {
      firePulse();
      setStatus({ kind: "sent" });
    }, 620);
  }

  return (
    <Stage progress={progress} window={WINDOW} lift={60} exit={false}>
      {/* The panel scrolls internally on short viewports, so it needs to clear
          the status strip and nav rather than passing under them. The clearance
          holds at every width: the nav is 97px tall on desktop too, and a short
          landscape window is exactly where the panel grows into it. */}
      <div className="flex h-full items-center justify-center px-5 pt-[108px] pb-10 md:px-10">
        <div className="panel-solid thin-scroll pointer-events-auto mx-auto max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl p-6 shadow-2xl md:p-8">
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

          {/* Two audiences, one console. The tab is chosen before any field is
              asked for, so nobody fills in a budget range to apply for a job. */}
          <div
            role="tablist"
            aria-label="Transmission type"
            className="mt-5 flex gap-2"
          >
            {CONSOLE_TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(t.id);
                    setStatus({ kind: "idle" });
                  }}
                  className={cn(
                    "rounded-md border px-3.5 py-2 font-mono text-[11px] transition-all duration-200",
                    active
                      ? "border-white bg-white font-semibold text-black shadow-[0_0_28px_-8px_rgba(255,255,255,0.7)]"
                      : "border-white/25 text-platinum hover:border-white/60 hover:bg-white/8 hover:text-white",
                  )}
                >
                  [ {t.label} ]
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="mt-3 text-[12.5px] text-zinc">
            {selectedTab.note}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {tab === "guild" ? (
              <motion.div
                key="guild"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="pt-7"
              >
                <h2 className="max-w-lg text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] text-white md:text-[30px]">
                  Not an internship. A crew, a review gate and a cut of the
                  work.
                </h2>
                <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-platinum">
                  The guild application asks for the hardest thing you have
                  built rather than a CV, so it lives on its own page with room
                  to answer properly.
                </p>

                <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-white/12 bg-white/10 sm:grid-cols-3">
                  {GUILD_OPENINGS.map((o) => (
                    <div key={o.id} className="bg-carbon/90 p-4">
                      <p className="text-[13px] leading-snug font-semibold text-white">
                        {o.label}
                      </p>
                      <p className="mt-2 font-mono text-[9.5px] leading-[1.6] text-steel">
                        {o.stack.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/careers"
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-zinc-200 sm:w-auto sm:px-8"
                >
                  Open the Guild application
                  <ArrowUpRight className="size-4" strokeWidth={2.2} />
                </Link>
                <p className="mt-3 font-mono text-[9.5px] tracking-[0.1em] text-steel uppercase">
                  Read by an engineer · portfolio over credentials
                </p>
              </motion.div>
            ) : status.kind === "sent" ? (
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
                  Transmission received
                </h3>
                <p className="mt-3 text-lg leading-snug text-platinum">
                  An engineer reads this before anyone books a call. Expect a
                  written response, usually inside two working days.
                </p>

                <dl className="mx-auto mt-9 grid max-w-lg grid-cols-2 gap-x-8 gap-y-4 border-t border-white/15 pt-6 text-left">
                  {[
                    ["Engagement", selectedEngagement.label],
                    ["Organisation", org || "—"],
                    ["Budget", budget],
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
                  onClick={() => setStatus({ kind: "idle" })}
                  className="mt-9 font-mono text-[10px] tracking-telemetry text-platinum uppercase underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Amend the transmission
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={submit}
                // Native bubbles would pre-empt the status line and land a
                // system-styled popover in the middle of the console.
                noValidate
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="pt-6 md:grid md:grid-cols-2 md:gap-x-8"
              >
                {/* Two columns on desktop: the flight deck is a fixed viewport,
                    so a console taller than ~820px gets clipped, not scrolled. */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] text-white md:text-[30px]">
                      Ready to build something that holds?
                    </h2>

                    {/* Trust signal sits above the form rather than below the
                      button: these are design budgets, and a reader who takes
                      them for delivered client results is a reader we misled. */}
                    <dl className="mt-5 grid grid-cols-3 gap-3 rounded-lg border border-white/12 bg-white/4 px-4 py-3">
                      {STANDARDS.map((s) => (
                        <div key={s.value}>
                          <dt className="font-mono text-[15px] leading-none font-semibold text-white tabular-nums">
                            {s.value}
                          </dt>
                          <dd className="mt-1.5 font-mono text-[9px] tracking-[0.12em] text-zinc uppercase">
                            {s.label}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-2 font-mono text-[9.5px] tracking-[0.1em] text-steel uppercase">
                      The standard we design to — not a claim about past results
                    </p>
                  </div>

                  <fieldset>
                    <Label hint="Pick one">Nature of the work</Label>
                    <div className="flex flex-wrap gap-2">
                      {ENGAGEMENTS.map((e) => {
                        const active = e.id === engagement;
                        return (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => setEngagement(e.id)}
                            aria-pressed={active}
                            className={cn(
                              "rounded-md border px-3 py-1.5 text-[12px] transition-all duration-200",
                              active
                                ? "border-white bg-white font-semibold text-black"
                                : "border-white/25 text-platinum hover:border-white/60 hover:bg-white/8 hover:text-white",
                            )}
                          >
                            {e.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Stage"
                      value={stage}
                      onChange={setStage}
                      options={STAGES}
                    />
                    <Select
                      label="Budget"
                      value={budget}
                      onChange={setBudget}
                      options={BUDGETS}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-5 md:mt-0">
                  <div>
                    <Label>Name / Company</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        aria-label="Name"
                        autoComplete="name"
                        required
                        className="field w-full rounded-lg px-4 py-3 text-[13px]"
                      />
                      <input
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        placeholder="Company"
                        aria-label="Company"
                        autoComplete="organization"
                        className="field w-full rounded-lg px-4 py-3 text-[13px]"
                      />
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Work email"
                      aria-label="Work email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      className="field mt-3 w-full rounded-lg px-4 py-3 text-[13px]"
                    />
                  </div>

                  <div>
                    {/* The prompt follows the engagement — a rescue and a
                        greenfield MVP are not the same question. */}
                    <Label hint="Optional">The task</Label>
                    <textarea
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      rows={3}
                      placeholder={selectedEngagement.prompt}
                      aria-label="The task"
                      className="field thin-scroll w-full resize-none rounded-lg px-4 py-3 text-[13px] leading-relaxed"
                    />
                  </div>

                  <Select
                    label="Timeline"
                    value={timeline}
                    onChange={setTimeline}
                    options={TIMELINES}
                  />

                  <div className="space-y-4 border-t border-white/15 pt-5">
                    <p
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "font-mono text-[11.5px] leading-relaxed",
                        status.kind === "error"
                          ? "text-amber-300"
                          : status.kind === "sending"
                            ? "text-signal"
                            : "text-zinc",
                      )}
                    >
                      {status.kind === "error"
                        ? status.message
                        : status.kind === "sending"
                          ? `> opening channel ${selectedTab.flag} …`
                          : "> routes to the engineering desk, not a CRM sequence."}
                    </p>

                    <button
                      type="submit"
                      disabled={sending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:bg-zinc-400"
                    >
                      {sending ? "Transmitting…" : "Execute Transmission"}
                      <ArrowUpRight className="size-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Stage>
  );
}
