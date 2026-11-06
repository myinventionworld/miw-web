import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { bloomLevels, dprFor, planTier, QualityGovernor, TIER_SPECS } from "./quality.ts";

const vp = (width, height, dpr) => ({ width, height, dpr });

describe("dprFor", () => {
  test("high keeps 2x supersampling on a 1080p screen and on a Retina laptop", () => {
    assert.equal(dprFor("high", vp(1920, 1080, 1)), 2);
    assert.equal(dprFor("high", vp(1512, 982, 2)), 2);
  });

  test("high stays inside a 4K buffer on big 1x monitors", () => {
    assert.equal(dprFor("high", vp(2560, 1440, 1)), 1.5);
    assert.equal(dprFor("high", vp(3840, 2160, 1)), 1);
    assert.equal(dprFor("high", vp(2560, 1440, 2)), 1.5);
  });

  test("balanced and low never draw more pixels than the screen has", () => {
    assert.equal(dprFor("balanced", vp(1920, 1080, 1)), 1);
    assert.equal(dprFor("balanced", vp(1536, 864, 1.25)), 1.25);
    assert.equal(dprFor("balanced", vp(1745, 982, 1.1)), 1);
    assert.equal(dprFor("balanced", vp(1512, 982, 2)), 1.5);
    assert.equal(dprFor("low", vp(1512, 982, 2)), 1);
    assert.equal(dprFor("low", vp(2560, 1440, 1)), 0.75);
  });

  test("stays within budget, in quarter steps, across common screens", () => {
    for (const tier of ["low", "balanced", "high"]) {
      const spec = TIER_SPECS[tier];
      for (const [w, h] of [[1280, 720], [1366, 768], [1536, 864], [1920, 1080], [2560, 1440], [3440, 1440], [3840, 2160]]) {
        for (const device of [1, 1.25, 1.5, 2]) {
          const d = dprFor(tier, vp(w, h, device));
          assert.equal(d * 4, Math.round(d * 4), `${tier} ${w}x${h}@${device} gave ${d}`);
          assert.ok(d <= spec.maxDpr);
          assert.ok(w * h * d * d <= spec.pixelBudget || d === Math.min(spec.minDpr, device), `${tier} ${w}x${h}@${device} gave ${d}`);
        }
      }
    }
  });
});

test("bloomLevels keeps the halo the size it was tuned at 2x", () => {
  assert.equal(bloomLevels(2), 8);
  assert.equal(bloomLevels(1.5), 8);
  assert.equal(bloomLevels(1), 7);
  assert.equal(bloomLevels(0.75), 7);
});

describe("planTier", () => {
  const angle = (name) => `ANGLE (Vendor, ${name} (0x00001638) Direct3D11 vs_5_0 ps_5_0, D3D11)`;

  test("integrated GPUs start low and may rise one tier", () => {
    for (const name of ["AMD Radeon(TM) Graphics", "Intel(R) UHD Graphics 620", "Intel(R) Iris(R) Xe Graphics", "AMD Radeon(TM) 780M"]) {
      assert.deepEqual(planTier(angle(name)), { tier: "low", ceiling: "balanced", locked: false }, name);
    }
  });

  test("discrete GPUs and Apple silicon start high", () => {
    for (const name of [
      angle("NVIDIA GeForce RTX 3070"),
      angle("AMD Radeon RX 6700 XT"),
      angle("AMD Radeon(TM) RX 7600"),
      "ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)",
      "Apple GPU",
    ]) {
      assert.deepEqual(planTier(name), { tier: "high", ceiling: "high", locked: false }, name);
    }
  });

  test("entry-level discrete and unknown GPUs start balanced", () => {
    assert.equal(planTier(angle("NVIDIA GeForce MX450")).tier, "balanced");
    assert.equal(planTier(angle("Intel(R) Arc(TM) A770 Graphics")).tier, "balanced");
    assert.deepEqual(planTier("WebKit WebGL"), { tier: "balanced", ceiling: "high", locked: false });
  });

  test("little memory or few cores cap the tier", () => {
    assert.deepEqual(planTier(angle("NVIDIA GeForce RTX 3070"), { memory: 4 }), { tier: "low", ceiling: "low", locked: false });
    assert.deepEqual(planTier(angle("NVIDIA GeForce RTX 3070"), { cores: 4 }), { tier: "balanced", ceiling: "balanced", locked: false });
  });

  test("?gfx= locks a tier and ignores anything else", () => {
    assert.deepEqual(planTier(angle("AMD Radeon(TM) Graphics"), {}, "high"), { tier: "high", ceiling: "high", locked: true });
    assert.equal(planTier(angle("AMD Radeon(TM) Graphics"), {}, "ultra").locked, false);
  });
});

