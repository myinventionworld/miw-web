"use client";

import { useEffect, useState } from "react";

/** The id of whichever of `ids` crosses the band just under the header, or null. */
export function useSectionInView(ids: readonly string[]) {
  const [current, setCurrent] = useState<string | null>(null);
  const key = ids.join(" ");

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        setCurrent(key.split(" ").find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const id of key.split(" ")) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  return current;
}
