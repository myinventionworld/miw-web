export type SoundId = "rain" | "fire" | "sea" | "night";

const RATE = 32000;
const LOOP = 12;
const FADE = 1.5;
const TARGET_RMS = 0.11;

const white = () => Math.random() * 2 - 1;

function lowpass(fc: number) {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / RATE);
  let y = 0;
  return (x: number) => (y += a * (x - y));
}

function highpass(fc: number) {
  const lp = lowpass(fc);
  return (x: number) => x - lp(x);
}

function brown() {
  let b = 0;
  return () => {
    b = (b + 0.02 * white()) / 1.02;
    return b * 3.5;
  };
}

function pink() {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  return () => {
    const w = white();
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    return (b0 + b1 + b2 + w * 0.1848) * 0.2;
  };
}

function drift(n: number, rate: number) {
  const step = RATE / rate;
  const points = Array.from({ length: Math.ceil(n / step) + 2 }, Math.random);
  return (i: number) => {
    const p = i / step;
    const k = Math.floor(p);
    const f = (1 - Math.cos((p - k) * Math.PI)) / 2;
    return points[k] * (1 - f) + points[k + 1] * f;
  };
}

function bursts(
  into: Float32Array,
  perSecond: number,
  length: [number, number],
  gain: () => number,
) {
  let t = 0;
  while (t < into.length) {
    t += Math.round((-Math.log(1 - Math.random()) * RATE) / perSecond);
    const len = Math.round(
      (length[0] + Math.random() * (length[1] - length[0])) * RATE,
    );
    const a = gain();
    for (let k = 0; k < len && t + k < into.length; k++) {
      into[t + k] += a * white() * Math.exp((-4 * k) / len);
    }
  }
}

function rain(n: number) {
  return [0, 1].map(() => {
    const out = new Float32Array(n);
    const lp = lowpass(5200);
    const hp = highpass(500);
    const move = drift(n, 0.6);
    for (let i = 0; i < n; i++)
      out[i] = hp(lp(white())) * (0.8 + 0.35 * move(i));
    const drops = new Float32Array(n);
    bursts(drops, 34, [0.003, 0.014], () => 0.08 + 0.55 * Math.random() ** 3);
    const dropHp = highpass(1400);
    for (let i = 0; i < n; i++) out[i] += dropHp(drops[i]);
    return out;
  });
}

function fire(n: number) {
  const roar = brown();
  const roarLp = lowpass(320);
  const move = drift(n, 0.9);
  const body = new Float32Array(n);
  for (let i = 0; i < n; i++)
    body[i] = roarLp(roar()) * (0.45 + 0.55 * move(i));

  const crackles = new Float32Array(n);
  let t = 0;
  while (t < n) {
    t += Math.round((-Math.log(1 - Math.random()) * RATE) / 2.4);
    let at = t;
    const count = 1 + Math.floor(Math.random() * 5);
    for (let c = 0; c < count; c++) {
      at += Math.round((0.01 + Math.random() * 0.07) * RATE);
      const len = Math.round((0.0008 + Math.random() * 0.004) * RATE);
      const a = 0.25 + 0.9 * Math.random() ** 2;
      for (let k = 0; k < len && at + k < n; k++) {
        crackles[at + k] += a * white() * Math.exp((-3 * k) / len);
      }
    }
  }

  return [0, 1].map((ch) => {
    const out = new Float32Array(n);
    const hp = highpass(900);
    const hiss = highpass(4000);
    const pan = ch === 0 ? 0.85 : 1.15;
    for (let i = 0; i < n; i++) {
      out[i] =
        body[i] * 1.2 + hp(crackles[i]) * 0.55 * pan + hiss(white()) * 0.012;
    }
    return out;
  });
}

