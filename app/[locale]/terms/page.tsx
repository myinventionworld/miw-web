import { alternates, initTranslations } from "@/modules/language";
import { LegalPage } from "@/modules/legal";

export async function generateMetadata(props: PageProps<"/[locale]/terms">) {
  const { locale } = await props.params;
  const { t } = await initTranslations(locale, ["legal"]);

  return {
    title: t("terms.metaTitle"),
    description: t("terms.metaDescription"),
    alternates: alternates(locale, "/terms"),
  };
}

/**
 * The terms of use. Written for what the site is — a studio's pages and a
 * contact form, with no accounts, payments or anything a visitor publishes —
 * so every clause covers something the site actually does.
 */
export default function TermsPage() {
  return <LegalPage page="terms" />;
}
