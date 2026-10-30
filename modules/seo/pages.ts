import { PROJECTS } from "@/modules/work";

/** Listed, but not what anyone searches for. */
export const LEGAL_PAGES = ["/terms"];

/** Every page, without its locale prefix. The case studies follow `PROJECTS`. */
export const PAGES = [
  "/",
  "/about",
  "/work",
  ...PROJECTS.map((p) => `/work/${p.slug}`),
  ...LEGAL_PAGES,
];
