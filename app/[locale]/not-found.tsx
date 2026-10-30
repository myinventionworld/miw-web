import Link from "next/link";
import { locale as currentLocale } from "next/root-params";

import { CoverHero } from "@/components/editorial/cover-hero";
import { EditorialShell } from "@/components/editorial/shell";
import { initTranslations } from "@/i18n";
import { localeHref } from "@/lib/locale";

/**
 * The 404 page: the cover with only the products drifting on it, a line in
 * plain words, and the three ways back. Next adds `noindex` and the 404 status.
 */
export default async function NotFound() {
  const locale = (await currentLocale()) ?? "en";
  const { t } = await initTranslations(locale, ["common"]);

  return (
    <EditorialShell bleed>
      <CoverHero>
        <p className="text-small font-medium text-zinc tabular-nums">404</p>
        <h1 className="mt-5 text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.02] font-bold tracking-[-0.05em] text-white">
          {t("notFound.title")}
        </h1>
        <p className="mt-6 max-w-xl text-copy-lg leading-relaxed text-zinc md:text-[1.1875rem]">
          {t("notFound.body")}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link
            href={localeHref(locale, "/")}
            className="rounded-full bg-action px-6 py-3 text-lead font-medium text-on-action transition-colors hover:bg-action-hover"
          >
            {t("footer.back")}
          </Link>
          <Link href={localeHref(locale, "/work")} className="text-lead font-medium text-comet hover:underline">
            {t("nav.work")} ›
          </Link>
          <Link href={localeHref(locale, "/about")} className="text-lead font-medium text-comet hover:underline">
            {t("nav.about")} ›
          </Link>
        </div>
      </CoverHero>
    </EditorialShell>
  );
}
