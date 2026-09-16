"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  BODY,
  damp,
  flight,
  sampleCamera,
  smoothstep,
  type Vec3,
} from "@/lib/flight";
import { STATIONS } from "@/lib/stations";

const LOOK_AHEAD = 0.022;

/**
 * Drives the camera along the scroll-pinned waypoint track. Owns nothing else —
 * every other component reads `flight` independently.
 */
export function CosmosFlight() {
  const scratchA = useRef<Vec3>([0, 0, 0]);
  const scratchB = useRef<Vec3>([0, 0, 0]);

  const position = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const body = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const roll = useRef(0);

  useFrame(({ camera }, delta) => {
    const p = flight.eased;

    sampleCamera(p, scratchA.current);
    position.current.set(...scratchA.current);
    camera.position.copy(position.current);

    // Aim a little further along the track...
    sampleCamera(Math.min(1, p + LOOK_AHEAD), scratchB.current);
    target.current.set(...scratchB.current);

    // ...then ease onto the station's body as we park. `proximity` is 1 on
    // station and 0 mid-leg, so the lock and the warp are exact inverses.
    const station = STATIONS[flight.station];
    const anchor = BODY[station.id];
    if (anchor) {
      body.current.set(...anchor.pos);
      // Past the last station the lock releases. `proximityAt` returns 1 for
      // everything beyond the final anchor, so without this the camera keeps
      // the pulsar dead-centre all the way to the console — a star behind the
      // form is exactly the washed-out composition this rebuild replaced.
      const lock = flight.proximity * (1 - smoothstep(0.84, 0.93, p));
      target.current.lerp(body.current, lock * 0.92);
    }

    forward.current.copy(target.current).sub(position.current).normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();
    up.current.crossVectors(right.current, forward.current).normalize();

    // Parallax as a look-target offset rather than a post-hoc euler tweak, so
    // the camera basis stays orthonormal and the horizon never shears.
    const sway = 0.35 + (1 - flight.proximity) * 0.65;
    target.current
      .addScaledVector(right.current, flight.pointerEased.x * 1.1 * sway)
      .addScaledVector(up.current, flight.pointerEased.y * 0.7 * sway);

    camera.lookAt(target.current);

    const drift =
      Math.sin(p * 21.0) * 0.016 + flight.velocity * 0.05 + flight.warp * 0.014;
    roll.current = damp(roll.current, drift, 4.2, delta);
    camera.rotateZ(roll.current);

    // Widen the lens in transit — cheap, and it reads as raw speed.
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = 38 + flight.warp * 16 + Math.abs(flight.velocity) * 4;
    if (Math.abs(perspective.fov - fov) > 0.01) {
      perspective.fov = damp(perspective.fov, fov, 5, delta);
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}
