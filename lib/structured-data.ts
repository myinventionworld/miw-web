import type { ProjectCase } from "@/data/projects";
import { TEAM } from "@/data/team";
import { CONTACT_EMAIL } from "@/lib/contact";
import { siteUrl } from "@/lib/site";
import i18nConfig from "@/i18nConfig";

/**
 * schema.org for search engines, as one `@graph` per page. The organization and
 * the site carry fixed `@id`s, so a page that names its publisher points at the
 * one node the layout already declares instead of describing it again.
 *
 * The brand is "MIW Labs"; the page titles say "MIW", so both are declared and
 * a search engine reads them as one name.
 */
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

/** Who publishes the site, and the site itself. Shared by every page. */
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

/** The trail from the home page to `items`' last entry, names already translated. */
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

/** A case study, and the product it describes. */
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

/** The team as people who work for the organization, roles already translated. */
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
