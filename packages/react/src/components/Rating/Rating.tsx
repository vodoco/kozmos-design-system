import React from "react";
import { Star01 as Star, ThumbsDown, ThumbsUp } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

/**
 * What a rating is measured on.
 *
 * `stars` is an ordinal scale: choosing four means "at least four", so four
 * fill. `thumbs` is a choice between two, and exactly the one chosen fills —
 * a thumbs-up is not "two thumbs". The value is still a number so a product
 * stores one shape either way: **0 is unanswered, 1 is down, 2 is up**, which
 * is the same "1 is the lowest" rule the stars follow.
 */
export type RatingVariant = "stars" | "thumbs";

export interface RatingProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  variant?: RatingVariant;
  /** Ignored when `variant` is `thumbs`, which is always a choice of two. */
  max?: number;
  /**
   * `0` is unanswered. Choosing what is already chosen returns to it. A
   * read-only star rating draws a score that is not whole to the nearest
   * half: `Math.round(value * 2) / 2`, so 4.3 is 4.5 and 4.2 is 4.
   */
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  /**
   * The group's accessible name. It was the fixed English "Rating", which is
   * a control an Arabic or Japanese visitor cannot hear in their language.
   */
  label?: string;
  /**
   * Each option's accessible name. The default said "Rate 3 out of 5 stars",
   * fixed in English and wrong the moment the scale is thumbs.
   */
  itemLabel?: (value: number, max: number, variant: RatingVariant) => string;
  /**
   * How a chosen rating reads when `readOnly`. On the stars it is given the
   * value rounded to the nearest half, as it is drawn: 4.3 reads as 4.5.
   */
  valueLabel?: (value: number, max: number, variant: RatingVariant) => string;
}

/**
 * A read-only star rating's value, rounded to the nearest half (decision
 * 181): 4.3 is 4.5, 4.2 is 4 and 4.25 is 4.5. It rounds the doubled value half
 * up, `Math.round(value * 2) / 2`, as SwiftUI's and Compose's do.
 */
function roundRatingToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

const defaultItemLabel: NonNullable<RatingProps["itemLabel"]> = (
  value,
  max,
  variant,
) =>
  variant === "thumbs"
    ? value === 1
      ? "Poor"
      : "Good"
    : `Rate ${value} out of ${max} stars`;

