/**
 * Case studies for `/systems/[slug]`.
 *
 * These are systems MIW built and operates, not client engagements — nothing
 * here carries a client's name, and the outcome numbers are the budgets each
 * system is designed and tested against rather than a result attributed to
 * someone else's business. That distinction is the whole reason this file is
 * separate from `lib/stations.ts`: the flight deck sells the capability, this
 * sells the evidence, and the evidence has to stay checkable.
 */

import type { ProjectStatus, StationId, Variant } from "./stations";

/** Column/row grid slot. Diagrams are laid out, not force-directed. */
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

export interface SystemCase {
  slug: string;
  codename: string;
  station: StationId;
  status: ProjectStatus;
  /** Which interactive demo the showcase frame renders for this system. */
  variant: Variant;
  /** Shown in the frame's address bar. Internal systems have internal hosts. */
  host: string;
  /** Set only when there is a deployment a stranger can actually open. */
  liveUrl?: string;
  kicker: string;
  title: string;
  lede: string;
  /** One line telling the reader what the embedded demo lets them do. */
  demoHint: string;
  /** Feature chips pinned over the demo frame. Three, short, no sentences. */
  callouts: string[];
  challenge: { lede: string; points: string[] };
  architecture: {
    lede: string;
    nodes: ArchNode[];
    edges: ArchEdge[];
    decisions: { choice: string; why: string }[];
  };
  outcome: {
    lede: string;
    targets: { value: string; label: string; note: string }[];
  };
}

