/**
 * Rating's public prop types, written out so the package's declarations
 * name nothing outside it. `types.check.ts` holds each to the shared
 * recipe's own type.
 */

/**
 * What a rating is measured on: `stars`, an ordinal scale, or `thumbs`, a
 * choice of two (0 unanswered, 1 down, 2 up).
 */
export type KozmosRatingVariant = "stars" | "thumbs";

/** Words for an option, or for a read-only rating's value. */
export type KozmosRatingLabel = (
  value: number,
  max: number,
  variant: KozmosRatingVariant,
) => string;
