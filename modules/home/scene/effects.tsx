"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import {
  BlendFunction,
  type BloomEffect,
  type ChromaticAberrationEffect,
  type EffectComposer as Composer,
  ToneMappingMode,
} from "postprocessing";

import { flight, lerp, smoothstep } from "../flight";
import { bloomLevels } from "./quality";

const BASE_RADIUS = 0.86;
const ABERRATION: [number, number] = [0.0003, 0.0002];

/**
 * The effect list is the same at every quality tier on purpose: the composer
 * builds its passes, and compiles their shaders, from the effect objects, and
 * any constructor prop that changes (Bloom's `levels`, `radius`) replaces the
 * object and rebuilds all of it. What a tier changes is set on the live
 * objects below instead.
 */
export function Effects({
  dpr,
  lite,
  composer,
}: {
  dpr: number;
  lite: boolean;
  composer: RefObject<Composer | null>;
}) {
  const bloom = useRef<BloomEffect>(null);
  const aberration = useRef<ChromaticAberrationEffect>(null);
  const tuning = useRef({ dpr, lite });

  const tune = useCallback((effect: BloomEffect | null) => {
    bloom.current = effect;
    if (!effect) return;
    const levels = bloomLevels(tuning.current.dpr);
    if (effect.mipmapBlurPass.levels !== levels) effect.mipmapBlurPass.levels = levels;
    // The bright pass runs at the full drawing buffer by default; the blur
    // that follows starts at half of it anyway.
    effect.luminancePass.resolution.scale = tuning.current.lite ? 0.5 : 1;
  }, []);

  useLayoutEffect(() => {
    tuning.current = { dpr, lite };
    tune(bloom.current);
  }, [dpr, lite, tune]);

  useFrame(() => {
    const p = flight.eased;
    const warp = flight.warp;
    // How much of the frame the pulsar owns.
    const star = smoothstep(0.66, 0.9, p);

    if (bloom.current) {
      // Near the star more bloom only lifts the black floor into grey. Tighten
      // the threshold instead and let the photosphere's own exposure blow out.
      // The rings depend on this: a loose threshold smears them back into the
      // halo we just removed.
      bloom.current.intensity =
        lerp(0.6, 1.45, warp) * (1 - star * 0.44) + flight.pulse * 2.4;
      bloom.current.luminanceMaterial.threshold = lerp(0.22, 1.02, star);
      // Collapse the kernel too. Threshold alone still leaves an eight-level
      // mipmap chain smearing the core across half the frame.
      bloom.current.mipmapBlurPass.radius = lerp(BASE_RADIUS, 0.38, star);
    }

    if (aberration.current) {
      // Lens dispersion scales with transit speed and the console's pulse.
      const amount =
        0.00026 +
        warp * 0.0018 +
        Math.abs(flight.velocity) * 0.0015 +
        flight.pulse * 0.0022;
      aberration.current.offset.set(amount, amount * 0.72);
    }
  });

  return (
    // No MSAA on the composer's buffer, at any ratio. In Chrome on an Apple
    // GPU (ANGLE over Metal) a multisampled buffer now and then hands back a
    // frame with the planet, the logo and the orbits missing and only the
    // stars left: the hero planet blinked out for a frame every second or so.
    // Two, four or eight samples all do it; none never does. The logo's
    // bevels and the hairline orbits get their smoothing from the canvas
    // running at 2x (`CosmosScene`) and from SMAA below.
    <EffectComposer ref={composer} multisampling={0} enableNormalPass={false}>
      <Bloom
        ref={tune}
        mipmapBlur
        intensity={0.62}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.32}
        radius={BASE_RADIUS}
        levels={8}
      />
      <ChromaticAberration
        ref={aberration}
        offset={ABERRATION}
        radialModulation
        modulationOffset={0.42}
      />
      <Vignette offset={0.24} darkness={0.82} />
      <Noise premultiply opacity={0.028} blendFunction={BlendFunction.OVERLAY} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      {/* Last, on the finished image. MSAA only smooths silhouettes; the
          logo's bevels are a pixel or two wide and their highlights flicker
          from one pixel to the next, which only an edge filter catches. */}
      <SMAA />
    </EffectComposer>
  );
}
