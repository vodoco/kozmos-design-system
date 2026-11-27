/**
 * RadioGroup's recipe: the group, each option's ring and dot, the radio
 * cards and tiles (GAP-158), and the words beside them, for every framework
 * that draws one. React's `RadioGroup` and `RadioGroupItem` (on Radix) and
 * Vue's `KozmosRadioGroup` and `KozmosRadioGroupItem` build the same
 * elements from it. Framework-free (`recipes.framework-free.test.ts`).
 */
import { cn } from "../utils";

/**
 * How an option is drawn (GAP-158). `default` is the ring and its label;
 * `card` a bordered box with an image or icon over the ring, the title and
 * the description; `tile` a smaller box of an icon over the title, for a grid
 * of short choices.
 */
export type RadioVariant = "default" | "card" | "tile";

/** The group: its options in a column, 8 apart. */
export const RADIO_GROUP_CLASS = "grid gap-2";

/**
 * A default option's row: the ring beside its label, 44 tall at least. With
 * a description the ring sits by the label's first line, else in the row's
 * middle.
 */
export function radioRowClass(described: boolean) {
  return cn("flex min-h-11 gap-2", described ? "items-start" : "items-center");
}

/**
 * The ring is a border on the surface, theme 600; the dot is a fill, the
 * theme fill, theme 500 in both themes (decision 59). The dot draws in
 * currentColor, so the text colour is the dot's.
 */
export const RADIO_CLASS =
  "peer aspect-square h-5 w-5 shrink-0 rounded-pill border border-input text-theme-fill ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-checked:border-primary aria-checked:text-theme-fill";

/** The ring in error, over `RADIO_CLASS`. */
export const RADIO_ERROR_CLASS =
  "border-destructive text-destructive-text focus-visible:ring-destructive aria-checked:border-destructive aria-checked:text-destructive-text";

/** The indicator the dot is drawn in, while the option is chosen. */
export const RADIO_INDICATOR_CLASS = "flex items-center justify-center";

/** The dot, 10 across, in the ring's text colour. */
export const RADIO_DOT_CLASS = "h-2.5 w-2.5 fill-current text-current";

/** A default option's label alone, with no description under it. */
export const RADIO_LABEL_CLASS =
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

/** A default option's label in error. */
export const RADIO_LABEL_ERROR_CLASS = "text-destructive-text";

/**
 * A card or a tile: the whole box is the one radio. The edge, theme 600 when
 * chosen, is drawn a second pixel heavier by owned CSS (kozmos-radio-card,
 * an inset shadow that the focus ring adds to), and the ring's dot or the
 * tile's check shows: the choice is never colour alone.
 */
export function radioBoxClass(
  variant: "card" | "tile",
  error: boolean,
  className?: string,
) {
  return cn(
    "kozmos-radio-card group relative flex w-full min-w-0 rounded-container border border-border p-3 text-foreground transition-colors hover:bg-hover-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-checked:border-primary",
    variant === "tile"
      ? "min-h-24 flex-col items-center justify-center gap-1 text-center"
      : "flex-col items-stretch gap-3 text-start",
    error &&
      "border-destructive focus-visible:ring-destructive aria-checked:border-destructive",
    className,
  );
}

/**
 * A box's image or icon. A tile's icon turns theme 600 when chosen, as
 * SwiftUI's and Compose's do; a card's image keeps its own colours, and is
 * concentric with the card: its radius less the card's 12 inset
 * (docs/nested-radius.md), owned CSS.
 */
export function radioMediaClass(variant: "card" | "tile") {
  return cn(
    "flex",
    variant === "tile"
      ? "items-center justify-center text-foreground group-aria-checked:text-primary"
      : "kozmos-radio-card-media w-full overflow-hidden text-foreground",
  );
}

/** A tile's title, under its icon. */
export const RADIO_TILE_TITLE_CLASS = "text-sm font-medium leading-5";

/** A tile's description, under its title. */
export const RADIO_TILE_DESCRIPTION_CLASS =
  "text-xs leading-4 text-muted-foreground";

/** A chosen tile's check, in its top end corner. */
export function radioTileCheckClass(error: boolean) {
  return cn(
    "absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-pill bg-theme-fill text-theme-fill-foreground",
    error && "bg-destructive",
  );
}

/** The tile's check mark, 14 across. */
export const RADIO_TILE_CHECK_MARK_CLASS = "h-3.5 w-3.5";

/** A card's line: its ring beside its words. */
export const RADIO_CARD_LINE_CLASS = "flex w-full items-start gap-2";

/** A card's ring, drawn as a mark: the box itself is the radio. */
export function radioCardMarkClass(error: boolean) {
  return cn(
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border border-input text-theme-fill group-aria-checked:border-primary",
    error &&
      "border-destructive text-destructive-text group-aria-checked:border-destructive",
  );
}

/** A card's title over its description. */
export const RADIO_CARD_WORDS_CLASS = "flex min-w-0 flex-col gap-0.5";

/** A card's title. */
export const RADIO_CARD_TITLE_CLASS = "text-sm font-medium leading-5";

/** A card's description. */
export const RADIO_CARD_DESCRIPTION_CLASS =
  "text-sm leading-5 text-muted-foreground";

/**
 * What a card or a tile with no title and no name of its own says in
 * development, once a page: nothing names it to a screen reader.
 */
export function untitledRadioBoxWarning(variant: "card" | "tile") {
  return `RadioGroupItem: a ${variant} has no label and no aria-label, so nothing names it to a screen reader; its description is never its name. Pass label, or aria-label for an icon-only tile.`;
}
