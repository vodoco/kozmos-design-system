import * as React from "react";

/**
 * A field's character count, and what it means.
 *
 * `limit` is a SOFT maximum, not the `maxLength` attribute. A browser refuses
 * the keystroke past `maxLength`, so with it set the "513/512, maximum
 * character limit exceeded" state in the MAP-474 feedback flow could never
 * happen — a visitor pasting a long answer would silently lose the end of it
 * instead of being told. The limit is drawn and judged here; nothing is
 * prevented.
 *
 * `minimum` is only applied once something has been typed. An empty field is
 * not yet wrong, it is unanswered, and telling someone their answer is too
 * short before they have started is noise.
 */
export interface CharacterCount {
  limit: number;
  minimum?: number;
  /** Localisable. The default is the bare `52/512` the prototype draws. */
  label?: (count: number, limit: number) => string;
  overLimit?: string;
  underMinimum?: (minimum: number) => string;
}

export interface ResolvedCharacterCount {
  text: string;
  message?: string;
  invalid: boolean;
}

export function resolveCharacterCount(
  count: CharacterCount | undefined,
  value: unknown,
): ResolvedCharacterCount | undefined {
  if (!count) return undefined;
  // A field's value is `string | number | readonly string[]`. Counting only
  // strings made a numeric input read 0/512 whatever was typed in it — a
  // silently wrong number, which is worse than no number.
  const text =
    value === undefined || value === null
      ? ""
      : Array.isArray(value)
        ? value.join("")
        : String(value);
  // Spread, not `.length`: `.length` counts UTF-16 units, so 👍 would be two.
  const length = [...text].length;
  const {
    limit,
    minimum,
    label = (n, max) => `${n}/${max}`,
    overLimit = "Maximum character limit exceeded",
    underMinimum = (n) => `Please enter at least ${n} characters.`,
  } = count;

  const over = length > limit;
  const under = minimum !== undefined && length > 0 && length < minimum;
  return {
    text: label(length, limit),
    message: over ? overLimit : under ? underMinimum(minimum!) : undefined,
    invalid: over || under,
  };
}

/**
 * The length of a field that the caller is not controlling.
 *
 * A counter has to read the value, and an uncontrolled field keeps it in the
 * DOM. This mirrors it into state on input so the count follows typing without
 * making the field controlled — which would take the caret to the end of the
 * text on every keystroke.
 */
export function useUncontrolledValue(
  controlled: unknown,
  defaultValue: unknown,
) {
  const [mirrored, setMirrored] = React.useState<string>(
    defaultValue === undefined || defaultValue === null
      ? ""
      : String(defaultValue),
  );
  const isControlled = controlled !== undefined;
  return {
    value: isControlled ? controlled : mirrored,
    onInput: isControlled
      ? undefined
      : (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          setMirrored(event.currentTarget.value),
  };
}
