import { PROJECTS } from "@/data/projects";

/**
 * The site's own address, for everything that needs an absolute URL:
 * `metadataBase`, the sitemap, robots.txt and the JSON-LD.
 *
 * There is no custom domain yet. `NEXT_PUBLIC_SITE_URL` is the setting for when
 * there is one; until then Vercel's production hostname
 * (`VERCEL_PROJECT_PRODUCTION_URL`, set by Vercel on every build), and
 * localhost for a build on a laptop.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Every page, without its locale prefix. The case studies follow `PROJECTS`. */
export const PAGES = [
  "/",
  "/about",
  "/work",
  ...PROJECTS.map((p) => `/work/${p.slug}`),
];
