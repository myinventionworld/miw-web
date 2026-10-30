"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { LOGO_ORIGIN, damp, flight, lerp, smoothstep } from "../flight";
import { bindUniforms } from "./bind-uniforms";

type Pt = readonly [number, number];

/**
 * Bold geometric letterforms, drawn on a 1.0-unit em square. The W is the M
 * mirrored across the baseline — the mark's whole conceit.
 */
const M_OUTLINE: Pt[] = [
  [0.0, 0.0],
  [0.0, 1.0],
  [0.26, 1.0],
  [0.5, 0.45],
  [0.74, 1.0],
  [1.0, 1.0],
  [1.0, 0.0],
  [0.78, 0.0],
  [0.78, 0.62],
  [0.58, 0.2],
  [0.42, 0.2],
  [0.22, 0.62],
  [0.22, 0.0],
];

const I_OUTLINE: Pt[] = [
  [0.0, 0.0],
  [0.24, 0.0],
  [0.24, 1.0],
  [0.0, 1.0],
];

const W_OUTLINE: Pt[] = M_OUTLINE.map(([x, y]) => [x, 1 - y] as Pt);

function toShape(points: Pt[]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  return shape;
}

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.24,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.024,
  bevelOffset: 0,
  bevelSegments: 4,
  curveSegments: 2,
};

const GLYPHS = [
  { outline: M_OUTLINE, x: 0 },
  { outline: I_OUTLINE, x: 1.14 },
  { outline: W_OUTLINE, x: 1.52 },
];

const TOTAL_WIDTH = 2.52;

const ringVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** One mesh yields both the orbit line and the satellite's comet tail. */
const ringFragment = /* glsl */ `
uniform float uAngle;
uniform float uOpacity;
uniform vec3 uTrailColor;
uniform float uBase;

varying vec2 vUv;

void main() {
  float behind = fract(uAngle - vUv.x);
  float trail = pow(1.0 - behind, 26.0);
  float alpha = (uBase + trail * 1.5) * uOpacity;
  vec3 col = mix(uTrailColor, vec3(1.4, 1.5, 1.6), trail);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

const glowFragment = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5) * 2.0;
  float halo = pow(max(1.0 - d, 0.0), 3.0);
  float core = pow(max(1.0 - d, 0.0), 16.0);
  vec3 col = mix(vec3(0.30, 0.72, 1.25), vec3(1.5, 1.5, 1.45), core);
  float alpha = (halo * 0.55 + core) * uOpacity;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col * (halo + core * 2.4), alpha);
}
`;

const ORBIT_RX = 3.3;
const ORBIT_RY = 1.42;

export function LogoModel() {
  const root = useRef<THREE.Group>(null);
  const letters = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const satellite = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const angle = useRef(0.12);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c8d2e0",
        metalness: 1,
        roughness: 0.14,
        envMapIntensity: 2.1,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 1,
        iridescenceIOR: 1.9,
        iridescenceThicknessRange: [120, 520],
        transparent: true,
      }),
    [],
  );

  const geometries = useMemo(
    () =>
      GLYPHS.map(({ outline, x }) => {
        const geo = new THREE.ExtrudeGeometry(toShape(outline), EXTRUDE);
        geo.translate(x - TOTAL_WIDTH / 2, -0.5, -EXTRUDE.depth! / 2);
        return geo;
      }),
    [],
  );

  const ringUniforms = useMemo(
    () => ({
      inner: {
        uAngle: { value: 0 },
        uOpacity: { value: 1 },
        uBase: { value: 0.16 },
        uTrailColor: { value: new THREE.Color(0.28, 0.7, 1.15) },
      },
      outer: {
        uAngle: { value: 0 },
        uOpacity: { value: 1 },
        uBase: { value: 0.07 },
        uTrailColor: { value: new THREE.Color(0.55, 0.5, 1.1) },
      },
      glow: { uOpacity: { value: 1 } },
    }),
    [],
  );

  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
    [geometries, material],
  );

  useFrame(({ camera }, delta) => {
    const p = flight.eased;

    const presence = 1 - smoothstep(0.055, 0.145, p);
    const ringPresence = 1 - smoothstep(0.13, 0.235, p);
    // The ring blows open into a gateway the camera flies through. Scaled to
    // the new track, where the whole first leg spans ~60 units rather than ~10.
    const gate = 1 + Math.pow(smoothstep(0.02, 0.16, p), 2.2) * 22;

    material.opacity = presence;
    ringUniforms.inner.uOpacity.value = ringPresence;
    ringUniforms.outer.uOpacity.value = ringPresence * 0.8;
    ringUniforms.glow.uOpacity.value = ringPresence;

    if (root.current) {
      root.current.visible = ringPresence > 0.004;
      const px = flight.pointerEased.x;
      const py = flight.pointerEased.y;
      root.current.rotation.y = damp(root.current.rotation.y, px * 0.26, 3.4, delta);
      root.current.rotation.x = damp(root.current.rotation.x, -py * 0.18, 3.4, delta);
    }

    if (letters.current) {
      const t = performance.now() * 0.001;
      letters.current.position.y = Math.sin(t * 0.62) * 0.055;
      letters.current.rotation.z = Math.sin(t * 0.41) * 0.016;
      letters.current.scale.setScalar(lerp(1, 1.5, smoothstep(0.04, 0.15, p)));
    }

    if (orbit.current) orbit.current.scale.set(gate, gate, gate);

    angle.current = (angle.current + delta * 0.13) % 1;
    ringUniforms.inner.uAngle.value = angle.current;
    ringUniforms.outer.uAngle.value = (angle.current + 0.5) % 1;

    if (satellite.current) {
      const theta = angle.current * Math.PI * 2;
      satellite.current.position.set(
        Math.cos(theta) * ORBIT_RX,
        Math.sin(theta) * ORBIT_RY,
        0,
      );
    }
    if (glow.current) glow.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={root} position={LOGO_ORIGIN}>
      <group ref={letters} scale={1.55}>
        {geometries.map((geo, i) => (
          <mesh key={i} geometry={geo} material={material} castShadow={false} />
        ))}
      </group>

      <group ref={orbit} rotation={[-0.34, 0.12, 0.16]}>
        <mesh scale={[ORBIT_RX, ORBIT_RY, 1]}>
          <torusGeometry args={[1, 0.011, 3, 320]} />
          <shaderMaterial
            vertexShader={ringVertex}
            fragmentShader={ringFragment}
            ref={bindUniforms(ringUniforms.inner)}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh scale={[ORBIT_RX * 1.26, ORBIT_RY * 1.26, 1]} rotation={[0, 0, 0.5]}>
          <torusGeometry args={[1, 0.006, 3, 256]} />
          <shaderMaterial
            vertexShader={ringVertex}
            fragmentShader={ringFragment}
            ref={bindUniforms(ringUniforms.outer)}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <group ref={satellite}>
          <mesh>
            <sphereGeometry args={[0.052, 16, 16]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh ref={glow} scale={1.4}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              vertexShader={ringVertex}
              fragmentShader={glowFragment}
              ref={bindUniforms(ringUniforms.glow)}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
