/**
 * Heading's public prop types, written out so the package's declarations
 * name nothing outside it. `types.check.ts` holds them to the shared
 * recipe's own.
 */
export type KozmosHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The tag a heading may draw as, whatever its level. */
export type KozmosHeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
