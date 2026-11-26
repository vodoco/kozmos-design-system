/**
 * Counter's public prop types, written out so the package's declarations
 * name nothing outside it. `types.check.ts` holds each to the shared
 * recipe's own type, so a tone or a size added there fails the typecheck
 * here.
 */
export type KozmosCounterTone = "neutral" | "brand" | "destructive" | "inverse";

export type KozmosCounterSize = "sm" | "default";
