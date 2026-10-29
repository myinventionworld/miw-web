import type { NextRequest } from "next/server";
import { i18nRouter } from "next-i18n-router";

import i18nConfig from "./i18nConfig";

/**
 * Locale routing. `middleware` is deprecated in this version of Next, so the
 * i18nexus router runs here instead — the signature is the same, it takes a
 * request and hands back a response.
 *
 * A visitor landing on `/work` is matched against `Accept-Language` and sent to
 * `/en/work`, `/ru/work` or `/cs/work`; the choice is then remembered in the
 * `NEXT_LOCALE` cookie so a reader who switched by hand is not overruled by
 * their browser on the next page.
 */
export function proxy(request: NextRequest) {
  return i18nRouter(request, i18nConfig);
}

export const config = {
  // Static assets and the favicon have no locale, and sending `_next/static`
  // through a redirect is how a site ships a page with no CSS — or, for the
  // product recordings in `public/screens`, a video that never loads.
  matcher:
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.webp$|.*\\.mp4$|.*\\.webm$).*)",
};
