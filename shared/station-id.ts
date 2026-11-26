export const STATION_IDS = ["backend", "commerce", "labs"] as const;

export type StationId = (typeof STATION_IDS)[number];
