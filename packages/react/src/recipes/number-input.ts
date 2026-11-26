/**
 * NumberInput's recipe: its steppers, its unit and how a number is read
 * from and stepped in its <input>, for every framework that draws one.
 * React's `NumberInput` and Vue's `KozmosNumberInput` both build their
 * element from it, on Input's recipe. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

export const NUMBER_FIELD_CLASS = "kozmos-reset kozmos-number-field";
/**
 * The input's wrapper: with a unit, the box the unit is drawn in; without
 * one, a wrapper that draws no box of its own.
 */
export const NUMBER_UNIT_FIELD_CLASS = "kozmos-reset kozmos-number-unit-field";
export const NUMBER_CONTROL_CLASS = "kozmos-number-control";
export const NUMBER_INPUT_CLASS = "kozmos-number-input";
export const NUMBER_WITH_STEPPERS_CLASS = "kozmos-number-with-steppers";
export const NUMBER_WITH_UNIT_CLASS =
  "kozmos-number-with-unit pe-[calc(var(--kozmos-number-unit-width,1rem)_+_1rem_-_1px)]";
export const NUMBER_UNIT_CLASS = "kozmos-reset kozmos-number-unit";
export const NUMBER_DECREMENT_CLASS =
  "kozmos-reset kozmos-field-action kozmos-number-step kozmos-number-decrement";
export const NUMBER_INCREMENT_CLASS =
  "kozmos-reset kozmos-field-action kozmos-number-step kozmos-number-increment";
/** A stepper's tone, in the field's status. */
export const NUMBER_STEP_TONE_CLASSES = {
  default: "",
  error: "kozmos-number-step-error",
  warning: "kozmos-number-step-warning",
  success: "kozmos-number-step-success",
} as const;

/**
 * The room the unit takes, as `--kozmos-number-unit-width`: its measured
 * width once there is one, else its length in the font's "0" widths.
 */
export function numberUnitWidth(unit: string, measured: number | null) {
  return measured !== null ? `${measured}px` : `${unitWidthInCh(unit)}ch`;
}

/**
 * The unit's width in the font's "0" widths, before it is measured: a wide
 * or fullwidth character (East Asian Width W or F, "平方米", "ｍ") counts two,
 * any other one. The common ranges are enough for a reservation the measured
 * width replaces on the first paint.
 */
export function unitWidthInCh(unit: string) {
  let width = 0;
  for (const character of unit) {
    const code = character.codePointAt(0) ?? 0;
    const wide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe4f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1f300 && code <= 0x1f64f) ||
      (code >= 0x20000 && code <= 0x3fffd);
    width += wide ? 2 : 1;
  }
  return width;
}

export function numericValueFromInput(input: HTMLInputElement) {
  if (input.value.trim() === "") return null;
  // A mixed field is a text field (below): its typed number is read here.
  if (input.type !== "number") {
    const typed = Number(input.value.trim().replace(",", "."));
    return Number.isFinite(typed) ? typed : null;
  }
  return Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber;
}

/** The number of decimals a number is written with: 2 for 1.25. */
const decimalsOf = (value: number) =>
  Number.isFinite(value) ? (String(value).split(".")[1]?.length ?? 0) : 0;

export function stepValue(
  input: HTMLInputElement,
  direction: "decrement" | "increment",
) {
  // `step="any"` takes any decimal, and the input's stepUp() and stepDown()
  // throw for it, so the steppers step by 1 themselves (GAP-257), within
  // `min` and `max`, keeping the value's own decimals: 2.5 goes to 3.5.
  if (input.step.trim().toLowerCase() === "any") {
    const current = numericValueFromInput(input) ?? 0;
    let next = current + (direction === "increment" ? 1 : -1);
    const min = input.min === "" ? NaN : Number(input.min);
    const max = input.max === "" ? NaN : Number(input.max);
    if (Number.isFinite(max)) next = Math.min(next, max);
    if (Number.isFinite(min)) next = Math.max(next, min);
    next = Number(
      next.toFixed(
        Math.min(20, Math.max(decimalsOf(current), decimalsOf(next))),
      ),
    );
    input.value = String(next);
    return numericValueFromInput(input);
  }
  if (direction === "increment") {
    input.stepUp();
  } else {
    input.stepDown();
  }

  return numericValueFromInput(input);
}
