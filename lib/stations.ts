/**
 * Single source of truth for the journey. The navbar, the mega-drawer, the
 * floating dock, the console, the /careers route and the 3D scene all read from
 * here, so changing the pitch is a content edit rather than a refactor.
 *
 * Four stations carry the two engines: 01–02 are the studio's client work,
 * 03 is the product lab it funds, 04 is the guild model both run on. The
 * transmission console is the fifth and final parking point.
 *
 * Every station is written twice — once for the person who signs the contract
 * and once for the person who will have to maintain it. `Mode` picks which.
 * Positioning lives in `.agents/product-marketing.md`.
 */

export type StationId = "backend" | "ai" | "labs" | "guild";

/** Business reads outcomes, telemetry reads mechanism. Same station either way. */
export type Mode = "business" | "telemetry";

/** Which generative visual the dock renders for this station. */
export type Variant = "topology" | "cluster" | "query" | "experiments";

export type ProjectStatus =
  | "Live"
  | "Public beta"
  | "In build"
  | "Internal MVP";

export interface Project {
  code: string;
  name: string;
  summary: string;
  stack: string[];
  status: ProjectStatus;
  /** Set only when there is something real to open. */
  href?: string;
}

/**
 * Value first, tech proof second. `headline` is the biggest text on the
 * station and states an outcome; everything under it is the argument for why
 * that outcome is credible.
 */
export interface StationCopy {
  headline: string;
  lede: string;
  problem: string;
  solution: string;
  proof: string[];
}

export interface Featured {
  codename: string;
  status: ProjectStatus;
  stack: string[];
  blurb: string;
  variant: Variant;
}

/** Station 04 sells a way of working, so it gets an offer card, not an artifact. */
export interface Program {
  headline: string;
  points: { label: string; body: string }[];
}

export interface Station {
  id: StationId;
  index: string;
  /** Tag under the index — CORE SYSTEMS, AUTONOMY, VENTURE R&D, INCUBATOR. */
  pillar: string;
  /** Label in the top bar and the HUD. */
  nav: string;
  title: string;
  /** Scroll position this station is parked at, 0..1. */
  anchor: number;
  cta: { label: string; href?: string };
  copy: Record<Mode, StationCopy>;
  /**
   * The engineering readout, shown in both modes. A CTO who lands mid-scroll
   * should not have to find a toggle to learn what the thing is built out of.
   */
  specs: { label: string; value: string }[];
  featured?: Featured;
  program?: Program;
  projects: Project[];
}

