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
 */

import type { ProjectStatus, StationId } from "@/lib/stations";

/** Column/row grid slot. Diagrams are laid out by hand, not force-directed. */
export interface ArchNode {
  id: string;
  label: string;
  kind: "entry" | "service" | "store" | "stream" | "model";
  col: number;
  row: number;
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
}

/** Which interactive micro-demo the product frame renders. */
export type Variant = "streaming" | "booking" | "checkout";

/**
 * Where a figure came from. Rendered next to the figure rather than explained in
 * a footnote nobody reaches.
 */
export type Basis = "observed" | "target";

export interface Metric {
  value: string;
  label: string;
  basis: Basis;
  note: string;
}

/**
 * What the address-bar badge says. Explicit rather than derived from `status`,
 * because "source available, no public deployment" is a real state and deriving
 * it would have printed `Staging` over a GitHub URL.
 */
export type Environment =
  | "Production"
  | "Staging"
  | "Internal"
  | "Source available";

export interface ProjectCase {
  /** Repository identity, kept so a reader can match this to the actual repo. */
  id: string;
  slug: string;
  /** Display name. */
  name: string;
  /** Monospace short form used on the deck and in diagrams. */
  codename: string;
  /** Domain line above the title. Uppercase, `//` separated. */
  category: string;
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
  /** Case-study headline. States the hard part, not the category. */
  headline: string;
  /**
   * The same system explained twice. `executive` is the benefit a budget holder
   * is buying; `telemetry` is the mechanism an engineer will check. The mode
   * toggle picks which one the deck shows.
   */
  pitch: { executive: string; telemetry: string };
  /** Three chips pinned under the demo. Short, no sentences. */
  callouts: string[];
  /** One line telling the reader what the embedded demo lets them do. */
  demoHint: string;
  metrics: Metric[];
  problem: { lede: string; points: string[] };
  design: { lede: string; nodes: ArchNode[]; edges: ArchEdge[] };
  solutions: { choice: string; why: string }[];
  results: { lede: string };
}

