"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CONTACT_EMAIL } from "@/modules/contact";
import { LocaleLink } from "@/modules/i18n";
import { PROJECTS } from "@/modules/work";
import { cn } from "@/shared/lib/cn";
import { LocaleSwitch } from "./locale-switch";

interface FooterLink {
  href: string;
  label: string;
}

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-small font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={`${l.href}${l.label}`}>
            <LocaleLink href={l.href} className="text-body text-zinc transition-colors hover:text-white">
              {l.label}
            </LocaleLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CopyEmail() {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("footer.copyEmail")}
        title={copied ? t("footer.copied") : t("footer.copyEmail")}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(CONTACT_EMAIL);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc transition-colors hover:bg-white/8 hover:text-white"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6}>
          {copied ? (
            <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="7" y="7" width="9.5" height="9.5" rx="2" />
              <path d="M13 4.5V4a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 4v6.5A1.5 1.5 0 0 0 5 12h.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? t("footer.copied") : ""}
      </span>
    </>
  );
}

export function BigFooter({ className }: { className?: string }) {
  const { t } = useTranslation(["common", "stations"]);
  const program = t("stations:commerce.program", { returnObjects: true }) as { label: string }[];

  const studio: FooterLink[] = [
    { href: "/about", label: t("nav.about") },
    { href: "/about#team", label: t("footer.team") },
    { href: "/work", label: t("nav.work") },
    { href: "/#transmission", label: t("nav.bookCall") },
  ];
  const services: FooterLink[] = [
    { href: "/#backend", label: t("stations:backend.nav") },
    ...program.map((p) => ({ href: "/#commerce", label: p.label })),
  ];
  const products: FooterLink[] = [
    ...PROJECTS.map((p) => ({ href: `/work/${p.slug}`, label: p.name })),
    { href: "/work", label: t("footer.allWork") },
  ];

  return (
    <footer className={cn("theme-light", className)}>
      <div className="border-t border-line bg-carbon">
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-8 sm:px-6 md:px-8 md:pt-20">
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] md:gap-x-10">
            <div className="col-span-2 md:col-span-1">
              <LocaleLink
                href="/"
                aria-label={t("brand.logoAria")}
                className="inline-flex text-[1.75rem] leading-none font-bold tracking-[-0.035em] text-white"
              >
                M<span className="text-comet">I</span>W
              </LocaleLink>
              <p className="mt-5 max-w-xs text-body leading-relaxed text-zinc">{t("home.lede")}</p>

              <p className="mt-8 text-small font-semibold text-white">{t("footer.writeUs")}</p>
              <div className="mt-1.5 flex items-center gap-1">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-body break-all text-comet underline-offset-4 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                <CopyEmail />
              </div>
              <p className="mt-1 text-meta text-zinc">{t("footer.replyIn")}</p>

              <p className="mt-6 flex items-center gap-2 text-meta text-zinc">
                <span aria-hidden className="size-1.5 rounded-full bg-signal" />
                {t("availability.status")} · {t("availability.scope")}
              </p>
            </div>

            <Column title={t("footer.studio")} links={studio} />
            <Column title={t("footer.services")} links={services} />
            <Column title={t("footer.products")} links={products} />
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-line pt-6 text-meta text-zinc">
            <p suppressHydrationWarning>
              © {new Date().getFullYear()} {t("brand.tagline")}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <nav aria-label={t("footer.legal")}>
                <LocaleLink href="/terms" className="-my-2 rounded-md py-2 transition-colors hover:text-white">
                  {t("footer.terms")}
                </LocaleLink>
              </nav>
              <LocaleSwitch />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