export const SYSTEMS: SystemCase[] = [
  {
    slug: "meridian",
    codename: "MERIDIAN",
    station: "backend",
    status: "Live",
    variant: "topology",
    host: "meridian.miw.internal/ops",
    kicker: "Internal system · Core Systems",
    title: "An event backbone that survives losing a broker",
    lede: "MERIDIAN is the write path underneath our high-load work. It absorbs a traffic spike, keeps ordering guarantees per key, and lets a broker die mid-flight without anyone being paged.",
    demoHint:
      "Click a hop to see what it spends of the latency budget, and what it costs at p99.",
    callouts: ["Broker-loss drill", "Per-hop budget", "Bounded replay"],
    challenge: {
      lede: "The systems we get called into share a shape: everything is synchronous, everything shares one database, and the first slow dependency takes the whole platform with it.",
      points: [
        "Synchronous fan-out means one slow downstream call holds a connection open across every service above it.",
        "Unbounded queues hide the problem until memory runs out, then surface it as a total outage rather than degradation.",
        "With no replay, a bad deploy is unrecoverable — the events that were dropped during the window are simply gone.",
        "Nobody can answer which hop spent the latency budget, so every performance conversation starts from scratch.",
      ],
    },
    architecture: {
      lede: "The write path is split into failure domains before a single endpoint is written. Services publish facts to an ordered log; everything downstream is a consumer that can be rebuilt from it.",
      nodes: [
        { id: "edge", label: "Ingress / TLS", kind: "entry", col: 0, row: 0 },
        { id: "api", label: "API gateway", kind: "service", col: 1, row: 0 },
        { id: "auth", label: "Auth verify", kind: "service", col: 1, row: 1 },
        { id: "orders", label: "Orders service", kind: "service", col: 2, row: 0 },
        { id: "log", label: "Event log", kind: "stream", col: 3, row: 0 },
        { id: "pg", label: "Postgres", kind: "store", col: 4, row: 0 },
        { id: "proj", label: "Projections", kind: "service", col: 4, row: 1 },
      ],
      edges: [
        { from: "edge", to: "api" },
        { from: "edge", to: "auth" },
        { from: "auth", to: "orders" },
        { from: "api", to: "orders", label: "command" },
        { from: "orders", to: "log", label: "fact" },
        { from: "log", to: "pg" },
        { from: "log", to: "proj", label: "replayable" },
      ],
      decisions: [
        {
          choice: "Ordered log as the system of record",
          why: "Recovery stops being a backup restore and becomes a replay. A consumer with a bug is fixed by shipping the fix and rewinding the offset.",
        },
        {
          choice: "Offsets committed after the side effect",
          why: "At-least-once delivery plus consumer-side idempotency keys gives exactly-once behaviour where it is observable, without a distributed transaction.",
        },
        {
          choice: "Partition key on the aggregate, not the tenant",
          why: "Ordering only has to hold per aggregate. Keying on the tenant would put a single large customer on one partition and cap the whole system at that partition's throughput.",
        },
        {
          choice: "Bounded queues with explicit backpressure",
          why: "A full queue that rejects is a system telling you the truth. An unbounded queue that buffers is a system lying until the process is killed.",
        },
      ],
    },
    outcome: {
      lede: "These are the budgets MERIDIAN is built and drilled against. We publish targets we can demonstrate on our own infrastructure; results belonging to a client get published with that client's name on them, or not at all.",
      targets: [
        {
          value: "99.99%",
          label: "Uptime target",
          note: "Losing one broker is a weekly rehearsal, not an incident review.",
        },
        {
          value: "<120ms",
          label: "p99 write path",
          note: "Allocated per hop up front, so a regression has an owner.",
        },
        {
          value: "0",
          label: "Maintenance windows",
          note: "Schema and consumer changes roll forward without taking writes offline.",
        },
      ],
    },
  },
  {
    slug: "waypoint",
    codename: "WAYPOINT",
    station: "ai",
    status: "In build",
    variant: "query",
    host: "waypoint.miw.internal/console",
    kicker: "Internal system · Autonomy",
    title: "An agent that plans in language and executes in code",
    lede: "WAYPOINT is the runtime under our applied-AI work. The model is allowed to choose a step; it is never allowed to be the step. Every tool call is schema-checked, permissioned and logged before it touches data.",
    demoHint:
      "Pick a metric and a grain — the query underneath is the one the agent is allowed to emit.",
    callouts: ["Governed query layer", "Bounded context", "Every call audited"],
    challenge: {
      lede: "Most AI pilots die at the same gate: someone asks what happens when the model is wrong, and there is no answer that survives a compliance review.",
      points: [
        "Free-form prompting against production data has no egress policy — nobody can state where the customer records went.",
        "Unvalidated tool output means a hallucinated argument becomes a real write.",
        "Context grows until the bill and the latency both become unpredictable.",
        "When it does go wrong there is no trace, so the only remediation available is turning the feature off.",
      ],
    },
    architecture: {
      lede: "Planning and execution are separated by a policy gate. The model never holds a credential, never sees a raw table, and cannot widen its own permissions.",
      nodes: [
        { id: "op", label: "Operator prompt", kind: "entry", col: 0, row: 0 },
        { id: "plan", label: "Planner", kind: "model", col: 1, row: 0 },
        { id: "policy", label: "Policy gate", kind: "service", col: 2, row: 0 },
        { id: "tools", label: "Tool sandbox", kind: "service", col: 3, row: 0 },
        { id: "wh", label: "Governed warehouse", kind: "store", col: 4, row: 0 },
        { id: "audit", label: "Audit log", kind: "store", col: 4, row: 1 },
      ],
      edges: [
        { from: "op", to: "plan" },
        { from: "plan", to: "policy", label: "proposed step" },
        { from: "policy", to: "tools", label: "signed call" },
        { from: "policy", to: "audit" },
        { from: "tools", to: "wh", label: "governed SQL" },
        { from: "tools", to: "audit" },
      ],
    decisions: [
        {
          choice: "Structured tool calling, schema-validated both ways",
          why: "A malformed argument fails at the gate instead of reaching the warehouse. The failure is a typed error the planner can retry against, not a corrupted row.",
        },
        {
          choice: "A semantic layer instead of table access",
          why: "The agent emits metric names it is allowed to ask for. Column-level access never has to be granted to the model at all.",
        },
        {
          choice: "Hard context ceiling with retrieval, not a bigger window",
          why: "Cost and latency stay predictable, and a prompt-injected document cannot displace the system instructions by sheer volume.",
        },
        {
          choice: "Human sign-off gated on blast radius, not on step count",
          why: "Reads run unattended. Anything that writes, spends or emails stops for a person, so the approval queue stays short enough that people actually read it.",
        },
      ],
    },
    outcome: {
      lede: "WAYPOINT is in build and running against our own data. The numbers below are the constraints it is designed to hold, and the ones we will keep publishing as it moves toward general availability.",
      targets: [
        {
          value: "0",
          label: "Uncontrolled egress",
          note: "Inference runs inside the customer boundary; the gate has no route out.",
        },
        {
          value: "100%",
          label: "Tool calls logged",
          note: "Prompt, plan, arguments and result, retained and replayable.",
        },
        {
          value: "<2s",
          label: "Plan to first row",
          note: "Bounded context is what keeps this flat as the corpus grows.",
        },
      ],
    },
  },
  {
    slug: "kiln",
    codename: "KILN",
    station: "labs",
    status: "Internal MVP",
    variant: "experiments",
    host: "kiln.miw.internal/builds",
    kicker: "Internal system · Venture R&D",
    title: "A build toolchain with no hidden state",
    lede: "KILN is how everything else here ships. Same inputs, same digest, on your laptop or in CI, cold cache or warm. It started as a fix for our own release pain and became the lab's first real product track.",
    demoHint:
      "Run the build with the cache warm and cold — the stage timings change, the digest does not.",
    callouts: ["Content-addressed cache", "Deterministic digest", "Cold / warm parity"],
    challenge: {
      lede: "A studio running four client systems and a product lab cannot afford a release process that behaves differently depending on who ran it.",
      points: [
        "Builds that pass locally and fail in CI burn an afternoon every time, and the difference is never written down anywhere.",
        "Cache keys derived from timestamps mean the cache is either wrong or useless, and teams learn to clear it reflexively.",
        "Without a reproducible artifact there is nothing meaningful to sign, so supply-chain attestation stays theatre.",
        "Rebuild times creep up until nobody rebases, and the branches drift far enough that merges become their own project.",
      ],
    },
    architecture: {
      lede: "Every step is a pure function of its declared inputs. The cache is keyed on the hash of those inputs, so a hit is provably the same work rather than probably the same work.",
      nodes: [
        { id: "src", label: "Source graph", kind: "entry", col: 0, row: 0 },
        { id: "res", label: "Resolver", kind: "service", col: 1, row: 0 },
        { id: "cas", label: "Content cache", kind: "store", col: 2, row: 0 },
        { id: "build", label: "Sandboxed build", kind: "service", col: 3, row: 0 },
        { id: "sign", label: "Attestation", kind: "service", col: 4, row: 0 },
        { id: "reg", label: "Artifact registry", kind: "store", col: 4, row: 1 },
      ],
      edges: [
        { from: "src", to: "res" },
        { from: "res", to: "cas", label: "input hash" },
        { from: "cas", to: "build", label: "hit / miss" },
        { from: "res", to: "build" },
        { from: "build", to: "sign" },
        { from: "sign", to: "reg", label: "signed digest" },
      ],
      decisions: [
        {
          choice: "Sandboxed steps with no ambient filesystem",
          why: "A step that cannot read an undeclared file cannot depend on one. Non-determinism fails the build immediately instead of surfacing months later on a new machine.",
        },
        {
          choice: "Content-addressed cache keyed on input hash",
          why: "A cache hit is an equality proof. There is no scenario where clearing the cache changes the output, which is what makes it safe to share across machines.",
        },
        {
          choice: "Rust with a WebAssembly plugin boundary",
          why: "Language support is extensible without giving third-party plugins the host's filesystem or network.",
        },
        {
          choice: "Signing after the build, over the digest",
          why: "The signature attests to an artifact anyone can independently reproduce, rather than to a pipeline run nobody can inspect.",
        },
      ],
    },
    outcome: {
      lede: "KILN is an internal MVP — it runs every release in this studio and is not yet open to outside teams. These are the properties it holds today on our own pipelines.",
      targets: [
        {
          value: "Identical",
          label: "Digest across machines",
          note: "Cold or warm, laptop or CI, the artifact hashes the same.",
        },
        {
          value: "<400ms",
          label: "Warm rebuild",
          note: "Cached stages are skipped on proof, not on a timestamp heuristic.",
        },
        {
          value: "0",
          label: "Undeclared inputs",
          note: "The sandbox makes an accidental host dependency a build failure.",
        },
      ],
    },
  },
];

export function systemBySlug(slug: string): SystemCase | undefined {
  return SYSTEMS.find((s) => s.slug === slug);
}

export function systemForStation(station: StationId): SystemCase | undefined {
  return SYSTEMS.find((s) => s.station === station);
}

/** Lets the nav drawer link a project straight to its case study. */
export function systemByCodename(name: string): SystemCase | undefined {
  return SYSTEMS.find((s) => s.codename === name);
}

/** Address-bar badge. Honest about what is actually running where. */
export const HOST_STATE: Record<ProjectStatus, string> = {
  Live: "Production",
  "Public beta": "Public beta",
  "In build": "Staging",
  "Internal MVP": "Internal",
};
