"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { sendEnquiry, type EnquiryResult } from "./actions";
import { CONTACT_EMAIL } from "./contact";
import {
  checkEnquiry,
  composeEnquiry,
  type EnquiryField,
  type EnquiryInput,
} from "./enquiry";
import { useTurnstile } from "./turnstile";

export type EnquiryStatus =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "sending" }
  /** The server has it and a person on the team will see it. */
  | { kind: "delivered"; email: string }
  /** It did not reach the team. Send retries; the mail app is the way out. */
  | { kind: "failed"; message: string; subject: string; body: string };

const MESSAGE: Record<EnquiryField, string> = {
  name: "form.errName",
  org: "form.errOrg",
  email: "form.errEmail",
  scope: "form.errScope",
  choice: "form.errScope",
};

const FAILURE: Record<Extract<EnquiryResult["status"], "failed" | "limited" | "unverified">, string> = {
  failed: "form.errSend",
  limited: "form.errLimited",
  unverified: "form.errHuman",
};

type Fields = Omit<EnquiryInput, "locale" | "website" | "elapsed" | "token">;

/**
 * The contact form's state, shared by the 3D console and the phone page. The
 * message goes through the server action; if it does not get through, the
 * form says why and offers the visitor's mail app with the message ready.
 * `humanCheck` is the ref for the Turnstile box, which stays empty unless
 * Cloudflare asks for a click.
 */
export function useEnquiry({ theme, onSent }: { theme: "light" | "dark"; onSent?: () => void }) {
  const { t, i18n } = useTranslation(["console", "common"]);
  const [status, setStatus] = useState<EnquiryStatus>({ kind: "idle" });
  const [website, setWebsite] = useState("");
  /** First touch of any field: the clock for the minimum fill time. */
  const started = useRef<number | null>(null);
  const human = useTurnstile({ theme, language: i18n.language });

  const touch = () => {
    if (started.current === null) started.current = Date.now();
    human.prepare();
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
    const fail = (key: string) =>
      setStatus({ kind: "failed", message: t(key, { email: CONTACT_EMAIL }), subject, body });

    setStatus({ kind: "sending" });
    const token = await human.take();
    if (token === null) {
      fail(FAILURE.unverified);
      return;
    }
    try {
      const res = await sendEnquiry({
        ...input,
        website,
        elapsed: started.current === null ? 0 : Date.now() - started.current,
        token,
      });
      if (res.status === "sent") {
        onSent?.();
        setStatus({ kind: "delivered", email: checked.value.email });
      } else if (res.status === "invalid") {
        setStatus({ kind: "error", message: t(MESSAGE[res.field]) });
      } else if (res.status === "too-fast") {
        setStatus({ kind: "error", message: t("form.errFast") });
      } else {
        fail(FAILURE[res.status]);
      }
    } catch {
      // Offline, or a tab left open across a deploy whose action id is gone.
      fail("form.errSend");
    }
  }

  return { status, setStatus, submit, touch, website, setWebsite, humanCheck: human.box };
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
