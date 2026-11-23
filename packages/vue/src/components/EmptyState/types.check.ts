/**
 * Compile-time only: each of EmptyState's public types equals the shared
 * recipe's (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing
 * here is exported or bundled.
 */
import type { Emotion, EmptyStateSize } from "#kozmos-recipes";
import type { KozmosEmptyStateSize } from "./types";
import type { KozmosEmotion } from "../Tag/types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type EmptyStateTypesMatchTheRecipe = [
  Expect<Equal<KozmosEmptyStateSize, EmptyStateSize>>,
  Expect<Equal<KozmosEmotion, Emotion>>,
];
