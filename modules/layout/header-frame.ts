import type { NavId } from "./nav";

/**
 * The dark header on the 3D home and the light one everywhere else are built
 * from these classes, so landing on a light page only changes colours: the
 * strip, the row, the items and the pill stay where they were.
 */
export const HEADER = {
  bar: "border-b border-line bg-void/85 backdrop-blur",
  strip:
    "flex h-8 items-center justify-between gap-3 border-b border-line px-4 text-small sm:px-6 lg:px-8",
  row: "flex h-14 items-center gap-1 px-4 sm:gap-2 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-8",
  logo: "-my-2 mr-auto py-2 lg:mr-0 lg:justify-self-start",
  nav: "hidden items-center gap-1 lg:flex",
  end: "flex items-center gap-1 sm:gap-2 lg:justify-self-end",
  item: "-my-2 rounded-md px-2 py-2 text-body font-medium whitespace-nowrap lg:px-3",
  idle: "text-zinc transition-colors hover:bg-space-800 hover:text-white",
  current: "bg-space-800 text-white",
  pill: "ml-1 flex items-center rounded-full bg-action px-3 py-2 text-small font-semibold whitespace-nowrap text-on-action transition-colors hover:bg-action-hover sm:ml-2 sm:px-3.5",
} as const;

export function navForSection(section: string | null): NavId | undefined {
  if (section === "transmission") return "contact";
  if (section === "backend" || section === "commerce") return "services";
  if (section === "labs") return "products";
  if (section === "team") return "team";
  return undefined;
}
