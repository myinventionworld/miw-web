import type { ShaderMaterial } from "three";

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