export const STATIONS: Station[] = [
  {
    id: "backend",
    index: "01",
    pillar: "Core Systems",
    nav: "High-Load Backend",
    title: "High-Load & Critical Backend",
    anchor: 0.06,
    cta: { label: "Request Architecture Audit" },
    copy: {
      business: {
        headline: "Your busiest day stops being a risk on the calendar.",
        lede: "Traffic spikes get absorbed instead of collapsing the queue, and releases go out without a maintenance window.",
        problem:
          "Services fall over when the traffic actually arrives, and years of tangled code mean every release is a coin flip. The bill lands twice — revenue lost during the outage, and an engineering team that has stopped shipping anything else.",
        solution:
          "We rebuild the load-bearing path. Work is isolated so one failure cannot pull the rest down with it, spikes get absorbed instead of collapsing the queue, and releases go out without a maintenance window.",
        proof: [
          "99.99% uptime target",
          "Spikes absorbed, not escalated",
          "Releases without downtime",
        ],
      },
      telemetry: {
        headline: "Distributed by design. Consistent under partition.",
        lede: "Failure domains get drawn before the first endpoint exists, and the write path is rehearsed against broker loss weekly.",
        problem:
          "Synchronous fan-out over shared mutable state, unbounded queues, no failure domains. p99 collapses the moment one dependency slows down, and there is no replay to reason about afterwards.",
        solution:
          "Bulkheaded services on an asynchronous event backbone: consumer-side idempotency, partition-aware backpressure, bounded replay. Failure domains get drawn before the first endpoint exists.",
        proof: [
          "99.99% uptime target",
          "p99 < 120ms budget",
          "Go · Java · Kafka · k8s",
        ],
      },
    },
    specs: [
      { label: "Stack", value: "Go · Java · Kafka · Postgres · k8s" },
      { label: "Latency", value: "p99 < 120ms, allocated per hop" },
      { label: "Pattern", value: "Event-driven · bulkheaded · replayable" },
    ],
    featured: {
      codename: "MERIDIAN",
      status: "Live",
      stack: ["Go", "Kafka", "Postgres", "Kubernetes"],
      blurb:
        "An event backbone with exactly-once semantics at the consumer edge and replay that does not page anyone. Kill a broker and watch the write path hold.",
      variant: "topology",
    },
    projects: [
      {
        code: "S-01",
        name: "MERIDIAN",
        summary:
          "Event backbone with consumer-side idempotency, partition-aware backpressure and bounded replay.",
        stack: ["Go", "Kafka", "Redis"],
        status: "Live",
      },
      {
        code: "S-02",
        name: "HALYARD",
        summary:
          "Multi-region control plane. Leases, fencing tokens, and a failover path that is rehearsed weekly.",
        stack: ["Rust", "etcd", "Kubernetes"],
        status: "Live",
      },
      {
        code: "S-03",
        name: "BALLAST",
        summary:
          "Online schema migration for tables too large to lock. Backfill, verify, cut over, keep the rollback.",
        stack: ["Postgres", "Go", "Temporal"],
        status: "In build",
      },
      {
        code: "S-04",
        name: "PORTHOLE",
        summary:
          "Tracing and SLO tooling that answers which hop spent the budget, not just that the request was slow.",
        stack: ["OpenTelemetry", "ClickHouse", "Next.js"],
        status: "Live",
      },
    ],
  },
  {
    id: "ai",
    index: "02",
    pillar: "Autonomy",
    nav: "Applied AI",
    title: "Applied AI & Autonomous Infrastructure",
    anchor: 0.3,
    cta: { label: "Explore AI Integration" },
    copy: {
      business: {
        headline: "Routine hours come off the board, with a receipt for each one.",
        lede: "Agents with a job description: the model plans, ordinary code executes, and a person signs off wherever the decision is expensive.",
        problem:
          "Assistants that invent answers, no record of what they touched, and nobody willing to promise in writing that your customer data stayed inside the company.",
        solution:
          "Agents with a job description. The model plans, ordinary code executes, and a person signs off wherever the decision is expensive. Routine hours come off the board with an audit trail behind every one of them.",
        proof: [
          "Data stays inside your boundary",
          "Every action auditable",
          "Sign-off where it counts",
        ],
      },
      telemetry: {
        headline: "Deterministic pipelines. Bounded context. Zero-leak egress.",
        lede: "The model proposes a step, a policy gate signs it, and sandboxed code runs it — the model never holds a credential.",
        problem:
          "Free-form prompting against production data: unbounded context, unvalidated tool output, no egress policy and nothing to replay when it goes wrong.",
        solution:
          "Schema-validated tool calling and structured outputs, context windows with a hard ceiling, human-in-the-loop gates on privileged calls. The model chooses the step; sandboxed code runs it.",
        proof: [
          "Zero-leak egress",
          "Structured outputs",
          "Human-in-the-loop gates",
        ],
      },
    },
    specs: [
      { label: "Stack", value: "TypeScript · Python · Bedrock · ClickHouse" },
      { label: "Latency", value: "plan → first row < 2s" },
      { label: "Pattern", value: "Governed tool calling · human-in-the-loop" },
    ],
    featured: {
      codename: "WAYPOINT",
      status: "In build",
      stack: ["TypeScript", "Postgres", "ClickHouse", "Bedrock"],
      blurb:
        "The agent plans in natural language and emits one governed query. Deterministic execution, bounded context, every tool call logged and permissioned.",
      variant: "query",
    },
    projects: [
      {
        code: "I-01",
        name: "WAYPOINT",
        summary:
          "Agent runtime. The model chooses the step, sandboxed code runs it, and nothing reaches prod unreviewed.",
        stack: ["TypeScript", "WebAssembly", "Postgres"],
        status: "In build",
      },
      {
        code: "I-02",
        name: "TIDEWATER",
        summary:
          "Streaming lakehouse. Sub-second ingest, late-arrival handling, and a compaction policy you can read.",
        stack: ["Flink", "ClickHouse", "S3"],
        status: "Live",
      },
      {
        code: "I-03",
        name: "SEXTANT",
        summary:
          "Semantic layer with versioned metric definitions and lineage down to the source column.",
        stack: ["DuckDB", "TypeScript", "dbt"],
        status: "Live",
      },
      {
        code: "I-04",
        name: "DEAD RECKONING",
        summary:
          "Anomaly detection tuned for on-call: high precision, explicit alert budget, explainable firings.",
        stack: ["Rust", "ClickHouse", "Grafana"],
        status: "In build",
      },
    ],
  },
  {
    id: "labs",
    index: "03",
    pillar: "Venture R&D",
    nav: "Labs",
    title: "Venture R&D & Internal Products",
    anchor: 0.54,
    cta: { label: "Request Early Access" },
    copy: {
      business: {
        headline: "We ship our own products, on the standard we sell you.",
        lede: "Client work funds a standing R&D budget. The tools we were missing get built, run by us in production, and the ones that earn usage become products.",
        problem:
          "Most studios talk about product thinking. Very few operate the products they talk about, so nothing they ship has ever had to survive its own users.",
        solution:
          "Client work funds a standing R&D budget. We build the developer tools and analytics we were missing, run them ourselves, and the ones that earn usage become products.",
        proof: [
          "Built in-house",
          "Run in production",
          "Client work funds the lab",
        ],
      },
      telemetry: {
        headline: "Built in the lab. Held to the bar the client work is held to.",
        lede: "Lab products ship on the studio's own pipeline: deterministic builds, a content-addressed cache, an SLO and a pager.",
        problem:
          "Internal tooling normally gets the leftovers: no SLO, no release process, and no owner once the author moves on to something else.",
        solution:
          "Every lab product ships on the studio's own pipeline — deterministic builds, content-addressed cache, an SLO and a pager. Anything that cannot hold that bar does not get a public listing.",
        proof: [
          "Sub-100ms first result",
          "Deterministic builds",
          "Same pipeline as client systems",
        ],
      },
    },
    specs: [
      { label: "Stack", value: "Rust · WebAssembly · TypeScript · Next.js" },
      { label: "Latency", value: "warm rebuild < 400ms" },
      { label: "Pattern", value: "Deterministic builds · content-addressed" },
    ],
    featured: {
      codename: "KILN",
      status: "Internal MVP",
      stack: ["Rust", "WebAssembly", "TypeScript"],
      blurb:
        "Our build and release toolchain. Deterministic artifacts, content-addressed cache, no hidden state. Cold or warm, the digest is the same.",
      variant: "experiments",
    },
    projects: [
      {
        code: "V-01",
        name: "SPARROW",
        summary:
          "Edge runtime for request-path logic. Cold start under a millisecond, hard memory ceiling.",
        stack: ["Rust", "V8", "Cloudflare"],
        status: "Public beta",
      },
      {
        code: "V-02",
        name: "LODESTONE",
        summary:
          "Data contracts enforced in CI. A breaking schema change fails the producer's build, not the consumer's night.",
        stack: ["Go", "Protobuf", "Kafka"],
        status: "In build",
      },
      {
        code: "V-03",
        name: "KILN",
        summary:
          "Deterministic build toolchain with a content-addressed cache and reproducible release artifacts.",
        stack: ["Rust", "WebAssembly"],
        status: "Internal MVP",
      },
      {
        code: "V-04",
        name: "FOUNDRY",
        summary:
          "The incubation track itself — how a free tool earns a budget, a team, and eventually a price.",
        stack: ["Process", "Next.js"],
        status: "Internal MVP",
      },
    ],
  },
  {
    id: "guild",
    index: "04",
    pillar: "Incubator",
    nav: "Guild",
    title: "The Engineering Guild",
    anchor: 0.78,
    cta: { label: "Apply to the Guild", href: "/careers" },
    copy: {
      business: {
        headline: "A named engineer owns your system. Not a bench.",
        lede: "A Principal Architect owns the design and the merge gate, and a small crew builds underneath it — nothing reaches your system unread.",
        problem:
          "An agency staffs your project with whoever is on the bench this month. You pay senior rates for work that nobody senior ever read.",
        solution:
          "MIW runs as a guild. A Principal Architect owns the design and the merge gate, and a small crew builds underneath it. Everything that reaches your system passed someone who has carried the pager for one like it.",
        proof: [
          "Principal owns the design",
          "Every change reviewed",
          "Named engineer on the work",
        ],
      },
      telemetry: {
        headline: "Engineering Guild under Principal Architecture Supervision.",
        lede: "Decisions land in an architecture decision record before the code exists, and the crew builds against that record under review.",
        problem:
          "Staff augmentation hands you headcount and no architecture. Decisions get made in ticket comments, nobody writes them down, and the system drifts until a rewrite is the only option left.",
        solution:
          "One Principal Architect owns the design and the merge gate. Decisions land in an architecture decision record before the code exists, and the crew builds against that record under review.",
        proof: [
          "ADR before implementation",
          "Review gate before merge",
          "Named owner per subsystem",
        ],
      },
    },
    specs: [
      { label: "Method", value: "ADR · review gate · pairing" },
      { label: "Cadence", value: "Design review, weekly" },
      { label: "Pattern", value: "Principal-owned merge gate" },
    ],
    program: {
      headline: "A guild, not an agency bench.",
      points: [
        {
          label: "Principal supervision",
          body: "One architect owns the design and the merge gate for the whole engagement.",
        },
        {
          label: "Production standards",
          body: "Ambitious developers train on real enterprise work, reviewed line by line.",
        },
        {
          label: "Revenue share",
          body: "Royalties on commercial projects, not an internship stipend.",
        },
        {
          label: "Co-founded products",
          body: "The strongest work becomes a lab product with its builders on the cap table.",
        },
      ],
    },
    projects: [
      {
        code: "G-01",
        name: "Intake",
        summary:
          "First- and second-year developers who already build things nobody asked them to build.",
        stack: ["Portfolio", "Live review"],
        status: "Live",
      },
      {
        code: "G-02",
        name: "Mentorship",
        summary:
          "Weekly design review with the Principal Architect, on the system you are actually shipping.",
        stack: ["ADR", "Code review"],
        status: "Live",
      },
      {
        code: "G-03",
        name: "Revenue share",
        summary:
          "Royalties on the commercial projects you build, paid on the same schedule the studio is paid.",
        stack: ["Revshare"],
        status: "Live",
      },
      {
        code: "G-04",
        name: "Co-founded products",
        summary:
          "Lab products spun out with their builders on the cap table, not as work-for-hire.",
        stack: ["Equity", "Lab track"],
        status: "In build",
      },
    ],
  },
];

