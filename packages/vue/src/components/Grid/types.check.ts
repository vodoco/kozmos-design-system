/**
 * Compile-time only: each of Grid's public types equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type {
  GridAlign,
  GridCols,
  GridFlow,
  GridGap,
  GridJustify,
  GridRows,
  GridVirtualWindow,
  GridXGap,
  GridYGap,
} from "#kozmos-recipes";
import type {
  KozmosGridAlign,
  KozmosGridCols,
  KozmosGridFlow,
  KozmosGridGap,
  KozmosGridJustify,
  KozmosGridRows,
  KozmosGridVirtualRange,
  KozmosGridXGap,
  KozmosGridYGap,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type GridTypesMatchTheRecipe = [
  Expect<Equal<KozmosGridCols, GridCols>>,
  Expect<Equal<KozmosGridRows, GridRows>>,
  Expect<Equal<KozmosGridFlow, GridFlow>>,
  Expect<Equal<KozmosGridAlign, GridAlign>>,
  Expect<Equal<KozmosGridJustify, GridJustify>>,
  Expect<Equal<KozmosGridGap, GridGap>>,
  Expect<Equal<KozmosGridXGap, GridXGap>>,
  Expect<Equal<KozmosGridYGap, GridYGap>>,
  // The range reported is the window's own items.
  Expect<
    Equal<KozmosGridVirtualRange, Pick<GridVirtualWindow, "start" | "end">>
  >,
];
