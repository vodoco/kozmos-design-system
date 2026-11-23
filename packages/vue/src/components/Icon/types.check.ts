/**
 * Compile-time only: each of Icon's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { IconColor, IconSize } from "#kozmos-recipes";
import type { KozmosIconColor, KozmosIconSize } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type IconTypesMatchTheRecipe = [
  Expect<Equal<KozmosIconSize, IconSize>>,
  Expect<Equal<KozmosIconColor, IconColor>>,
];
