"use client";

import { useCallback, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const WAIT_MS = 10_000;
/** The flexible widget's minimum width; a phone's form column can be narrower. */
const FLEXIBLE_MIN = 300;

interface Turnstile {
  render(el: HTMLElement, options: Record<string, unknown>): string | undefined;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let script: Promise<Turnstile> | undefined;

function load(): Promise<Turnstile> {
  script ??= new Promise<Turnstile>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = SCRIPT;
    el.async = true;
    el.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    el.onerror = () => {
      script = undefined;
      el.remove();
      reject(new Error("turnstile"));
    };
    document.head.append(el);
  });
  return script;
}

/**
 * Cloudflare Turnstile for the contact form, off unless
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. The script loads on the first touch
 * of the form, not with the page. The widget shows itself only when Cloudflare
 * wants the visitor to click; otherwise `take()` hands over a token it got
 * quietly while they typed. `take()` gives `undefined` when Turnstile is off
 * and `null` when there is no token to send.
 */
export function useTurnstile({ theme, language }: { theme: "light" | "dark"; language: string }) {
  const el = useRef<HTMLDivElement | null>(null);
  const widget = useRef<string | undefined>(undefined);
  const wanted = useRef(false);
  const token = useRef<string | null>(null);
  const interactive = useRef(false);
  const waiting = useRef<((t: string | null) => void)[]>([]);
  const options = useRef({ theme, language });

  const render = useCallback(() => {
    load().then(
      (api) => {
        if (!el.current || widget.current !== undefined) return;
        widget.current = api.render(el.current, {
          sitekey: SITE_KEY,
          action: "enquiry",
          appearance: "interaction-only",
          size: el.current.clientWidth < FLEXIBLE_MIN ? "compact" : "flexible",
          ...options.current,
          callback: (t: string) => {
            token.current = t;
            for (const resolve of waiting.current.splice(0)) resolve(t);
          },
          "before-interactive-callback": () => {
            interactive.current = true;
          },
          "after-interactive-callback": () => {
            interactive.current = false;
          },
          "expired-callback": () => {
            token.current = null;
          },
          "error-callback": () => {
            token.current = null;
          },
        });
      },
      () => {
        wanted.current = false;
      },
    );
  }, []);

  const prepare = useCallback(() => {
    if (!SITE_KEY || wanted.current) return;
    wanted.current = true;
    render();
  }, [render]);

  const box = useCallback(
    (node: HTMLDivElement) => {
      el.current = node;
      if (wanted.current) render();
      return () => {
        if (widget.current !== undefined) window.turnstile?.remove(widget.current);
        el.current = null;
        widget.current = undefined;
        token.current = null;
        interactive.current = false;
      };
    },
    [render],
  );

  const take = useCallback(async (): Promise<string | null | undefined> => {
    if (!SITE_KEY) return undefined;
    prepare();
    if (token.current === null && interactive.current) return null;
    const t =
      token.current ??
      (await new Promise<string | null>((resolve) => {
        waiting.current.push(resolve);
        window.setTimeout(() => resolve(null), WAIT_MS);
      }));
    if (t === null) return null;
    // A token is good for one check, so the next attempt needs a fresh one.
    token.current = null;
    if (widget.current !== undefined) window.turnstile?.reset(widget.current);
    return t;
  }, [prepare]);

  return { box, prepare, take };
}
