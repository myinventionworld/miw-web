import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ShaderMaterial } from "three";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Attaches a uniforms object to a ShaderMaterial by ref instead of by prop.
 * Passing `uniforms` as a prop makes R3F store a clone, so every per-frame
 * write to the original silently never reaches the GPU.
 */
export function bindUniforms(uniforms: Record<string, { value: unknown }>) {
  return (material: ShaderMaterial | null) => {
    if (material) material.uniforms = uniforms;
  };
}

export function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      (window.WebGL2RenderingContext && canvas.getContext("webgl2")) ||
        (window.WebGLRenderingContext && canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * True where the flight deck should not be rendered at all.
 *
 * A phone can run this scene — that is the trap. It runs it at 22fps with the
 * radio on and the battery draining, on a viewport where the station card fills
 * the screen anyway and the planet it is composed against is behind it. The
 * scroll-pinned camera also depends on a wheel gesture with a velocity; a
 * momentum flick delivers `touchmove` without one, which is the same reason the
 * dock magnet never fires on touch.
 *
 * So the test is not "is this device weak", it is "is this device pointing at
 * the experience the scene was composed for".
 *
 * That used to be `(pointer: coarse)` plus a narrow viewport, and the width half
 * was wrong. Width is not a property of the input device: an iPad in landscape
 * is 1024–1366 CSS px, so every one of them cleared the bar and got the full
 * scroll-pinned camera — a WebGL context on battery, driven by a momentum flick
 * that carries no wheel velocity, which is precisely the gesture the dock magnet
 * cannot read. The deck was being served to the one device class this function
 * exists to keep off it.
 *
 * `(hover: none)` is the direct test instead, because hover is the capability
 * the deck is actually built on — the pointer parallax, the hover states and the
 * wheel-velocity magnet all assume a pointing device that rests on the page.
 * A touchscreen laptop still passes: its primary pointer is the trackpad, so it
 * reports `hover: hover` and keeps the deck, which is the correct answer for a
 * machine that has a wheel and the width to compose against.
 *
 * Deliberately not user-agent sniffing, and deliberately read once at mount
 * rather than watched — swapping a visitor from the 3D deck to the flat grid
 * mid-scroll because they rotated the phone would lose their place on the page.
 */
export function prefersFlatDeck(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cannotHover = window.matchMedia("(hover: none)").matches;
  return coarse && cannotHover;
}
