// Repeatable measurements of the home page's WebGL scene, against a running
// build (`next build && next start`):
//
//   node scripts/perf/scene-bench.mjs
//
// Everything is counted at the WebGL call level, so two builds are measured
// the same way with no hooks in either.
//
// BENCH_MODE=load (default) renders for real, in whatever WebGL the browser
//   has, and counts what loading and a short flight cost: shader programs
//   linked, time blocked waiting on them, cube map renders, canvas resizes,
//   texture and renderbuffer allocations, draw calls and triangles per frame.
//   On a machine without a GPU this is SwiftShader: counts are meaningful,
//   times are only comparable with each other.
//
// BENCH_MODE=model replaces the GPU with a cost model and the clock with a
//   virtual one. Draw calls do nothing; each frame that drew holds back the
//   next animation frame by BENCH_GPU_MS_PER_MPX for every million pixels of
//   the canvas's drawing buffer, rounded up to whole refreshes. A scripted
//   wheel alternates flying and resting for BENCH_SECONDS of virtual time.
//   It shows what the page's frame pacing and quality control do on a GPU of
//   that speed. It is a model, not a measurement of any real GPU.
//
// BENCH_URL           page (default http://localhost:3000/en)
// BENCH_VIEWPORT      CSS size and devicePixelRatio (default 1920x1080@1)
// BENCH_RENDERER      renderer string reported to the page (default an AMD APU
//                     on Windows); the page refuses software renderers
// BENCH_SECONDS       virtual seconds of flight in model mode (default 60)
// BENCH_GPU_MS_PER_MPX  model GPU cost per million drawing-buffer pixels
//                     (default 4.8: 10 ms for a 1080p frame)
// BENCH_HZ            model display refresh (default 60)
// BENCH_CORES         navigator.hardwareConcurrency reported to the page (default 8)
// BENCH_QUERY         extra query string, e.g. `gfx=low`
// BENCH_JSON          write the full result here
// BENCH_CHROMIUM      path to a Chromium to use instead of Playwright's own
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const env = process.env;
const MODE = env.BENCH_MODE || "load";
const URL_ = env.BENCH_URL || "http://localhost:3000/en";
const [, vw, vh, vdpr] = /^(\d+)x(\d+)@([\d.]+)$/.exec(env.BENCH_VIEWPORT || "1920x1080@1") ?? [];
const cfg = {
  mode: MODE,
  renderer:
    env.BENCH_RENDERER ||
    "ANGLE (AMD, AMD Radeon(TM) Graphics (0x00001638) Direct3D11 vs_5_0 ps_5_0, D3D11)",
  seconds: Number(env.BENCH_SECONDS || 60),
  msPerMpx: Number(env.BENCH_GPU_MS_PER_MPX || 4.8),
  hz: Number(env.BENCH_HZ || 60),
  cores: Number(env.BENCH_CORES || 8),
};

