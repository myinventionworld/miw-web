/**
 * Single source of truth for the journey. The navbar, the mega-drawer, the
 * floating dock and the 3D scene all read from here, so adding a station or a
 * project is a content edit rather than a refactor.
 */

export type StationId = "studio" | "systems" | "intelligence" | "venture";

/** Which generative visual the dock renders for this station. */
export type Variant = "topology" | "cluster" | "query" | "experiments";

export type ProjectStatus = "Live" | "In build" | "Pilot" | "Internal";

export interface Project {
  code: string;
  name: string;
  summary: string;
  stack: string[];
  status: ProjectStatus;
}

export interface Station {
  id: StationId;
  index: string;
  /** Label in the top bar. */
  nav: string;
  /** Headline above the dock. */
  title: string;
  /** One-line thesis. */
  lede: string;
  body: string;
  /** Scroll position this station is parked at, 0..1. */
  anchor: number;
  /** Featured artifact docked beside the celestial body. */
  featured: {
    codename: string;
    status: ProjectStatus;
    stack: string[];
    blurb: string;
    variant: Variant;
    action: string;
  };
  projects: Project[];
}

export const STATIONS: Station[] = [
  {
    id: "studio",
    index: "01",
    nav: "Studio & R&D",
    title: "Engineering Studio",
    lede: "Architecture first. Everything after that is cladding.",
    body: "Small senior teams that own the runtime, not just the repo. We start by finding the load-bearing decisions — data ownership, failure domains, the shape of the write path — and we write those down before anyone opens an editor.",
    anchor: 0.06,
    featured: {
      codename: "Service topology",
      status: "Live",
      stack: ["Go", "gRPC", "Postgres", "Kubernetes"],
      blurb: "How we map a system before we touch it: every hop, its budget, and where the latency actually goes.",
      variant: "topology",
      action: "Inspect architecture spec",
    },
    projects: [
      {
        code: "A-01",
        name: "Architecture Review",
        summary: "Two weeks inside your system. You get a written decision record, not a slide deck.",
        stack: ["Postgres", "Kafka", "Kubernetes"],
        status: "Live",
      },
      {
        code: "A-02",
        name: "Platform Modernisation",
        summary: "Strangler-fig migration off a monolith, with the cutover rehearsed before it ships.",
        stack: ["Go", "Temporal", "Terraform"],
        status: "Live",
      },
      {
        code: "A-03",
        name: "Embedded Team",
        summary: "Three to six engineers inside your org chart, reviewing your code and carrying your pager.",
        stack: ["TypeScript", "Go", "Rust"],
        status: "Live",
      },
      {
        code: "A-04",
        name: "Technical Due Diligence",
        summary: "Pre-investment read on a codebase: what is real, what is load-bearing, what is a rewrite.",
        stack: ["Static analysis", "Postgres", "Tracing"],
        status: "Pilot",
      },
    ],
  },
  {
    id: "systems",
    index: "02",
    nav: "Systems & Cloud",
    title: "Distributed Systems & Cloud Platforms",
    lede: "Engines that hold when the load arrives.",
    body: "Event backbones, multi-region control planes and the unglamorous parts — backpressure, idempotency, replay. We design for the day a partition heals and two regions disagree about who owns a row.",
    anchor: 0.3,
    featured: {
      codename: "MERIDIAN",
      status: "Live",
      stack: ["Go", "Kafka", "Kubernetes", "Terraform"],
      blurb: "An event backbone with exactly-once semantics at the consumer edge and replay that does not page anyone.",
      variant: "cluster",
      action: "Inspect architecture spec",
    },
    projects: [
      {
        code: "S-01",
        name: "MERIDIAN",
        summary: "Event backbone with consumer-side idempotency, partition-aware backpressure and bounded replay.",
        stack: ["Go", "Kafka", "Redis"],
        status: "Live",
      },
      {
        code: "S-02",
        name: "HALYARD",
        summary: "Multi-region control plane. Leases, fencing tokens, and a failover path that is tested weekly.",
        stack: ["Rust", "etcd", "Kubernetes"],
        status: "Live",
      },
      {
        code: "S-03",
        name: "BALLAST",
        summary: "Online schema migration for tables too large to lock. Backfill, verify, cut over, keep the rollback.",
        stack: ["Postgres", "Go", "Temporal"],
        status: "In build",
      },
      {
        code: "S-04",
        name: "PORTHOLE",
        summary: "Tracing and SLO tooling that answers which hop spent the budget, not just that the request was slow.",
        stack: ["OpenTelemetry", "ClickHouse", "Next.js"],
        status: "Live",
      },
    ],
  },
  {
    id: "intelligence",
    index: "03",
    nav: "Intelligence & BI",
    title: "Real-time Intelligence",
    lede: "Analytics that behave like a flight deck, not a monthly report.",
    body: "Streaming lakehouses, a semantic layer people actually trust, and forecasting that ships with its own error bars. If a number on a dashboard cannot be traced back to the row that produced it, it does not go on the dashboard.",
    anchor: 0.54,
    featured: {
      codename: "TIDEWATER",
      status: "Live",
      stack: ["ClickHouse", "Flink", "DuckDB", "Next.js"],
      blurb: "Streaming lakehouse with a governed metric layer — one definition of revenue, enforced at query time.",
      variant: "query",
      action: "Launch artifact",
    },
    projects: [
      {
        code: "I-01",
        name: "TIDEWATER",
        summary: "Streaming lakehouse. Sub-second ingest, late-arrival handling, and a compaction policy you can read.",
        stack: ["Flink", "ClickHouse", "S3"],
        status: "Live",
      },
      {
        code: "I-02",
        name: "SEXTANT",
        summary: "Semantic layer with versioned metric definitions and lineage down to the source column.",
        stack: ["DuckDB", "TypeScript", "dbt"],
        status: "Live",
      },
      {
        code: "I-03",
        name: "FORECASTLE",
        summary: "Demand and capacity forecasting that publishes prediction intervals, not just a point estimate.",
        stack: ["Python", "Ray", "Postgres"],
        status: "Pilot",
      },
      {
        code: "I-04",
        name: "DEAD RECKONING",
        summary: "Anomaly detection tuned for on-call: high precision, explicit alert budget, explainable firings.",
        stack: ["Rust", "ClickHouse", "Grafana"],
        status: "In build",
      },
    ],
  },
  {
    id: "venture",
    index: "04",
    nav: "Venture Lab",
    title: "Venture Lab",
    lede: "We fund our own experiments.",
    body: "A standing budget for tools, protocols and products nobody commissioned. Some ship as products. Some stay internal and quietly make every client engagement faster. The failures get written up too.",
    anchor: 0.78,
    featured: {
      codename: "KILN",
      status: "Internal",
      stack: ["Rust", "WebAssembly", "TypeScript"],
      blurb: "Our build and release toolchain. Deterministic artifacts, content-addressed cache, no hidden state.",
      variant: "experiments",
      action: "Launch artifact",
    },
    projects: [
      {
        code: "V-01",
        name: "KILN",
        summary: "Deterministic build toolchain with a content-addressed cache and reproducible release artifacts.",
        stack: ["Rust", "WebAssembly"],
        status: "Internal",
      },
      {
        code: "V-02",
        name: "SPARROW",
        summary: "Edge runtime for request-path logic. Cold start under a millisecond, hard memory ceiling.",
        stack: ["Rust", "V8", "Cloudflare"],
        status: "Pilot",
      },
      {
        code: "V-03",
        name: "LODESTONE",
        summary: "Data contracts enforced in CI. A breaking schema change fails the producer's build, not the consumer's night.",
        stack: ["Go", "Protobuf", "Kafka"],
        status: "In build",
      },
      {
        code: "V-04",
        name: "FOUNDRY",
        summary: "The incubation track itself — how an internal tool earns a budget, a team, and eventually a customer.",
        stack: ["Process", "Next.js"],
        status: "Internal",
      },
    ],
  },
];

/** Navbar order differs from journey order; the top bar leads with the work. */
export const NAV_ORDER: StationId[] = [
  "systems",
  "intelligence",
  "venture",
  "studio",
];

export const NAV_STATIONS: Station[] = NAV_ORDER.map(
  (id) => STATIONS.find((s) => s.id === id)!,
);

export const CONSOLE_ANCHOR = 0.97;

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
  Live: "border-signal/60 text-signal",
  "In build": "border-beam/60 text-beam",
  Pilot: "border-amber-400/60 text-amber-300",
  Internal: "border-white/35 text-platinum",
};
