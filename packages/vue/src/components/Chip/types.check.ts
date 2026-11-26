/**
 * Compile-time only: each of Chip's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type {
  ChipGroupSelectionMode,
  ChipSize,
  ChipVariant,
} from "#kozmos-recipes";
import type {
  KozmosChipGroupSelectionMode,
  KozmosChipSize,
  KozmosChipVariant,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type ChipTypesMatchTheRecipe = [
  Expect<Equal<KozmosChipVariant, ChipVariant>>,
  Expect<Equal<KozmosChipSize, ChipSize>>,
  Expect<Equal<KozmosChipGroupSelectionMode, ChipGroupSelectionMode>>,
];
