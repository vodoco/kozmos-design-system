/**
 * Compile-time only: each of Button's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { ButtonEmotion, ButtonSize, ButtonVariant } from "#kozmos-recipes";
import type {
  KozmosButtonEmotion,
  KozmosButtonSize,
  KozmosButtonVariant,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type ButtonTypesMatchTheRecipe = [
  Expect<Equal<KozmosButtonVariant, ButtonVariant>>,
  Expect<Equal<KozmosButtonSize, ButtonSize>>,
  Expect<Equal<KozmosButtonEmotion, ButtonEmotion>>,
];
