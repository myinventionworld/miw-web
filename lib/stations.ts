/**
 * The shape of the journey. The navbar, the mega-drawer, the floating dock, the
 * console, the /careers route and the 3D scene all read from here.
 *
 * Four stations carry the two engines: 01–02 are the studio's client work,
 * 03 is the product lab it funds, 04 is the guild model both run on. The
 * transmission console is the fifth and final parking point.
 *
 * What is left in this file is structure — ids, scroll anchors, which options
 * belong to which tab. The words moved to `locales/<lang>/stations.json`,
 * `careers.json` and `console.json` when the site went trilingual, because
 * three copies of this file kept in step by hand is not a content model. Every
 * id below is a key over there; the interfaces near each export describe what
 * the JSON is expected to hold.
 *
 * Positioning lives in `.agents/product-marketing.md`.
 */

export type StationId = "backend" | "commerce" | "labs" | "guild";

/** Business reads outcomes, telemetry reads mechanism. Same station either way. */
export type Mode = "business" | "telemetry";

/** Ids, not labels. The badge text is at `projects:status.<id>`. */
export type ProjectStatus = "live" | "beta" | "build" | "internal";

/**
 * Value first, tech proof second. `headline` is the biggest text on the
 * station and states an outcome; everything under it is the argument for why
 * that outcome is credible. Read from `stations:<id>.<mode>`.
 */
export interface StationCopy {
  headline: string;
  lede: string;
  problem: string;
  solution: string;
  proof: string[];
}

/** `stations:<id>.specs` — the engineering readout, shown in both modes. */
export interface Spec {
  label: string;
  value: string;
}

/** `stations:guild.program` — station 04 sells a way of working, not an artifact. */
export interface ProgramPoint {
  label: string;
  body: string;
}

export interface Station {
  id: StationId;
  index: string;
  /** Scroll position this station is parked at, 0..1. */
  anchor: number;
  /**
   * Where the call to action goes when it is a route. Stations without one fly
   * the camera to the console instead.
   */
  ctaHref?: string;
  /** Station 04 shows the programme card in place of a product frame. */
  program?: true;
}

/**
 * Deliberately no `featured` field and no project list.
 *
 * Both used to live here, which meant the deck carried a codename, a stack and
 * a blurb per station that had to be kept in step with the case study by hand —
 * and sixteen invented project names that existed only to fill a nav drawer.
 * The artifact a station shows is now looked up from `data/projects.ts` by
 * station id, so there is exactly one place where a product's name, status and
 * links are written down. A station with no real system shows no frame.
 */
export const STATIONS: Station[] = [
  { id: "backend", index: "01", anchor: 0.06 },
  { id: "commerce", index: "02", anchor: 0.3 },
  { id: "labs", index: "03", anchor: 0.54 },
  { id: "guild", index: "04", anchor: 0.78, ctaHref: "/careers", program: true },
];

/* ── navigation ───────────────────────────────────────────────────────── */

/**
 * The top bar sells four things, which is not the same as four stations:
 * "Studio" is the client engine and spans two stations, and "Transmission"
 * is the console rather than a station at all.
 *
 * Label and blurb are at `stations:sections.<id>`.
 */
export interface NavSection {
  id: string;
  /** Stations listed in the drawer. Empty means the item has no drawer. */
  stations: StationId[];
  /** Where clicking the label takes you. */
  go: StationId | "console";
}

export const NAV_SECTIONS: NavSection[] = [
  { id: "studio", stations: ["backend", "commerce"], go: "backend" },
  { id: "labs", stations: ["labs"], go: "labs" },
  { id: "guild", stations: ["guild"], go: "guild" },
  { id: "transmission", stations: [], go: "console" },
];

export const CONSOLE_ANCHOR = 0.97;

/* ── commercial availability ──────────────────────────────────────────── */

/**
 * `common:availability` is scarcity that is checkable rather than manufactured,
 * and `common:standards` is the bar delivered architecture is designed to — not
 * a claim about past client results. Both are prose and live in the locale
 * files; keep the count honest there, in all three languages at once.
 */
export interface Availability {
  status: string;
  scope: string;
}

export interface Standard {
  value: string;
  label: string;
}

/* ── transmission console ─────────────────────────────────────────────── */

