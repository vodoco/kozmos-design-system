/**
 * Compile-time only: each of Container's public types equals the shared
 * recipe's (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing
 * here is exported or bundled.
 */
import type {
  ContainerBlock,
  ContainerBlockInset,
  ContainerInset,
} from "#kozmos-recipes";
import type {
  KozmosContainerBlock,
  KozmosContainerBlockInset,
  KozmosContainerInset,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type ContainerTypesMatchTheRecipe = [
  Expect<Equal<KozmosContainerBlockInset, ContainerBlockInset>>,
  Expect<Equal<KozmosContainerBlock, ContainerBlock>>,
  Expect<Equal<KozmosContainerInset, ContainerInset>>,
];