/* ── navigation ───────────────────────────────────────────────────────── */

/**
 * The top bar sells four things, which is not the same as four stations:
 * "Studio" is the client engine and spans two stations, and "Transmission"
 * is the console rather than a station at all.
 */
export interface NavSection {
  id: string;
  label: string;
  blurb: string;
  /** Stations listed in the drawer. Empty means the item has no drawer. */
  stations: StationId[];
  /** Where clicking the label takes you. */
  go: StationId | "console";
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "studio",
    label: "Studio",
    blurb:
      "Custom backends, architecture audits and applied AI for teams that already have traffic.",
    stations: ["backend", "ai"],
    go: "backend",
  },
  {
    id: "labs",
    label: "Labs",
    blurb: "Products the studio builds for itself first, then opens up.",
    stations: ["labs"],
    go: "labs",
  },
  {
    id: "guild",
    label: "Guild",
    blurb:
      "The incubator: production standards, Principal supervision, revenue share.",
    stations: ["guild"],
    go: "guild",
  },
  {
    id: "transmission",
    label: "Transmission",
    blurb: "Direct channel to the engineers who would do the work.",
    stations: [],
    go: "console",
  },
];

export const CONSOLE_ANCHOR = 0.97;

/* ── commercial availability ──────────────────────────────────────────── */

