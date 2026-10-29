import { CONTACT_EMAIL } from "@/lib/contact";

/**
 * Where an enquiry goes once the server has accepted it. Server code only: it
 * reads secrets from the environment.
 *
 * Two channels, either or both:
 *
 * - Email through Resend's REST API: `RESEND_API_KEY`, sent to `CONTACT_TO`
 *   (default `CONTACT_EMAIL`) from `CONTACT_FROM` (default Resend's shared
 *   `onboarding@resend.dev`, which without a verified domain can only write to
 *   the account owner — exactly the one inbox this needs). Replies go to the
 *   visitor.
 * - Telegram: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
 *
 * With neither set the form keeps handing the message to the visitor's mail
 * app, so a deploy without these variables works as it did before.
 *
 * `RESEND_API_URL` and `TELEGRAM_API_URL` exist so a test can point both at a
 * local mock; leave them unset in Vercel.
 */

export function canDeliver(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  );
}

interface Message {
  subject: string;
  body: string;
  replyTo: string;
}

/** Ten seconds is generous for one API call; the visitor is watching a spinner. */
const TIMEOUT = 10_000;

async function post(url: string, init: { headers?: Record<string, string>; body: unknown }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(init.body),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) {
    // The status and Resend's own error name are enough to debug from the
    // Vercel logs; the visitor's message stays out of them.
    const detail = await res.text().catch(() => "");
    throw new Error(`${new URL(url).hostname} ${res.status} ${detail.slice(0, 200)}`);
  }
}

function viaResend(m: Message) {
  const base = process.env.RESEND_API_URL || "https://api.resend.com";
  return post(`${base}/emails`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: {
      from: process.env.CONTACT_FROM || "MIW Labs <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO || CONTACT_EMAIL],
      reply_to: m.replyTo,
      subject: m.subject,
      text: m.body,
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
 * Sends on every configured channel at once. The enquiry counts as delivered
 * if any of them took it: an email that bounced but a Telegram message that
 * arrived still means a person on the team has it.
 */
export async function deliver(m: Message): Promise<boolean> {
  const sends: Promise<void>[] = [];
  if (process.env.RESEND_API_KEY) sends.push(viaResend(m));
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) sends.push(viaTelegram(m));

  const results = await Promise.allSettled(sends);
  for (const r of results) {
    if (r.status === "rejected") console.error("[contact] delivery failed:", String(r.reason));
  }
  return results.some((r) => r.status === "fulfilled");
}
