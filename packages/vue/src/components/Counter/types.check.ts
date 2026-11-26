/**
 * Compile-time only: each of Counter's public types equals the shared
 * recipe's (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing
 * here is exported or bundled.
 */
import type { CounterSize, CounterTone } from "#kozmos-recipes";
import type { KozmosCounterSize, KozmosCounterTone } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type CounterTypesMatchTheRecipe = [
  Expect<Equal<KozmosCounterTone, CounterTone>>,
  Expect<Equal<KozmosCounterSize, CounterSize>>,
];