/**
 * Scarcity that is checkable rather than manufactured. Keep the count honest —
 * a bar that always says "2 slots left" is a bar nobody reads twice.
 */
export const AVAILABILITY = {
  status: "Accepting 2 client engagements for Q4",
  scope: "Avg scope: 4–8 weeks",
} as const;

/**
 * The standard delivered architecture is designed to, not a claim about past
 * client results. Keep it framed that way until there is a named system in
 * production to attribute numbers to.
 */
export const STANDARDS = [
  { value: "99.99%", label: "Uptime target" },
  { value: "<120ms", label: "p99 budget" },
  { value: "DevSecOps", label: "Every pipeline" },
] as const;

/* ── transmission console ─────────────────────────────────────────────── */

/**
 * Two audiences, two forms. Mixing a developer's portfolio link into the same
 * field set as a budget range is what made the old single form ask everyone
 * for things that did not apply to them.
 */
export const CONSOLE_TABS = [
  {
    id: "studio",
    flag: "--hire-studio",
    label: "Hire MIW Studio",
    note: "A build, a rescue, an audit or an AI integration. Answered by an engineer.",
  },
  {
    id: "guild",
    flag: "--join-guild",
    label: "Join the Guild",
    note: "You write code and want to build under Principal-level supervision.",
  },
] as const;

