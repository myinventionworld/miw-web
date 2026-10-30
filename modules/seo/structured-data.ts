import type { ProjectCase } from "@/modules/work";
import { TEAM } from "@/modules/team";
import { CONTACT_EMAIL } from "@/modules/contact";
import { siteUrl } from "./site";
import { i18nConfig } from "@/modules/i18n";

const BRAND = "MIW Labs";
const SHORT = "MIW";

const LANGUAGES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  cs: "Czech",
};

export const organizationId = () => `${siteUrl()}/#organization`;
const websiteId = () => `${siteUrl()}/#website`;

/** `<` is escaped so nothing in the strings can close the script tag. */
export function serializeJsonLd(graph: object[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
    /</g,
    "\\u003c",
  );
}

export function siteGraph(locale: string, description: string) {
  const base = siteUrl();
  return [
    {
      "@type": "Organization",
      "@id": organizationId(),
      name: BRAND,
      alternateName: SHORT,
      url: `${base}/`,
      logo: `${base}/logo.png`,
      email: CONTACT_EMAIL,
      description,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Prague",
        addressCountry: "CZ",
      },
      areaServed: ["CZ", "EU"],
      knowsLanguage: i18nConfig.locales.map((l) => LANGUAGES[l] ?? l),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        email: CONTACT_EMAIL,
        availableLanguage: i18nConfig.locales.map((l) => LANGUAGES[l] ?? l),
      },
      numberOfEmployees: { "@type": "QuantitativeValue", value: TEAM.length },
      sameAs: ["https://github.com/myinventionworld"],
    },
    {
      "@type": "WebSite",
      "@id": websiteId(),
      name: BRAND,
      alternateName: SHORT,
      url: `${base}/`,
      inLanguage: locale,
      publisher: { "@id": organizationId() },
    },
  ];
}

export function breadcrumbs(items: { name: string; href: string }[]) {
  const base = siteUrl();
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: base + item.href,
    })),
  };
}

export function caseStudy(
  project: ProjectCase,
  copy: { headline: string; pitch: string; category: string },
  locale: string,
  href: string,
) {
  const url = siteUrl() + href;
  return {
    "@type": "CreativeWork",
    "@id": `${url}#case-study`,
    url,
    name: `${project.name} — ${copy.headline}`,
    headline: copy.headline,
    description: copy.pitch,
    inLanguage: locale,
    genre: "Case study",
    keywords: project.stack.join(", "),
    creator: { "@id": organizationId() },
    publisher: { "@id": organizationId() },
    isPartOf: { "@id": websiteId() },
    about: {
      "@type": "SoftwareApplication",
      name: project.name,
      applicationCategory: copy.category,
      operatingSystem: "Web",
      ...(project.liveUrl && { url: project.liveUrl }),
      ...(project.repoUrl && { sameAs: project.repoUrl }),
    },
  };
}

export function teamMembers(roles: Record<string, string>) {
  const base = siteUrl();
  return TEAM.map((p) => ({
    "@type": "Person",
    name: p.name,
    jobTitle: roles[p.id],
    ...(p.photo && { image: base + p.photo }),
    worksFor: { "@id": organizationId() },
  }));
}
