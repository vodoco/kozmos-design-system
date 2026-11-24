/**
 * Grid's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a step added there fails the typecheck here.
 */
export type KozmosGridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12 | "none";
export type KozmosGridRows = 1 | 2 | 3 | 4 | 5 | 6 | "none";
export type KozmosGridFlow =
  | "row"
  | "col"
  | "dense"
  | "row-dense"
  | "col-dense";
export type KozmosGridAlign =
  | "start"
  | "center"
  | "end"
  | "baseline"
  | "stretch";
export type KozmosGridJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around";
export type KozmosGridGap = 0 | 1 | 2 | 3 | 4 | 6 | 8;
export type KozmosGridXGap = 0 | 1 | 2 | 4 | 8;
export type KozmosGridYGap = 0 | 1 | 2 | 4 | 8;

/** The items a virtualized Grid draws (GAP-172): `start` up to, not including, `end`. */
export interface KozmosGridVirtualRange {
  start: number;
  end: number;
}
