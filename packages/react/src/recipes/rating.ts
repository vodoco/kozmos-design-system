/**
 * Rating's recipe: the scale's classes, its rounding and its default words,
 * for every framework that draws one. React's `Rating` and Vue's
 * `KozmosRating` build the same group, options and faces from it.
 * Framework-free (`recipes.framework-free.test.ts`).
 */
import { cn } from "../utils";

/**
 * What a rating is measured on: `stars`, an ordinal scale, or `thumbs`, a
 * choice of two (0 unanswered, 1 down, 2 up).
 */
export type RatingVariant = "stars" | "thumbs";

/** Words for an option, or for a read-only rating's value. */
export type RatingLabel = (
  value: number,
  max: number,
  variant: RatingVariant,
) => string;

/**
 * A read-only star rating's value, rounded to the nearest half (decision
 * 181): 4.3 is 4.5, 4.2 is 4 and 4.25 is 4.5. It rounds the doubled value half
 * up, `Math.round(value * 2) / 2`, as SwiftUI's and Compose's do.
 */
export function roundRatingToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Each option's default name, fixed in English: products pass their own. */
export const defaultRatingItemLabel: RatingLabel = (value, max, variant) =>
  variant === "thumbs"
    ? value === 1
      ? "Poor"
      : "Good"
    : `Rate ${value} out of ${max} stars`;

/** A read-only rating's default words. */
export const defaultRatingValueLabel: RatingLabel = (value, max, variant) => {
  if (value === 0) return "Not rated";
  return variant === "thumbs"
    ? value === 1
      ? "Rated poor"
      : "Rated good"
    : `Rated ${value} out of ${max} stars`;
};

/** The group, read-only or a radiogroup. */
export const RATING_CLASS = "flex items-center gap-1";

/** An option: a radio, 44 square on the thumbs. */
export function ratingItemClass(thumbs: boolean) {
  return cn(
    "kozmos-reset flex cursor-pointer items-center justify-center rounded-pill bg-transparent p-0 transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    thumbs && "h-11 w-11",
  );
}

/** A star, filled or empty. */
export function ratingStarClass(filled: boolean) {
  return cn(
    "h-6 w-6",
    filled ? "fill-data-yellow text-data-yellow" : "text-muted-foreground",
  );
}

/**
 * A read-only star filled to its middle: the empty star, and the filled one
 * over it clipped to its inline start half (`start-0` is a logical side).
 */
export const RATING_HALF_CLASSES = {
  box: "relative block h-6 w-6",
  empty: "block h-6 w-6 text-muted-foreground",
  clip: "absolute inset-y-0 start-0 block w-1/2 overflow-hidden",
  filled: "block h-6 w-6 fill-data-yellow text-data-yellow",
} as const;

/**
 * A thumb's disc. The chosen thumb is the theme's tint, theme/0, ringed and
 * marked in theme 600, as SwiftUI, Compose and Figma draw it (decision 59).
 */
export function ratingThumbClass(filled: boolean) {
  return cn(
    "flex h-10 w-10 items-center justify-center rounded-pill border-2 transition-colors",
    filled
      ? "border-primary bg-[var(--primitives-colors-theme-0)] text-primary"
      : "border-transparent bg-muted text-muted-foreground",
  );
}

/** The thumb's mark. */
export const RATING_THUMB_ICON_CLASS = "h-5 w-5";