/**
 * A GPU modelled the way the benchmark does: a frame costs `msPerMpx` per
 * million drawing-buffer pixels, rounded up to whole 60Hz refreshes.
 */
function simulate({ plan, viewport, msPerMpx, seconds, fly = 2500, rest = 3500, timer = true }) {
  const changes = [];
  let gaveUp = 0;
  const pixels = (tier) => {
    const d = dprFor(tier, viewport);
    return viewport.width * d * viewport.height * d;
  };
  const governor = new QualityGovernor({
    ...plan,
    pixels,
    onChange: (tier) => changes.push(tier),
    onGiveUp: () => gaveUp++,
  });
  const vsync = 1000 / 60;
  let t = 0;
  while (t < seconds * 1000) {
    const active = t % (fly + rest) < fly;
    const gpu = (msPerMpx * pixels(governor.tier)) / 1e6;
    const target = active ? vsync : 2 * vsync;
    const interval = Math.max(target, Math.ceil(gpu / vsync - 1e-9) * vsync);
    t += interval;
    governor.frame(interval, active ? 1000 / 60 : 1000 / 30, active);
    if (timer) governor.gpuTime(gpu);
  }
  return { governor, changes, gaveUp };
}

describe("QualityGovernor", () => {
  const screen = vp(1920, 1080, 1);

  test("an integrated GPU that cannot fly at 2x settles one step down and stays there", () => {
    // 4.8 ms per Mpx: 40 ms at 2x, 22 ms at 1.5x, 10 ms at 1x.
    const { governor, changes } = simulate({
      plan: { tier: "high", ceiling: "high", locked: false },
      viewport: screen,
      msPerMpx: 4.8,
      seconds: 120,
    });
    assert.deepEqual(changes, ["balanced"]);
    assert.equal(governor.ceiling, "balanced");
  });

  test("flying and resting in turn does not make it oscillate", () => {
    // The old monitor judged rest against 30fps and flight against 60, and
    // restored 2x at every rest. Here a GPU that rests fine but stutters in
    // flight is lowered once, and never raised again.
    const { changes } = simulate({
      plan: { tier: "high", ceiling: "high", locked: false },
      viewport: vp(2560, 1440, 1),
      msPerMpx: 3,
      seconds: 300,
    });
    assert.deepEqual(changes, ["balanced"]);
  });

  test("a fast GPU is left alone", () => {
    const { changes } = simulate({
      plan: { tier: "high", ceiling: "high", locked: false },
      viewport: screen,
      msPerMpx: 1,
      seconds: 120,
    });
    assert.deepEqual(changes, []);
  });

  test("rises one tier only with GPU timer evidence of headroom", () => {
    const plan = { tier: "low", ceiling: "balanced", locked: false };
    assert.deepEqual(simulate({ plan, viewport: screen, msPerMpx: 1, seconds: 120 }).changes, ["balanced"]);
    assert.deepEqual(simulate({ plan, viewport: screen, msPerMpx: 1, seconds: 120, timer: false }).changes, []);
    assert.deepEqual(simulate({ plan, viewport: screen, msPerMpx: 6, seconds: 120 }).changes, []);
  });

  test("a hopeless GPU walks down to low a step at a time, then gives up once", () => {
    const { changes, gaveUp } = simulate({
      plan: { tier: "high", ceiling: "high", locked: false },
      viewport: screen,
      msPerMpx: 40,
      seconds: 120,
    });
    assert.deepEqual(changes, ["balanced", "low"]);
    assert.equal(gaveUp, 1);
  });

  test("a GPU that is slow but usable at low keeps the scene", () => {
    // 9 ms per Mpx: 19 ms at low, every flight frame late but at 30fps.
    const { changes, gaveUp } = simulate({
      plan: { tier: "low", ceiling: "balanced", locked: false },
      viewport: screen,
      msPerMpx: 9,
      seconds: 300,
    });
    assert.deepEqual(changes, []);
    assert.equal(gaveUp, 0);
  });

  test("a locked tier never changes and never gives up", () => {
    const { changes, gaveUp } = simulate({
      plan: { tier: "high", ceiling: "high", locked: true },
      viewport: screen,
      msPerMpx: 40,
      seconds: 60,
    });
    assert.deepEqual(changes, []);
    assert.equal(gaveUp, 0);
  });

  test("a hidden tab's gap is not counted as a slow frame", () => {
    const governor = new QualityGovernor({
      tier: "high",
      ceiling: "high",
      locked: false,
      pixels: () => 1,
      onChange: () => assert.fail("changed tier"),
    });
    for (let i = 0; i < 2000; i++) governor.frame(i % 100 === 0 ? 30_000 : 16.7, 1000 / 60, true);
  });
});
