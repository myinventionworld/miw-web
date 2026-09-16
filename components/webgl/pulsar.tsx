"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { BODY, damp, flight, smoothstep } from "@/lib/flight";
import { bindUniforms } from "@/lib/utils";
import { Rings } from "./rings";

const POS = new THREE.Vector3(...BODY.venture.pos);
const R = BODY.venture.radius;

const RING_INNER = R * 1.48;
const RING_OUTER = R * 2.42;
const RING_TILT: [number, number, number] = [-Math.PI / 2 + 0.46, 0, -0.22];

/**
 * Lateral, not along the track. The approach runs down -Z, so a +Z sun would
 * put every ring fragment at peak forward-scatter at once and flood the frame
 * with the flat grey wash this rebuild exists to remove. Sideways light also
 * throws a readable shadow wedge instead of a uniform one.
 */
const SUN_DIR = new THREE.Vector3(0.79, 0.36, 0.5).normalize();

const TINT_A = new THREE.Color(1.5, 1.28, 0.86);
const TINT_B = new THREE.Color(0.32, 0.62, 1.35);

const vertexShader = /* glsl */ `
varying vec3 vNormalV;

void main() {
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Photosphere only. There is no halo billboard here by design — a large
 * camera-facing plane close to the lens samples nothing but its own centre and
 * floods the frame with flat grey. The glow is left to the bloom pass, which
 * derives it from this surface's actual HDR values.
 */
const coreFragment = /* glsl */ `
uniform float uPulse;
uniform float uEnergy;
uniform float uExposure;

varying vec3 vNormalV;

void main() {
  float facing = max(dot(normalize(vNormalV), vec3(0.0, 0.0, 1.0)), 0.0);

  vec3 rim = vec3(0.34, 0.66, 1.55);
  vec3 body = mix(rim, vec3(2.4, 2.4, 2.3), pow(facing, 1.6));
  vec3 hot = vec3(8.2, 8.0, 7.6) * pow(facing, 3.2);

  // Both terms ride uEnergy. An ungated base would clip the sphere to white at
  // every distance, flattening it and blowing out anything layered over it.
  vec3 col = body * (0.03 + uEnergy * 1.34) + hot * (0.07 + uEnergy * 1.06);
  col *= uExposure * (1.0 + uPulse * 2.4);

  gl_FragColor = vec4(col, 1.0);
}
`;

const shockFragment = /* glsl */ `
uniform float uPulse;
varying vec3 vLocal;

uniform float uInner;
uniform float uOuter;

void main() {
  float r = length(vLocal.xy);
  float r01 = (r - uInner) / max(uOuter - uInner, 1e-4);
  // A single hard wavefront rather than a soft torus.
  float edge = smoothstep(0.0, 0.16, r01) * (1.0 - smoothstep(0.22, 0.6, r01));
  float alpha = edge * uPulse;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(vec3(0.72, 1.55, 2.1) * (1.0 + uPulse * 2.0), alpha);
}
`;

const shockVertex = /* glsl */ `
varying vec3 vLocal;

void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function Pulsar() {
  const core = useRef<THREE.Mesh>(null);
  const shock = useRef<THREE.Mesh>(null);
  const ringFade = useRef(0);

  const uniforms = useMemo(
    () => ({
      core: {
        uPulse: { value: 0 },
        uEnergy: { value: 0 },
        uExposure: { value: 1 },
      },
      shock: {
        uPulse: { value: 0 },
        uInner: { value: R * 1.1 },
        uOuter: { value: R * 4.2 },
      },
    }),
    [],
  );

  const shockGeometry = useMemo(
    () => new THREE.RingGeometry(R * 1.1, R * 4.2, 128, 1),
    [],
  );

  useFrame(({ camera }, delta) => {
    const p = flight.eased;

    // Peaks on station, then settles so the console stacked over it stays
    // readable instead of being washed out.
    const energy =
      smoothstep(0.62, 0.8, p) * (1 - 0.62 * smoothstep(0.86, 0.96, p));

    flight.pulse = Math.max(0, flight.pulse - delta * 1.05);
    const pulse = flight.pulse;

    // Far off the star is a few pixels wide and can be driven well past white
    // without flooding anything; up close that same exposure turns the frame
    // into a wall of light, so control is handed back to uEnergy.
    const dist = camera.position.distanceTo(POS);
    const near = 1 - smoothstep(40, 240, dist);
    uniforms.core.uExposure.value = 1 + (1 - near) * 3.6;

    uniforms.core.uEnergy.value = energy;
    uniforms.core.uPulse.value = pulse;
    uniforms.shock.uPulse.value = pulse * pulse;

    ringFade.current = damp(
      ringFade.current,
      smoothstep(0.56, 0.72, p),
      5,
      delta,
    );

    if (core.current) core.current.rotation.y += delta * 0.12;

    if (shock.current) {
      shock.current.scale.setScalar(pulse > 0.001 ? 1 + (1 - pulse) * 7 : 0.0001);
      shock.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group position={POS}>
      <mesh ref={core}>
        <sphereGeometry args={[R, 64, 48]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={coreFragment}
          ref={bindUniforms(uniforms.core)}
          toneMapped={false}
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
        fade={ringFade}
        tilt={RING_TILT}
        spin={0.05}
        glow={1.15}
      />

      <mesh ref={shock} geometry={shockGeometry} scale={0.0001}>
        <shaderMaterial
          vertexShader={shockVertex}
          fragmentShader={shockFragment}
          ref={bindUniforms(uniforms.shock)}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
