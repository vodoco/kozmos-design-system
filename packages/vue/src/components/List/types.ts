/**
 * List's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a value added there fails the typecheck here.
 */
export type KozmosListDensity = "default" | "compact";

export type KozmosListItemStatusValue = "todo" | "inProgress" | "done";
