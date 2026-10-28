/**
 * Where enquiries go. One address, read by a person.
 *
 * The site has no backend, so the contact form composes an email and hands it
 * to the visitor's mail app (`mailto:`). Nothing is sent until they press Send
 * there, and the form says so. Wiring a real endpoint (a route handler with
 * Resend or a form service) is a change to `submit()` in
 * `components/overlay/transmission-console.tsx` and nothing else.
 */
export const CONTACT_EMAIL = "mykhailoplokhin@gmail.com";

export function mailtoHref(subject: string, body: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
