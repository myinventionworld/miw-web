"use client";

import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { EffectComposer } from "postprocessing";

import { cn } from "@/shared/lib/cn";

import { WAYPOINTS } from "../flight";
import { CosmosFlight } from "./cosmos-flight";
import { Earth } from "./earth";
import { Effects } from "./effects";
import { FlightDriver } from "./flight-driver";
import { FramePacer, frameLog, type Gate } from "./frame-pacer";
import { IcePlanet } from "./ice-planet";
import { LogoModel } from "./logo-model";
import { ProductMoons } from "./product-moons";
import { Pulsar } from "./pulsar";
import { dprFor, planTier, QualityGovernor, type Tier, type Viewport } from "./quality";
import { RingedPlanet } from "./ringed-planet";
import { Starfield } from "./starfield";
import { compileComposer, compileFor, held, whenSet } from "./warmup";

const Diagnostics = lazy(() => import("./diagnostics").then((m) => ({ default: m.Diagnostics })));

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

const GL = {
  // Off on purpose: everything is drawn into the composer's buffer, so
  // multisampling the canvas would never touch the scene and would only
  // cost memory. `Effects` says how the edges are smoothed instead.
  antialias: false,
  alpha: false,
  powerPreference: "high-performance",
  stencil: false,
  depth: true,
  toneMapping: THREE.NoToneMapping,
} as const;

const CAMERA = {
  position: [...WAYPOINTS[0].pos] as [number, number, number],
  fov: 38,
  near: 0.5,
  far: 12000,
};

function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false);

  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });

  return null;
}

/** Holds the first frame until the scene's and the composer's programs are compiled and the planets baked. */
function Warmup({
  composer,
  onWarm,
}: {
  composer: RefObject<EffectComposer | null>;
  onWarm: () => void;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    let live = true;
    // The composer draws the scene into a half-float buffer, not the screen.
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    void (async () => {
      await Promise.allSettled([compileFor(gl, scene, camera, target), held(gl)]);
      target.dispose();
      const post = live ? await whenSet(() => composer.current) : null;
      if (post && live) await compileComposer(gl, post, camera).catch(() => {});
      if (live) onWarm();
    })();
    return () => {
      live = false;
    };
  }, [gl, scene, camera, composer, onWarm]);

  return null;
}

/**
 * Everything in the scene graph, memoised: a quality change re-renders the
 * canvas, and a re-render here would rebake the environment, which drei does
 * whenever its children change identity.
 */
const Scene = memo(function Scene({
  dense,
  detail,
  composer,
  onWarm,
  onReady,
}: {
  dense: boolean;
  detail: number;
  composer: RefObject<EffectComposer | null>;
  onWarm: () => void;
  onReady: () => void;
}) {
  return (
    <>
      {/* Far plane is huge; fog keeps the tail of the track from stacking up. */}
      <fog attach="fog" args={["#030305", 700, 4600]} />
      <ambientLight intensity={0.16} />
      <pointLight position={[6, 4, 8]} intensity={22} color="#9fd8ff" />
      <pointLight position={[-7, -3, 4]} intensity={14} color="#a77bff" />

      <Suspense fallback={null}>
        <ChromeEnvironment />
        <LogoModel />
        <Earth detail={detail} />
        <RingedPlanet />
        <IcePlanet detail={detail} />
        <Pulsar />
        <ProductMoons />
        <Starfield count={dense ? 3200 : 1400} />
        <Warmup composer={composer} onWarm={onWarm} />
        <Ready onReady={onReady} />
      </Suspense>

      <CosmosFlight />
    </>
  );
});

function readViewport(): Viewport {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
}

function useViewport(onChange: () => void) {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    let timer = 0;
    let query: MediaQueryList | null = null;
    const update = () => {
      onChange();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setViewport(readViewport());
        watch();
      }, 150);
    };
    // Moving the window to a screen with another pixel ratio need not resize it.
    const watch = () => {
      query?.removeEventListener("change", update);
      query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      query.addEventListener("change", update);
    };
    watch();
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", update);
      query?.removeEventListener("change", update);
    };
  }, [onChange]);

  return viewport;
}

const showStats = () =>
  process.env.NODE_ENV !== "production" ||
  new URLSearchParams(window.location.search).has("gfxstats");

export function CosmosScene({ gpu, onTooSlow }: { gpu: string; onTooSlow: () => void }) {
  const [plan] = useState(() =>
    planTier(
      gpu,
      {
        memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
        cores: navigator.hardwareConcurrency,
      },
      new URLSearchParams(window.location.search).get("gfx"),
    ),
  );
  const [tier, setTier] = useState<Tier>(plan.tier);
  const [gate] = useState<Gate>(() => ({ open: false }));
  const [stats] = useState(showStats);
  const [dense] = useState(() => window.matchMedia("(min-width: 768px)").matches);
  const [ready, setReady] = useState(false);
  const live = useRef<Viewport | null>(null);
  const composer = useRef<EffectComposer | null>(null);
  const tooSlow = useRef(onTooSlow);
  useEffect(() => {
    tooSlow.current = onTooSlow;
  }, [onTooSlow]);

  const [governor] = useState(
    () =>
      new QualityGovernor({
        ...plan,
        pixels: (t) => {
          const v = live.current ?? readViewport();
          const d = dprFor(t, v);
          return v.width * d * v.height * d;
        },
        onChange: setTier,
        onGiveUp: () => tooSlow.current(),
      }),
  );

  const interrupt = useCallback(() => governor.interrupt(), [governor]);
  const viewport = useViewport(interrupt);
  useEffect(() => {
    live.current = viewport;
  }, [viewport]);
  const dpr = dprFor(tier, viewport);

  // Fixed at mount: rebaking the planets later would cost more than it saves.
  const detail = plan.tier === "low" ? 512 : 1024;

  const [mountedAt] = useState(() => performance.now());
  useEffect(() => {
    frameLog.mounted = mountedAt;
  }, [mountedAt]);
  const onWarm = useCallback(() => {
    gate.open = true;
    frameLog.warm = performance.now();
  }, [gate]);
  const onReady = useCallback(() => {
    frameLog.shown = performance.now();
    setReady(true);
  }, []);

  return (
    <Canvas
      className={cn(
        "transition-opacity duration-[1600ms] ease-out motion-reduce:transition-none",
        ready ? "opacity-100" : "opacity-0",
      )}
      data-tier={tier}
      frameloop="never"
      dpr={dpr}
      // The canvas is fixed to the viewport; scrolling never moves it, so
      // measuring it on every scroll event only forces layout.
      resize={{ scroll: false }}
      gl={GL}
      camera={CAMERA}
      onCreated={({ gl }) => gl.setClearColor("#030305")}
    >
      <FramePacer governor={governor} gate={gate} />
      <FlightDriver />
      <Scene dense={dense} detail={detail} composer={composer} onWarm={onWarm} onReady={onReady} />
      <Effects dpr={dpr} lite={tier === "low"} composer={composer} />
      {stats && (
        <Suspense fallback={null}>
          <Diagnostics governor={governor} />
        </Suspense>
      )}
    </Canvas>
  );
}
