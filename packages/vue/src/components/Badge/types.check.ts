/**
 * Compile-time only: each of Badge's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { BadgeSize, BadgeVariant } from "#kozmos-recipes";
import type { KozmosBadgeSize, KozmosBadgeVariant } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type BadgeTypesMatchTheRecipe = [
  Expect<Equal<KozmosBadgeVariant, BadgeVariant>>,
  Expect<Equal<KozmosBadgeSize, BadgeSize>>,
];
