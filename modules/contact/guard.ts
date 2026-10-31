import { headers } from "next/headers";

const WINDOW_MS = 10 * 60_000;
const seen = new Map<string, number[]>();

/**
 * At most `limit` calls per key in ten minutes. The count lives in this server
 * instance's memory, so it caps a burst against one instance; it is not a
 * quota shared across all of them.
 */
export function allow(key: string, limit: number): boolean {
  const now = Date.now();
  if (seen.size > 5_000) {
    for (const [k, times] of seen) if (now - times[times.length - 1] >= WINDOW_MS) seen.delete(k);
  }
  const recent = (seen.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  const allowed = recent.length < limit;
  if (allowed) recent.push(now);
  seen.set(key, recent);
  return allowed;
}

export async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
}

/**
 * Cloudflare Turnstile's verdict on the token the form sent. Without
 * `TURNSTILE_SECRET_KEY` the check is off; with it, no token or no answer from
 * Cloudflare is a no, and the form offers the mail app instead.
 */
export async function isHuman(token: unknown, ip: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || token === "" || token.length > 2048) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    const out = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (out.success !== true) {
      console.warn("[contact] turnstile refused:", out["error-codes"]?.join(", ") || res.status);
    }
    return out.success === true;
  } catch (e) {
    console.error("[contact] turnstile did not answer:", String(e));
    return false;
  }
}
