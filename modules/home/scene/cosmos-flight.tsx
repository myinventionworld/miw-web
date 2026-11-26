"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  BODY,
  FRAME,
  HERO_FRAME,
  damp,
  flight,
  lerp,
  sampleCamera,
  smoothstep,
  type BodyScreen,
  type Vec3,
} from "../flight";
import { STATIONS } from "../stations";

const DOCKED_FOV = 38;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const LOOK = new THREE.Vector3();
const TO_BODY = new THREE.Vector3();
const NDC = new THREE.Vector3();

/** A body's circle on screen, in CSS pixels. */
function project(
  pos: THREE.Vector3,
  radius: number,
  camera: THREE.PerspectiveCamera,
  size: { width: number; height: number },
): BodyScreen {
  const gap = pos.distanceTo(camera.position);
  const ahead = LOOK.set(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .dot(TO_BODY.copy(pos).sub(camera.position).normalize());
  const ndc = NDC.copy(pos).project(camera);
  const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const angle = Math.asin(Math.min(1, radius / Math.max(gap, 1e-6)));
  return {
    x: ((ndc.x + 1) / 2) * size.width,
    y: ((1 - ndc.y) / 2) * size.height,
    r: (Math.tan(angle) / half) * (size.height / 2),
    visible: ahead > 0.2 && Math.abs(ndc.x) < 1.4 && Math.abs(ndc.y) < 2.4,
  };
}

const LOOK_AHEAD = 0.022;

/**
 * World distance the camera aims ahead. Fixed, because the pointer parallax
 * below is a world-space offset on the look target: let the target distance
 * vary and the same offset becomes a wildly different rotation.
 */
const LOOK_DISTANCE = 16;

/**
 * Drives the camera along the scroll-pinned waypoint track. Owns nothing else —
 * every other component reads `flight` independently.
 */
export function CosmosFlight() {
  const scratchA = useRef<Vec3>([0, 0, 0]);
  const scratchB = useRef<Vec3>([0, 0, 0]);
  const scratchC = useRef<Vec3>([0, 0, 0]);

  const position = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const heading = useRef(new THREE.Vector3());
  const body = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const roll = useRef(0);
  const dived = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3());

  useFrame(({ camera, size }, delta) => {
    const p = flight.eased;

    sampleCamera(p, scratchA.current);
    position.current.set(...scratchA.current);
    camera.position.copy(position.current);

    // Aim a little further along the track. Sampling `p + LOOK_AHEAD` as the
    // target directly is what the runway's end punishes: the clamp slides the
    // aim point into the camera over the last 3% of scroll, so the look vector
    // decays to zero exactly where the console parks. Taking the heading from a
    // span that is always LOOK_AHEAD wide, then pushing the target out a fixed
    // distance, keeps it finite everywhere.
    const ahead = Math.min(1, p + LOOK_AHEAD);
    sampleCamera(ahead, scratchB.current);
    sampleCamera(ahead - LOOK_AHEAD, scratchC.current);
    heading.current
      .set(
        scratchB.current[0] - scratchC.current[0],
        scratchB.current[1] - scratchC.current[1],
        scratchB.current[2] - scratchC.current[2],
      )
      .normalize();
    target.current
      .copy(position.current)
      .addScaledVector(heading.current, LOOK_DISTANCE);

    // ...then turn onto the station's body as we park. Offsetting the aim by
    // tan(half fov) * distance per unit of FRAME puts the body exactly there
    // on screen.
    const station = STATIONS[flight.station];
    const anchor = station && BODY[station.id];
    const lock = anchor ? flight.proximity : 0;
    if (anchor) {
      body.current.set(...anchor.pos);
      const docked = FRAME[station.id];
      const hero = station.id === "backend" ? 1 - smoothstep(0, station.anchor, p) : 0;
      const fx = lerp(docked.x, HERO_FRAME.x, hero);
      const fy = lerp(docked.y, HERO_FRAME.y, hero);
      const gap = body.current.distanceTo(position.current);
      const tan = Math.tan(THREE.MathUtils.degToRad(DOCKED_FOV / 2));
      forward.current.copy(body.current).sub(position.current).normalize();
      right.current.crossVectors(forward.current, WORLD_UP).normalize();
      up.current.crossVectors(right.current, forward.current).normalize();
      aim.current
        .copy(body.current)
        .addScaledVector(right.current, -fx * tan * (size.width / size.height) * gap)
        .addScaledVector(up.current, -fy * tan * gap);
      target.current.lerp(aim.current, lock);
    }

    forward.current.copy(target.current).sub(position.current).normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();
    up.current.crossVectors(right.current, forward.current).normalize();

    // Parallax as a look-target offset rather than a post-hoc euler tweak, so
    // the camera basis stays orthonormal and the horizon never shears.
    //
    // It fades to nothing as the console docks. Everywhere else the drift is
    // the point; over a form it is a background that moves while you are trying
    // to read and type against it. The starfield keeps its own drift, so the
    // scene is still alive once the camera stops.
    const settle = 1 - smoothstep(0.9, 0.965, p);
    const sway = (0.35 + (1 - flight.proximity) * 0.65) * settle;
    target.current
      .addScaledVector(right.current, flight.pointerEased.x * 1.1 * sway)
      .addScaledVector(up.current, flight.pointerEased.y * 0.7 * sway);

    const dive = flight.diveBody ? flight.dive : 0;
    if (flight.diveBody && dive > 0) {
      dived.current.set(...flight.diveBody.pos);
      const gap = dived.current.distanceTo(position.current);
      const travel = Math.max(0, gap - flight.diveBody.radius * 2.1) * dive;
      camera.position.lerp(dived.current, travel / Math.max(gap, 1e-6));
      target.current.lerp(dived.current, dive);
    }

    camera.lookAt(target.current);

    const drift =
      Math.sin(p * 21.0) * 0.016 + flight.velocity * 0.05 + flight.warp * 0.014;
    roll.current = damp(roll.current, drift, 4.2, delta);
    camera.rotateZ(roll.current * (1 - dive));

    // Widen the lens in transit — cheap, and it reads as raw speed.
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = 38 + flight.warp * 16 + Math.abs(flight.velocity) * 4;
    if (Math.abs(perspective.fov - fov) > 0.01) {
      perspective.fov = damp(perspective.fov, fov, 5, delta);
      perspective.updateProjectionMatrix();
    }

    camera.updateMatrixWorld();
    if (flight.diveBody) {
      dived.current.set(...flight.diveBody.pos);
      flight.diveScreen = project(dived.current, flight.diveBody.radius, perspective, size);
    }
    flight.bodyScreen = anchor
      ? {
          id: station.id,
          ...project(body.current, anchor.radius, perspective, size),
        }
      : null;
  });

  return null;
}
