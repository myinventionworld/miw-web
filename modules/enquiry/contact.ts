/**
 * Where enquiries go. One address, read by a person.
 *
 * The contact form sends through the server (`actions.ts`, by
 * email via Resend and/or to Telegram) when those are configured, and
 * otherwise composes an email and hands it to the visitor's mail app
 * (`mailto:`). The address is also the fallback the form shows when sending
 * fails.
 */
export const CONTACT_EMAIL = "mykhailoplokhin@gmail.com";

export function mailtoHref(subject: string, body: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
