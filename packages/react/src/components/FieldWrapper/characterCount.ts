import * as React from "react";

export {
  resolveCharacterCount,
  type CharacterCount,
  type ResolvedCharacterCount,
} from "../../recipes/character-count";

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

    /** Empties the mirror: the field was emptied outside an input event. */
    clear: () => setMirrored(""),
  };
}