export type ConsoleTab = (typeof CONSOLE_TABS)[number]["id"];

/** What the engagement actually is. Drives the scope prompt in the form. */
export const ENGAGEMENTS = [
  {
    id: "mvp",
    label: "New build / MVP",
    prompt:
      "What are you building, who is it for, and what has to hold once it grows?",
  },
  {
    id: "rescue",
    label: "Architecture rescue",
    prompt:
      "What breaks today, how often, and what has already been tried to fix it?",
  },
  {
    id: "ai",
    label: "AI integration",
    prompt:
      "Which process are you trying to take off people, and what data does it need to touch?",
  },
  {
    id: "audit",
    label: "Architecture audit",
    prompt:
      "What is the load-bearing part of the system, and what breaks first when it grows?",
  },
] as const;

export type EngagementId = (typeof ENGAGEMENTS)[number]["id"];

/**
 * Asked up front rather than discovered on call three. A range that rules the
 * studio out is worth ten minutes of everyone's time, not ten days of it.
 */
export const BUDGETS = [
  "$5k – $10k",
  "$10k – $25k",
  "$25k+",
  "Not sure yet",
] as const;

export const STAGES = [
  "Pre-seed / idea",
  "Seed / first traction",
  "Series A+",
  "Established business",
] as const;

export const TIMELINES = [
  "Starting now",
  "Within a month",
  "This quarter",
  "Scoping only",
] as const;

/* ── guild ────────────────────────────────────────────────────────────── */

/** Recruit-facing detail. The client-facing pitch is station 04 above. */
export const GUILD = {
  eyebrow: "MIW Labs — Guild & Incubator",
  title: "The Engineering Guild & Incubator",
  lede: "We take ambitious first- and second-year developers, put them on real enterprise work under Principal-level supervision, and pay them a share of it.",
  body: "This is not an internship and it is not a course. You join a crew building a system that a paying client depends on, your work goes through the same review gate as everyone else's, and when the project earns money you earn a cut of it. The strongest work becomes a lab product with its builders on the cap table.",
  tracks: [
    {
      label: "Real enterprise stack",
      body: "Distributed services, event backbones, AI pipelines running under an SLA — not a to-do app.",
    },
    {
      label: "Principal-level mentorship",
      body: "Weekly design review with the architect who owns the system, on the code you shipped that week.",
    },
    {
      label: "Royalties, not a stipend",
      body: "Revenue share on the commercial projects you build, paid when the studio is paid.",
    },
    {
      label: "Co-founded startups",
      body: "Lab products spun out with equity for the people who built them.",
    },
  ],
  expectations: [
    "You already build things nobody asked you to build.",
    "You can read a codebase you did not write without giving up.",
    "You want the review that tells you what is wrong, not the one that says nice work.",
  ],
  cta: "Apply to the Guild",
} as const;

/**
 * Directions rather than headcount. We are not filling a seat with a fixed
 * title — a strong applicant on any of these gets a crew built around them.
 */
