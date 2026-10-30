"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import * as THREE from "three";

import { WAYPOINTS } from "../flight";
import { CosmosFlight } from "./cosmos-flight";
import { Earth } from "./earth";
import { Effects } from "./effects";
import { FlightDriver } from "./flight-driver";
import { FramePacer, pacing } from "./frame-pacer";
import { IcePlanet } from "./ice-planet";
import { LogoModel } from "./logo-model";
import { ProductMoons } from "./product-moons";
import { Pulsar } from "./pulsar";
import { RingedPlanet } from "./ringed-planet";
import { Starfield } from "./starfield";

/** Studio rig baked into a cube map — no HDRI fetch, no network dependency. */
function ChromeEnvironment() {
  return (
    <Environment resolution={192} frames={1}>
      <Lightformer
        form="rect"
        intensity={5}
        color="#ffffff"
        position={[0, 5.5, -7]}
        scale={[14, 7, 1]}
      />
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#5ad9ff"
        position={[-7, 1.2, 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[10, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#9d7bff"
        position={[7, -1.4, 2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[10, 4, 1]}
      />
      <Lightformer
        form="ring"
        intensity={3.4}
        color="#ffffff"
        position={[2.5, 3.5, 6]}
        scale={5}
      />
      <Lightformer
        form="circle"
        intensity={1.6}
        color="#ff9f6e"
        position={[-4, -4, -4]}
        scale={6}
      />
    </Environment>
  );
}

/**
 * The sharpest the canvas gets, on every screen. On a 1x screen that is twice
 * the screen's pixels, scaled down by the browser: since the composer cannot
 * multisample (see `Effects`), this is what smooths the edges there.
 */
const MAX_DPR = 2;

export function CosmosScene() {
  // Start at the ceiling, not below it. This used to start at 1.5 and let the
  // monitor raise it once it had 2.5 s of frames, so a fast machine resized
  // the canvas with the hero planet on screen. Now only a machine that cannot
  // hold the frame rate ever sees a change.
  const [dpr, setDpr] = useState(MAX_DPR);
  const [quality, setQuality] = useState<"high" | "low">("high");

  const dense =
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches;

  return (
    <Canvas
      frameloop="never"
      dpr={dpr}
      gl={{
        // Off on purpose: everything is drawn into the composer's buffer, so
        // multisampling the canvas would never touch the scene and would only
        // cost memory. `Effects` says how the edges are smoothed instead.
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        toneMapping: THREE.NoToneMapping,
      }}
      camera={{
        position: [...WAYPOINTS[0].pos],
        fov: 38,
        near: 0.5,
        far: 12000,
      }}
      onCreated={({ gl }) => gl.setClearColor("#030305")}
    >
      <FramePacer />
      <FlightDriver />

      <PerformanceMonitor
        // The pacer drops to 30fps at rest on purpose. Judge each window by the
        // lowest rate it asked for, or idling reads as the GPU falling behind.
        bounds={() => {
          const floor = pacing.floor;
          pacing.floor = pacing.target;
          return [floor * 0.83, floor];
        }}
        onDecline={() => {
          // One step at a time: a machine that only struggles at 2x keeps the
          // full grade at 1.5, where every machine used to start.
          if (dpr > 1.5) {
            setDpr(1.5);
          } else {
            setDpr(1);
            setQuality("low");
          }
        }}
        onIncline={() => setDpr(MAX_DPR)}
      />

      {/* Far plane is huge; fog keeps the tail of the track from stacking up. */}
      <fog attach="fog" args={["#030305", 700, 4600]} />
      <ambientLight intensity={0.16} />
      <pointLight position={[6, 4, 8]} intensity={22} color="#9fd8ff" />
      <pointLight position={[-7, -3, 4]} intensity={14} color="#a77bff" />

      <Suspense fallback={null}>
        <ChromeEnvironment />
        <LogoModel />
        <Earth />
        <RingedPlanet />
        <IcePlanet />
        <Pulsar />
        <ProductMoons />
        <Starfield count={dense ? 3200 : 1400} />
      </Suspense>

      <CosmosFlight />
      <Effects quality={quality} />
    </Canvas>
  );
}
