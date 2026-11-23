/**
 * Compile-time only: each of Text's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type {
  TextAlign,
  TextColor,
  TextSize,
  TextTag,
  TextWeight,
} from "#kozmos-recipes";
import type {
  KozmosTextAlign,
  KozmosTextColor,
  KozmosTextSize,
  KozmosTextTag,
  KozmosTextWeight,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type TextTypesMatchTheRecipe = [
  Expect<Equal<KozmosTextSize, TextSize>>,
  Expect<Equal<KozmosTextWeight, TextWeight>>,
  Expect<Equal<KozmosTextAlign, TextAlign>>,
  Expect<Equal<KozmosTextColor, TextColor>>,
  Expect<Equal<KozmosTextTag, TextTag>>,
];
