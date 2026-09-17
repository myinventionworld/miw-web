"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { NOISE_GLSL } from "@/lib/glsl";
import { bindUniforms } from "@/lib/utils";
import { BODY, damp, flight, smoothstep } from "@/lib/flight";

const EARTH_ORIGIN = BODY.backend.pos;
const EARTH_RADIUS = BODY.backend.radius;

const SUN_DIR = new THREE.Vector3(-0.55, 0.34, 0.76).normalize();

const surfaceVertex = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vUnit;
varying vec3 vView;

void main() {
  vUnit = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const surfaceFragment = /* glsl */ `
${NOISE_GLSL}

uniform vec3 uSunDir;
uniform float uOpacity;

varying vec3 vNormalW;
varying vec3 vUnit;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNormalW);
  vec3 sp = normalize(vUnit);

  float continents = fbm(sp * 1.55, 6);
  float ridges = fbm(sp * 4.1 + 11.7, 4);
  float land = smoothstep(0.015, 0.155, continents + ridges * 0.19);
  float detail = fbm(sp * 9.3 - 4.2, 4) * 0.5 + 0.5;

  vec3 abyss = vec3(0.002, 0.008, 0.028);
  vec3 shelf = vec3(0.010, 0.047, 0.104);
  vec3 ocean = mix(abyss, shelf, smoothstep(-0.42, 0.26, continents));

  vec3 ground = mix(vec3(0.028, 0.055, 0.046), vec3(0.098, 0.104, 0.086), detail);
  ground = mix(ground, vec3(0.148, 0.152, 0.158), smoothstep(0.58, 0.96, detail));

  float lat = abs(sp.y);
  float ice = smoothstep(0.80, 0.945, lat + fbm(sp * 3.0, 3) * 0.07);

  vec3 albedo = mix(ocean, ground, land);
  albedo = mix(albedo, vec3(0.70, 0.77, 0.86), ice);

  float ndl = dot(n, uSunDir);
  float day = smoothstep(-0.14, 0.30, ndl);

  vec3 h = normalize(uSunDir + vView);
  float spec = pow(max(dot(n, h), 0.0), 64.0) * (1.0 - land) * (1.0 - ice) * day;

  // Night side: sodium-lamp city clusters clinging to habitable latitudes.
  float density = fbm(sp * 23.0, 3) * 0.5 + 0.5;
  float cities = smoothstep(0.63, 0.90, density) * land * smoothstep(0.92, 0.38, lat);
  vec3 lights = vec3(1.0, 0.70, 0.34) * cities * (1.0 - day) * 2.1;

  vec3 col = albedo * (day * 1.18 + 0.016);
  col += spec * vec3(0.72, 0.86, 1.0) * 0.85;
  col += lights;

  // Atmospheric scatter bleeding over the limb.
  float fres = pow(1.0 - max(dot(n, vView), 0.0), 3.2);
  col += vec3(0.16, 0.42, 0.98) * fres * (day * 0.95 + 0.06);

  gl_FragColor = vec4(col, uOpacity);
}
`;

const cloudFragment = /* glsl */ `
${NOISE_GLSL}

uniform vec3 uSunDir;
uniform float uTime;
uniform float uOpacity;

varying vec3 vNormalW;
varying vec3 vUnit;
varying vec3 vView;

void main() {
  vec3 sp = normalize(vUnit);
  vec3 n = normalize(vNormalW);

  vec3 drift = vec3(uTime * 0.011, 0.0, uTime * 0.004);
  float band = fbm(sp * vec3(2.3, 4.6, 2.3) + drift, 5);
  float wisp = fbm(sp * 7.4 + drift * 2.0, 4) * 0.5 + 0.5;

  float mask = smoothstep(0.06, 0.46, band) * wisp;
  float day = smoothstep(-0.10, 0.34, dot(n, uSunDir));

  vec3 col = vec3(0.80, 0.86, 0.96) * (day * 1.05 + 0.018);
  float alpha = mask * uOpacity * (0.28 + day * 0.62);

  if (alpha < 0.003) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

const atmosphereVertex = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vNormalW;

void main() {
  vNormalV = normalize(normalMatrix * normal);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform float uOpacity;

varying vec3 vNormalV;
varying vec3 vNormalW;

void main() {
  float rim = pow(max(0.62 - dot(normalize(vNormalV), vec3(0.0, 0.0, 1.0)), 0.0), 3.4);
  float lit = smoothstep(-0.55, 0.42, dot(normalize(vNormalW), uSunDir));
  vec3 col = mix(vec3(0.06, 0.22, 0.72), vec3(0.42, 0.78, 1.0), lit);
  gl_FragColor = vec4(col * rim * (0.22 + lit * 1.45), rim * uOpacity);
}
`;

export function Earth() {
  const planet = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const opacity = useRef(1);

  const uniforms = useMemo(
    () => ({
      surface: {
        uSunDir: { value: SUN_DIR },
        uOpacity: { value: 1 },
      },
      cloud: {
        uSunDir: { value: SUN_DIR },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
      },
      atmosphere: {
        uSunDir: { value: SUN_DIR },
        uOpacity: { value: 1 },
      },
    }),
    [],
  );

  useFrame((_, delta) => {
    const p = flight.eased;

    // The camera genuinely flies past this body now, so the only job here is to
    // retire it once it is behind the lens and stop paying for the shader.
    const target = 1 - smoothstep(0.16, 0.26, p);
    opacity.current = damp(opacity.current, target, 6, delta);
    const fade = opacity.current;

    uniforms.surface.uOpacity.value = fade;
    uniforms.cloud.uOpacity.value = fade * 0.9;
    uniforms.atmosphere.uOpacity.value = fade;

    uniforms.cloud.uTime.value += delta;

    const spin = delta * 0.0125;
    if (planet.current) planet.current.rotation.y += spin;
    if (clouds.current) clouds.current.rotation.y += spin * 1.32;
  });

  return (
    <group position={EARTH_ORIGIN} rotation={[0, 0, 0.36]}>
      <mesh ref={planet}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 64]} />
        <shaderMaterial
          vertexShader={surfaceVertex}
          fragmentShader={surfaceFragment}
          ref={bindUniforms(uniforms.surface)}
          transparent
        />
      </mesh>

      <mesh ref={clouds}>
        <sphereGeometry args={[EARTH_RADIUS * 1.012, 96, 48]} />
        <shaderMaterial
          vertexShader={surfaceVertex}
          fragmentShader={cloudFragment}
          ref={bindUniforms(uniforms.cloud)}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.085}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 32]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          ref={bindUniforms(uniforms.atmosphere)}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
