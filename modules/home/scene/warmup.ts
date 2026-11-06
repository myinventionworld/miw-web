import {
  BufferAttribute,
  BufferGeometry,
  HalfFloatType,
  Material,
  Mesh,
  Scene,
  WebGLRenderTarget,
  type Camera,
  type Object3D,
  type WebGLRenderer,
} from "three";
import { Effect, Pass, type EffectComposer } from "postprocessing";

const queues = new WeakMap<WebGLRenderer, Promise<unknown>>();
const pending = new WeakMap<WebGLRenderer, Set<Promise<unknown>>>();

const PROGRAM_TIMEOUT_MS = 8000;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const nextTask = (ms = 0) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Program {
  isReady(): boolean | null;
  getUniforms(): unknown;
}

/**
 * Compiles every material under `root` and resolves once each program can be
 * drawn without stalling. Cold, every body's program compiled inside the
 * first frame, and three's first use of each (`getProgramInfoLog`,
 * `getShaderInfoLog`, `getProgramParameter`) blocked until the driver was
 * done: seconds on Direct3D, all in one task.
 *
 * With `KHR_parallel_shader_compile` (Chrome and Edge on Windows among them)
 * this polls instead and the page never waits. Without it, each program's
 * first use gets a task of its own, so the wait is cut into pieces the page
 * can breathe between.
 *
 * The program three picks depends on where it draws: anything but the screen
 * gets a linear output, so `target` must be the kind of buffer the material
 * will really draw into, or the compiled program is not the one used.
 */
export async function compileFor(
  gl: WebGLRenderer,
  root: Object3D,
  camera: Camera,
  target: WebGLRenderTarget | null,
): Promise<void> {
  const previous = gl.getRenderTarget();
  let materials: Set<Material>;
  gl.setRenderTarget(target);
  try {
    materials = gl.compile(root, camera);
  } finally {
    gl.setRenderTarget(previous);
  }

  const programs = new Set<Program>();
  for (const material of materials) {
    const program = (gl.properties.get(material) as { currentProgram?: Program }).currentProgram;
    if (program) programs.add(program);
  }

  const parallel = gl.extensions.has("KHR_parallel_shader_compile");
  const giveUp = performance.now() + PROGRAM_TIMEOUT_MS;
  for (const program of programs) {
    if (parallel) {
      while (!program.isReady() && performance.now() < giveUp) await nextTask(8);
    } else {
      await nextTask();
    }
    program.getUniforms();
  }
}

/**
 * Every material the composer will draw with, sorted by whether it draws to
 * the screen. Found by walking passes, their effects and the passes those
 * own, rather than by name, so it follows the library's internals as they
 * change.
 */
function composerMaterials(composer: EffectComposer) {
  const screen = new Set<Material>();
  const offscreen = new Set<Material>();
  const seen = new Set<object>();
  const visit = (node: unknown, toScreen: boolean) => {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    if (node instanceof Material) {
      (toScreen ? screen : offscreen).add(node);
      return;
    }
    if (!(node instanceof Pass || node instanceof Effect || Array.isArray(node))) return;
    seen.add(node);
    if (node instanceof Pass && node.fullscreenMaterial) {
      visit(node.fullscreenMaterial, toScreen && node.renderToScreen);
    }
    for (const value of Object.values(node)) visit(value, false);
  };
  for (const pass of composer.passes) visit(pass, true);
  return { screen, offscreen };
}

export async function compileComposer(gl: WebGLRenderer, composer: EffectComposer, camera: Camera) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const sceneOf = (materials: Set<Material>) => {
    const scene = new Scene();
    for (const material of materials) scene.add(new Mesh(geometry, material));
    return scene;
  };
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  const { screen, offscreen } = composerMaterials(composer);
  try {
    await Promise.allSettled([
      compileFor(gl, sceneOf(offscreen), camera, target),
      compileFor(gl, sceneOf(screen), camera, null),
    ]);
  } finally {
    geometry.dispose();
    target.dispose();
  }
}

/** Resolves with `get()` once it has a value and has had a frame to settle, or `null`. */
export async function whenSet<T>(get: () => T | null, frames = 60): Promise<T | null> {
  for (let i = 0; i < frames && !get(); i++) await nextFrame();
  if (!get()) return null;
  await nextFrame();
  return get();
}

/** Keeps the first frame waiting until `work` settles. */
export function hold<T>(gl: WebGLRenderer, work: Promise<T>): Promise<T> {
  let set = pending.get(gl);
  if (!set) pending.set(gl, (set = new Set()));
  const tracked = set;
  tracked.add(work);
  const release = () => void tracked.delete(work);
  work.then(release, release);
  return work;
}

/** Runs heavy one-off GPU work a frame apart from the rest, so it never piles into one frame. */
export function inTurn(gl: WebGLRenderer, task: () => void): Promise<void> {
  const run = (queues.get(gl) ?? Promise.resolve()).then(nextFrame).then(task);
  queues.set(gl, run.catch(() => {}));
  return hold(gl, run);
}

export function held(gl: WebGLRenderer): Promise<unknown> {
  return Promise.allSettled([...(pending.get(gl) ?? [])]);
}
