/**
 * RadioGroup's public prop types, written out so the package's declarations
 * name nothing outside it. `types.check.ts` holds each to the shared
 * recipe's own type.
 */

/**
 * How an option is drawn (GAP-158). `default` is the ring and its label;
 * `card` a bordered box with an image or icon over the ring, the title and
 * the description; `tile` a smaller box of an icon over the title, for a grid
 * of short choices.
 */
export type KozmosRadioGroupItemVariant = "default" | "card" | "tile";
