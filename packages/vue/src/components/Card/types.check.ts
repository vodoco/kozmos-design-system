/**
 * Compile-time only: each of Card's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type {
  CardHeaderTone,
  CardPadding,
  CardTitleSize,
} from "#kozmos-recipes";
import type {
  KozmosCardHeaderTone,
  KozmosCardPadding,
  KozmosCardTitleSize,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type CardTypesMatchTheRecipe = [
  Expect<Equal<KozmosCardPadding, CardPadding>>,
  Expect<Equal<KozmosCardHeaderTone, CardHeaderTone>>,
  Expect<Equal<KozmosCardTitleSize, CardTitleSize>>,
];
