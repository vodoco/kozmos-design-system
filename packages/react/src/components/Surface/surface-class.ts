// The surface classes alone, apart from the Surface component: a part that is
// itself the surface's element (the map shell's panel, a card) takes its class
// from here without bringing the component into the app's bundle. The type is
// declared with the component, and only its type is imported here, so nothing
// of Surface.tsx runs or ships with this module.
import type { SurfaceVariant } from "./Surface";

export type { SurfaceVariant };

/**
 * The class for each variant, for a component that is itself the surface's
 * element (a landmark, a list item). Both carry `kozmos-reset`: the legacy
 * preflight, scoped to the root, would otherwise keep its border reset over
 * the surface's edge.
 */
export const SURFACE_CLASSES: Record<SurfaceVariant, string> = {
  solid: "kozmos-reset kozmos-surface-solid",
  glass: "kozmos-reset kozmos-surface-glass",
};

export function surfaceClass(variant: SurfaceVariant = "solid") {
  return SURFACE_CLASSES[variant];
}
