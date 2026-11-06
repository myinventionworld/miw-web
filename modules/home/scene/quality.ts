export type Tier = "low" | "balanced" | "high";

const ORDER: readonly Tier[] = ["low", "balanced", "high"];

const rank = (tier: Tier) => ORDER.indexOf(tier);

export function stepTier(tier: Tier, by: number): Tier {
  return ORDER[Math.max(0, Math.min(ORDER.length - 1, rank(tier) + by))];
}

export const isTier = (value: unknown): value is Tier =>
  typeof value === "string" && (ORDER as readonly string[]).includes(value);

interface TierSpec {
  maxDpr: number;
  minDpr: number;
  pixelBudget: number;
  /** Whether the canvas may hold more pixels than the screen shows. */
  supersample: boolean;
}

/**
 * Every pass in the composer is full-screen and half-float, so cost follows
 * drawing-buffer pixels almost linearly. `high` keeps the 2x supersampling the
 * scene relies on for its edges (the composer cannot multisample, see
 * `Effects`), up to a 4K buffer: past that a 1x monitor would ask for 15 to 33
 * million pixels a frame.
 */
export const TIER_SPECS: Record<Tier, TierSpec> = {
  low: { maxDpr: 1, minDpr: 0.75, pixelBudget: 1920 * 1080, supersample: false },
  balanced: { maxDpr: 1.5, minDpr: 0.75, pixelBudget: 2560 * 1600, supersample: false },
  high: { maxDpr: 2, minDpr: 1, pixelBudget: 3840 * 2160, supersample: true },
};

export interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

/** In quarter steps, so resizing the window rarely changes it. */
export function dprFor(tier: Tier, { width, height, dpr }: Viewport): number {
  const spec = TIER_SPECS[tier];
  const ceiling = spec.supersample ? spec.maxDpr : Math.min(spec.maxDpr, dpr);
  const floor = Math.min(spec.minDpr, ceiling);
  const fit = Math.sqrt(spec.pixelBudget / Math.max(1, width * height));
  const ratio = Math.max(floor, Math.min(ceiling, fit));
  return Math.max(floor, Math.floor(ratio * 4 + 1e-6) / 4);
}

/**
 * Bloom's mip chain starts at half the drawing buffer, so the same number of
 * levels spreads the glow twice as wide on a 1x canvas as on a 2x one. One
 * level less per halving keeps the halo the size it was tuned at, 8 levels at 2x.
 */
export function bloomLevels(dpr: number): number {
  return Math.max(5, Math.min(8, Math.round(8 + Math.log2(dpr / 2))));
}

export interface DeviceHints {
  /** GiB, as `navigator.deviceMemory` reports it. */
  memory?: number;
  cores?: number;
}

export interface TierPlan {
  tier: Tier;
  /** Highest tier the governor may raise this device to. */
  ceiling: Tier;
  locked: boolean;
}

/**
 * Starting tier from the GPU's name. Integrated graphics start low and a
 * discrete GPU or Apple silicon starts high; on Windows the browser picks one
 * adapter for every tab, so a laptop with both often renders on the
 * integrated one, and that is the name reported here. Unknown names start in
 * the middle. A device may later rise one tier, never more.
 */
export function planTier(renderer: string, hints: DeviceHints = {}, override?: string | null): TierPlan {
  if (isTier(override)) return { tier: override, ceiling: override, locked: true };

  const r = renderer.toLowerCase();
  let tier: Tier = "balanced";
  if (/\bapple (m\d|gpu)/.test(r)) tier = "high";
  else if (/nvidia|geforce|quadro|\brtx\b|\bgtx\b/.test(r)) {
    tier = /\bmx ?\d{3}\b|\bgt \d{3,4}\b/.test(r) ? "balanced" : "high";
  } else if (/radeon|\bamd\b/.test(r)) {
    tier = /radeon(\(tm\))? (rx|pro|r9|vii)\b|firepro/.test(r) ? "high" : "low";
  } else if (/intel/.test(r)) tier = /\barc\b/.test(r) ? "balanced" : "low";
  else if (/adreno|mali|powervr|videocore/.test(r)) tier = "low";

  let cap: Tier = "high";
  if (hints.memory !== undefined && hints.memory <= 4) cap = "low";
  else if (hints.cores !== undefined && hints.cores <= 4) cap = "balanced";

  const start = rank(tier) > rank(cap) ? cap : tier;
  const up = stepTier(start, 1);
  return { tier: start, ceiling: rank(up) > rank(cap) ? cap : up, locked: false };
}

const WINDOW_MS = 2000;
const START_COOLDOWN_MS = 2500;
const CHANGE_COOLDOWN_MS = 3000;
/** A gap this long is a hidden tab or a stalled page, not a slow GPU. */
const GAP_MS = 1000;
const MIN_FRAMES = 4;
const LATE = 1.5;
const BAD_SHARE = 0.25;
const BAD_WINDOWS = 3;
const SEVERE = 2.5;
const SEVERE_WINDOWS = 2;
const GIVE_UP_WINDOWS = 3;
const GOOD_WINDOWS = 5;
/** Most GPU time the next tier may be predicted to take, of a 16.7 ms frame. */
const RAISE_BUDGET_MS = 9;

export interface GovernorOptions extends TierPlan {
  /** Drawing-buffer pixels a tier would render on the current screen. */
  pixels: (tier: Tier) => number;
  onChange: (tier: Tier) => void;
  /** Even `low` is unusable here: the page should drop the scene. Called once. */
  onGiveUp?: () => void;
}

