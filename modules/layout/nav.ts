export const NAV = [
  { id: "services", href: "/#backend", label: "services", flight: true },
  { id: "products", href: "/#labs", label: "products", flight: true },
  { id: "team", href: "/#team", label: "team", flight: true },
  { id: "contact", href: "/#transmission", label: "contact", flight: true },
  { id: "work", href: "/work", label: "work", flight: false },
  { id: "about", href: "/about", label: "aboutUs", flight: false },
] as const;

export type NavId = (typeof NAV)[number]["id"];

export type NavLabel = (typeof NAV)[number]["label"];

export const START_HREF = "/#transmission";
