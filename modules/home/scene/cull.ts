import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Object3D } from "three";

const SHOWN = 0.004;

/**
 * Hides an object while it is faded out so its shaders stop running.
 *
 * three only compiles what is visible, so everything is drawn for its first
 * frame regardless: hidden from the start, a body would compile its program
 * mid-flight, the first time it fades in, and stall that frame.
 */
export function useCull() {
  const frames = useRef(0);

  useFrame(() => {
    frames.current++;
  }, -20);

  return (object: Object3D | null, presence: number) => {
    if (object) object.visible = frames.current < 2 || presence > SHOWN;
  };
}
