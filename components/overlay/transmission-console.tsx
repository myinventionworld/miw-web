"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, type MotionValue } from "motion/react";
import { Tick } from "@/components/glyph";

import { firePulse } from "@/lib/flight";
import {
  BUDGETS,
  CONSOLE_TABS,
  ENGAGEMENTS,
  STAGES,
  TAB_ENGAGEMENTS,
  TIMELINES,
  type ConsoleTab,
  type EngagementId,
} from "@/lib/stations";
import { CONTACT_EMAIL, mailtoHref } from "@/lib/contact";
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
      <span className="text-small font-medium text-white">{children}</span>
      {hint && <span className="text-meta text-zinc">{hint}</span>}
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
      <span className="mb-1.5 block text-meta text-zinc">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field w-full appearance-none rounded-lg px-3 py-2.5 text-small"
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
  | { kind: "sent"; subject: string; body: string };

export function TransmissionConsole({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const { t } = useTranslation(["console", "common"]);
  const [tab, setTab] = useState<ConsoleTab>("business");
  const [engagement, setEngagement] = useState<EngagementId>("website");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<string>(STAGES[0]);
  const [budget, setBudget] = useState<string>(BUDGETS[0]);
  const [timeline, setTimeline] = useState<string>(TIMELINES[0]);
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

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

    // There is no backend: the message is composed here and opened in the
    // visitor's own mail app. The receipt says plainly that it is not sent yet.
    const subject = `MIW — ${t(`engagements.${engagement}.label`)} — ${org.trim()}`;
    const body = [
      `${t("form.name")}: ${name.trim()}`,
      `${t("form.company")}: ${org.trim()}`,
      `${t("form.email")}: ${email.trim()}`,
      `${t("form.engagement")}: ${t(`engagements.${engagement}.label`)}`,
      `${t("form.stage")}: ${t(`stages.${stage}`)}`,
      `${t("form.budget")}: ${t(`budgets.${budget}`)}`,
      `${t("form.timeline")}: ${t(`timelines.${timeline}`)}`,
      "",
      scope.trim(),
    ].join("\n");

    firePulse();
    setCopied(false);
    setStatus({ kind: "sent", subject, body });
    window.location.href = mailtoHref(subject, body);
  }

  async function copyMessage(text: string) {
    try {
      await navigator.clipboard.writeText(`${CONTACT_EMAIL}\n\n${text}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
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
          {/* Two audiences, one console. The tab is chosen before any field
              is asked for, so a shop owner is never asked about a seed round. */}
          <div
            role="tablist"
            aria-label={t("tablist")}
            className="flex flex-wrap gap-2"
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
                    "rounded-full border px-4 py-2 text-small font-medium whitespace-nowrap transition-all duration-200",
                    active
                      ? "border-comet/70 bg-comet/15 font-semibold text-white"
                      : "border-white/25 text-platinum hover:border-white/60 hover:bg-white/8 hover:text-white",
                  )}
                >
                  {t(`tabs.${c.id}.label`)}
                </button>
              );
            })}
          </div>
          <p
            aria-live="polite"
            className="mt-2.5 text-small text-zinc deck-short:mt-2"
          >
            {t(`tabs.${tab}.note`)}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {status.kind === "sent" ? (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="py-8 text-center"
              >
                <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-signal/50 bg-signal/12">
                  <Tick className="text-title text-signal" />
                </div>
                <h3 className="mt-5 text-3xl font-bold tracking-[-0.035em] text-white md:text-4xl">
                  {t("receipt.title")}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-lead leading-relaxed text-platinum">
                  {t("receipt.body", { email: CONTACT_EMAIL })}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={mailtoHref(status.subject, status.body)}
                    className="rounded-full bg-action px-5 py-2.5 text-small font-semibold text-on-action transition-colors hover:bg-action-hover"
                  >
                    {t("receipt.reopen")}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyMessage(status.body)}
                    className="rounded-full border border-white/25 px-5 py-2.5 text-small font-medium text-white transition-colors hover:border-white/60"
                  >
                    {copied ? t("receipt.copied") : t("receipt.copy")}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStatus({ kind: "idle" })}
                  className="mt-5 text-small text-zinc underline-offset-4 transition-colors hover:text-white hover:underline"
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
                    <h2 className="text-heading-lg leading-[1.08] font-bold tracking-[-0.035em] text-white deck-short:text-heading md:text-heading-xl">
                      {t(`tabs.${tab}.heading`)}
                    </h2>

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
                              "rounded-md border px-3 py-1.5 text-small transition-all duration-200",
                              active
                                ? "border-comet/70 bg-comet/15 font-semibold text-white"
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
                        className="field w-full rounded-lg px-4 py-3 text-body"
                      />
                      <input
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        placeholder={t("form.company")}
                        aria-label={t("form.company")}
                        autoComplete="organization"
                        required
                        className="field w-full rounded-lg px-4 py-3 text-body"
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
                      className="field mt-3 w-full rounded-lg px-4 py-3 text-body"
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
                      className="field thin-scroll w-full resize-none rounded-lg px-4 py-3 text-body leading-relaxed deck-short:h-[68px] deck-short:py-2"
                    />
                  </div>

                  <div className="space-y-3 border-t border-white/15 pt-4 deck-short:space-y-2 deck-short:pt-3">
                    <p
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "text-small leading-relaxed",
                        status.kind === "error" ? "text-amber-300" : "text-zinc",
                      )}
                    >
                      {status.kind === "error"
                        ? status.message
                        : t("form.idle", { email: CONTACT_EMAIL })}
                    </p>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-action px-6 py-3 font-semibold text-on-action transition-colors hover:bg-action-hover"
                    >
                      {t("form.submit")}
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
