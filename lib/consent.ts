import { useSyncExternalStore } from "react";

export type Consent = "accepted" | "declined";

const KEY = "miw-consent";
const LOCALE_COOKIE = "NEXT_LOCALE";
const listeners = new Set<() => void>();

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribe, readConsent, () => undefined);
}

export function setConsent(consent: Consent, locale: string) {
  try {
    localStorage.setItem(KEY, consent);
  } catch {}
  if (consent === "accepted") rememberLocale(locale);
  else document.cookie = `${LOCALE_COOKIE}=;path=/;max-age=0`;
  listeners.forEach((l) => l());
}

export function rememberLocale(locale: string) {
  if (readConsent() !== "accepted") return;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}
