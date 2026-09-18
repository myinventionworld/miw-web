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

export type StationId = "backend" | "commerce" | "labs" | "guild";

/** Business reads outcomes, telemetry reads mechanism. Same station either way. */
export type Mode = "business" | "telemetry";

export type ProjectStatus =
  | "Live"
  | "Public beta"
  | "In build"
  | "Internal MVP";

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

/**
 * Station 04 sells a way of working, so it gets an offer card, not an artifact.
 * No headline of its own — `copy[mode].headline` is the station's claim, and the
 * programme copy used to restate it a paragraph later in slightly worse words.
 */
export interface Program {
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
  program?: Program;
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
      { label: "Stack", value: "Java · Spring Boot · Go · Postgres · k8s" },
      { label: "Latency", value: "p99 < 120ms, allocated per hop" },
      { label: "Pattern", value: "ACID at the contested row · bulkheaded services" },
      // Applied AI sits on this station rather than on one of its own. It is a
      // capability we sell and integrate; it is not yet a system of ours anyone
      // can open, and a station with no artifact is exactly the empty promise
      // this rebuild exists to remove.
      { label: "Autonomy", value: "Agent integrations, same review gate" },
    ],
  },
  {
    id: "commerce",
    index: "02",
    pillar: "Throughput",
    nav: "Commerce",
    title: "High-Throughput Commerce & Order Pipelines",
    anchor: 0.3,
    cta: { label: "Stress-Test My Checkout" },
    copy: {
      business: {
        headline: "The sale you spent the budget on is the sale you can serve.",
        lede: "Checkout completes in one pass, stock stays truthful while the campaign is running, and a payment confirmed twice still bills the customer once.",
        problem:
          "A promotion works, traffic arrives, and the shop picks that hour to get slow. Carts are abandoned at the payment step, two customers buy the last unit, and a retried webhook charges someone twice — every one of which costs more than the campaign made.",
        solution:
          "We rebuild the order pipeline around the worst hour rather than the average one. The commit path is short, the catalogue is served from cache, documents and email leave the critical path, and duplicate payment events settle to one order.",
        proof: [
          "Checkout holds at peak",
          "One charge per order",
          "Stock stays truthful",
        ],
      },
      telemetry: {
        headline: "Idempotent at the boundary. Cached in two tiers. Queued off the hot path.",
        lede: "Gateways retry by design, so the webhook handler dedupes on the payment intent inside the settling transaction rather than hoping delivery is unique.",
        problem:
          "Stock decremented in application code, catalogue reads going to Postgres on every render, invoice generation inline in the checkout request, and a webhook handler that treats redelivery as a new intent.",
        solution:
          "Reservation and settlement in one transaction, a process-memory tier in front of Redis for catalogue reads, invoicing on a distributed queue, and a unique constraint on the payment intent doing the deduplication.",
        proof: [
          "Exactly-once settlement",
          "Cache hit > 94% target",
          "Sub-second commit budget",
        ],
      },
    },
    specs: [
      { label: "Stack", value: "Next.js · Node / Go · Postgres · Redis · Stripe" },
      { label: "Latency", value: "submit → confirmed order < 1s" },
      { label: "Pattern", value: "Idempotent hooks · two-tier cache · queued docs" },
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
      { label: "Stack", value: "Next.js · TypeScript · Prisma · Vercel Edge" },
      { label: "Latency", value: "p99 route change < 90ms" },
      { label: "Pattern", value: "Edge ISR · typed end to end · zero-cost hosting" },
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
      "Fault-tolerant backends, commerce pipelines and architecture audits for teams that already have traffic.",
    stations: ["backend", "commerce"],
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
  status: "Accepting 2 client projects for Q3/Q4",
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
 * Three intents, three forms. Mixing a developer's portfolio link into the same
 * field set as a budget range is what made the old single form ask everyone for
 * things that did not apply to them.
 *
 * "Hire the studio" used to be one tab covering both a greenfield build and a
 * look at a system that already exists. They are different conversations: one
 * starts from what you want, the other from what already breaks, and the second
 * is the cheaper first step for most of the people who arrive here.
 */
export const CONSOLE_TABS = [
  {
    id: "engineering",
    flag: "--client-engineering",
    label: "Client Engineering",
    heading: "Ready to build something that holds?",
    note: "A new build, an MVP, or an AI integration on top of a system you already run.",
  },
  {
    id: "audit",
    flag: "--architecture-audit",
    label: "Architecture Audit",
    // Not "build". An audit delivers a document and a ranked queue of work; a
    // heading that promises a build here is how an audit becomes a scope fight
    // in week two.
    heading: "Find out what breaks first — before it does.",
    note: "The system works and the growth curve says it will not. We read it and write down what breaks first.",
  },
  {
    id: "guild",
    flag: "--join-guild",
    label: "Join the Guild",
    heading: "Not an internship. A crew, a review gate and a cut of the work.",
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
  title: "The MIW Engineering Guild",
  lede: "We are not an outsourcing galley. We are an engineering laboratory: ambitious first- and second-year developers on real production work, under Principal-level supervision, paid a share of what it earns.",
  body: "This is not an internship and it is not a course. You join a crew building a system that a paying client depends on, your work goes through the same review gate as everyone else's, and when the project earns money you earn a cut of it. The strongest work becomes a lab product with its builders on the cap table.",
  tracks: [
    {
      label: "Real enterprise stack",
      body: "Transactional booking platforms, payment pipelines and catalogue systems under real load — not a to-do app.",
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
  /**
   * Readiness, not a checklist of things you must already know. We teach the
   * stack; what cannot be taught in a term is the willingness to be wrong about
   * it in public every week. Kept separate from `expectations` because a reader
   * who conflates the two decides they are unqualified and closes the tab.
   */
  readiness: [
    {
      label: "The stack you would be dropped into",
      body: "Go and Java on the service side, Next.js and TypeScript on the surface, Kubernetes underneath. You are not expected to arrive fluent in all of it — you are expected to be willing to be a beginner in public, weekly.",
    },
    {
      label: "Event-driven thinking",
      body: "Queues, retries, at-least-once delivery and what it costs. If the phrase 'this handler will be called twice' does not yet worry you, this is the part of the job that will teach you why it should.",
    },
    {
      label: "Deterministic code",
      body: "Same input, same output, same result on someone else's machine. Code whose behaviour depends on timing, ordering or a machine's local state is the thing the review gate exists to catch.",
    },
  ],
  cta: "Apply to the Guild",
} as const;

/**
 * Directions rather than headcount. We are not filling a seat with a fixed
 * title — a strong applicant on any of these gets a crew built around them.
 *
 * Each one names the system you would actually be put on, and all three are
 * systems in `data/projects.ts` that a reader can go and inspect. A track
 * advertising work on something we do not run is how an incubator turns into a
 * course.
 */
export const GUILD_OPENINGS = [
  {
    id: "backend",
    label: "Backend & Distributed Systems",
    system: "OMNIBUS",
    level: "Open to first-year students through working engineers",
    stack: ["Java", "Spring Boot", "Go", "Kubernetes", "Postgres"],
    body: "Services that hold under load, and transactions that hold under contention. You will work on locking, failure domains and deploy topology on a platform that is already serving requests.",
    work: [
      "Own an endpoint end to end: contract, transaction boundary, failure response, the runbook when it degrades.",
      "Write the concurrent test that proves two requests for the last seat cannot both win, then make it pass.",
      "Take a latency regression from the p99 chart down to the query that spent the budget.",
    ],
    signal:
      "Show us something concurrent you wrote and can explain the failure modes of.",
  },
  {
    id: "commerce",
    label: "Commerce, Payments & Throughput",
    system: "COMMERCE CORE",
    level: "Open to anyone who wants the hard part of a checkout, not the UI",
    stack: ["Go", "Node.js", "Redis", "Postgres", "Stripe"],
    body: "Order pipelines built for the worst hour: idempotent payment handling, cache tiers, queued documents. This is also where our applied-AI work lands first, because an order pipeline is where automation has something measurable to do.",
    work: [
      "Make a webhook handler idempotent and prove it by replaying a real delivery twice.",
      "Load-test the catalogue path and move the ceiling by a cache tier rather than by a bigger instance.",
      "Move something slow off the checkout path onto a queue without losing the failure signal.",
    ],
    signal:
      "Show us something you built that handles money, retries or both, and tell us what you got wrong first.",
  },
  {
    id: "frontend",
    label: "Modern Frontend & Systems UI",
    system: "WOVIE",
    level: "Open to anyone who can make a dense interface stay fast",
    stack: ["Next.js", "TypeScript", "Tailwind", "Prisma", "WebGL"],
    body: "Interfaces over large data sets and dense operational readouts. Performance is a requirement on this track, not a pass somebody does later.",
    work: [
      "Hold a route-change budget on a page rendering a catalogue, with the cache cold.",
      "Cut hydration down to the surface that actually responds to a click, and measure the difference.",
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
