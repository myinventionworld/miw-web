import type { NavId } from "./nav";

/**
 * The dark header on the 3D home and the light one everywhere else are built
 * from these classes, so landing on a light page only changes colours: the
 * row, the items and the pill stay where they were.
 */
export const HEADER = {
  bar: "border-b border-line bg-void/85 backdrop-blur",
  row: "mx-auto flex h-14 max-w-5xl items-center gap-1 px-4 sm:gap-2 sm:px-6 md:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6",
  logo: "-my-2 mr-auto py-2 lg:mr-0 lg:justify-self-start",
  nav: "flex items-center gap-1",
  end: "flex items-center gap-2 lg:justify-self-end",
  item: "-my-2 rounded-md px-2 py-2 text-body font-medium lg:px-3",
  idle: "text-zinc transition-colors hover:bg-space-800 hover:text-white",
  current: "bg-space-800 text-white",
  pill: "flex items-center rounded-full bg-action px-3 py-2 text-small font-semibold text-on-action transition-colors hover:bg-action-hover sm:px-3.5",
  langs: "hidden lg:flex",
} as const;

/** Services covers the three stations; the console and the contact section are Contact. */
export function navForSection(section: string | null): NavId | undefined {
  if (section === "transmission") return "contact";
  if (section === "backend" || section === "commerce" || section === "labs") return "services";
  return undefined;
}