const defaultValueLabel: NonNullable<RatingProps["valueLabel"]> = (
  value,
  max,
  variant,
) => {
  if (value === 0) return "Not rated";
  return variant === "thumbs"
    ? value === 1
      ? "Rated poor"
      : "Rated good"
    : `Rated ${value} out of ${max} stars`;
};

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      className,
      variant = "stars",
      max: callerMax = 5,
      value = 0,
      onChange,
      readOnly = false,
      label = "Rating",
      itemLabel = defaultItemLabel,
      valueLabel = defaultValueLabel,
      ...props
    },
    ref,
  ) => {
    const thumbs = variant === "thumbs";
    const max = thumbs ? 2 : callerMax;
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);
    const { trackEvent } = useKozmosAnalytics();
    const group = React.useRef<HTMLDivElement | null>(null);
    const setGroup = React.useCallback(
      (node: HTMLDivElement | null) => {
        group.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // A read-only rating is not a control. It used to be a radiogroup of
    // DISABLED radios, which drops out of the tab order entirely: a screen
    // reader user could not reach a rating they were only meant to read.
    if (readOnly) {
      // A score read from somewhere else, an average of reviews, is rarely
      // whole: the stars show it to the nearest half (decision 181), and the
      // label says what is drawn. Thumbs are a choice, never an average.
      const shown = thumbs ? value : roundRatingToHalf(value);
      const filled = (item: number) =>
        thumbs ? item === shown : item <= shown;
      return (
        <div
          ref={setGroup}
          role="img"
          aria-label={valueLabel(shown, max, variant)}
          className={cn("flex items-center gap-1", className)}
          {...props}
        >
          {Array.from({ length: max }, (_, index) => (
            <Face
              key={index}
              filled={filled(index + 1)}
              half={!thumbs && index + 0.5 === shown}
              item={index + 1}
              thumbs={thumbs}
            />
          ))}
        </div>
      );
    }

    const select = (next: number) => {
      // Choosing what is already chosen clears it: a visitor who taps the
      // wrong thumb can undo it without dismissing the whole dialog.
      const resolved = next === value ? 0 : next;
      trackEvent("Rating", "rating_changed", { value: resolved, max, variant });
      onChange?.(resolved);
    };

    const move = (from: number, step: number) => {
      const next = Math.min(max, Math.max(1, from + step));
      const button =
        group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[
          next - 1
        ];
      button?.focus();
      // A radiogroup selects as it moves; that is the pattern, and without it
      // a keyboard visitor can reach an option but not take it.
      if (next !== value) {
        trackEvent("Rating", "rating_changed", { value: next, max, variant });
        onChange?.(next);
      }
    };

    const onKeyDown = (event: React.KeyboardEvent, item: number) => {
      // Left and right are the writing direction's, not the screen's: in
      // Arabic the first option is on the right, so ArrowLeft must go forward.
      const rtl =
        group.current && getComputedStyle(group.current).direction === "rtl";
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      switch (event.key) {
        case forward:
        case "ArrowDown":
          event.preventDefault();
          move(item, 1);
          break;
        case back:
        case "ArrowUp":
          event.preventDefault();
          move(item, -1);
          break;
        case "Home":
          event.preventDefault();
          move(1, 0);
          break;
        case "End":
          event.preventDefault();
          move(max, 0);
          break;
        default:
          break;
      }
    };

    // One tab stop for the group, not one per option: tabbing through five
    // stars to get past a rating is the radiogroup pattern done wrong.
    const tabStop = value > 0 ? value : 1;
    // Hover previews the scale, so it may light the stars — but it must not
    // touch aria-checked. It did, so a pointer passing over the fifth star
    // made a screen reader announce five when the answer was three.
    const shown = !thumbs && hoverValue !== null ? hoverValue : value;

    return (
      <div
        ref={setGroup}
        role="radiogroup"
        aria-label={label}
        className={cn("flex items-center gap-1", className)}
        {...props}
      >
        {Array.from({ length: max }, (_, index) => {
          const item = index + 1;
          const filled = thumbs ? item === shown : item <= shown;
          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={item === value}
              aria-label={itemLabel(item, max, variant)}
              tabIndex={item === tabStop ? 0 : -1}
              className={cn(
                "kozmos-reset flex cursor-pointer items-center justify-center rounded-pill bg-transparent p-0 transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                thumbs && "h-11 w-11",
              )}
              onClick={() => select(item)}
              onKeyDown={(event) => onKeyDown(event, item)}
              onMouseEnter={() => !thumbs && setHoverValue(item)}
              onMouseLeave={() => !thumbs && setHoverValue(null)}
            >
              <Face filled={filled} item={item} thumbs={thumbs} />
            </button>
          );
        })}
      </div>
    );
  },
);
Rating.displayName = "Rating";

/** The mark itself, so the read-only and interactive forms cannot drift. */
function Face({
  filled,
  half = false,
  item,
  thumbs,
}: {
  filled: boolean;
  /** A read-only star filled to its middle: only its start half is drawn. */
  half?: boolean;
  item: number;
  thumbs: boolean;
}) {
  if (!thumbs && half) {
    // The empty star, and the filled one over it clipped to its inline start
    // half: the left in a left-to-right page, the right in a right-to-left
    // one, since `start-0` is a logical side and the clipped box's own
    // content starts there too.
    return (
      <span aria-hidden="true" className="relative block h-6 w-6">
        <Star className="block h-6 w-6 text-muted-foreground" />
        <span
          className="absolute inset-y-0 start-0 block w-1/2 overflow-hidden"
          data-rating-half=""
        >
          <Star className="block h-6 w-6 fill-data-yellow text-data-yellow" />
        </span>
      </span>
    );
  }
  if (!thumbs) {
    return (
      <Star
        aria-hidden="true"
        className={cn(
          "h-6 w-6",
          filled
            ? "fill-data-yellow text-data-yellow"
            : "text-muted-foreground",
        )}
      />
    );
  }
  const Icon = item === 1 ? ThumbsDown : ThumbsUp;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-pill border-2 transition-colors",
        // The chosen thumb is the theme's tint, theme/0, ringed and marked in
        // theme 600, as SwiftUI, Compose and Figma draw it. It was a theme 600
        // fill with foreground/1000 on it (decision 59).
        filled
          ? "border-primary bg-[var(--primitives-colors-theme-0)] text-primary"
          : "border-transparent bg-muted text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export { Rating };