export const GUILD_OPENINGS = [
  {
    id: "backend",
    label: "Backend & Distributed Systems",
    system: "MERIDIAN",
    level: "Open to first-year students through working engineers",
    stack: ["Go", "Java", "Kubernetes", "Kafka", "Postgres"],
    body: "Services that hold under load. You will work on failure domains, backpressure and replay on a system that a paying client depends on.",
    work: [
      "Own a consumer end to end: schema, idempotency, offset handling, the runbook when it falls behind.",
      "Sit in the broker-loss drill and write up what the system actually did versus what the design said it would.",
      "Take a latency regression from the p99 chart down to the hop that spent the budget.",
    ],
    signal:
      "Show us something concurrent you wrote and can explain the failure modes of.",
  },
  {
    id: "ai",
    label: "Applied AI & Agentic Systems",
    system: "WAYPOINT",
    level: "Open to anyone who has shipped something an LLM actually drives",
    stack: ["Python", "TypeScript", "Bedrock", "Claude", "MCP"],
    body: "Agent runtimes with policy gates, structured tool calling and audit trails. Prompting is the smallest part of this track.",
    work: [
      "Add a tool to the sandbox: schema both directions, the permission it needs, the audit record it leaves.",
      "Build the eval that proves a planner change did not quietly get worse.",
      "Work the retrieval layer so context stays bounded as the corpus grows.",
    ],
    signal:
      "Show us an agent or pipeline you built that does something real, not a wrapper around a chat box.",
  },
  {
    id: "frontend",
    label: "Modern Frontend & Systems UI",
    system: "KILN",
    level: "Open to anyone who can make a dense interface stay fast",
    stack: ["Next.js", "TypeScript", "Tailwind", "WebGL"],
    body: "Interfaces for dense operational data — dashboards, consoles, telemetry. Performance is a requirement here, not a later pass.",
    work: [
      "Build a console view over a live stream that stays readable when the data gets ugly.",
      "Hold a frame budget on a page that renders thousands of rows and a scene behind them.",
      "Make the accessible path the default one, not the retrofit.",
    ],
    signal:
      "Show us an interface you built where the hard part was the data, not the styling.",
  },
] as const;

/**
 * Published because the unknown is what stops people applying. Every step is
 * something we do to their work, not a personality screen.
 */
export const HIRING_STEPS = [
  {
    step: "01",
    label: "Application",
    body: "You link the thing you built and tell us what was hard about it. A Principal Architect reads it — there is no recruiter screen and no CV parser in front of them.",
    meta: "Written answer either way",
  },
  {
    step: "02",
    label: "Code conversation",
    body: "Forty-five minutes on your own code. Why it is shaped that way, what you tried that did not work, what you would change now. No whiteboard puzzles.",
    meta: "45 minutes, remote",
  },
  {
    step: "03",
    label: "Paired change",
    body: "A small real change to one of our systems, paired with the architect who owns it. You see the review gate from the inside before you commit to anything.",
    meta: "Timeboxed, paid",
  },
  {
    step: "04",
    label: "Crew placement",
    body: "You join a crew with a named architect and a weekly design review. Revenue-share terms are in writing before your first commit, not after it.",
    meta: "Terms in writing",
  },
] as const;

/** Answers the questions that otherwise arrive by DM. Nothing invented. */
export const CAREERS_FAQ = [
  {
    q: "Is this paid?",
    a: "You get a revenue share on the commercial projects you build, paid when the studio is paid, and equity in lab products that spin out with you on them. It is not a stipend and it is not an unpaid internship.",
  },
  {
    q: "Do I need commercial experience?",
    a: "No. The filter is the work you link, not where it was written. Most of the intake is first- and second-year students who build things nobody asked them to build.",
  },
  {
    q: "Can I do this alongside university?",
    a: "The programme is designed around people who are still studying, so yes. Tell us your realistic hours in the application and we will build the crew around them rather than pretending they do not exist.",
  },
  {
    q: "None of the three directions fit me.",
    a: "These are directions, not headcount. Apply to the closest one and say so in the last field — a strong applicant gets a crew built around them.",
  },
  {
    q: "What happens to my application?",
    a: "A Principal Architect reads it and you get a written answer, usually inside a week. If it is a no, the answer says what would change it.",
  },
] as const;

/** Extended intake. Deliberately asks for work, not for a CV. */
export const GUILD_LEVELS = [
  "1st year",
  "2nd year",
  "3rd year+",
  "Self-taught",
  "Already working",
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
  Live: "border-signal/60 text-signal",
  "Public beta": "border-beam/60 text-beam",
  "In build": "border-amber-400/60 text-amber-300",
  "Internal MVP": "border-white/35 text-platinum",
};