function instrument(cfg) {
  const realNow = performance.now.bind(performance);
  const B = (window.__bench = {
    link: 0,
    compile: 0,
    blockedMs: 0,
    blockingCalls: 0,
    cubeFaceRenders: 0,
    allocs: [],
    resizes: [],
    frames: [],
    phases: [],
    firstDraw: null,
    firstDrawEnd: null,
    flatAt: null,
    shownAt: null,
    longTasks: [],
    linkTicks: [],
    blockedTicks: [],
  });
  let tickNo = 0;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) B.longTasks.push({ start: e.startTime, ms: e.duration });
    }).observe({ type: "longtask", buffered: true });
  } catch {}
  Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { get: () => cfg.cores });

  let glCanvas = null;
  let totalDraws = 0;
  let tickDraws = 0;
  let tickScreenDraws = 0;
  let screenBound = true;
  let tickTris = 0;
  let clock = () => realNow();

  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    const ctx = getContext.call(this, type, attrs);
    if (ctx && /webgl/.test(type)) {
      this.__gl = true;
    }
    return ctx;
  };
  for (const prop of ["width", "height"]) {
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, prop);
    Object.defineProperty(HTMLCanvasElement.prototype, prop, {
      ...d,
      set(v) {
        if (this.__gl && d.get.call(this) !== v) {
          B.resizes.push({ t: clock(), prop, v });
        }
        d.set.call(this, v);
      },
    });
  }

  const BPP = {
    0x881a: 8, 0x8814: 16, 0x8058: 4, 0x8c43: 4, 0x881b: 6, 0x8815: 12, 0x822f: 4,
    0x8229: 1, 0x822b: 2, 0x81a6: 4, 0x88f0: 4, 0x8cad: 8, 0x81a5: 2, 0x8cac: 4,
  };
  const CUBE = 0x8513;
  const UNMASKED = 0x9246;
  for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    const wrap = (name, fn) => {
      const orig = P[name];
      if (orig) P[name] = function (...a) { return fn.call(this, orig, a); };
    };
    wrap("getParameter", function (orig, a) {
      return a[0] === UNMASKED && cfg.renderer ? cfg.renderer : orig.apply(this, a);
    });
    wrap("linkProgram", function (orig, a) {
      B.link++;
      B.linkTicks.push(tickNo);
      return orig.apply(this, a);
    });
    wrap("compileShader", function (orig, a) { B.compile++; return orig.apply(this, a); });
    for (const name of ["getProgramParameter", "getShaderParameter", "getProgramInfoLog", "getShaderInfoLog"]) {
      wrap(name, function (orig, a) {
        const t = realNow();
        const r = orig.apply(this, a);
        B.blockedMs += realNow() - t;
        B.blockedTicks.push([tickNo, realNow() - t]);
        B.blockingCalls++;
        return r;
      });
    }
    wrap("bindFramebuffer", function (orig, a) {
      if (a[0] !== 0x8ca8) screenBound = a[1] === null;
      return orig.apply(this, a);
    });
    wrap("framebufferTexture2D", function (orig, a) {
      if (a[2] >= 0x8515 && a[2] <= 0x851a) B.cubeFaceRenders++;
      return orig.apply(this, a);
    });
    const alloc = (kind, w, h, fmt, levels = 1, faces = 1) => {
      let bytes = 0;
      for (let i = 0, x = w, y = h; i < levels; i++, x = Math.max(1, x >> 1), y = Math.max(1, y >> 1)) {
        bytes += x * y * (BPP[fmt] ?? 4);
      }
      B.allocs.push({ t: clock(), kind, w, h, bytes: bytes * faces });
    };
    wrap("texStorage2D", function (orig, a) {
      alloc("texture", a[3], a[4], a[2], a[1], a[0] === CUBE ? 6 : 1);
      return orig.apply(this, a);
    });
    wrap("texImage2D", function (orig, a) {
      if (a.length >= 9 && typeof a[3] === "number" && a[8] === null) alloc("texture", a[3], a[4], a[2]);
      return orig.apply(this, a);
    });
    wrap("renderbufferStorage", function (orig, a) {
      alloc("renderbuffer", a[2], a[3], a[1]);
      return orig.apply(this, a);
    });
    wrap("renderbufferStorageMultisample", function (orig, a) {
      alloc("renderbuffer", a[3], a[4], a[2]);
      return orig.apply(this, a);
    });
    const draw = (instanced, countAt) =>
      function (orig, a) {
        if (!glCanvas && this.canvas?.__gl) glCanvas = this.canvas;
        tickDraws++;
        totalDraws++;
        if (screenBound) tickScreenDraws++;
        if (a[0] === 4) tickTris += (a[countAt] / 3) * (instanced ? a[a.length - 1] : 1);
        if (cfg.mode !== "model") return orig.apply(this, a);
      };
    wrap("drawArrays", draw(false, 2));
    wrap("drawElements", draw(false, 1));
    wrap("drawArraysInstanced", draw(true, 2));
    wrap("drawElementsInstanced", draw(true, 1));
    if (cfg.mode === "model") {
      wrap("clear", function () {});
      // The GPU timer reports the modelled cost of whatever was drawn while
      // it ran, so code that reads it sees the same GPU as the clock does.
      const TIME_ELAPSED = 0x88bf;
      const results = new WeakMap();
      let open = null;
      let drawsAtBegin = 0;
      wrap("getExtension", function (orig, a) {
        if (a[0] === "EXT_disjoint_timer_query_webgl2") return { TIME_ELAPSED_EXT: TIME_ELAPSED, GPU_DISJOINT_EXT: 0x8fbb };
        return orig.apply(this, a);
      });
      wrap("beginQuery", function (orig, a) {
        if (a[0] !== TIME_ELAPSED) return orig.apply(this, a);
        open = a[1];
        drawsAtBegin = totalDraws;
      });
      wrap("endQuery", function (orig, a) {
        if (a[0] !== TIME_ELAPSED) return orig.apply(this, a);
        const ms = totalDraws > drawsAtBegin && glCanvas ? (cfg.msPerMpx * glCanvas.width * glCanvas.height) / 1e6 : 0;
        if (open) results.set(open, ms * 1e6);
        open = null;
      });
      wrap("getQueryParameter", function (orig, a) {
        if (!results.has(a[0])) return orig.apply(this, a);
        return a[1] === 0x8867 ? true : results.get(a[0]);
      });
      const getParameter = P.getParameter;
      P.getParameter = function (p) {
        return p === 0x8fbb ? false : getParameter.call(this, p);
      };
    }
  }

  const record = (t) => {
    if (B.shownAt === null && glCanvas?.closest(".opacity-100")) B.shownAt = realNow();
    if (B.flatAt === null && glCanvas && !glCanvas.isConnected) B.flatAt = t;
    if (!tickDraws) return;
    if (B.firstDraw === null) {
      B.firstDraw = t;
      B.firstDrawEnd = clock();
    }
    B.frames.push({
      t,
      tick: tickNo,
      draws: tickDraws,
      screen: tickScreenDraws,
      tris: Math.round(tickTris),
      w: glCanvas?.width ?? 0,
      h: glCanvas?.height ?? 0,
      css: innerWidth,
    });
  };

  if (cfg.mode !== "model") {
    const raf = window.requestAnimationFrame.bind(window);
    const loop = (t) => {
      raf(loop);
      record(t);
      tickNo++;
      tickDraws = 0;
      tickScreenDraws = 0;
      tickTris = 0;
    };
    raf(loop);
    return;
  }

  let vnow = realNow();
  clock = () => vnow;
  performance.now = () => vnow;
  const realRaf = window.requestAnimationFrame.bind(window);
  const queue = new Map();
  let nextId = 1;
  window.requestAnimationFrame = (cb) => {
    queue.set(nextId, cb);
    return nextId++;
  };
  window.cancelAnimationFrame = (id) => void queue.delete(id);

  // Fly for 2.5 s, rest for 3.5 s, and turn back past mid-runway, so the
  // pacer sees both its moving and its resting rate.
  const FLY = 2500;
  const REST = 3500;
  let dir = 1;
  const scenario = (t) => {
    if (B.firstDraw === null) return;
    const s = t - B.firstDraw;
    if (s > cfg.seconds * 1000) return;
    const phase = s % (FLY + REST) < FLY ? "fly" : "rest";
    B.phases.push({ t, phase });
    if (phase !== "fly") return;
    const y = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (y > 0.5) dir = -1;
    if (y < 0.05) dir = 1;
    window.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 36 * dir, deltaMode: 0, bubbles: true, cancelable: true, clientX: 400, clientY: 300 }),
    );
  };

  const vsync = 1000 / cfg.hz;
  let cost = 0;
  const pump = () => {
    realRaf(pump);
    vnow += cost > 0 ? Math.max(1, Math.ceil(cost / vsync - 1e-6)) * vsync : vsync;
    scenario(vnow);
    const cbs = [...queue.values()];
    queue.clear();
    tickDraws = 0;
    tickScreenDraws = 0;
    tickTris = 0;
    for (const cb of cbs) {
      try { cb(vnow); } catch (e) { console.error(e); }
    }
    record(vnow);
    tickNo++;
    cost = tickDraws && glCanvas ? (cfg.msPerMpx * glCanvas.width * glCanvas.height) / 1e6 : 0;
  };
  realRaf(pump);
}

