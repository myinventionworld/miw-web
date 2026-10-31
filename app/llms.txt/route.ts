import about from "@/locales/en/about.json";
import common from "@/locales/en/common.json";
import projects from "@/locales/en/projects.json";
import stations from "@/locales/en/stations.json";
import { PROJECTS } from "@/modules/work";
import { TEAM } from "@/modules/team";
import { CONTACT_EMAIL } from "@/modules/contact";
import { siteUrl } from "@/modules/seo";

/**
 * /llms.txt (llmstxt.org): the site in one Markdown page for language models
 * and AI agents — who we are, what we offer, the products with their case
 * studies, the team and how to get in touch, with links to the full pages.
 *
 * Built from the same English strings and data as the pages, so it cannot
 * drift from what the site says. Static: rendered once per build.
 */
export const dynamic = "force-static";

type ProjectCopy = { category: string; pitch: string };

export function GET() {
  const base = siteUrl();
  const page = (path: string) => `${base}/en${path}`;
  const copy = projects as unknown as Record<string, ProjectCopy>;
  const env = projects.environment as Record<string, string>;
  const roles = about.team.roles as Record<string, string>;

  const lines = [
    "# MIW Labs",
    "",
    `> ${common.meta.description}`,
    "",
    `${common.availability.status}. ${common.availability.scope}. Email: ${CONTACT_EMAIL}. ` +
      "The site is in English, Russian and Czech: /en, /ru, /cs.",
    "",
    "## Services",
    "",
    `- For small businesses: ${stations.commerce.business.lede} ` +
      stations.commerce.program.map((p) => `${p.label}: ${p.body}`).join(" "),
    `- For startups and tech teams: ${stations.backend.business.lede}`,
    `- [Start a project](${page("#transmission")}): ${common.home.transmissionBody}`,
    "",
    "## Products and case studies",
    "",
    ...PROJECTS.map((p) => {
      const c = copy[p.id];
      const links = [p.liveUrl && `[open the app](${p.liveUrl})`].filter(Boolean);
      return (
        `- [${p.name}](${page(`/work/${p.slug}`)}): ${c.pitch} ` +
        `${c.category}. ${env[p.environment]}. Stack: ${p.stack.join(", ")}.` +
        (links.length ? ` Also: ${links.join(", ")}.` : "")
      );
    }),
    "",
    "## Team",
    "",
    `${about.team.lede}`,
    "",
    ...TEAM.map((p) => `- ${p.name}: ${roles[p.id]}`),
    "",
    "## Pages",
    "",
    `- [Home](${page("")}): ${common.meta.title}`,
    `- [Work](${page("/work")}): the products and their case studies`,
    `- [About](${page("/about")}): ${about.metaDescription}`,
    "",
    "## Optional",
    "",
    `- [Sitemap](${base}/sitemap.xml): every page in every language`,
    `- [Русский](${base}/ru), [Čeština](${base}/cs)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
