"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { NOISE_GLSL, RING_GLSL } from "@/lib/glsl";
import { BODY, damp, flight, smoothstep } from "@/lib/flight";
import { bindUniforms } from "@/lib/utils";
import { Rings } from "./rings";

const POS = new THREE.Vector3(...BODY.commerce.pos);
const R = BODY.commerce.radius;

const RING_INNER = R * 1.34;
const RING_OUTER = R * 2.28;
const RING_TILT: [number, number, number] = [-Math.PI / 2 + 0.34, 0, 0.18];
const RING_NORMAL = new THREE.Vector3(0, 0, 1)
  .applyEuler(new THREE.Euler(...RING_TILT))
  .normalize();

const SUN_DIR = new THREE.Vector3(0.62, 0.42, 0.66).normalize();

// Module constants: inlining these in JSX would hand `Rings` a fresh identity
// every render and rebuild its uniforms object.
const TINT_A = new THREE.Color(0.78, 0.71, 0.6);
const TINT_B = new THREE.Color(0.46, 0.44, 0.42);

const vertexShader = /* glsl */ `
varying vec3 vUnit;
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vView;

void main() {
  vUnit = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
${NOISE_GLSL}
${RING_GLSL}

uniform vec3 uSunDir;
uniform vec3 uRingCenter;
uniform vec3 uRingNormal;
uniform float uRingInner;
uniform float uRingOuter;
uniform float uOpacity;
uniform float uTime;

varying vec3 vUnit;
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vView;

/**
 * March from this surface point toward the star, intersect the ring plane, and
 * sample the same density the ring is drawn with. That shared function is why
 * the shadow lands in the gaps instead of as a generic dark band.
 */
float ringShadow(vec3 P) {
  float denom = dot(uSunDir, uRingNormal);
  if (abs(denom) < 1e-4) return 0.0;

  float t = dot(uRingCenter - P, uRingNormal) / denom;
  if (t <= 0.0) return 0.0;

  vec3 hit = P + uSunDir * t;
  float r = length(hit - uRingCenter);
  float r01 = (r - uRingInner) / max(uRingOuter - uRingInner, 1e-4);
  return clamp(ringDensity(r01) * 1.7, 0.0, 1.0);
}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 sp = normalize(vUnit);

  // Zonal banding: stretched hard in latitude, with slow turbulent shear so the
  // belts do not read as printed stripes.
  float shear = fbm(vec3(sp.x * 1.7, sp.y * 0.6, sp.z * 1.7) + uTime * 0.008, 4);
  float lat = sp.y * 5.4 + shear * 0.72;
  float belts = sin(lat) * 0.5 + 0.5;
  belts = pow(belts, 1.5);

  float grain = fbm(sp * 8.2 + uTime * 0.012, 4) * 0.5 + 0.5;

  vec3 dark = vec3(0.128, 0.104, 0.076);
  vec3 mid = vec3(0.372, 0.312, 0.232);
  vec3 pale = vec3(0.706, 0.640, 0.520);

  vec3 albedo = mix(dark, mid, belts);
  albedo = mix(albedo, pale, smoothstep(0.58, 0.94, belts * grain));

  // A single long-lived vortex, because a perfectly banded gas giant looks CG.
  vec2 eye = vec2(sp.x, sp.y - 0.18);
  float storm = 1.0 - smoothstep(0.06, 0.20, length(eye * vec2(1.0, 2.1)));
  albedo = mix(albedo, vec3(0.62, 0.36, 0.24), storm * 0.7);

  float ndl = dot(n, uSunDir);
  float day = smoothstep(-0.12, 0.34, ndl);

  float shadow = ringShadow(vWorld) * step(0.0, ndl);

  vec3 col = albedo * (day * 1.16 + 0.022);
  col *= 1.0 - shadow * 0.82;

  // Limb haze.
  float fres = pow(1.0 - max(dot(n, vView), 0.0), 3.0);
  col += vec3(0.42, 0.36, 0.28) * fres * (day * 0.7 + 0.05);

  gl_FragColor = vec4(col, uOpacity);
}
`;

export function RingedPlanet() {
  const planet = useRef<THREE.Mesh>(null);
  const fade = useRef(0);
  const opacity = useRef(0);

  const uniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR },
      uRingCenter: { value: POS.clone() },
      uRingNormal: { value: RING_NORMAL },
      uRingInner: { value: RING_INNER },
      uRingOuter: { value: RING_OUTER },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const p = flight.eased;

    // Visible across the whole leg that approaches and leaves this station.
    const target =
      smoothstep(0.1, 0.2, p) * (1 - smoothstep(0.4, 0.49, p));
    opacity.current = damp(opacity.current, target, 6, delta);
    fade.current = opacity.current;

    uniforms.uOpacity.value = opacity.current;
    uniforms.uTime.value += delta;

    if (planet.current) planet.current.rotation.y += delta * 0.018;
  });

  return (
    <group position={POS}>
      <mesh ref={planet}>
        <sphereGeometry args={[R, 96, 48]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          ref={bindUniforms(uniforms)}
          transparent
        />
      </mesh>

      <Rings
        inner={RING_INNER}
        outer={RING_OUTER}
        planetRadius={R}
        planetPosition={POS}
        sunDir={SUN_DIR}
        tintA={TINT_A}
        tintB={TINT_B}
        fade={fade}
        tilt={RING_TILT}
        spin={0.004}
      />
    </group>
  );
}
