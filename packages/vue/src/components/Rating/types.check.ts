/**
 * Compile-time only: each of Rating's public types equals the shared
 * recipe's (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing
 * here is exported or bundled.
 */
import type { RatingLabel, RatingVariant } from "#kozmos-recipes";
import type { KozmosRatingLabel, KozmosRatingVariant } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type RatingTypesMatchTheRecipe = [
  Expect<Equal<KozmosRatingVariant, RatingVariant>>,
  Expect<Equal<KozmosRatingLabel, RatingLabel>>,
];
