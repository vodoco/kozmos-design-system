/**
 * Compile-time only: Surface's public type equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { SurfaceVariant } from "#kozmos-recipes";
import type { KozmosSurfaceVariant } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type SurfaceTypesMatchTheRecipe = [
  Expect<Equal<KozmosSurfaceVariant, SurfaceVariant>>,
];
