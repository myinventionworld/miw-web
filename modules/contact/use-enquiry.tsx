"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { sendEnquiry } from "./actions";
import { mailtoHref } from "./contact";
import {
  checkEnquiry,
  composeEnquiry,
  type EnquiryField,
  type EnquiryInput,
} from "./enquiry";

export type EnquiryStatus =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "sending" }
  /** The server has it and a person on the team will see it. */
  | { kind: "delivered"; email: string }
  /** Handed to the visitor's mail app: nothing is sent until they press Send. */
  | { kind: "mailto"; subject: string; body: string }
  /** The server could not send it. The mail app is the way out. */
  | { kind: "failed"; subject: string; body: string };

const MESSAGE: Record<EnquiryField, string> = {
  name: "form.errName",
  org: "form.errOrg",
  email: "form.errEmail",
  scope: "form.errScope",
  choice: "form.errScope",
};

type Fields = Omit<EnquiryInput, "locale" | "website" | "elapsed">;

/**
 * The contact form's state, shared by the 3D console and the phone page.
 *
 * `direct` says whether the server can send (it has a Resend key or a
 * Telegram bot); the page reads that at build time. Without it the form does
 * what it always did and opens the visitor's mail app with the message ready.
 * With it the message goes through the server action, and if that fails the
 * mail app is offered as the fallback, with the address in plain sight.
 */
export function useEnquiry(direct: boolean, onSent?: () => void) {
  const { t, i18n } = useTranslation(["console", "common"]);
  const [status, setStatus] = useState<EnquiryStatus>({ kind: "idle" });
  const [website, setWebsite] = useState("");
  /** First touch of any field: the clock for the minimum fill time. */
  const started = useRef<number | null>(null);

  const touch = () => {
    if (started.current === null) started.current = Date.now();
  };

  async function submit(fields: Fields) {
    if (status.kind === "sending") return;
    const input: EnquiryInput = { ...fields, locale: i18n.language };
    const checked = checkEnquiry(input);
    if (!checked.ok) {
      setStatus({ kind: "error", message: t(MESSAGE[checked.field]) });
      return;
    }
    const { subject, body } = composeEnquiry(checked.value, (key) => t(key));

    const handOff = () => {
      onSent?.();
      setStatus({ kind: "mailto", subject, body });
      window.location.href = mailtoHref(subject, body);
    };
    if (!direct) {
      handOff();
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const res = await sendEnquiry({
        ...input,
        website,
        elapsed: started.current === null ? 0 : Date.now() - started.current,
      });
      if (res.status === "sent") {
        onSent?.();
        setStatus({ kind: "delivered", email: checked.value.email });
      } else if (res.status === "unconfigured") handOff();
      else if (res.status === "invalid")
        setStatus({ kind: "error", message: t(MESSAGE[res.field]) });
      else if (res.status === "too-fast")
        setStatus({ kind: "error", message: t("form.errFast") });
      else setStatus({ kind: "failed", subject, body });
    } catch {
      // Offline, or a tab left open across a deploy whose action id is gone.
      setStatus({ kind: "failed", subject, body });
    }
  }

  return { status, setStatus, submit, touch, website, setWebsite };
}

/**
 * The honeypot: a field people never see or reach with Tab, which form-filling
 * bots tend to fill in anyway. Off screen rather than `display: none`, which
 * the better bots skip.
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label>
        Website
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
