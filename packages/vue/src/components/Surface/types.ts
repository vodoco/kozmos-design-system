/**
 * Surface's public prop type, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds it to the shared recipe's.
 */

/**
 * What a surface is made of. Solid — the background colour with the subtle
 * border — is the default everywhere; glass, the glass surface role composed
 * from `Semantics.Effect.glass`, is a choice a product makes per surface.
 */
export type KozmosSurfaceVariant = "solid" | "glass";
