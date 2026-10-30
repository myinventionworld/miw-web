"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  BIAS_SCALE,
  BODY,
  FRAME_BIAS,
  damp,
  flight,
  sampleCamera,
  smoothstep,
  type Vec3,
} from "../flight";
import { STATIONS } from "../stations";

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

  useFrame(({ camera }, delta) => {
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

    // ...then ease onto the station's body as we park. `proximity` is 1 on
    // station and 0 mid-leg, so the lock and the warp are exact inverses.
    const station = STATIONS[flight.station];
    const anchor = BODY[station.id];
    // Past the last station the lock releases. `proximityAt` returns 1 for
    // everything beyond the final anchor, so without this the camera keeps
    // the pulsar dead-centre all the way to the console — a star behind the
    // form is exactly the washed-out composition this rebuild replaced.
    const lock = anchor ? flight.proximity * (1 - smoothstep(0.84, 0.93, p)) : 0;
    if (anchor) {
      body.current.set(...anchor.pos);
      target.current.lerp(body.current, lock * 0.92);
    }

    forward.current.copy(target.current).sub(position.current).normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();
    up.current.crossVectors(right.current, forward.current).normalize();

    // Docking composition. The lock above centres the body by construction,
    // which is the wrong answer now that the info card alternates sides: three
    // of the four stations would park their card on top of their own subject.
    // Nudging the aim point away from the body slides it across the frame, and
    // scaling by `lock` means this only ever applies while parked — the transit
    // is still aimed down the track.
    const bias = FRAME_BIAS[station.id];
    if (bias && lock > 0.001) {
      target.current
        .addScaledVector(right.current, -bias.x * BIAS_SCALE.x * lock)
        .addScaledVector(up.current, -bias.y * BIAS_SCALE.y * lock);
    }

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
