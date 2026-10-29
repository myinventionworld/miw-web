"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { PROJECTS } from "@/data/projects";
import { BODY, damp, flight, smoothstep, type Vec3 } from "@/lib/flight";
import { productFocus } from "@/lib/product-focus";

/**
 * Our products as moons, each in its own colour, orbiting the planet of the
 * station it belongs to: Omnibus around the first planet (startups), Boowie
 * and Wovie around the products planet. The same picture as the brand cover.
 *
 * Flat, matte and dim on purpose: no emissive, so the bloom pass leaves them
 * alone. Pointing at a product in the header menu brightens its orbit and
 * swells the moon a little.
 */

interface MoonSpec {
  slug: string;
  center: Vec3;
  radius: number;
  size: number;
  tilt: [number, number, number];
  speed: number;
  phase: number;
  /** Flight progress window in which the host planet is on screen. */
  visible: (p: number) => number;
}

const earthVisible = (p: number) => 1 - smoothstep(0.16, 0.26, p);
const labsVisible = (p: number) =>
  smoothstep(0.34, 0.44, p) * (1 - smoothstep(0.64, 0.73, p));

const SPECS: MoonSpec[] = [
  {
    slug: "omnibus",
    center: BODY.backend.pos,
    radius: BODY.backend.radius * 1.55,
    size: 1.3,
    tilt: [0.32, 0, -0.18],
    speed: 0.07,
    phase: 2.2,
    visible: earthVisible,
  },
  {
    slug: "boowie",
    center: BODY.labs.pos,
    radius: BODY.labs.radius * 1.5,
    size: 1.5,
    tilt: [0.26, 0, 0.2],
    speed: 0.06,
    phase: 0.6,
    visible: labsVisible,
  },
  {
    slug: "wovie",
    center: BODY.labs.pos,
    radius: BODY.labs.radius * 1.95,
    size: 1.1,
    tilt: [-0.18, 0, -0.12],
    speed: 0.045,
    phase: 3.6,
    visible: labsVisible,
  },
];

function Moon({ spec, color }: { spec: MoonSpec; color: string }) {
  const group = useRef<THREE.Group>(null);
  const moon = useRef<THREE.Mesh>(null);
  /** The host planet is on screen: drives the orbit line. */
  const shown = useRef(0);
  /** The moon itself: also off while it is behind the text. */
  const opacity = useRef(0);
  const focus = useRef(0);
  const screen = useMemo(() => new THREE.Vector3(), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.8),
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: 0,
      }),
    [color],
  );

  const orbit = useMemo(() => {
    const points = Array.from({ length: 160 }, (_, i) => {
      const a = (i / 160) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * spec.radius, 0, Math.sin(a) * spec.radius);
    });
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    return line;
  }, [spec.radius]);

  useFrame((state, delta) => {
    const a = state.clock.elapsedTime * spec.speed + spec.phase;
    if (moon.current) {
      moon.current.position.set(Math.cos(a) * spec.radius, 0, Math.sin(a) * spec.radius);
    }

    // The copy sits on the left of the frame (the hero, and the station card
    // opposite its planet), so a moon fades out while its orbit carries it
    // behind the text and comes back on the planet's side.
    let clear = 1;
    if (moon.current) {
      moon.current.getWorldPosition(screen).project(state.camera);
      clear = screen.z > 1 ? 0 : smoothstep(-0.15, 0.12, screen.x);
    }
    shown.current = damp(shown.current, spec.visible(flight.eased), 6, delta);
    opacity.current = damp(opacity.current, shown.current * clear, 6, delta);
    focus.current = damp(
      focus.current,
      productFocus.slug === spec.slug ? 1 : 0,
      8,
      delta,
    );

    const f = focus.current;
    material.opacity = opacity.current;
    (orbit.material as THREE.LineBasicMaterial).opacity =
      shown.current * (0.12 + 0.4 * f);

    if (moon.current) {
      moon.current.scale.setScalar(1 + 0.35 * f);
      moon.current.visible = opacity.current > 0.01;
    }
    if (group.current) group.current.visible = shown.current > 0.01;
  });

  return (
    <group ref={group} position={spec.center} rotation={spec.tilt}>
      <primitive object={orbit} />
      <mesh ref={moon} material={material}>
        <sphereGeometry args={[spec.size, 32, 16]} />
      </mesh>
    </group>
  );
}

export function ProductMoons() {
  return (
    <>
      {SPECS.map((spec) => {
        const project = PROJECTS.find((p) => p.slug === spec.slug);
        return project ? (
          <Moon key={spec.slug} spec={spec} color={project.color} />
        ) : null;
      })}
    </>
  );
}
