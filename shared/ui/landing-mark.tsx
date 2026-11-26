"use client";

import { type ReactNode, useState, ViewTransition } from "react";

import { landingMark } from "@/shared/lib/landing";

/** The planet the camera dived into turns into `children` when this page is where it lands. */
export function LandingMark({ id, children }: { id: string; children: ReactNode }) {
  const [named] = useState(() => landingMark() === id);
  if (!named) return children;
  return (
    <ViewTransition name="landing-body" share="landing-morph" default="none">
      {children}
    </ViewTransition>
  );
}
