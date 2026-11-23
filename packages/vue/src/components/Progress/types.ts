/**
 * Progress's public types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's.
 */
export type KozmosProgressShape = "linear" | "circular";
export type KozmosProgressSize = "sm" | "md" | "lg";
export type KozmosProgressLabelPlacement = "center" | "end";
export type KozmosProgressPlacement = "inline" | "top";

/** A normalized, host-selected interval, as React's `ProgressRange`. */
export interface KozmosProgressRange {
  start: number;
  end: number;
}
export type KozmosProgressTrackAppearance = "theme" | "gradient";
export type KozmosProgressTrackPositionMode = "static" | "live";
export type KozmosProgressTrackMotion = "none" | "directional";
