/**
 * Compile-time only: each of Input's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled. The action is React's but for its toggle's icon,
 * which is Vue's (the contract's exception `KozmosInput.action:type`).
 */
import type { CharacterCount, InputStatus } from "#kozmos-recipes";
import type { KozmosCharacterCount, KozmosInputStatus } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type InputTypesMatchTheRecipe = [
  Expect<Equal<KozmosInputStatus, InputStatus>>,
  Expect<Equal<KozmosCharacterCount, CharacterCount>>,
];
