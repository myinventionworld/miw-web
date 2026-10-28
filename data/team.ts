/**
 * The people. Names are proper nouns, so they live here and not in the locale
 * files; each person's role is translated at `about:team.roles.<id>`.
 *
 * `photo` is a path under `public/team/` once there is a real portrait. Until
 * then the card shows initials — a stock face or a generated one would be the
 * kind of thing this site is written to avoid.
 */
export interface Person {
  id: string;
  name: string;
  photo?: string;
}

export const TEAM: Person[] = [
  { id: "mykhailo", name: "Mykhailo Plokhin" },
  { id: "ivan", name: "Ivan Shestachenko" },
  { id: "denis", name: "Denis Yazan" },
  { id: "mykola", name: "Mykola Volovod" },
  { id: "illia", name: "Illia Hoznoferov" },
  { id: "rosztiszlav", name: "Rosztiszlav Halász" },
  { id: "andrei", name: "Andrei Hoznoferov" },
];

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
