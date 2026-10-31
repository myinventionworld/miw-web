"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { mailtoHref } from "./contact";
import { cn } from "@/shared/lib/cn";
import { SignalStrip } from "./signal-strip";
import { Honeypot, useEnquiry } from "./use-enquiry";
import { BUDGETS } from "./options";

const FIELD =
  "w-full rounded-lg border border-line bg-void px-4 py-3 text-body text-white placeholder:text-steel transition-colors focus:border-comet focus:outline-none";

/**
 * The contact form on the phone page: the questions that decide whether we
 * can help (who, how to reply, what, roughly how much), on white like the rest
 * of that page. Same server action and the same checks as the 3D console; the
 * tab, stage and timeline stay on the deck, where there is room for them.
 */
export function EnquiryForm() {
  const { t } = useTranslation(["console", "common"]);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState<string>(BUDGETS[0]);
  const [scope, setScope] = useState("");
  const { status, setStatus, submit, touch, website, setWebsite, humanCheck } = useEnquiry({
    theme: "light",
  });
  const sending = status.kind === "sending";
  const failed = status.kind === "failed";
  const [inside, setInside] = useState(false);

  if (status.kind === "delivered") {
    return (
      <div className="mt-8 text-left" role="status">
        <SignalStrip state="sent" />
        <h3 className="mt-4 text-title font-bold tracking-[-0.02em] text-white">
          {t("receipt.sentTitle")}
        </h3>
        <p className="mt-2 text-body leading-relaxed text-zinc">
          {t("receipt.sentBody", {
            reply: t("common:contact.replyTime"),
            email: status.email,
          })}
        </p>
        <button
          type="button"
          onClick={() => {
            setScope("");
            setInside(false);
            setStatus({ kind: "idle" });
          }}
          className="mt-5 block text-small text-comet hover:underline"
        >
          {t("receipt.another")}
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-busy={sending}
      onFocusCapture={() => {
        touch();
        setInside(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInside(false);
      }}
      onChangeCapture={touch}
      onSubmit={(e) => {
        e.preventDefault();
        submit({ name, org, email, scope, budget });
      }}
      className="relative mt-8 space-y-3 text-left"
    >
      <SignalStrip state={sending ? "sending" : inside ? "still" : "idle"} className="mb-4" />
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
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("form.email")}
        aria-label={t("form.email")}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        className={FIELD}
      />
      <label className="block">
        <span className="mb-1.5 block text-meta text-zinc">{t("form.budget")}</span>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className={cn(FIELD, "appearance-none")}
        >
          {BUDGETS.map((id) => (
            <option key={id} value={id}>
              {t(`budgets.${id}`)}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        rows={4}
        placeholder={t("form.scope")}
        aria-label={t("form.scope")}
        required
        className={cn(FIELD, "resize-none leading-relaxed")}
      />
      <Honeypot value={website} onChange={setWebsite} />
      <div ref={humanCheck} />

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "pt-1 text-small leading-relaxed",
          status.kind === "error" || failed ? "text-amber-700" : "text-zinc",
        )}
      >
        {status.kind === "error" || status.kind === "failed" ? status.message : t("form.idle")}
      </p>
      {status.kind === "failed" && (
        <a
          href={mailtoHref(status.subject, status.body)}
          className="inline-flex rounded-full border border-white/25 px-4 py-2 text-small font-medium text-white transition-colors hover:border-white/80 hover:bg-white/10"
        >
          {t("form.openMail")}
        </a>
      )}

      <button
        type="submit"
        disabled={sending}
        className="flex w-full items-center justify-center rounded-full bg-action px-6 py-3.5 text-lead font-medium text-on-action transition-colors hover:bg-action-hover disabled:opacity-70"
      >
        {sending ? t("form.sending") : failed ? t("form.retry") : t("form.send")}
      </button>
      <p className="text-meta text-zinc">{t("form.privacy")}</p>
    </form>
  );
}