/**
 * Three intents, three forms. Mixing a developer's portfolio link into the same
 * field set as a budget range is what made the old single form ask everyone for
 * things that did not apply to them.
 *
 * "Hire the studio" used to be one tab covering both a greenfield build and a
 * look at a system that already exists. They are different conversations: one
 * starts from what you want, the other from what already breaks, and the second
 * is the cheaper first step for most of the people who arrive here.
 *
 * The flag stays here rather than in the locale files: it is a command-line
 * argument, and `--audit-architektury` would be a joke that does not land in any
 * language.
 */
export const CONSOLE_TABS = [
  { id: "engineering", flag: "--client-engineering" },
  { id: "audit", flag: "--architecture-audit" },
  { id: "guild", flag: "--join-guild" },
] as const;

export type ConsoleTab = (typeof CONSOLE_TABS)[number]["id"];

/** What the engagement actually is. Drives the scope prompt in the form. */
export const ENGAGEMENTS = ["mvp", "rescue", "ai", "audit"] as const;

export type EngagementId = (typeof ENGAGEMENTS)[number];

/**
 * Which engagements each console tab offers. The tab has already told us
 * roughly why the reader is here, so asking them to pick from all four again
 * would be asking the same question twice in two different wordings.
 */
export const TAB_ENGAGEMENTS: Record<ConsoleTab, readonly EngagementId[]> = {
  engineering: ["mvp", "ai"],
  audit: ["audit", "rescue"],
  guild: [],
};

/**
 * Asked up front rather than discovered on call three. A range that rules the
 * studio out is worth ten minutes of everyone's time, not ten days of it.
 *
 * Ids rather than the labels themselves, because the label is also the value
 * that gets submitted — and a form whose payload changes meaning depending on
 * which language the visitor read it in is a form nobody can read the replies
 * to. The figures stay in dollars in every language for the same reason.
 */
export const BUDGETS = ["5-10k", "10-25k", "25k-plus", "unsure"] as const;

export const STAGES = [
  "pre-seed",
  "seed",
  "series-a",
  "established",
] as const;

export const TIMELINES = ["now", "month", "quarter", "scoping"] as const;

/* ── guild ────────────────────────────────────────────────────────────── */

/**
 * Directions rather than headcount. We are not filling a seat with a fixed
 * title — a strong applicant on any of these gets a crew built around them.
 *
 * Each one names the system you would actually be put on, and all three are
 * systems in `data/projects.ts` that a reader can go and inspect. A track
 * advertising work on something we do not run is how an incubator turns into a
 * course. Codename and stack are proper nouns, so they stay here; the pitch is
 * at `careers:openings.<id>`.
 */
export const GUILD_OPENINGS = [
  {
    id: "backend",
    system: "OMNIBUS",
    stack: ["Java", "Spring Boot", "Go", "Kubernetes", "Postgres"],
  },
  {
    id: "commerce",
    system: "COMMERCE CORE",
    stack: ["Go", "Node.js", "Redis", "Postgres", "Stripe"],
  },
  {
    id: "frontend",
    system: "WOVIE",
    stack: ["Next.js", "TypeScript", "Tailwind", "Prisma", "WebGL"],
  },
] as const;

export type OpeningId = (typeof GUILD_OPENINGS)[number]["id"];

/**
 * Published because the unknown is what stops people applying. Every step is
 * something we do to their work, not a personality screen. Copy at
 * `careers:hiring.<step>`.
 */
export const HIRING_STEPS = ["01", "02", "03", "04"] as const;

/** Answers the questions that otherwise arrive by DM. Nothing invented. */
export const CAREERS_FAQ = [
  "paid",
  "experience",
  "university",
  "fit",
  "after",
] as const;

/** Extended intake. Deliberately asks for work, not for a CV. */
export const GUILD_LEVELS = [
  "y1",
  "y2",
  "y3",
  "self-taught",
  "working",
] as const;

/* ── lookups ──────────────────────────────────────────────────────────── */

export function stationById(id: StationId): Station {
  return STATIONS.find((s) => s.id === id)!;
}

/** Index of the station whose anchor is nearest to a scroll position. */
export function nearestStation(p: number): Station {
  let best = STATIONS[0];
  let bestDist = Infinity;
  for (const s of STATIONS) {
    const d = Math.abs(s.anchor - p);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}

export const STATUS_TONE: Record<ProjectStatus, string> = {
  live: "border-signal/60 text-signal",
  beta: "border-beam/60 text-beam",
  build: "border-amber-400/60 text-amber-300",
  internal: "border-white/35 text-platinum",
};
