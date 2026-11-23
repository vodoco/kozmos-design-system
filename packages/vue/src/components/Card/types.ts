/**
 * Card's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a padding, tone or size added there fails the typecheck here.
 */
export type KozmosCardPadding = "default" | "compact";

export type KozmosCardHeaderTone = "default" | "subtle";

export type KozmosCardTitleSize = "lg" | "md" | "sm";

/** The heading a card's title is: there is no `h1`, the page's own title. */
export type KozmosCardTitleLevel = "h2" | "h3" | "h4" | "h5" | "h6";
