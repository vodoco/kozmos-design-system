// Surface's recipe: the classes a Kozmos surface draws with, for every
// framework that draws one. React's `Surface` and Vue's `KozmosSurface`
// build their element from it, and a part that is itself the surface's
// element (the map shell's panel, a card) takes its class from here without
// bringing the component into the app's bundle. Framework-free
// (`recipes.framework-free.test.ts`).

/**
 * What a surface is made of. Solid — the background colour with the subtle
 * border — is the default everywhere; glass, the glass surface role composed
 * from `Semantics.Effect.glass`, is a choice a product makes per surface.
 */
export type SurfaceVariant = "solid" | "glass";

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
