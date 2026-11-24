/**
 * Compile-time only: Timeline's public type equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { TimelineDensity } from "#kozmos-recipes";
import type { KozmosTimelineDensity } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type TimelineTypesMatchTheRecipe = [
  Expect<Equal<KozmosTimelineDensity, TimelineDensity>>,
];
