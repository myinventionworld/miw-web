"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, type MotionValue } from "motion/react";

import { firePulse } from "./flight";
import { CONTACT_EMAIL, mailtoHref } from "@/modules/contact";
import { cn } from "@/shared/lib/cn";
import { SiteFooter } from "@/modules/layout";
import {
  SignalStrip,
  Honeypot,
  useEnquiry,
  BUDGETS,
  CONSOLE_TABS,
  ENGAGEMENTS,
  STAGES,
  TAB_ENGAGEMENTS,
  TAB_STAGES,
  TIMELINES,
  type ConsoleTab,
  type EngagementId,
} from "@/modules/contact";
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

const EASE = [0.22, 1, 0.36, 1] as const;

/** Mono, like the readouts elsewhere on the deck: a label, not a heading. */
const LEGEND = "mb-2 block font-mono text-label text-zinc";

const FIELD = "field w-full rounded-lg px-3.5 py-2.5 text-body";

function Label({ children }: { children: ReactNode }) {
  return <span className={LEGEND}>{children}</span>;
}

/**
 * One question with its answers side by side in a single ruled bar. These were
 * three native selects in a row, which hid every answer but one behind a click
 * and drew three identical grey plates.
 *
 * The rules between the cells are the bar's own background showing through a
 * 1px gap, so when a longer language wraps a row the rule follows the wrap
 * instead of leaving a cell floating. Cells grow to fill their row, so a
 * wrapped row is still a full-width bar.
 *
 * The option's value is its id, not the words on it. A submitted `budget` of
 * "$10k – $25k" and one of "10–25 tis. $" are the same answer, and a desk that
 * has to normalise them by hand is a desk that will get it wrong once.
 */
