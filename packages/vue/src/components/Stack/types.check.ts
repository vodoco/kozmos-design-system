/**
 * Compile-time only: each of Stack's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type {
  StackAlign,
  StackDirection,
  StackGap,
  StackJustify,
  StackWrap,
} from "#kozmos-recipes";
import type {
  KozmosStackAlign,
  KozmosStackDirection,
  KozmosStackGap,
  KozmosStackJustify,
  KozmosStackWrap,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type StackTypesMatchTheRecipe = [
  Expect<Equal<KozmosStackDirection, StackDirection>>,
  Expect<Equal<KozmosStackAlign, StackAlign>>,
  Expect<Equal<KozmosStackJustify, StackJustify>>,
  Expect<Equal<KozmosStackWrap, StackWrap>>,
  Expect<Equal<KozmosStackGap, StackGap>>,
];
