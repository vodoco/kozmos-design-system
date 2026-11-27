/**
 * Compile-time only: Drawer's side equals the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type { DrawerSideName, TooltipToneName } from "#kozmos-recipes";
import type { KozmosDrawerSide } from "./types";
import type { KozmosTooltipTone } from "../Tooltip/types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type OverlayTypesMatchTheRecipes = [
  Expect<Equal<KozmosDrawerSide, DrawerSideName>>,
  Expect<Equal<KozmosTooltipTone, TooltipToneName>>,
];
