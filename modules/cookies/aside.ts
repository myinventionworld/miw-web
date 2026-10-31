"use client";

import { useEffect, useSyncExternalStore } from "react";

let holders = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAside(): boolean {
  return useSyncExternalStore(subscribe, () => holders > 0, () => false);
}

export function useBannerAside(active: boolean) {
  useEffect(() => {
    if (!active) return;
    holders++;
    emit();
    return () => {
      holders--;
      emit();
    };
  }, [active]);
}
