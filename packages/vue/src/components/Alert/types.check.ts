/**
 * Compile-time only: each of Alert's public types equals the shared
 * recipe's (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing
 * here is exported or bundled.
 */
import type {
  AlertLiveness,
  AlertTitleLevel,
  AlertVariant,
} from "#kozmos-recipes";
import type {
  KozmosAlertLiveness,
  KozmosAlertTitleLevel,
  KozmosAlertVariant,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type AlertTypesMatchTheRecipe = [
  Expect<Equal<KozmosAlertVariant, AlertVariant>>,
  Expect<Equal<KozmosAlertLiveness, AlertLiveness>>,
  Expect<Equal<KozmosAlertTitleLevel, AlertTitleLevel>>,
];