function Segmented({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { id: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className={LEGEND}>{legend}</legend>
      <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-white/12 bg-white/12">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={cn(
                "flex-auto px-3 py-2.5 text-small font-medium whitespace-nowrap transition-colors duration-150 deck-short:py-2",
                // Selected is the tab's own mark: a comet rule along the
                // bottom, on a cell lifted just enough to read without it.
                active
                  ? "bg-space-800 text-white shadow-[inset_0_-2px_0_var(--color-comet)]"
                  : "bg-carbon text-zinc hover:bg-space-800/60 hover:text-white",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TransmissionConsole({
  progress,
  direct,
}: {
  progress: MotionValue<number>;
  /** The server can send the message itself (see `modules/contact/delivery.ts`). */
  direct: boolean;
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
  const [copied, setCopied] = useState(false);
  const { status, setStatus, submit, touch, website, setWebsite } = useEnquiry(
    direct,
    () => {
      firePulse();
      setCopied(false);
    },
  );
  const sending = status.kind === "sending";

  /**
   * Only the engagements that belong to this tab. Switching tabs re-points the
   * selection at the first of them rather than leaving `Architecture rescue`
   * selected under `--client-engineering` — a mismatch nobody would notice until
   * the transmission arrived contradicting itself.
   */
  const offered = ENGAGEMENTS.filter((e) => TAB_ENGAGEMENTS[tab].includes(e));
  const stages = TAB_STAGES[tab];

  function pickTab(next: ConsoleTab) {
    setTab(next);
    setStatus({ kind: "idle" });
    const first = TAB_ENGAGEMENTS[next][0];
    if (first) setEngagement(first);
    // Same rule for the stage, and on the business tab it is the only answer,
    // so it is set here rather than asked.
    setStage(TAB_STAGES[next][0]);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Checked again on the server; here so the message lands next to the
    // button instead of after a round trip.
    submit({ name, org, email, scope, budget, tab, engagement, stage, timeline });
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
          and a short landscape window is exactly where the panel grows into it.

          A column, so the site footer can take the last row under the panel:
          the end of the runway is the deck's last screen, and anything placed
          after the runway would scroll in underneath this fixed stage. The
          panel's `my-auto` keeps it centred in what the footer leaves, and as
          a scroll container it is the one that gives way when the two do not
          fit — the footer keeps its line. */}
      <div className="flex h-full flex-col px-5 pt-[104px] md:px-10">
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
        <div className="panel-solid thin-scroll pointer-events-auto mx-auto my-auto max-h-full w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl p-5 shadow-2xl deck-short:p-4 md:p-7 md:deck-short:p-5">
          {/* Two audiences, one console. The tab is chosen before any field
              is asked for, so a shop owner is never asked about a seed round. */}
          <div
            role="tablist"
            aria-label={t("tablist")}
            className="flex flex-wrap gap-x-6 border-b border-white/10"
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
                    "relative pb-3 text-small font-medium whitespace-nowrap transition-colors duration-200 deck-short:pb-2.5",
                    active ? "text-white" : "text-zinc hover:text-white",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="console-tab"
                      transition={{ duration: 0.35, ease: EASE }}
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-comet"
                    />
                  )}
                  {t(`tabs.${c.id}.label`)}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {status.kind === "delivered" ? (
              <motion.div
                key="delivered"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="py-10 text-center"
              >
                <SignalStrip state="sent" className="mx-auto h-14 max-w-md" />
                <h3 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-white md:text-4xl">
                  {t("receipt.sentTitle")}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-lead leading-relaxed text-platinum">
                  {t("receipt.sentBody", {
                    reply: t("common:contact.replyTime"),
                    email: status.email,
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setScope("");
                    setStatus({ kind: "idle" });
                  }}
                  className="mt-6 text-small text-zinc underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {t("receipt.another")}
                </button>
              </motion.div>
            ) : status.kind === "mailto" ? (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="py-10 text-center"
              >
                <SignalStrip state="sent" className="mx-auto h-14 max-w-md" />
                <h3 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-white md:text-4xl">
                  {t("receipt.title")}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-lead leading-relaxed text-platinum">
                  {t("receipt.body", { email: CONTACT_EMAIL })}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={mailtoHref(status.subject, status.body)}
                    className="rounded-full bg-white px-6 py-2.5 text-small font-semibold text-void transition-colors hover:bg-platinum"
                  >
                    {t("receipt.reopen")}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyMessage(status.body)}
                    className="rounded-full border border-white/20 px-6 py-2.5 text-small font-medium text-white transition-colors hover:border-white/50 hover:bg-white/[0.06]"
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
                onSubmit={onSubmit}
                onFocusCapture={touch}
                onChangeCapture={touch}
                aria-busy={sending}
                // Native bubbles would pre-empt the status line and land a
                // system-styled popover in the middle of the console.
                noValidate
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="pt-6 deck-short:pt-4 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-x-10"
              >
                {/* Two columns on desktop: what the work is on the left, who is
                    asking and the task itself on the right. The flight deck is a
                    fixed viewport, so whichever column is taller decides whether
                    the send row is reachable; the task field takes up whatever
                    the right column has spare, so the two end level. */}
                <div className="space-y-5 deck-short:space-y-3">
                  <div>
                    <h2 className="text-heading-lg leading-[1.08] font-bold tracking-[-0.035em] text-white deck-short:text-heading md:text-heading-xl">
                      {t(`tabs.${tab}.heading`)}
                    </h2>
                    <p
                      aria-live="polite"
                      className="mt-2 text-body leading-relaxed text-zinc deck-short:hidden"
                    >
                      {t(`tabs.${tab}.note`)}
                    </p>
                  </div>

                  <Segmented
                    legend={t("form.engagement")}
                    value={engagement}
                    onChange={(v) => setEngagement(v as EngagementId)}
                    options={offered.map((id) => ({
                      id,
                      label: t(`engagements.${id}.label`),
                    }))}
                  />
                  <Segmented
                    legend={t("form.budget")}
                    value={budget}
                    onChange={setBudget}
                    options={BUDGETS.map((id) => ({
                      id,
                      label: t(`budgets.${id}`),
                    }))}
                  />
                  <Segmented
                    legend={t("form.timeline")}
                    value={timeline}
                    onChange={setTimeline}
                    options={TIMELINES.map((id) => ({
                      id,
                      label: t(`timelines.${id}`),
                    }))}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-5 deck-short:mt-3 deck-short:gap-3 lg:mt-0">
                  <div>
                    <Label>{t("form.identity")}</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("form.name")}
                        aria-label={t("form.name")}
                        autoComplete="name"
                        required
                        className={FIELD}
                      />
                      <input
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        placeholder={t("form.company")}
                        aria-label={t("form.company")}
                        autoComplete="organization"
                        required
                        className={FIELD}
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
                      className={cn(FIELD, "mt-2")}
                    />
                  </div>

                  {/* Next to the details rather than with the work: it is about
                      who is asking. Only the startup tab has a choice to make. */}
                  {stages.length > 1 && (
                    <Segmented
                      legend={t("form.stage")}
                      value={stage}
                      onChange={setStage}
                      options={stages.map((id) => ({
                        id,
                        label: t(`stages.${id}`),
                      }))}
                    />
                  )}

                  <div className="flex flex-1 flex-col">
                    {/* The prompt follows the engagement — a rescue and a
                        greenfield MVP are not the same question. */}
                    <Label>{t("form.scope")}</Label>
                    <textarea
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      rows={4}
                      placeholder={t(`engagements.${engagement}.prompt`)}
                      aria-label={t("form.scope")}
                      required
                      // The height here is a floor, not the size: the field
                      // grows to end level with the left column. It has to be
                      // set, because left to `rows` the field's own height is
                      // what the grid row measures, and on a short deck that
                      // alone pushed the send row out of reach.
                      className={cn(
                        FIELD,
                        "thin-scroll h-24 flex-auto resize-none leading-relaxed deck-short:h-[68px] deck-short:py-2",
                      )}
                    />
                  </div>
                </div>

                {/* The send row runs under both columns: the fine print on the
                    left where it is read, the button on the right where the eye
                    ends. It used to be a full-width grey bar under a paragraph,
                    which read as the end of a document rather than an action. */}
                <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 deck-short:mt-4 deck-short:gap-3 deck-short:pt-3 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                  <Honeypot value={website} onChange={setWebsite} />
                  <div className="min-w-0 space-y-1">
                    <p
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "text-meta leading-relaxed",
                        status.kind === "error" || status.kind === "failed"
                          ? "text-amber-300"
                          : "text-zinc",
                      )}
                    >
                      {status.kind === "error"
                        ? status.message
                        : status.kind === "failed"
                          ? t("form.errSend", { email: CONTACT_EMAIL })
                          : direct
                            ? t("form.idleDirect")
                            : t("form.idle", { email: CONTACT_EMAIL })}
                    </p>
                    <p className="text-meta text-steel">{t("form.privacy")}</p>
                    {status.kind === "failed" && (
                      <a
                        href={mailtoHref(status.subject, status.body)}
                        className="mt-2 inline-flex rounded-full border border-white/20 px-4 py-2 text-small font-medium text-white transition-colors hover:border-white/50 hover:bg-white/[0.06]"
                      >
                        {t("form.openMail")}
                      </a>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex w-full shrink-0 items-center justify-center rounded-full bg-white px-7 py-3 text-body font-semibold text-void transition-colors hover:bg-platinum disabled:opacity-70 sm:w-auto"
                  >
                    {sending
                      ? t("form.sending")
                      : direct
                        ? t("form.send")
                        : t("form.submit")}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* No motion of its own: it arrives with the console and holds with
            it. `contentinfo` because a footer inside a section is not one by
            default, and this is the only footer the deck has. */}
        <SiteFooter
          role="contentinfo"
          className="pointer-events-auto mx-auto w-full max-w-5xl shrink-0"
          frame="text-lift py-3 deck-short:py-2"
        />
      </div>
    </Stage>
  );
}
