"use client";

import { localeHref } from "@/modules/i18n";
import { AsciiCover } from "@/modules/team";
import { CoverHero } from "./cover-hero";

export interface ErrorScreenText {
  label: string;
  title: string;
  body: string;
  retry: string;
  back: string;
  homeAria: string;
}

export function ErrorScreen({
  locale,
  text,
  retry,
}: {
  locale: string;
  text: ErrorScreenText;
  retry: () => void;
}) {
  const home = localeHref(locale, "/");

  return (
    <div className="theme-light min-h-screen bg-void">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6 md:px-8">
          <a href={home} className="-my-2 flex items-center gap-2.5 py-2" aria-label={text.homeAria}>
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-white/35" />
              <span className="absolute size-1 rounded-full bg-white" />
            </span>
            <span className="text-body font-semibold tracking-[0.2em] text-white sm:tracking-[0.36em]">MIW</span>
          </a>
        </div>
      </header>
      <main>
        <CoverHero picture={<AsciiCover signal="lost" />}>
          <p className="text-small font-medium text-zinc">{text.label}</p>
          <h1 className="mt-5 text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.02] font-bold tracking-[-0.05em] text-white">
            {text.title}
          </h1>
          <p className="mt-6 max-w-xl text-copy-lg leading-relaxed text-zinc md:text-[1.1875rem]">{text.body}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <button
              type="button"
              onClick={retry}
              className="rounded-full bg-action px-6 py-3 text-lead font-medium text-on-action transition-colors hover:bg-action-hover"
            >
              {text.retry}
            </button>
            <a href={home} className="text-lead font-medium text-comet hover:underline">
              {text.back} ›
            </a>
          </div>
        </CoverHero>
      </main>
    </div>
  );
}
