/**
 * Chip's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a variant or a size added there fails the typecheck here.
 */
export type KozmosChipVariant = "neutral" | "brand" | "destructive";
export type KozmosChipSize = "sm" | "default" | "lg";
export type KozmosChipGroupSelectionMode = "multiple" | "single";
