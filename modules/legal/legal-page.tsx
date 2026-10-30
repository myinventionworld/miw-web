import type { ReactNode } from "react";
import { locale as currentLocale } from "next/root-params";

import { EditorialShell } from "@/modules/editorial/server";
import { CONTACT_EMAIL } from "@/modules/enquiry";
import { initTranslations } from "@/modules/i18n";
import { LEGAL_UPDATED, OPERATOR } from "./operator";

/** `legal:<page>.sections` — a heading and its paragraphs. */
export interface LegalSection {
  title: string;
  body: string[];
}

interface Fact {
  label: string;
  value: ReactNode;
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section className="mt-12">
      <h2 className="text-title leading-snug font-bold tracking-[-0.02em] text-white">
        {section.title}
      </h2>
      {section.body.map((p) => (
        <p key={p} className="mt-3 text-copy leading-relaxed text-zinc">
          {p}
        </p>
      ))}
    </section>
  );
}

/**
 * A legal page: one reading column, the date the text took effect under the
 * title, and who runs the site at the foot. The terms are the only one today;
 * the next (a privacy notice, say) is a key under `legal:` and a route that
 * renders this.
 *
 * `legal` is loaded here, on the server, rather than added to `NAMESPACES` in
 * `i18n.ts`. These pages have no client component that reads it, and anything
 * in `NAMESPACES` is handed to the browser on every page of the site.
 */
export async function LegalPage({ page }: { page: "terms" }) {
  const locale = await currentLocale();
  const { t } = await initTranslations(locale, ["legal", "common"]);

  const sections = t(`${page}.sections`, {
    returnObjects: true,
  }) as LegalSection[];
  // Parsed as UTC and printed as UTC, so the server's own time zone cannot
  // move the date a day back.
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(LEGAL_UPDATED));
  const law = OPERATOR.governingLaw
    ? new Intl.DisplayNames([locale], { type: "region" }).of(OPERATOR.governingLaw)
    : null;

  // Only what is true today. Until there is a registered company the operator
  // is the team under its own name, and the rows for a company ID, an address
  // and a governing law are left out rather than shown empty.
  const facts: Fact[] = [
    { label: t("operator.legalName"), value: OPERATOR.legalName ?? "MIW Labs" },
  ];
  if (OPERATOR.companyId) {
    facts.push({ label: t("operator.companyId"), value: OPERATOR.companyId });
  }
  facts.push(
    OPERATOR.address
      ? { label: t("operator.address"), value: OPERATOR.address }
      : { label: t("operator.location"), value: t("common:availability.scope") },
  );
  if (law) facts.push({ label: t("operator.governingLaw"), value: law });
  facts.push({
    label: t("operator.email"),
    value: (
      <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-comet hover:underline">
        {CONTACT_EMAIL}
      </a>
    ),
  });

  return (
    <EditorialShell>
      <article className="max-w-2xl">
        <p className="text-small font-medium text-zinc">{t("eyebrow")}</p>
        <h1 className="mt-4 text-[clamp(2.2rem,4.4vw,3.2rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white">
          {t(`${page}.title`)}
        </h1>
        <p className="mt-4 text-meta text-steel">
          {t("updated", { date: updated })}
        </p>
        <p className="mt-8 text-copy-lg leading-relaxed text-platinum">
          {t(`${page}.lede`)}
        </p>

        {sections.map((s) => (
          <Section key={s.title} section={s} />
        ))}
        {/* Points at the governing-law row below, so it comes and goes with
            it. */}
        {law && (
          <Section
            section={t(`${page}.law`, { returnObjects: true }) as LegalSection}
          />
        )}

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-title leading-snug font-bold tracking-[-0.02em] text-white">
            {t("operator.title")}
          </h2>
          <dl className="mt-5">
            {facts.map((f) => (
              <div
                key={f.label}
                className="grid gap-1 border-b border-line py-3 sm:grid-cols-[13rem_1fr] sm:gap-6"
              >
                <dt className="text-body text-steel">{f.label}</dt>
                <dd className="text-body text-white">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </EditorialShell>
  );
}
