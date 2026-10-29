// Smoke test against a running build: `next build && next start`, then
//   node scripts/ci/smoke.mjs
//
// - every page in every language answers 200, and so do robots.txt and
//   sitemap.xml;
// - no page throws (`pageerror`) on a desktop or a phone;
// - nothing scrolls sideways at 320 and 390 px;
// - screenshots of the main pages go to SMOKE_OUT for the CI artifact.
//
// SMOKE_BASE_URL  the site (default http://localhost:3000)
// SMOKE_OUT       screenshot folder (default smoke-screenshots)
// SMOKE_CHANNEL   a browser channel, e.g. `chrome` to run locally against an
//                 installed Chrome instead of Playwright's own Chromium
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const OUT = process.env.SMOKE_OUT || "smoke-screenshots";
const LOCALES = ["en", "ru", "cs"];
const ROUTES = ["", "/about", "/work", "/work/omnibus", "/work/boowie", "/work/wovie"];
const PAGES = LOCALES.flatMap((l) => ROUTES.map((r) => `/${l}${r}`));
const SHOTS = ["/en", "/en/about", "/en/work", "/en/work/omnibus", "/ru/work/wovie", "/cs/about"];

const failures = [];
const fail = (msg) => {
  failures.push(msg);
  console.log(`  FAIL ${msg}`);
};
const warn = (msg) => console.log(`  WARN ${msg}`);

// 1. Status codes, without a browser.
console.log("status codes");
for (const path of [...PAGES, "/robots.txt", "/sitemap.xml"]) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  if (res.status !== 200) fail(`${path} answered ${res.status}`);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.SMOKE_CHANNEL || undefined,
  // Software WebGL, so the 3D home renders on a runner without a GPU.
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

async function visit(context, path, { shot, width } = {}) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]));
  try {
    const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60_000 });
    if (!res || res.status() !== 200) fail(`${path} loaded with ${res?.status()}`);
    await page.waitForTimeout(800);
    if (width) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (scrollWidth > width) fail(`${path} at ${width}px scrolls sideways (${scrollWidth}px)`);
    }
  } catch (e) {
    fail(`${path}: ${String(e).split("\n")[0]}`);
  }
  // A screenshot is for people to look at, not a check. On a runner without a
  // GPU the 3D home draws through software WebGL and one frame can take tens
  // of seconds, so it gets time, and a missing picture is a warning.
  if (shot) {
    await page
      .screenshot({ path: `${OUT}/${shot}.png`, timeout: 120_000 })
      .catch((e) => warn(`${path}: no screenshot (${String(e).split("\n")[0]})`));
  }
  for (const e of errors) fail(`${path}${width ? ` at ${width}px` : ""} threw: ${e}`);
  await page.close();
}

// 2. Desktop: every page loads clean; the main ones are photographed.
console.log("desktop 1440");
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const path of PAGES) {
  await visit(desktop, path, {
    shot: SHOTS.includes(path) ? `desktop${path.replaceAll("/", "-")}` : undefined,
  });
}
await desktop.close();

// 3. Phones: the same pages at 320 and 390, as a touch device.
for (const width of [320, 390]) {
  console.log(`phone ${width}`);
  const phone = await browser.newContext({
    viewport: { width, height: 800 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  for (const path of PAGES) {
    await visit(phone, path, {
      width,
      shot: width === 390 && SHOTS.includes(path) ? `phone${path.replaceAll("/", "-")}` : undefined,
    });
  }
  await phone.close();
}

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} problem(s)`);
  process.exit(1);
}
console.log(`\nall good: ${PAGES.length} pages x 3 viewports, robots.txt, sitemap.xml`);
