// A field's character count's recipe: what the count says and when it is
// wrong, for every framework that draws one. React's Input and Textarea and
// Vue's KozmosInput and KozmosTextarea count with it. Framework-free
// (`recipes.framework-free.test.ts`). A line comment, so the declarations
// carry CharacterCount's own doc comment alone.

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