const pct = (xs, p) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const r1 = (x) => Math.round(x * 10) / 10;

const browser = await chromium.launch({
  executablePath: env.BENCH_CHROMIUM || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: { width: Number(vw), height: Number(vh) },
  deviceScaleFactor: Number(vdpr),
});
await context.addInitScript(instrument, cfg);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]));
page.on("console", (m) => {
  const text = m.text().split("\n")[0];
  if (m.type() === "error" && !/_vercel|404 \(Not Found\)/.test(text)) errors.push(text);
});

const target = URL_ + (env.BENCH_QUERY ? (URL_.includes("?") ? "&" : "?") + env.BENCH_QUERY : "");
await page.goto(target, { waitUntil: "load", timeout: 120_000 });

let result;
if (MODE === "model") {
  await page.waitForFunction(
    (s) => {
      const b = window.__bench;
      return b.flatAt !== null || (b.firstDraw !== null && b.frames.at(-1).t - b.firstDraw > s * 1000 + 2000);
    },
    cfg.seconds,
    { timeout: 30 * 60_000, polling: 1000 },
  );
  result = await page.evaluate(() => window.__bench);
} else {
  await page.waitForFunction(() => window.__bench.shownAt !== null, null, { timeout: 300_000, polling: 100 });
  const loaded = await page.evaluate(() => structuredClone(window.__bench));
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(3000);
  result = await page.evaluate(() => window.__bench);
  result.atSceneShown = {
    link: loaded.link,
    blockedMs: loaded.blockedMs,
    cubeFaceRenders: loaded.cubeFaceRenders,
    allocBytes: loaded.allocs.reduce((s, a) => s + a.bytes, 0),
  };
}
await browser.close();

