/**
 * Compile-time only: each of the design config's public types equals the
 * shared recipe's (`#kozmos-recipes`). vue-tsc fails here when they differ;
 * nothing here is exported or bundled.
 */
import type {
  DesignConfig,
  DesignConfigInput,
  GlassConfig,
} from "#kozmos-recipes";
import type {
  KozmosDesignConfig,
  KozmosDesignConfigInput,
  KozmosGlassConfig,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type DesignConfigTypesMatchTheRecipe = [
  Expect<Equal<KozmosGlassConfig, GlassConfig>>,
  Expect<Equal<KozmosDesignConfig, DesignConfig>>,
  Expect<Equal<KozmosDesignConfigInput, DesignConfigInput>>,
];
