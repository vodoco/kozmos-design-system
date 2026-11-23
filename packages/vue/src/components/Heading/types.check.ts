/**
 * Compile-time only: Heading's public types equal the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { HeadingLevel, headingTags } from "#kozmos-recipes";
import type { KozmosHeadingLevel, KozmosHeadingTag } from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type HeadingTypesMatchTheRecipe = [
  Expect<Equal<KozmosHeadingLevel, HeadingLevel>>,
  Expect<Equal<KozmosHeadingTag, (typeof headingTags)[HeadingLevel]>>,
];
