"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const bakeVertex = /* glsl */ `
varying vec3 vDir;

void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Renders `fragment` once into a cube map, so a field that only depends on the
 * direction from a body's centre is sampled each frame instead of recomputed.
 * The fragment reads `vec3 vDir` (unnormalised) and writes `gl_FragColor`.
 */
export function useBakedCube(fragment: string, size: number) {
  const gl = useThree((s) => s.gl);

  const target = useMemo(
    () =>
      new THREE.WebGLCubeRenderTarget(size, {
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
      }),
    [size],
  );

  useEffect(() => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: bakeVertex,
      fragmentShader: `varying vec3 vDir;\n${fragment}`,
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(geometry, material));

    new THREE.CubeCamera(0.1, 10, target).update(gl, scene);

    geometry.dispose();
    material.dispose();
  }, [gl, target, fragment]);

  useEffect(() => () => target.dispose(), [target]);

  return target.texture;
}