const f = result.frames;
const first = result.firstDraw;
const afterStart = (xs) => xs.filter((x) => x.t > result.firstDrawEnd);
const blocking = (until) =>
  Math.round(result.longTasks.filter((x) => x.start < until).reduce((s, x) => s + Math.max(0, x.ms - 50), 0));
const summary = {
  url: target,
  mode: MODE,
  viewport: env.BENCH_VIEWPORT || "1920x1080@1",
  renderer: cfg.renderer,
  framesDrawn: f.length,
  drawingBuffer: f.length ? `${f.at(-1).w}x${f.at(-1).h}` : "none",
  drawingBufferMpx: f.length ? r1((f.at(-1).w * f.at(-1).h) / 1e6) : 0,
  drawCallsPerFrame: { median: pct(f.map((x) => x.draws), 50), max: Math.max(...f.map((x) => x.draws)) },
  trianglesPerFrame: { median: pct(f.map((x) => x.tris), 50), max: Math.max(...f.map((x) => x.tris)) },
  programsLinked: result.link,
  shadersCompiled: result.compile,
  blockedOnShaderQueriesMs: Math.round(result.blockedMs),
  cubeFaceRenders: result.cubeFaceRenders,
  sceneShownAtMs: result.shownAt === null ? null : Math.round(result.shownAt),
  mainThreadBlockingMs: blocking(Infinity),
  longestTaskMs: Math.round(Math.max(0, ...result.longTasks.map((x) => x.ms))),
  canvasResizesAfterFirstFrame: afterStart(result.resizes).length / 2,
  allocationsAfterFirstFrame: afterStart(result.allocs).length,
  allocatedMBAfterFirstFrame: r1(afterStart(result.allocs).reduce((s, a) => s + a.bytes, 0) / 2 ** 20),
  allocatedMBTotal: r1(result.allocs.reduce((s, a) => s + a.bytes, 0) / 2 ** 20),
  ...(() => {
    // The first frame that reaches the screen, not a bake or a warm-up.
    const tick = f.find((x) => x.screen > 0)?.tick;
    return {
      programsLinkedInFirstSceneFrame: result.linkTicks.filter((x) => x === tick).length,
      blockedInFirstSceneFrameMs: Math.round(result.blockedTicks.filter(([x]) => x === tick).reduce((s, [, ms]) => s + ms, 0)),
    };
  })(),
  errors,
};
if (result.atSceneShown) {
  summary.atSceneShown = {
    ...result.atSceneShown,
    blockedMs: Math.round(result.atSceneShown.blockedMs),
    allocMB: r1(result.atSceneShown.allocBytes / 2 ** 20),
    mainThreadBlockingMs: blocking(result.shownAt),
  };
  delete summary.atSceneShown.allocBytes;
}

if (MODE === "model") {
  const phaseAt = (t) => {
    let p = "warmup";
    for (const x of result.phases) {
      if (x.t > t) break;
      p = x.phase;
    }
    return p;
  };
  const end = first + cfg.seconds * 1000;
  const flight = f.filter((x) => x.t > first && x.t <= end);
  const by = { fly: [], rest: [] };
  for (let i = 1; i < flight.length; i++) {
    const ph = phaseAt(flight[i].t);
    if (by[ph]) by[ph].push(flight[i].t - flight[i - 1].t);
  }
  const late = (xs, budget) => r1((100 * xs.filter((x) => x > budget * 1.5).length) / Math.max(1, xs.length));
  const dprs = [];
  for (const x of flight) {
    const d = r1((x.w / x.css) * 100) / 100;
    if (dprs.at(-1)?.dpr !== d) dprs.push({ s: r1((x.t - first) / 1000), dpr: d });
  }
  summary.model = {
    droppedSceneAtS: result.flatAt === null ? null : r1((result.flatAt - first) / 1000),
    gpuMsPerMpx: cfg.msPerMpx,
    hz: cfg.hz,
    seconds: cfg.seconds,
    fly: {
      fps: r1(1000 / (by.fly.reduce((s, x) => s + x, 0) / Math.max(1, by.fly.length))),
      p95FrameMs: r1(pct(by.fly, 95)),
      latePct: late(by.fly, 1000 / 60),
    },
    rest: {
      fps: r1(1000 / (by.rest.reduce((s, x) => s + x, 0) / Math.max(1, by.rest.length))),
      p95FrameMs: r1(pct(by.rest, 95)),
      latePct: late(by.rest, 1000 / 30),
    },
    dprChanges: dprs.length - 1,
    dprTimeline: dprs.slice(0, 24),
  };
}

console.log(JSON.stringify(summary, null, 2));
if (env.BENCH_JSON) await writeFile(env.BENCH_JSON, JSON.stringify({ summary, raw: result }, null, 1));
