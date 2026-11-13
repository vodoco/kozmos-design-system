import React from "react";
import { clsx } from "clsx";
import { NumberInput } from "../../components/NumberInput/NumberInput";
import { Rating } from "../../components/Rating/Rating";
import { Text } from "../../components/Text/Text";

/**
 * A rating as a product stores it: the score, the scale it is out of, and
 * how many ratings it averages. `null` is a field left empty.
 */
export interface RatingEditorValue {
  rating: number | null;
  max: number | null;
  count: number | null;
}
export type RatingEditorField = keyof RatingEditorValue;

/** What is wrong with each field, in the editor's words; empty when valid. */
export type RatingEditorErrors = Partial<Record<RatingEditorField, string>>;

export interface RatingEditorMessages {
  /** The rating is above the max. */
  ratingAboveMax: (max: string) => string;
  /** The max is below the rating. */
  maxBelowRating: (rating: string) => string;
  /** The rating is negative or has more than one decimal. */
  rating: string;
  /** The max is below 1. */
  max: string;
  /** The count is not a whole number of 0 or more. */
  count: string;
}

const MESSAGES: RatingEditorMessages = {
  ratingAboveMax: (max) => `Rating can't be more than the max rating, ${max}.`,
  maxBelowRating: (rating) =>
    `Max rating can't be less than the rating, ${rating}.`,
  rating: "Rating must be 0 or more, with one decimal at most.",
  max: "Max rating must be 1 or more.",
  count: "Number of ratings must be a whole number, 0 or more.",
};

/**
 * Checks a rating (decision 180): the rating 0 or more, one decimal at
 * most, and no more than the max; the max 1 or more; the count a whole
 * number of 0 or more. A rating above its max is an error on both fields.
 * Returns each field's message; a product disables Save while any is set.
 */
export function validateRating(
  { rating, max, count }: RatingEditorValue,
  messages: Partial<RatingEditorMessages> = {},
  format: (value: number) => string = String,
): RatingEditorErrors {
  const say = { ...MESSAGES, ...messages };
  const errors: RatingEditorErrors = {};
  if (
    rating !== null &&
    (rating < 0 || Math.abs(Math.round(rating * 10) - rating * 10) > 1e-9)
  )
    errors.rating = say.rating;
  if (max !== null && max < 1) errors.max = say.max;
  if (
    rating !== null &&
    max !== null &&
    !errors.rating &&
    !errors.max &&
    rating > max
  ) {
    errors.rating = say.ratingAboveMax(format(max));
    errors.max = say.maxBelowRating(format(rating));
  }
  if (count !== null && (count < 0 || !Number.isInteger(count)))
    errors.count = say.count;
  return errors;
}

/**
 * The preview's stars: always five, filled to the rating's share of its
 * max, to the nearest half (decision 181), a half rounding up: 4.3 of 5 is
 * 4.5, 86 of 100 is 4.5, 3.2 of 5 is 3, 3.3 of 6 is 3.
 *
 * The rating has one decimal at most, so its tenths are a whole number, and
 * a whole number over the max is a half exactly when it should be: rating
 * / max * 10 rounded 3.3 of 6 (2.75 stars, 5.4999… halves) down to 2.5.
 * Checked over every one-decimal rating for every max from 1 to 100.
 */
export function ratingStars(rating: number, max: number) {
  return Math.round(Math.round(rating * 10) / max) / 2;
}

export interface RatingEditorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  /** The rating, for a product that holds it. */
  value?: RatingEditorValue;
  /** The rating an editor that holds its own starts with: empty, out of 5. */
  defaultValue?: RatingEditorValue;
  /** Called with the whole rating after each edit. */
  onValueChange?: (value: RatingEditorValue) => void;
  /** The fields' labels. Defaults "Rating", "Max rating", "Number of ratings". */
  labels?: Partial<Record<RatingEditorField, string>>;
  /** The errors' words (validateRating's). */
  messages?: Partial<RatingEditorMessages>;
  /** Formats the numbers in the messages and the preview. */
  locale?: string;
  /**
   * The preview's words, under the stars. Default `4.3 of 5 · 120 ratings`,
   * without the count when it is empty.
   */
  summary?: (rating: string, max: string, count: number | null) => string;
  /**
   * Fields whose values differ across a multi-selection (GAP-153): each
   * shows `mixedLabel` and no number, and the preview waits for them.
   */
  mixed?: Partial<Record<RatingEditorField, boolean>>;
  /** Default "Multiple values". */
  mixedLabel?: string;
  /** Per field, going back to the several values: give it for one that was. */
  onResetMixed?: Partial<Record<RatingEditorField, () => void>>;
  disabled?: boolean;
}

const FIELDS: RatingEditorField[] = ["rating", "max", "count"];
const LABELS = {
  rating: "Rating",
  max: "Max rating",
  count: "Number of ratings",
};

/**
 * The Rating property's editor (CLOUD-UI-004, decision 180): three number
 * fields, the rating (one decimal), its max (1 or more: 5 usually, 100 at
 * times) and the number of ratings (a whole number, 0 or more), checked
 * against each other: a rating above its max is an error on both. Each
 * error is the field's own, invalid and described by its message. Under
 * them, a read-only preview: five stars filled to the rating's share of its
 * max, to the nearest half (decision 181), and the real numbers in words,
 * "4.3 of 5 · 120 ratings". A Dashboard module (decision 183).
 */
const RatingEditor = React.forwardRef<HTMLDivElement, RatingEditorProps>(
  (
    {
      className,
      value: valueProp,
      defaultValue = { rating: null, max: 5, count: null },
      onValueChange,
      labels,
      messages,
      locale,
      summary,
      mixed = {},
      mixedLabel = "Multiple values",
      onResetMixed = {},
      disabled,
      ...props
    },
    ref,
  ) => {
    const [held, setHeld] = React.useState(defaultValue);
    const value = valueProp ?? held;
    const format = (number: number) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
        number,
      );
    const errors = validateRating(value, messages, format);
    const { rating, max, count } = value;
    const shown =
      !FIELDS.some((field) => mixed[field] || errors[field]) &&
      rating !== null &&
      max !== null;

    return (
      <div
        ref={ref}
        className={clsx("kozmos-rating-editor", className)}
        {...props}
      >
        {FIELDS.map((field) => (
          <NumberInput
            key={field}
            label={labels?.[field] ?? LABELS[field]}
            value={value[field] ?? ""}
            min={field === "max" ? 1 : 0}
            step={field === "rating" ? 0.1 : 1}
            error={errors[field]}
            disabled={disabled}
            mixed={mixed[field] ?? false}
            mixedLabel={mixedLabel}
            onResetMixed={onResetMixed[field]}
            onValueChange={(next) => {
              const edited = { ...value, [field]: next };
              if (valueProp === undefined) setHeld(edited);
              onValueChange?.(edited);
            }}
          />
        ))}
        {shown ? (
          <div className="kozmos-rating-editor-preview">
            {/* The words say the exact value; the stars are their picture. */}
            <Rating
              readOnly
              aria-hidden="true"
              value={ratingStars(rating, max)}
            />
            <Text as="span" size="sm" color="muted">
              {summary
                ? summary(format(rating), format(max), count)
                : count === null
                  ? `${format(rating)} of ${format(max)}`
                  : `${format(rating)} of ${format(max)} · ${format(count)} ${count === 1 ? "rating" : "ratings"}`}
            </Text>
          </div>
        ) : null}
      </div>
    );
  },
);
RatingEditor.displayName = "RatingEditor";

export { RatingEditor };