function sea(n: number) {
  const swell = new Float32Array(n);
  let start = -Math.random() * 3;
  while (start < n / RATE) {
    const rise = 2 + Math.random() * 1.2;
    const fall = 3.5 + Math.random() * 1.5;
    const height = 0.6 + Math.random() * 0.4;
    for (let i = Math.max(0, Math.round(start * RATE)); i < n; i++) {
      const s = i / RATE - start;
      if (s > rise + fall * 2.5) break;
      const v =
        s < rise
          ? Math.sin(((s / rise) * Math.PI) / 2) ** 2
          : Math.exp(-(s - rise) / fall);
      swell[i] += height * v;
    }
    start += 5.5 + Math.random() * 3;
  }

  return [0, 1].map((ch) => {
    const out = new Float32Array(n);
    const noise = pink();
    const foam = highpass(2500);
    const lag = ch * Math.round(0.25 * RATE);
    let y = 0;
    let a = 0;
    for (let i = 0; i < n; i++) {
      const e = 0.18 + swell[Math.max(0, i - lag)];
      if (i % 32 === 0)
        a = 1 - Math.exp((-2 * Math.PI * (220 + 1300 * e)) / RATE);
      y += a * (noise() - y);
      out[i] = y * (0.35 + e) + foam(white()) * 0.05 * e * e;
    }
    return out;
  });
}

const CRICKETS = [
  { f: 4300, every: 0.56, pulses: 3, gain: 0.06, pan: -0.5 },
  { f: 4720, every: 0.74, pulses: 4, gain: 0.04, pan: 0.45 },
  { f: 5150, every: 0.93, pulses: 2, gain: 0.03, pan: 0.1 },
];

function night(n: number) {
  return [0, 1].map((ch) => {
    const out = new Float32Array(n);
    const air = brown();
    const airLp = lowpass(240);
    const leaves = highpass(1800);
    const move = drift(n, 0.25);
    for (let i = 0; i < n; i++) {
      out[i] = airLp(air()) * 0.5 + leaves(white()) * 0.012 * (0.4 + move(i));
    }
    for (const c of CRICKETS) {
      const g = c.gain * (ch === 0 ? 1 - c.pan * 0.6 : 1 + c.pan * 0.6);
      let t = Math.random() * c.every;
      while (t < n / RATE) {
        for (let p = 0; p < c.pulses; p++) {
          const s0 = Math.round((t + p * 0.045) * RATE);
          const len = Math.round(0.016 * RATE);
          for (let k = 0; k < len && s0 + k < n; k++) {
            const env = Math.sin((Math.PI * k) / len) ** 2;
            out[s0 + k] +=
              g * env * Math.sin((2 * Math.PI * c.f * (s0 + k)) / RATE);
          }
        }
        t += c.every * (0.94 + Math.random() * 0.12);
      }
    }
    return out;
  });
}

const MAKERS: Record<SoundId, (n: number) => Float32Array[]> = {
  rain,
  fire,
  sea,
  night,
};

const loops = new Map<SoundId, Float32Array<ArrayBuffer>[]>();

export function renderLoop(id: SoundId): Float32Array<ArrayBuffer>[] {
  const done = loops.get(id);
  if (done) return done;
  const length = LOOP * RATE;
  const fade = FADE * RATE;
  const channels = MAKERS[id](length + fade);

  let sum = 0;
  for (const c of channels) for (let i = 0; i < length; i++) sum += c[i] * c[i];
  const scale = TARGET_RMS / Math.sqrt(sum / (length * channels.length) || 1);

  const loop = channels.map((c) => {
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      if (i < fade) {
        const x = (i / fade) * (Math.PI / 2);
        data[i] = (c[i] * Math.sin(x) + c[length + i] * Math.cos(x)) * scale;
      } else {
        data[i] = c[i] * scale;
      }
    }
    return data;
  });
  loops.set(id, loop);
  return loop;
}

export function loopBuffer(id: SoundId, ctx: BaseAudioContext): AudioBuffer {
  const loop = renderLoop(id);
  const buffer = ctx.createBuffer(loop.length, loop[0].length, RATE);
  loop.forEach((data, ch) => buffer.copyToChannel(data, ch));
  return buffer;
}

export const LOOP_SECONDS = LOOP;
