/**
 * The people. Names are proper nouns, so they live here and not in the locale
 * files; each person's role is translated at `about:team.roles.<id>`, and the
 * one line in their own words at `about:team.lines.<id>` — a person without
 * one simply has no line on the page, never a placeholder.
 *
 * `photo` is a path under `public/team/`: a square portrait, 480px or more,
 * shown as it is, in colour. Without a photo the avatar shows initials — a
 * stock face or a generated one would be the kind of thing this site is
 * written to avoid.
 *
 * `orbit` places the person on About's team orbits, inner or outer. The cover
 * on About reads the same list, so both show the same seven people.
 */
export interface Person {
  id: string;
  name: string;
  photo?: string;
  orbit: "inner" | "outer";
}

export const TEAM: Person[] = [
  { id: "mykhailo", name: "Mykhailo Plokhin", orbit: "inner", photo: "/team/mykhailo.webp" },
  { id: "ivan", name: "Ivan Shestachenko", orbit: "inner", photo: "/team/ivan.webp" },
  { id: "denis", name: "Denis Yazan", orbit: "inner", photo: "/team/denis.webp" },
  { id: "mykola", name: "Mykola Volovod", orbit: "outer", photo: "/team/mykola.webp" },
  { id: "illia", name: "Illia Hoznoferov", orbit: "outer", photo: "/team/illia.webp" },
  { id: "rosztiszlav", name: "Rosztiszlav Halász", orbit: "outer" },
  { id: "andrei", name: "Andrei Hoznoferov", orbit: "outer", photo: "/team/andrei.webp" },
];

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
