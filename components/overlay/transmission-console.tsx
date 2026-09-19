"use client";

import { LocaleLink } from "@/components/locale-link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, type MotionValue } from "motion/react";
import { Arrow, Carrier, Tick } from "@/components/glyph";

import { firePulse } from "@/lib/flight";
import {
  BUDGETS,
  CONSOLE_TABS,
  ENGAGEMENTS,
  GUILD_OPENINGS,
  STAGES,
  TAB_ENGAGEMENTS,
  TIMELINES,
  type ConsoleTab,
  type EngagementId,
  type Standard,
} from "@/lib/stations";
import { cn } from "@/lib/utils";
import { Stage } from "./stage";

/**
 * Scroll band the console occupies — the end of the runway, held open.
 *
 * The fade-in has to start inside the dock magnet's capture radius around
 * `CONSOLE_ANCHOR` (0.97), or there is a stretch of runway where the form is
 * half-present and the scroll is free to stop. It used to open at 0.885, which
 * left ~0.045 of exactly that.
 */
const WINDOW = [0.925, 0.962, 0.998, 1] as const;

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline gap-3">
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

/**
 * The option's value is its id, not the words on it. A submitted `budget` of
 * "$10k – $25k" and one of "10–25 tis. $" are the same answer, and a desk that
 * has to normalise them by hand is a desk that will get it wrong once.
 */
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { id: string; label: string }[];
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
          <option key={o.id} value={o.id} className="bg-carbon">
            {o.label}
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
  const { t } = useTranslation(["console", "common", "careers"]);
  const [tab, setTab] = useState<ConsoleTab>("engineering");
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

  const selectedTab = CONSOLE_TABS.find((c) => c.id === tab)!;
  const standards = t("common:standards", {
    returnObjects: true,
  }) as Standard[];
  const sending = status.kind === "sending";

  /**
   * Only the engagements that belong to this tab. Switching tabs re-points the
   * selection at the first of them rather than leaving `Architecture rescue`
   * selected under `--client-engineering` — a mismatch nobody would notice until
   * the transmission arrived contradicting itself.
   */
  const offered = ENGAGEMENTS.filter((e) => TAB_ENGAGEMENTS[tab].includes(e));

  function pickTab(next: ConsoleTab) {
    setTab(next);
    setStatus({ kind: "idle" });
    const first = TAB_ENGAGEMENTS[next][0];
    if (first) setEngagement(first);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    // Validated in the order the fields are read, so the message always points
    // at the first thing wrong rather than the last thing checked.
    if (name.trim().length < 2) {
      setStatus({ kind: "error", message: t("form.errName") });
      return;
    }
    if (org.trim().length < 2) {
      setStatus({ kind: "error", message: t("form.errOrg") });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus({ kind: "error", message: t("form.errEmail") });
      return;
    }
    // A written reply needs something to reply about. One line is enough; the
    // point of the minimum is to keep this desk out of the auto-blast lists.
    if (scope.trim().length < 12) {
      setStatus({ kind: "error", message: t("form.errScope") });
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
      {/* Clears the status strip and nav rather than passing under them. The
          clearance holds at every width: the nav is 97px tall on desktop too,
          and a short landscape window is exactly where the panel grows into it. */}
      <div className="flex h-full items-center justify-center px-5 pt-[104px] pb-6 md:px-10">
        {/* This used to carry a comment claiming the form was laid out to fit a
            13" window, so it needed no scrollbar. Measured, that was false: at
            1366x640 — a 1366x768 laptop once the browser chrome is subtracted —
            the panel came to 540px against a 512px band and the submit button
            landed 25px below the fold, unclickable. The primary conversion action
            on the site was unreachable on one of the most common screens sold.

            So the panel is capped at the band and scrolls itself when it has to.
            Deliberately *not* `data-lenis-prevent`: that attribute blocks Lenis
            unconditionally, so once the pointer was over the panel the wheel
            would stop reaching the page even with the panel already scrolled to
            its end — the reader would be sealed inside the form with no way back
            up the runway. `allowNestedScroll` in `experience.tsx` is the right
            mechanism and needs no attribute; Lenis checks whether this element
            can still scroll in the gesture's direction and takes the wheel back
            the moment it cannot.

            The `deck-short` trims below exist so the scrollbar is a guarantee
            rather than the normal experience: on a short deck the form gives up
            padding first, and only scrolls when that is not enough. */}
        <div className="panel-solid thin-scroll pointer-events-auto mx-auto max-h-full w-full max-w-4xl overflow-y-auto overscroll-contain rounded-2xl p-5 shadow-2xl deck-short:p-4 md:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4 deck-short:pb-3">
            <div className="flex items-center gap-2.5">
              <Carrier className="text-[14px] text-signal" />
              <span className="font-mono text-[10px] tracking-telemetry text-white uppercase">
                {t("title")}
              </span>
            </div>
            <span className="hidden font-mono text-[10px] tracking-telemetry text-zinc uppercase sm:inline">
              {t("subtitle")}
            </span>
          </div>

          {/* Three intents, one console. The tab is chosen before any field is
              asked for, so nobody fills in a budget range to apply for a job.
              The flag is the label from `sm` up — it is the same string the
              readout below prints when the channel opens, and a console that
              names its own arguments is the one honest place for that joke. */}
          <div
            role="tablist"
            aria-label={t("tablist")}
            className="mt-4 flex flex-wrap gap-2 deck-short:mt-3"
          >
            {CONSOLE_TABS.map((c) => {
              const active = c.id === tab;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => pickTab(c.id)}
                  className={cn(
                    "rounded-md border px-3.5 py-2 font-mono text-[11px] whitespace-nowrap transition-all duration-200",
                    active
                      ? "border-white bg-white font-semibold text-black shadow-[0_0_28px_-8px_rgba(255,255,255,0.7)]"
                      : "border-white/25 text-platinum hover:border-white/60 hover:bg-white/8 hover:text-white",
                  )}
                >
                  [ <span className="hidden sm:inline">{c.flag}</span>
                  <span className="sm:hidden">{t(`tabs.${c.id}.label`)}</span> ]
                </button>
              );
            })}
          </div>
          <p
            aria-live="polite"
            className="mt-2.5 text-[12.5px] text-zinc deck-short:mt-2"
          >
            {t(`tabs.${tab}.note`)}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {tab === "guild" ? (
              <motion.div
                key="guild"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="pt-6"
              >
                <h2 className="max-w-lg text-[24px] leading-[1.1] font-semibold tracking-[-0.03em] text-white md:text-[28px]">
                  {t("tabs.guild.heading")}
                </h2>
                <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-platinum">
                  {t("guild.body")}
                </p>

                <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-white/12 bg-white/10 sm:grid-cols-3">
                  {GUILD_OPENINGS.map((o) => (
                    <div key={o.id} className="bg-carbon/90 p-3.5">
                      <p className="text-[13px] leading-snug font-semibold text-white">
                        {t(`careers:openings.${o.id}.label`)}
                      </p>
                      <p className="mt-1.5 font-mono text-[9.5px] leading-[1.6] text-steel">
                        {o.stack.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>

                <LocaleLink
                  href="/careers"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-zinc-200 sm:w-auto sm:px-8"
                >
                  {t("guild.cta")}
                  <Arrow className="text-[15px]" weight={1.7} />
                </LocaleLink>
                <p className="mt-3 font-mono text-[9.5px] tracking-[0.1em] text-steel uppercase">
                  {t("guild.note")}
                </p>
              </motion.div>
            ) : status.kind === "sent" ? (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="py-8 text-center"
              >
                <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-signal/50 bg-signal/12">
                  <Tick className="text-[19px] text-signal" />
                </div>
                <h3 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                  {t("receipt.title")}
                </h3>
                <p className="mt-3 text-lg leading-snug text-platinum">
                  {t("receipt.body")}
                </p>

                <dl className="mx-auto mt-7 grid max-w-lg grid-cols-2 gap-x-8 gap-y-4 border-t border-white/15 pt-5 text-left">
                  {[
                    [
                      t("receipt.engagement"),
                      t(`engagements.${engagement}.label`),
                    ],
                    [t("receipt.organisation"), org || "—"],
                    [t("receipt.budget"), t(`budgets.${budget}`)],
                    [t("receipt.channel"), email],
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
                  className="mt-7 font-mono text-[10px] tracking-telemetry text-platinum uppercase underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {t("receipt.amend")}
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
                className="pt-5 deck-short:pt-4 md:grid md:grid-cols-2 md:gap-x-8"
              >
                {/* Two columns on desktop, balanced by height rather than by
                    topic: the flight deck is a fixed viewport, so whichever
                    column is taller is the one that decides whether the submit
                    button is reachable. That is why Timeline sits here with the
                    other two dropdowns instead of under the task field. */}
                <div className="space-y-5 deck-short:space-y-4">
                  <div>
                    <h2 className="text-[24px] leading-[1.1] font-semibold tracking-[-0.03em] text-white deck-short:text-[21px] md:text-[28px]">
                      {t(`tabs.${tab}.heading`)}
                    </h2>

                    {/* Trust signal sits above the form rather than below the
                      button: these are design budgets, and a reader who takes
                      them for delivered client results is a reader we misled. */}
                    <dl className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 rounded-lg border border-white/12 bg-white/4 px-3.5 py-2.5 deck-short:mt-3 deck-short:py-2">
                      {standards.map((s) => (
                        <div
                          key={s.value}
                          className="flex items-baseline gap-1.5"
                        >
                          <dt className="font-mono text-[14px] leading-none font-semibold text-white tabular-nums">
                            {s.value}
                          </dt>
                          <dd className="font-mono text-[9px] tracking-[0.12em] text-zinc uppercase">
                            {s.label}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-1.5 font-mono text-[9.5px] tracking-[0.1em] text-steel uppercase">
                      {t("form.standardsNote")}
                    </p>
                  </div>

                  <fieldset>
                    <Label hint={t("form.engagementHint")}>
                      {t("form.engagement")}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {offered.map((e) => {
                        const active = e === engagement;
                        return (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setEngagement(e)}
                            aria-pressed={active}
                            className={cn(
                              "rounded-md border px-3 py-1.5 text-[12px] transition-all duration-200",
                              active
                                ? "border-white bg-white font-semibold text-black"
                                : "border-white/25 text-platinum hover:border-white/60 hover:bg-white/8 hover:text-white",
                            )}
                          >
                            {t(`engagements.${e}.label`)}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-3 gap-2.5">
                    <Select
                      label={t("form.stage")}
                      value={stage}
                      onChange={setStage}
                      options={STAGES.map((id) => ({
                        id,
                        label: t(`stages.${id}`),
                      }))}
                    />
                    <Select
                      label={t("form.budget")}
                      value={budget}
                      onChange={setBudget}
                      options={BUDGETS.map((id) => ({
                        id,
                        label: t(`budgets.${id}`),
                      }))}
                    />
                    <Select
                      label={t("form.timeline")}
                      value={timeline}
                      onChange={setTimeline}
                      options={TIMELINES.map((id) => ({
                        id,
                        label: t(`timelines.${id}`),
                      }))}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-4 deck-short:space-y-3 md:mt-0">
                  <div>
                    <Label hint={t("form.identityHint")}>
                      {t("form.identity")}
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("form.name")}
                        aria-label={t("form.name")}
                        autoComplete="name"
                        required
                        className="field w-full rounded-lg px-4 py-3 text-[13px]"
                      />
                      <input
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        placeholder={t("form.company")}
                        aria-label={t("form.company")}
                        autoComplete="organization"
                        required
                        className="field w-full rounded-lg px-4 py-3 text-[13px]"
                      />
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("form.email")}
                      aria-label={t("form.email")}
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
                    <Label hint={t("form.scopeHint")}>{t("form.scope")}</Label>
                    <textarea
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      rows={3}
                      placeholder={t(`engagements.${engagement}.prompt`)}
                      aria-label={t("form.scope")}
                      required
                      // `rows` is the floor, not the height — a short deck
                      // overrides it in CSS. Two visible lines still honours the
                      // label, which asks for one.
                      className="field thin-scroll w-full resize-none rounded-lg px-4 py-3 text-[13px] leading-relaxed deck-short:h-[68px] deck-short:py-2"
                    />
                  </div>

                  <div className="space-y-3 border-t border-white/15 pt-4 deck-short:space-y-2 deck-short:pt-3">
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
                          ? t("form.sending", { flag: selectedTab.flag })
                          : t("form.idle")}
                    </p>

                    <button
                      type="submit"
                      disabled={sending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:bg-zinc-400"
                    >
                      {/* No mark. "Execute" is already the verb, and an arrow on
                          a submit button points at nothing. */}
                      {sending ? t("form.submitting") : t("form.submit")}
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
