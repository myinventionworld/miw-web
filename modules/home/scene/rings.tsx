"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { RING_GLSL } from "./glsl";
import { bindUniforms } from "./bind-uniforms";

/**
 * A flat, razor-thin debris ring. Deliberately not a glow sprite: the radius is
 * recovered per-fragment from the local position, so the band structure stays
 * crisp at any screen size instead of blurring into a halo.
 */

const vertexShader = /* glsl */ `
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalW;

void main() {
  vLocal = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  // RingGeometry lies in local XY, so the plane normal is local +Z.
  vNormalW = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
${RING_GLSL}

uniform float uInner;
uniform float uOuter;
uniform float uOpacity;
uniform float uPlanetR;
uniform vec3 uPlanetPos;
uniform vec3 uSunDir;
uniform vec3 uTintA;
uniform vec3 uTintB;
uniform float uGlow;

varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalW;

void main() {
  float r = length(vLocal.xy);
  float r01 = (r - uInner) / max(uOuter - uInner, 1e-4);

  float density = ringDensity(r01);
  if (density < 0.004) discard;

  vec3 V = normalize(vWorld - cameraPosition);
  vec3 N = normalize(vNormalW);

  // Beer–Lambert along the sight line. Looking down on the plane the ring is
  // faint; edge-on the path length explodes and it snaps to a bright wire.
  float cosI = abs(dot(V, N));
  float path = 1.0 / max(cosI, 0.055);
  float alpha = 1.0 - exp(-density * path * 2.4);

  // Planet shadow, as a ray–sphere test toward the star. Hard-edged on purpose.
  vec3 L = uPlanetPos - vWorld;
  float tca = dot(L, uSunDir);
  float d2 = dot(L, L) - tca * tca;
  float r2 = uPlanetR * uPlanetR;
  float shadow = tca > 0.0 ? 1.0 - smoothstep(r2 * 0.88, r2 * 1.04, d2) : 0.0;

  // Ice forward-scatters hard: the ring flares when the star sits behind it and
  // goes matte when the star is behind the camera.
  float fwd = pow(max(-dot(V, uSunDir), 0.0), 7.0);
  float back = pow(max(dot(V, uSunDir), 0.0), 2.0);

  vec3 tint = mix(uTintA, uTintB, ringNoise(r01 * 11.0));

  // Light radiated by the body at the ring's centre, falling off with distance.
  // Nil for a planet lit by a distant star; for an accretion ring around a
  // pulsar it is the only source, and the falloff is what stops the disc from
  // reading as one flat sheet of grey.
  float rn = max(r / max(uInner, 1e-4), 1.0);
  vec3 emitted = tint * uGlow / (rn * rn);

  // Only the external terms are occluded — the body cannot shadow its own light.
  vec3 col =
    (tint * (0.26 + back * 0.44) + tint * fwd * 2.6) * (1.0 - shadow * 0.94) +
    emitted;

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * uOpacity);
}
`;

export interface RingsProps {
  inner: number;
  outer: number;
  planetRadius: number;
  planetPosition: THREE.Vector3;
  sunDir: THREE.Vector3;
  tintA: THREE.Color;
  tintB: THREE.Color;
  /** Mutated by the parent each frame; never triggers a render. */
  fade: RefObject<number>;
  /** Radians. Axial tilt of the ring plane. */
  tilt?: [number, number, number];
  spin?: number;
  /** Radiance of the encircled body itself. Zero for a planet. */
  glow?: number;
}

export function Rings({
  inner,
  outer,
  planetRadius,
  planetPosition,
  sunDir,
  tintA,
  tintB,
  fade,
  tilt = [-Math.PI / 2 + 0.34, 0, 0.18],
  spin = 0.006,
  glow = 0,
}: RingsProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uInner: { value: inner },
      uOuter: { value: outer },
      uOpacity: { value: 0 },
      uPlanetR: { value: planetRadius },
      uPlanetPos: { value: planetPosition.clone() },
      uSunDir: { value: sunDir.clone() },
      uTintA: { value: tintA.clone() },
      uTintB: { value: tintB.clone() },
      uGlow: { value: glow },
    }),
    [inner, outer, planetRadius, planetPosition, sunDir, tintA, tintB, glow],
  );

  const geometry = useMemo(
    () => new THREE.RingGeometry(inner, outer, 512, 1),
    [inner, outer],
  );

  useFrame((_, delta) => {
    uniforms.uOpacity.value = fade.current;
    uniforms.uPlanetPos.value.copy(planetPosition);
    // Rotating in the ring's own plane keeps the band structure static while
    // the dust drifts, which is what the eye actually reads as orbital motion.
    if (mesh.current) mesh.current.rotateZ(delta * spin);
  });

  return (
    <mesh ref={mesh} geometry={geometry} rotation={tilt} renderOrder={2}>
      <shaderMaterial
        ref={bindUniforms(uniforms)}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
