export const NAV = [
  { id: "services", href: "/#backend" },
  { id: "work", href: "/work" },
  { id: "about", href: "/about" },
  { id: "contact", href: "/#transmission" },
] as const;

export type NavId = (typeof NAV)[number]["id"];

export const START_HREF = "/#transmission";
