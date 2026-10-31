import { type RefObject, useEffect, useState } from "react";

/**
 * Whether whatever is in `ref` should stand still because nobody can see them:
 * the box is off screen or the tab is hidden. Two events, no per-frame work.
 */
export function useIdle(ref: RefObject<Element | null>) {
  const [offScreen, setOffScreen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOffScreen(!e.isIntersecting));
    io.observe(el);
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);

  return offScreen || hidden;
}