export interface GovernorStats {
  tier: Tier;
  ceiling: Tier;
  changes: number;
  lateShare: number;
  medianRatio: number;
  gpuMs: number | null;
}

interface Track {
  span: number;
  ratios: number[];
  bad: number;
  severe: number;
}

const track = (): Track => ({ span: 0, ratios: [], bad: 0, severe: 0 });

/**
 * Picks the tier from how frames actually arrive.
 *
 * Flight and rest are judged apart, against the rate the pacer asked for in
 * each (60 and 30fps), so resting on time between flights cannot hide a GPU
 * that stutters through every transit. Lowers the tier after three two-second
 * windows of either with a quarter of frames late, or two with the median
 * frame at 2.5x its budget. Raises it only on GPU timer evidence that the next
 * tier fits comfortably, five flight windows running, and only at rest so the
 * resize never lands mid-flight. A tier it had to leave stays closed for the
 * visit: at most one failed rise, then it settles. Three severe windows
 * running at `low` mean no tier will do, and it gives up.
 */
export class QualityGovernor {
  tier: Tier;
  ceiling: Tier;
  readonly locked: boolean;
  changes = 0;

  private readonly pixels: (tier: Tier) => number;
  private readonly onChange: (tier: Tier) => void;
  private readonly onGiveUp?: () => void;
  private gaveUp = false;
  private cooldown = START_COOLDOWN_MS;
  private flight = track();
  private rest = track();
  private gpu: number[] = [];
  private good = 0;
  private raise = false;
  private last: Omit<GovernorStats, "tier" | "ceiling" | "changes"> = {
    lateShare: 0,
    medianRatio: 0,
    gpuMs: null,
  };

  constructor({ tier, ceiling, locked, pixels, onChange, onGiveUp }: GovernorOptions) {
    this.tier = tier;
    this.ceiling = ceiling;
    this.locked = locked;
    this.pixels = pixels;
    this.onChange = onChange;
    this.onGiveUp = onGiveUp;
  }

  /** One drawn frame: how long since the previous one, and how long it was meant to take. */
  frame(intervalMs: number, expectedMs: number, active: boolean) {
    if (this.locked || this.gaveUp) return;
    if (intervalMs > GAP_MS) {
      this.interrupt();
      return;
    }
    if (this.raise && !active) {
      this.change(stepTier(this.tier, 1));
      return;
    }
    if (this.cooldown > 0) {
      this.cooldown -= intervalMs;
      return;
    }
    const t = active ? this.flight : this.rest;
    t.span += intervalMs;
    t.ratios.push(intervalMs / expectedMs);
    if (t.span >= WINDOW_MS) this.evaluate(t, active);
  }

  /** GPU time of one frame, from a timer query, when the browser has one. */
  gpuTime(ms: number) {
    if (!this.locked && this.cooldown <= 0) this.gpu.push(ms);
  }

  /** The page was hidden, resized or stalled: the windows in progress say nothing. */
  interrupt() {
    this.flight = track();
    this.rest = track();
    this.gpu = [];
    this.good = 0;
    this.cooldown = Math.max(this.cooldown, 1000);
  }

  stats(): GovernorStats {
    return { tier: this.tier, ceiling: this.ceiling, changes: this.changes, ...this.last };
  }

  private evaluate(t: Track, active: boolean) {
    const ratios = t.ratios.sort((a, b) => a - b);
    t.span = 0;
    t.ratios = [];
    if (ratios.length < MIN_FRAMES) return;

    const lateShare = ratios.filter((r) => r > LATE).length / ratios.length;
    const median = ratios[ratios.length >> 1];
    t.severe = median >= SEVERE ? t.severe + 1 : 0;
    t.bad = lateShare >= BAD_SHARE ? t.bad + 1 : 0;
    this.last = { ...this.last, lateShare, medianRatio: median };

    if (t.severe >= SEVERE_WINDOWS || t.bad >= BAD_WINDOWS) {
      if (this.tier !== "low") {
        this.ceiling = stepTier(this.tier, -1);
        this.change(this.ceiling);
      } else if (t.severe >= GIVE_UP_WINDOWS) {
        this.gaveUp = true;
        this.onGiveUp?.();
      }
      return;
    }
    if (!active) return;

    const gpu = this.gpu.sort((a, b) => a - b);
    this.gpu = [];
    const gpuMs = gpu.length >= MIN_FRAMES ? gpu[Math.floor(gpu.length * 0.9)] : null;
    this.last.gpuMs = gpuMs;

    const next = stepTier(this.tier, 1);
    const fits =
      gpuMs !== null &&
      next !== this.tier &&
      rank(next) <= rank(this.ceiling) &&
      lateShare < 0.05 &&
      (gpuMs * this.pixels(next)) / Math.max(1, this.pixels(this.tier)) <= RAISE_BUDGET_MS;
    this.good = fits ? this.good + 1 : 0;
    if (this.good >= GOOD_WINDOWS) this.raise = true;
  }

  private change(tier: Tier) {
    this.raise = false;
    this.flight = track();
    this.rest = track();
    this.gpu = [];
    this.good = 0;
    this.cooldown = CHANGE_COOLDOWN_MS;
    if (tier === this.tier) return;
    this.tier = tier;
    this.changes++;
    this.onChange(tier);
  }
}
