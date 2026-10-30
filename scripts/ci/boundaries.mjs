// Module boundaries, checked from the import statements alone:
//   node scripts/ci/boundaries.mjs
//
// - app/ and proxy.ts import modules only through their public entry,
//   `@/modules/<name>` or `@/modules/<name>/server`, never `@/shared`;
// - a module reaches another module the same way, and its own files by
//   relative path, never through its own entry and never outside its folder;
// - shared/ imports neither modules nor app;
// - a `"use client"` file never imports a `/server` entry;
// - modules do not depend on each other in a cycle.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";

const ROOTS = ["app", "modules", "shared", "proxy.ts"];
const SOURCE = /\.(ts|tsx|mjs)$/;
const IMPORT =
  /(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|^import\s+["']([^"']+)["']/gm;

function walk(path) {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((name) => walk(join(path, name)));
  }
  return SOURCE.test(path) && !path.endsWith(".d.ts") ? [path] : [];
}

const moduleOf = (path) => path.match(/^modules\/([^/]+)\//)?.[1];

const failures = [];
const graph = new Map();

for (const file of ROOTS.flatMap(walk)) {
  const text = readFileSync(file, "utf8");
  const client = /^\s*["']use client["']/.test(text);
  const own = moduleOf(file);

  for (const m of text.matchAll(IMPORT)) {
    const spec = m[1] ?? m[2] ?? m[3];
    const fail = (why) => failures.push(`${file}: "${spec}" ${why}`);

    let target;
    if (spec.startsWith("@/")) target = spec.slice(2);
    else if (spec.startsWith(".")) target = normalize(join(dirname(file), spec));
    else continue;

    const entry = target.match(/^modules\/([^/]+)(\/server)?$/);
    const into = moduleOf(`${target}/`);

    if (client && entry?.[2]) fail("is server-only and this is a client file");

    if (file.startsWith("shared/")) {
      if (/^(modules|app)\//.test(target)) fail("— shared/ cannot depend on modules or app");
      continue;
    }

    if (!own) {
      if (target.startsWith("shared/")) fail("— routes import modules, not shared/");
      else if (into && !entry) fail(`reaches inside modules/${into}; import "@/modules/${into}"`);
      continue;
    }

    if (target.startsWith("app/")) fail("— modules cannot depend on app/");
    else if (into === own) {
      if (spec.startsWith("@/")) fail("— import your own module's files by relative path");
    } else if (into) {
      if (!entry) fail(`reaches inside modules/${into}; import "@/modules/${into}"`);
      else if (spec.startsWith(".")) fail(`— import another module as "@/modules/${into}"`);
      if (!graph.has(own)) graph.set(own, new Set());
      graph.get(own).add(into);
    } else if (spec.startsWith(".")) {
      fail(`leaves modules/${own} by relative path (${relative(".", target)})`);
    }
  }
}

const state = new Map();
function visit(node, path) {
  if (state.get(node) === "done") return;
  if (state.get(node) === "open") {
    failures.push(`module cycle: ${[...path.slice(path.indexOf(node)), node].join(" -> ")}`);
    return;
  }
  state.set(node, "open");
  for (const next of graph.get(node) ?? []) visit(next, [...path, node]);
  state.set(node, "done");
}
for (const node of graph.keys()) visit(node, []);

if (failures.length) {
  console.log(failures.map((f) => `  FAIL ${f}`).join("\n"));
  process.exit(1);
}
console.log(
  [...graph].map(([from, to]) => `  ${from} -> ${[...to].sort().join(", ")}`).sort().join("\n"),
);
console.log("module boundaries ok");
