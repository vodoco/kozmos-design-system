/**
 * Icon's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a size or colour added there fails the typecheck here.
 */
export type KozmosIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export type KozmosIconColor = "default" | "muted" | "primary" | "destructive";
