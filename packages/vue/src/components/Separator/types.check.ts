/**
 * Compile-time only: Separator's public type equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { SeparatorOrientation } from "#kozmos-recipes";
import type { KozmosSeparatorOrientation } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type SeparatorTypesMatchTheRecipe = [
  Expect<Equal<KozmosSeparatorOrientation, SeparatorOrientation>>,
];
