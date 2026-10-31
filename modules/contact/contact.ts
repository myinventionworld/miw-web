/**
 * Where enquiries go. One address, read by a person.
 *
 * The contact form sends through the server (`actions.ts`). The address is
 * what the form offers, as a `mailto:` with the message ready, when that
 * fails.
 */
export const CONTACT_EMAIL = "mykhailoplokhin@gmail.com";

export function mailtoHref(subject: string, body: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
