"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { flight, lerp } from "@/lib/flight";
import { bindUniforms } from "@/lib/utils";

const DEPTH = 420;

const vertexShader = /* glsl */ `
attribute vec3 aOffset;
attribute float aSeed;

uniform float uTravel;
uniform float uWarp;
uniform float uDepth;
uniform float uStretch;

varying float vFade;
varying float vSeed;
varying float vHeat;

void main() {
  // Length of the streak: a dot at rest, a 300-unit rod at full warp.
  float heat = pow(uWarp, 1.45);
  float len = mix(0.5, uStretch, heat) * (0.35 + aSeed * 1.25);
  float thick = mix(0.16, 0.032, heat) * (0.45 + aSeed * 0.9);

  // Stars sweep toward +Z past the camera and wrap around the tunnel depth.
  vec3 center = aOffset;
  center.z = mod(center.z + uTravel + uDepth * 0.5, uDepth) - uDepth * 0.5;

  vec3 local = position * vec3(thick, thick, len);
  vec4 mv = modelViewMatrix * vec4(center + local, 1.0);

  float dist = length(mv.xyz);
  // Streaks read only off-axis, so near stars must survive: fade in fast, and
  // out gently toward the tunnel's far wall.
  vFade = (1.0 - smoothstep(uDepth * 0.34, uDepth * 0.52, dist)) *
          smoothstep(0.6, 5.0, dist);
  vSeed = aSeed;
  vHeat = heat;

  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
varying float vFade;
varying float vSeed;
varying float vHeat;

void main() {
  vec3 cool = vec3(0.60, 0.78, 1.00);
  vec3 warm = vec3(1.00, 0.87, 0.74);
  vec3 violet = vec3(0.74, 0.63, 1.00);

  vec3 col = mix(cool, warm, smoothstep(0.28, 0.72, vSeed));
  col = mix(col, violet, smoothstep(0.86, 1.0, vSeed));
  col = mix(col, vec3(1.0), vHeat * 0.55);

  float energy = 0.55 + vHeat * 1.15;
  float alpha = vFade * mix(0.7, 0.34, vHeat);

  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col * energy, alpha);
}
`;

export function Starfield({ count = 3200 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const travel = useRef(0);
  const speed = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTravel: { value: 0 },
      uWarp: { value: 0 },
      uDepth: { value: DEPTH },
      uStretch: { value: 110 },
    }),
    [],
  );

  const geometry = useMemo(() => {
    const base = new THREE.BoxGeometry(1, 1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute("position", base.getAttribute("position"));

    const offsets = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Hollow cylinder around the flight axis: keeps the lens clear and makes
      // the warp read as a tunnel rather than a fog.
      const radius = 13 + Math.pow(Math.random(), 0.55) * 72;
      const theta = Math.random() * Math.PI * 2;
      offsets[i * 3] = Math.cos(theta) * radius;
      offsets[i * 3 + 1] = Math.sin(theta) * radius * 0.78;
      offsets[i * 3 + 2] = (Math.random() - 0.5) * DEPTH;
      seeds[i] = Math.random();
    }

    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geo.instanceCount = count;
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), DEPTH);

    return geo;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera }, delta) => {
    const g = group.current;
    if (!g) return;

    // The tunnel rides with the camera, so all relative motion is in uTravel.
    g.position.copy(camera.position);

    const warp = flight.warp;
    // Docking slows the tunnel instead of stopping it. A dead starfield behind a
    // parked card reads as a canvas that crashed; a crawling one reads as
    // station-keeping, which is the thing actually happening.
    const idle = lerp(2.2, 0.4, flight.proximity);
    const target = lerp(idle, 620, Math.pow(warp, 1.35));
    speed.current = lerp(speed.current, target, 1 - Math.exp(-3.4 * delta));
    travel.current += speed.current * delta;

    uniforms.uTravel.value = travel.current;
    uniforms.uWarp.value = warp;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={bindUniforms(uniforms)}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
