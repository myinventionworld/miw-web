import { createHash } from "node:crypto";

import { CONTACT_EMAIL } from "./contact";

/**
 * Where an enquiry goes once the server has accepted it. Server code only: it
 * reads secrets from the environment. The variables are listed in
 * `.env.example`.
 *
 * `RESEND_API_URL` and `TELEGRAM_API_URL` exist so a test can point both at a
 * local mock; leave them unset in Vercel.
 */

export interface Message {
  subject: string;
  body: string;
}

const TIMEOUT = 10_000;

const telegram = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

export function canDeliver(): boolean {
  return Boolean(process.env.RESEND_API_KEY) || telegram();
}

/**
 * Resend's shared sender writes only to the account owner, so the visitor's
 * copy needs `CONTACT_FROM` on a domain verified in Resend.
 */
export function canConfirm(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM);
}

const team = () =>
  (process.env.CONTACT_TO || CONTACT_EMAIL)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

async function post(url: string, init: { headers?: Record<string, string>; body: unknown }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(init.body),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) {
    // The status and the provider's own error name are enough to debug from
    // the Vercel logs; the visitor's message stays out of them.
    const detail = await res.text().catch(() => "");
    throw new Error(`${new URL(url).hostname} ${res.status} ${detail.slice(0, 200)}`);
  }
}

function email(
  m: Message & { to: string[]; replyTo: string[]; headers?: Record<string, string> },
  idempotencyKey?: string,
) {
  const base = process.env.RESEND_API_URL || "https://api.resend.com";
  return post(`${base}/emails`, {
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
    },
    body: {
      from: process.env.CONTACT_FROM || "MIW Labs <onboarding@resend.dev>",
      to: m.to,
      reply_to: m.replyTo,
      subject: m.subject,
      text: m.body,
      headers: m.headers,
    },
  });
}

function viaTelegram(m: Message) {
  const base = process.env.TELEGRAM_API_URL || "https://api.telegram.org";
  return post(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    // Plain text: the visitor's words go through as written, with nothing a
    // stray `*` or `<` could turn into broken markup.
    body: {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: `${m.subject}\n\n${m.body}`,
      disable_web_page_preview: true,
    },
  });
}

/**
 * Sends to the team on every configured channel at once. The enquiry counts
 * as delivered if any of them took it: an email that bounced but a Telegram
 * message that arrived still means a person on the team has it.
 */
export async function deliver(m: Message & { replyTo: string }): Promise<boolean> {
  const sends: Promise<void>[] = [];
  if (process.env.RESEND_API_KEY) {
    // Derived from the content, not random: Resend sends one email per key a
    // day, so a retry after a timeout that did reach it is not a second email.
    const key = createHash("sha256").update(`${m.replyTo}\n${m.subject}\n${m.body}`).digest("hex");
    sends.push(email({ ...m, to: team(), replyTo: [m.replyTo] }, `enquiry/${key}`));
  }
  if (telegram()) sends.push(viaTelegram(m));

  const results = await Promise.allSettled(sends);
  for (const r of results) {
    if (r.status === "rejected") console.error("[contact] delivery failed:", String(r.reason));
  }
  return results.some((r) => r.status === "fulfilled");
}

/** The visitor's confirmation. Replies to it reach the team. */
export async function confirm(to: string, m: Message): Promise<void> {
  try {
    await email({
      ...m,
      to: [to],
      replyTo: team(),
      // RFC 3834: out-of-office responders do not answer an automatic message.
      headers: { "Auto-Submitted": "auto-replied" },
    });
  } catch (e) {
    console.error("[contact] confirmation failed:", String(e));
  }
}
