/** Ids, not labels. The badge text is at `projects:status.<id>`. */
export type ProjectStatus = "live" | "beta" | "build" | "internal";

export const STATUS_TONE: Record<ProjectStatus, string> = {
  live: "border-accent/60 text-accent",
  beta: "border-accent/40 text-accent",
  build: "border-white/30 text-platinum",
  internal: "border-white/30 text-platinum",
};
