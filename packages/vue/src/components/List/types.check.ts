/**
 * Compile-time only: each of List's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { ListDensity, ListItemStatusValue } from "#kozmos-recipes";
import type { KozmosListDensity, KozmosListItemStatusValue } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type ListTypesMatchTheRecipe = [
  Expect<Equal<KozmosListDensity, ListDensity>>,
  Expect<Equal<KozmosListItemStatusValue, ListItemStatusValue>>,
];
