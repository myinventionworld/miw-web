"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { NOISE_GLSL } from "@/lib/glsl";
import { BODY, damp, flight, smoothstep } from "@/lib/flight";
import { bindUniforms } from "@/lib/utils";
import { useBakedCube } from "./baked-cube";

const POS = new THREE.Vector3(...BODY.labs.pos);
const R = BODY.labs.radius;

const SUN_DIR = new THREE.Vector3(-0.48, 0.3, 0.82).normalize();

const vertexShader = /* glsl */ `
varying vec3 vUnit;
varying vec3 vNormalW;
varying vec3 vView;

void main() {
  vUnit = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fieldsFragment = /* glsl */ `
${NOISE_GLSL}

void main() {
  vec3 sp = normalize(vDir);

  // Ridged noise inverts fbm's smooth hills into sharp valleys — the standard
  // way to get a fracture network rather than blobs.
  float f1 = fbm(sp * 2.6, 5);
  float ridge = 1.0 - abs(f1);
  float fractures = smoothstep(0.86, 0.995, ridge);

  float f2 = fbm(sp * 6.1 + 19.3, 4);
  float minor = smoothstep(0.90, 0.999, 1.0 - abs(f2)) * 0.55;

  float cracks = clamp(fractures + minor, 0.0, 1.0);

  // Shell thickness: thin ice reads as the ocean beneath showing through.
  float thickness = fbm(sp * 1.9 - 7.4, 4) * 0.5 + 0.5;

  float caps = smoothstep(0.78, 0.93, abs(sp.y) + fbm(sp * 3.4, 3) * 0.06);

  gl_FragColor = vec4(cracks, thickness, caps, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${NOISE_GLSL}

uniform samplerCube uFields;
uniform vec3 uSunDir;
uniform float uOpacity;
uniform float uTime;

varying vec3 vUnit;
varying vec3 vNormalW;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNormalW);
  vec3 sp = normalize(vUnit);

  vec4 fields = textureCube(uFields, sp);
  float cracks = fields.r;
  float thickness = fields.g;

  vec3 deep = vec3(0.012, 0.055, 0.128);
  vec3 shallow = vec3(0.106, 0.318, 0.472);
  vec3 ice = vec3(0.786, 0.868, 0.930);

  vec3 albedo = mix(deep, shallow, smoothstep(0.24, 0.72, thickness));
  albedo = mix(albedo, ice, smoothstep(0.52, 0.88, thickness));
  // Fracture floors expose liquid, so they run warm-dark against the shell.
  albedo = mix(albedo, vec3(0.043, 0.169, 0.290), cracks * 0.88);
  albedo = mix(albedo, vec3(0.94, 0.96, 0.99), fields.b);

  float ndl = dot(n, uSunDir);
  float day = smoothstep(-0.16, 0.32, ndl);

  // Ice is a strong specular reflector; this is what keeps it from reading
  // as a flat matte ball.
  vec3 h = normalize(uSunDir + vView);
  float spec = pow(max(dot(n, h), 0.0), 96.0) * day * (1.0 - cracks * 0.6);

  vec3 col = albedo * (day * 1.22 + 0.028);
  col += spec * vec3(0.86, 0.94, 1.0) * 1.15;

  // Thin high-latitude aurora on the night side.
  float aurora = smoothstep(0.62, 0.92, abs(sp.y)) * (1.0 - day);
  if (aurora > 0.0) {
    aurora *= fbm(sp * 5.0 + vec3(0.0, uTime * 0.14, 0.0), 3) * 0.5 + 0.5;
    col += vec3(0.16, 0.86, 0.62) * aurora * 0.5;
  }

  float fres = pow(1.0 - max(dot(n, vView), 0.0), 3.4);
  col += vec3(0.30, 0.58, 0.92) * fres * (day * 0.85 + 0.08);

  gl_FragColor = vec4(col, uOpacity);
}
`;

export function IcePlanet() {
  const planet = useRef<THREE.Mesh>(null);
  const opacity = useRef(0);
  const fields = useBakedCube(fieldsFragment, 1024);

  const uniforms = useMemo(
    () => ({
      uFields: { value: fields },
      uSunDir: { value: SUN_DIR },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    }),
    [fields],
  );

  useFrame((_, delta) => {
    const p = flight.eased;
    const target = smoothstep(0.34, 0.44, p) * (1 - smoothstep(0.64, 0.73, p));
    opacity.current = damp(opacity.current, target, 6, delta);

    uniforms.uOpacity.value = opacity.current;
    uniforms.uTime.value += delta;

    if (planet.current) planet.current.rotation.y += delta * 0.014;
  });

  return (
    <group position={POS} rotation={[0, 0, 0.22]}>
      <mesh ref={planet}>
        <sphereGeometry args={[R, 112, 56]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          ref={bindUniforms(uniforms)}
          transparent
        />
      </mesh>
    </group>
  );
}
