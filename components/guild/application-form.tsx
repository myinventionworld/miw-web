"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tick } from "@/components/glyph";

import { GUILD_LEVELS, GUILD_OPENINGS } from "@/lib/stations";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "sending" }
  | { kind: "sent" };

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[10px] tracking-[0.14em] text-white uppercase">
          {label}
        </span>
        {hint && (
          <span className="font-mono text-[9.5px] tracking-[0.1em] text-steel uppercase">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

/**
 * Asks for the work and nothing else. There is no CV upload, no years-of-
 * experience dropdown and no cover letter box — a first-year with a hard
 * project should not be filtered out by a form built for someone with a
 * résumé.
 */
export function GuildApplicationForm() {
  const [track, setTrack] = useState<string>(GUILD_OPENINGS[0].id);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [level, setLevel] = useState<string>(GUILD_LEVELS[0]);
  const [background, setBackground] = useState("");
  const [hardest, setHardest] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const sending = status.kind === "sending";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    if (name.trim().length < 2) {
      setStatus({ kind: "error", message: "err: name required." });
      return;
    }
    if (contact.trim().length < 3) {
      setStatus({
        kind: "error",
        message: "err: a Telegram handle or email is required to reply.",
      });
      return;
    }
    if (portfolio.trim().length < 4) {
      setStatus({
        kind: "error",
        message: "err: link something you built. This is the whole filter.",
      });
      return;
    }
    if (hardest.trim().length < 40) {
      setStatus({
        kind: "error",
        message:
          "err: the hardest-thing answer is what gets read first. A sentence or two, minimum.",
      });
      return;
    }

    setStatus({ kind: "sending" });
    timer.current = setTimeout(() => setStatus({ kind: "sent" }), 620);
  }

  const selected = GUILD_OPENINGS.find((o) => o.id === track)!;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status.kind === "sent" ? (
        <motion.div
          key="receipt"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl border border-white/12 bg-white/3 p-8 text-center md:p-12"
        >
          <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-signal/50 bg-signal/12">
            <Tick className="text-[19px] text-signal" />
          </div>
          <h3 className="mt-6 text-[28px] font-semibold tracking-[-0.03em] text-white">
            Application received
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-platinum">
            A Principal Architect reads this, not a recruiter. You get a written
            answer either way — usually inside a week.
          </p>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="mt-8 font-mono text-[10px] tracking-telemetry text-zinc uppercase underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Amend the application
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={submit}
          noValidate
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl border border-white/12 bg-white/3 p-6 md:p-8"
        >
          <fieldset>
            <legend className="mb-3 font-mono text-[10px] tracking-[0.14em] text-white uppercase">
              Direction
            </legend>
            <div className="flex flex-wrap gap-2">
              {GUILD_OPENINGS.map((o) => {
                const active = o.id === track;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setTrack(o.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-[12.5px] transition-colors",
                      active
                        ? "border-white bg-white font-semibold text-black"
                        : "border-white/22 text-platinum hover:border-white/55 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className="mt-3 text-[13px] text-zinc">
              {selected.signal}
            </p>
          </fieldset>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="field w-full rounded-lg px-4 py-3 text-[13.5px]"
              />
            </Field>
            <Field label="Telegram / Email">
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="@handle or you@domain.com"
                required
                className="field w-full rounded-lg px-4 py-3 text-[13.5px]"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="GitHub / portfolio / projects" hint="Required">
              <input
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="github.com/you — or a link to the thing itself"
                inputMode="url"
                required
                className="field w-full rounded-lg px-4 py-3 text-[13.5px]"
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Current level">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="field w-full appearance-none rounded-lg px-4 py-3 text-[13.5px]"
              >
                {GUILD_LEVELS.map((l) => (
                  <option key={l} value={l} className="bg-carbon">
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="University / experience" hint="Optional">
              <input
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Where you study or what you have shipped"
                className="field w-full rounded-lg px-4 py-3 text-[13.5px]"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="The hardest thing you have ever written or debugged">
              <textarea
                value={hardest}
                onChange={(e) => setHardest(e.target.value)}
                rows={5}
                placeholder="What was hard about it, what you tried that did not work, and how you found the answer. This is the part that gets read first."
                required
                className="field thin-scroll w-full resize-none rounded-lg px-4 py-3 text-[13.5px] leading-relaxed"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "max-w-sm font-mono text-[11.5px] leading-relaxed",
                status.kind === "error"
                  ? "text-amber-300"
                  : status.kind === "sending"
                    ? "text-signal"
                    : "text-steel",
              )}
            >
              {status.kind === "error"
                ? status.message
                : status.kind === "sending"
                  ? "> filing application …"
                  : "> read by a Principal Architect. No recruiter screen."}
            </p>
            <button
              type="submit"
              disabled={sending}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-[13.5px] font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:bg-zinc-400"
            >
              {sending ? "Submitting…" : "Submit Guild Application"}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
