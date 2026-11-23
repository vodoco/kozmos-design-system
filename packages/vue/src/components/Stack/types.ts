/**
 * Stack's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a step added there fails the typecheck here.
 */
export type KozmosStackDirection =
  | "row"
  | "column"
  | "row-reverse"
  | "column-reverse";
export type KozmosStackAlign =
  | "start"
  | "center"
  | "end"
  | "baseline"
  | "stretch";
export type KozmosStackJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around";
export type KozmosStackWrap = "nowrap" | "wrap" | "wrap-reverse";
export type KozmosStackGap = 0 | 1 | 2 | 3 | 4 | 6 | 8;
