/**
 * The three systems MIW has actually built. Single source of truth for the
 * product frames on the flight deck, the `/work` index and every case study.
 *
 * Two rules hold this file together, and both exist because the deck is easy to
 * lie on:
 *
 * A number carries its provenance. `basis: "observed"` means it is true of the
 * build you can open from here; `basis: "target"` means it is the budget the
 * system is designed and tested against. Nothing in between, and nothing framed
 * as a result belonging to someone else's business.
 *
 * A link says what it actually opens. `liveUrl` is a deployment a stranger can
 * load; `repoUrl` is source. Wovie has source and no public deployment, so it
 * gets a source button and no "Live app" — one dead or mislabelled link costs
 * more trust than the whole page buys.
 *
 * What is left here is what a translator must not be able to change: addresses,
 * stack names, statuses, metric figures and the grid a diagram is laid out on.
 * The prose lives at `locales/<lang>/projects.json` under each project's `id`,
 * and every interface below names the key its text is read from.
 */

import type { ProjectStatus, StationId } from "@/lib/stations";

/**
 * Column/row grid slot. The box's text is at
 * `projects:<id>.design.nodes.<nodeId>` — a diagram whose boxes stay in English
 * on a Czech case study is a diagram that stops being part of the argument.
 */
export interface ArchNode {
  id: string;
  kind: "entry" | "service" | "store" | "stream" | "model";
  col: number;
  row: number;
}

/**
 * Edge labels are optional and are looked up at
 * `projects:<id>.design.edges.<from>-<to>`. An edge with no entry there draws
 * as a bare arrow, which is what most of them are.
 */
export interface ArchEdge {
  from: string;
  to: string;
}

/** Which interactive micro-demo the product frame renders. */
export type Variant = "streaming" | "booking" | "checkout";

/**
 * Where a figure came from. Rendered next to the figure rather than explained in
 * a footnote nobody reaches. Label and legend are at `projects:basis.<id>`.
 */
export type Basis = "observed" | "target";

/**
 * The figure stays here and the words move: `99.99%` reads the same in every
 * language, and a translated metric is a metric nobody can check against the
 * system. Label and note are at `projects:<id>.metrics.<metricId>`.
 */
export interface Metric {
  id: string;
  value: string;
  basis: Basis;
}

/**
 * What the address-bar badge says. Explicit rather than derived from `status`,
 * because "source available, no public deployment" is a real state and deriving
 * it would have printed `Staging` over a GitHub URL. Text at
 * `projects:environment.<id>`.
 */
export type Environment = "production" | "staging" | "internal" | "source";

/**
 * Structure only. The prose counterpart of each project lives at
 * `projects:<id>` and holds: `category`, `headline`, `pitch.executive`,
 * `pitch.telemetry`, `callouts[]`, `demoHint`, `metrics.<metricId>.{label,note}`,
 * `problem.{lede,points[]}`, `design.{lede,nodes,edges}`, `solutions[]` of
 * `{choice, why}` and `results.lede`.
 *
 * Note what is absent: the decision log. It is prose end to end — a choice and
 * the alternative it beat — so it lives only in the locale file and is read back
 * as an array. A count here would be one more number to keep in step with four
 * paragraphs for no reader's benefit.
 */
export interface ProjectCase {
  /** Repository identity, kept so a reader can match this to the actual repo. */
  id: string;
  slug: string;
  /** Display name. A proper noun, so it does not travel to the locale files. */
  name: string;
  /** Monospace short form used on the deck and in diagrams. */
  codename: string;
  station: StationId;
  status: ProjectStatus;
  environment: Environment;
  variant: Variant;
  /** Shown in the frame's address bar. */
  host: string;
  /** A deployment anyone can open. Omitted when there is not one. */
  liveUrl?: string;
  /** Source. Not the same thing as a running app, so not the same field. */
  repoUrl?: string;
  stack: string[];
  metrics: Metric[];
  design: { nodes: ArchNode[]; edges: ArchEdge[] };
}

