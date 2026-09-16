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