export const PROJECTS: ProjectCase[] = [
  {
    id: "omnibus_nss",
    slug: "omnibus",
    name: "Omnibus",
    codename: "OMNIBUS",
    category: "ENTERPRISE INFRASTRUCTURE // TRANSIT CORE",
    station: "backend",
    status: "Live",
    environment: "Production",
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
    headline: "Two passengers, one seat, and a database that refuses to blink",
    pitch: {
      executive:
        "A fault-tolerant booking and route-management platform. The seat map is live, the hold is transactional, and peak demand cannot oversell the vehicle — so the last seat on a full route stops being a support ticket.",
      telemetry:
        "Concurrency-safe reservations: the ACID boundary is drawn at the hold, contested rows are taken with SELECT … FOR UPDATE, RBAC is enforced per endpoint and the client is generated from the OpenAPI contract. Ships as containers onto a Kubernetes cluster.",
    },
    callouts: ["Row-level seat locks", "No overbooking", "k8s deploy"],
    demoHint:
      "Send two passengers at the same seat — the second request loses at the lock, not at a nightly reconciliation job.",
    metrics: [
      {
        value: "99.99%",
        label: "Transaction integrity",
        basis: "target",
        note: "A reservation either holds a seat or fails loudly. There is no partial booking state for support to unpick afterwards.",
      },
      {
        value: "Zero",
        label: "Overbooking",
        basis: "target",
        note: "Enforced by the lock and covered by a concurrent-request test, rather than detected by reconciliation after the passenger has paid.",
      },
      {
        value: "Containerised",
        label: "k8s mesh",
        basis: "observed",
        note: "Runs as containers on a Kubernetes cluster behind one ingress — the deployment you can open from this page.",
      },
    ],
    problem: {
      lede: "Booking systems fail in a specific, expensive way: they are correct right up to the moment two people want the same thing at the same time, which is also the moment the business makes its money.",
      points: [
        "Read-then-write seat selection is a race. Two requests both see the seat as free, both write, and the second passenger finds out at the door.",
        "Overbooking gets treated as a reconciliation problem — a nightly job and an apology — rather than as a constraint the write path should never have been allowed to violate.",
        "Route, fleet and schedule data drifts apart because each surface reads it slightly differently, so the seat map and the timetable disagree at peak.",
        "Access control arrives as an afterthought: the dispatcher endpoint and the passenger endpoint are the same endpoint with a different UI in front of it.",
      ],
    },
    design: {
      lede: "One service owns the reservation and nothing else is allowed to write a seat. Everything contested funnels through a single transactional path that is short enough to hold a row lock without hurting throughput.",
      nodes: [
        { id: "ingress", label: "k8s ingress", kind: "entry", col: 0, row: 0 },
        { id: "api", label: "Spring REST API", kind: "service", col: 1, row: 0 },
        { id: "rbac", label: "RBAC / JWT", kind: "service", col: 1, row: 1 },
        {
          id: "booking",
          label: "Booking service",
          kind: "service",
          col: 2,
          row: 0,
        },
        { id: "routes", label: "Routes & fleet", kind: "service", col: 2, row: 1 },
        { id: "pg", label: "Postgres · row locks", kind: "store", col: 3, row: 0 },
        { id: "ledger", label: "Ticket ledger", kind: "store", col: 3, row: 1 },
      ],
      edges: [
        { from: "ingress", to: "api" },
        { from: "ingress", to: "rbac" },
        { from: "rbac", to: "booking", label: "scoped token" },
        { from: "api", to: "booking", label: "reserve" },
        { from: "api", to: "routes" },
        { from: "booking", to: "pg", label: "FOR UPDATE" },
        { from: "booking", to: "ledger" },
        { from: "routes", to: "pg" },
      ],
    },
    solutions: [
      {
        choice: "SELECT … FOR UPDATE on the contested seat row",
        why: "The second writer blocks instead of overwriting, and the transaction it blocks on is measured in milliseconds because the hold is the only work inside it. Optimistic retries were the alternative and they turn a full route into a retry storm exactly when the route is full.",
      },
      {
        choice: "A single write path for reservations",
        why: "Every other surface — dispatcher, timetable, seat map — reads. One writer is what makes the invariant checkable at all; two writers make it a policy nobody can enforce.",
      },
      {
        choice: "OpenAPI as the contract, not as documentation",
        why: "The client is generated from the spec, so a breaking field change fails a build instead of surfacing as a blank seat map in production.",
      },
      {
        choice: "RBAC at the endpoint, deployed per container",
        why: "Roles are resolved before the handler runs and the same image serves every environment. A dispatcher capability cannot be reached by guessing a passenger URL.",
      },
    ],
    results: {
      lede: "Omnibus is deployed and open — the link above is the running system, not a staging mirror. The figures below are its design budgets, and the environment badge tells you which of them we have watched in production.",
    },
  },
  {
    id: "miw_eshop",
    slug: "commerce-core",
    name: "MIW Commerce Platform",
    codename: "COMMERCE CORE",
    category: "HIGH-THROUGHPUT COMMERCE // ORDER PIPELINES",
    station: "commerce",
    status: "In build",
    environment: "Internal",
    variant: "checkout",
    host: "commerce.miw.internal/checkout",
    stack: ["Next.js", "Node.js / Go", "PostgreSQL", "Redis", "Stripe Gateway"],
    headline: "A checkout that survives the flash sale it was built for",
    pitch: {
      executive:
        "A headless storefront built for the day the traffic actually arrives. Checkout completes in one pass, stock stays truthful while a sale is running, and a payment confirmed twice still bills once.",
      telemetry:
        "Idempotent webhook handling keyed on the payment intent, a two-tier cache in front of the catalogue, and invoice generation pushed onto a distributed queue so the checkout path never waits on a PDF.",
    },
    callouts: ["Idempotent payment hooks", "Two-tier Redis cache", "Queued invoicing"],
    demoHint:
      "Deliver the same Stripe webhook twice — the second delivery settles to the same order id and charges nothing.",
    metrics: [
      {
        value: "Sub-second",
        label: "Checkout commit",
        basis: "target",
        note: "Budget for the path from submit to a confirmed order. Invoicing and email are queued out of it precisely so they cannot spend it.",
      },
      {
        value: "Exactly once",
        label: "Payment hooks",
        basis: "target",
        note: "Gateways retry by design. Deduplication on the payment-intent id makes redelivery a no-op instead of a second charge.",
      },
      {
        value: "> 94%",
        label: "Cache hit ratio",
        basis: "target",
        note: "Catalogue reads served from process memory then Redis, so a sale spike lands on cache rather than on Postgres.",
      },
    ],
    problem: {
      lede: "Commerce platforms are tested by their worst hour, not their average one. A flash sale finds every place where the checkout path does more work than it needs to and every place where a retry is treated as a new intent.",
      points: [
        "Payment gateways retry webhooks. A handler without a dedupe key turns that guarantee into duplicate orders, duplicate invoices and a refund queue.",
        "Catalogue reads hit the database on every render, so the traffic spike the marketing team worked for is the thing that takes the shop down.",
        "Invoice and receipt generation sits inline in the checkout request, which means the slowest possible dependency is on the critical path to taking money.",
        "Stock is decremented optimistically in application code, so two concurrent orders can both succeed against the last unit.",
      ],
    },
    design: {
      lede: "Two entry points, one order pipeline. A shopper's checkout and a gateway's webhook are different traffic with different failure modes, and they converge only at the point where the order is settled.",
      nodes: [
        { id: "shopper", label: "Shopper", kind: "entry", col: 0, row: 0 },
        {
          id: "stripe",
          label: "Stripe webhook",
          kind: "entry",
          col: 0,
          row: 1,
        },
        {
          id: "storefront",
          label: "Next.js storefront",
          kind: "service",
          col: 1,
          row: 0,
        },
        {
          id: "hooks",
          label: "Idempotent handler",
          kind: "service",
          col: 1,
          row: 1,
        },
        { id: "orders", label: "Order service", kind: "service", col: 2, row: 0 },
        { id: "cache", label: "Redis · two-tier", kind: "store", col: 3, row: 0 },
        { id: "queue", label: "Invoice queue", kind: "stream", col: 3, row: 1 },
        { id: "pg", label: "Postgres · orders", kind: "store", col: 4, row: 0 },
      ],
      edges: [
        { from: "shopper", to: "storefront" },
        { from: "stripe", to: "hooks", label: "delivery ×N" },
        { from: "storefront", to: "orders", label: "checkout" },
        { from: "orders", to: "cache", label: "catalogue" },
        { from: "orders", to: "queue", label: "invoice job" },
        { from: "orders", to: "pg", label: "reserve stock" },
        { from: "hooks", to: "pg", label: "settle once" },
      ],
    },
    solutions: [
      {
        choice: "Dedupe on the payment-intent id, inside the settling transaction",
        why: "An insert with a unique constraint on the intent is what makes redelivery safe — a cache of seen ids is a race with a shorter window, not a fix.",
      },
      {
        choice: "Two-tier cache: process memory in front of Redis",
        why: "The hot path for a sale is a handful of product pages read thousands of times. The in-process tier absorbs that without a network hop; Redis keeps the tiers coherent across instances.",
      },
      {
        choice: "Invoices and receipts on a queue, not in the request",
        why: "Document generation is slow and occasionally fails. Off the critical path it is a retry; on it, it is a customer watching a spinner after their card was charged.",
      },
      {
        choice: "Stock reserved by the database, not by the application",
        why: "The decrement and the order insert are the same transaction, so the last unit is sold once. Anything else is an eventual-consistency story told to a customer who already paid.",
      },
    ],
    results: {
      lede: "Commerce Core runs internally and has no public deployment yet, so there is nothing here to click and nothing here we are asking you to take on trust. These are the budgets it is being built against.",
    },
  },
  {
    id: "wovie_next",
    slug: "wovie",
    name: "Wovie",
    codename: "WOVIE",
    category: "CONSUMER WEB // STREAMING & DX",
    station: "labs",
    status: "In build",
    environment: "Source available",
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
    headline: "A media catalogue that never makes you wait to decide",
    pitch: {
      executive:
        "A high-velocity streaming portal and media catalogue. Browsing, search and personal libraries land instantly, so the viewer spends their attention choosing something to watch rather than waiting to find out what exists.",
      telemetry:
        "SSR with ISR revalidation at the Vercel edge, typed schemas end to end through Prisma, hydration limited to the interactive surface, and client-side routing under 100ms because the next route's payload is already in flight.",
    },
    callouts: ["Edge ISR cache", "Typed end to end", "Sub-100ms routing"],
    demoHint:
      "Flip the edge cache cold and warm — the route budget changes, the payload shape does not.",
    metrics: [
      {
        value: "< 90ms",
        label: "p99 route change",
        basis: "target",
        note: "Budget for a client-side navigation with the edge cache warm. Prefetch is what pays for it, not a faster server.",
      },
      {
        value: "Zero",
        label: "Cloud cost",
        basis: "observed",
        note: "Runs inside free-tier edge and serverless limits. An architecture constraint with teeth: nothing can be solved by provisioning.",
      },
      {
        value: "100%",
        label: "Type-safe data path",
        basis: "observed",
        note: "Generated Prisma types and typed API boundaries, with no escape hatch between the database row and the rendered component.",
      },
    ],
    problem: {
      lede: "Catalogue interfaces are latency problems wearing a content costume. The library is large, the data is third-party, and every millisecond between a click and a poster is a viewer deciding to do something else.",
      points: [
        "Fetching a third-party catalogue on every request makes an upstream API's bad day your interface's bad day.",
        "Rendering the whole page on the client puts the slowest device in the audience on the critical path to the first poster.",
        "Untyped API responses let a renamed upstream field ship as a blank card, and it is always spotted by a user rather than by CI.",
        "Personal libraries need real per-user reads, which is exactly the traffic a naive cache strategy cannot serve and a naive database strategy cannot afford.",
      ],
    },
    design: {
      lede: "Everything that can be static is static at the edge; only what belongs to a specific viewer touches the database. The split is drawn once, at the routing layer, rather than negotiated per feature.",
      nodes: [
        { id: "visitor", label: "Visitor", kind: "entry", col: 0, row: 0 },
        {
          id: "edge",
          label: "Edge middleware",
          kind: "service",
          col: 1,
          row: 0,
        },
        { id: "rsc", label: "RSC render", kind: "service", col: 2, row: 0 },
        { id: "isr", label: "ISR cache", kind: "store", col: 3, row: 1 },
        { id: "prisma", label: "Prisma client", kind: "service", col: 3, row: 0 },
        { id: "pg", label: "Postgres · libraries", kind: "store", col: 4, row: 0 },
        { id: "tmdb", label: "TMDB catalogue", kind: "model", col: 4, row: 1 },
      ],
      edges: [
        { from: "visitor", to: "edge" },
        { from: "edge", to: "rsc", label: "cache miss" },
        { from: "rsc", to: "isr", label: "revalidate" },
        { from: "rsc", to: "prisma" },
        { from: "prisma", to: "pg", label: "per-viewer" },
        { from: "prisma", to: "tmdb", label: "catalogue" },
      ],
    },
    solutions: [
      {
        choice: "ISR at the edge for everything catalogue-shaped",
        why: "The catalogue is the same for every viewer, so it should be rendered once per revalidation window rather than once per visit. An upstream outage then degrades to stale data instead of to an error page.",
      },
      {
        choice: "Server components by default, hydration by exception",
        why: "The poster grid ships as markup. Only the controls that actually respond to a click carry JavaScript, which is what keeps a large page cheap on a mid-range phone.",
      },
      {
        choice: "Generated types across the whole data path",
        why: "A schema change becomes a type error at the boundary it broke. The alternative is a runtime check per call site, which is the same work done worse and later.",
      },
      {
        choice: "Route prefetch on intent, not on viewport",
        why: "Prefetching everything visible spends the free-tier budget on routes nobody opens. Prefetching on hover and focus buys the same perceived speed for a fraction of the requests.",
      },
    ],
    results: {
      lede: "Wovie's source is public; there is no deployment on this page because the one we run is not open to strangers. The budgets below are the ones the build is held to.",
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

/** Printed under any table of metrics. The legend is load-bearing. */
export const BASIS_NOTE: Record<Basis, string> = {
  observed: "Observed on the build linked from this page",
  target: "Design budget — tested against, not a client result",
};