export const PROJECTS: ProjectCase[] = [
  {
    id: "omnibus_nss",
    slug: "omnibus",
    name: "Omnibus",
    codename: "OMNIBUS",
    station: "backend",
    status: "live",
    environment: "production",
    variant: "booking",
    host: "omnibus.79.72.58.230.nip.io",
    liveUrl: "https://omnibus.79.72.58.230.nip.io/",
    stack: [
      "Java",
      "Spring Boot",
      "PostgreSQL",
      "Docker",
      "Kubernetes",
      "REST/OpenAPI",
    ],
    metrics: [
      { id: "integrity", value: "99.99%", basis: "target" },
      { id: "overbooking", value: "Zero", basis: "target" },
      { id: "mesh", value: "Containerised", basis: "observed" },
    ],
    design: {
      nodes: [
        { id: "ingress", kind: "entry", col: 0, row: 0 },
        { id: "api", kind: "service", col: 1, row: 0 },
        { id: "rbac", kind: "service", col: 1, row: 1 },
        { id: "booking", kind: "service", col: 2, row: 0 },
        { id: "routes", kind: "service", col: 2, row: 1 },
        { id: "pg", kind: "store", col: 3, row: 0 },
        { id: "ledger", kind: "store", col: 3, row: 1 },
      ],
      edges: [
        { from: "ingress", to: "api" },
        { from: "ingress", to: "rbac" },
        { from: "rbac", to: "booking" },
        { from: "api", to: "booking" },
        { from: "api", to: "routes" },
        { from: "booking", to: "pg" },
        { from: "booking", to: "ledger" },
        { from: "routes", to: "pg" },
      ],
    },
  },
  {
    id: "miw_eshop",
    slug: "commerce-core",
    name: "MIW Commerce Platform",
    codename: "COMMERCE CORE",
    station: "commerce",
    status: "build",
    environment: "internal",
    variant: "checkout",
    host: "commerce.miw.internal/checkout",
    stack: ["Next.js", "Node.js / Go", "PostgreSQL", "Redis", "Stripe Gateway"],
    metrics: [
      { id: "commit", value: "Sub-second", basis: "target" },
      { id: "hooks", value: "Exactly once", basis: "target" },
      { id: "cache", value: "> 94%", basis: "target" },
    ],
    design: {
      nodes: [
        { id: "shopper", kind: "entry", col: 0, row: 0 },
        { id: "stripe", kind: "entry", col: 0, row: 1 },
        { id: "storefront", kind: "service", col: 1, row: 0 },
        { id: "hooks", kind: "service", col: 1, row: 1 },
        { id: "orders", kind: "service", col: 2, row: 0 },
        { id: "cache", kind: "store", col: 3, row: 0 },
        { id: "queue", kind: "stream", col: 3, row: 1 },
        { id: "pg", kind: "store", col: 4, row: 0 },
      ],
      edges: [
        { from: "shopper", to: "storefront" },
        { from: "stripe", to: "hooks" },
        { from: "storefront", to: "orders" },
        { from: "orders", to: "cache" },
        { from: "orders", to: "queue" },
        { from: "orders", to: "pg" },
        { from: "hooks", to: "pg" },
      ],
    },
  },
  {
    id: "wovie_next",
    slug: "wovie",
    name: "Wovie",
    codename: "WOVIE",
    station: "labs",
    status: "build",
    environment: "source",
    variant: "streaming",
    host: "github.com/TheRainHub/wovie_next-",
    repoUrl: "https://github.com/TheRainHub/wovie_next-",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Prisma",
      "TMDB API",
      "Vercel Edge",
    ],
    metrics: [
      { id: "route", value: "< 90ms", basis: "target" },
      { id: "cost", value: "Zero", basis: "observed" },
      { id: "types", value: "100%", basis: "observed" },
    ],
    design: {
      nodes: [
        { id: "visitor", kind: "entry", col: 0, row: 0 },
        { id: "edge", kind: "service", col: 1, row: 0 },
        { id: "rsc", kind: "service", col: 2, row: 0 },
        { id: "isr", kind: "store", col: 3, row: 1 },
        { id: "prisma", kind: "service", col: 3, row: 0 },
        { id: "pg", kind: "store", col: 4, row: 0 },
        { id: "tmdb", kind: "model", col: 4, row: 1 },
      ],
      edges: [
        { from: "visitor", to: "edge" },
        { from: "edge", to: "rsc" },
        { from: "rsc", to: "isr" },
        { from: "rsc", to: "prisma" },
        { from: "prisma", to: "pg" },
        { from: "prisma", to: "tmdb" },
      ],
    },
  },
];

export function projectBySlug(slug: string): ProjectCase | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/**
 * The artifact a station puts in its frame. Station 04 sells a way of working
 * and deliberately has none — `undefined` is a valid answer, not a gap to fill.
 */
export function projectForStation(station: StationId): ProjectCase | undefined {
  return PROJECTS.find((p) => p.station === station);
}

export function projectsForStations(stations: readonly StationId[]) {
  return PROJECTS.filter((p) => stations.includes(p.station));
}
